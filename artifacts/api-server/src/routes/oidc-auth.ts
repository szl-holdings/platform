import * as oidc from "openid-client";
import { z } from "zod";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  getOidcConfig,
  getSessionToken,
  setSessionCookie,
  clearSessionCookie,
  setOidcCookie,
  getSafeReturnTo,
  getOrigin,
  upsertUserFromOidc,
  createOidcSession,
  deleteOidcSession,
  ISSUER_URL,
  isOidcConfigured,
} from "../lib/auth";

const router: IRouter = Router();

const ExchangeMobileAuthorizationCodeBody = z.object({
  code: z.string(),
  code_verifier: z.string(),
  redirect_uri: z.string().url(),
  state: z.string(),
  nonce: z.string().optional().nullable(),
});

router.get("/auth/user", (req: Request, res: Response) => {
  const user = req.oidcUser ?? null;
  res.json({
    user: user
      ? {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          roles: user.roles,
        }
      : null,
  });
});

router.get("/login", async (req: Request, res: Response) => {
  if (!isOidcConfigured()) {
    res.status(503).json({ error: "OIDC not configured" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const callbackUrl = `${getOrigin(req)}/api/callback`;
    const returnTo = getSafeReturnTo(req.query.returnTo);

    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);

    const redirectTo = oidc.buildAuthorizationUrl(config, {
      redirect_uri: callbackUrl,
      scope: "openid email profile offline_access",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "login consent",
      state,
      nonce,
    });

    setOidcCookie(res, "code_verifier", codeVerifier);
    setOidcCookie(res, "nonce", nonce);
    setOidcCookie(res, "state", state);
    setOidcCookie(res, "return_to", returnTo);

    res.redirect(redirectTo.href);
  } catch (err) {
    req.log?.error({ err }, "Login initiation failed");
    res.status(500).json({ error: "Login initiation failed" });
  }
});

router.get("/callback", async (req: Request, res: Response) => {
  if (!isOidcConfigured()) {
    res.redirect("/");
    return;
  }

  try {
    const config = await getOidcConfig();
    const callbackUrl = `${getOrigin(req)}/api/callback`;

    const codeVerifier = req.cookies?.code_verifier;
    const nonce = req.cookies?.nonce;
    const expectedState = req.cookies?.state;

    if (!codeVerifier || !expectedState) {
      res.redirect("/api/login");
      return;
    }

    const currentUrl = new URL(
      `${callbackUrl}?${new URL(req.url, `http://${req.headers.host}`).searchParams}`,
    );

    let tokens: oidc.TokenEndpointResponse & oidc.TokenEndpointResponseHelpers;
    try {
      tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
        pkceCodeVerifier: codeVerifier,
        expectedNonce: nonce,
        expectedState,
        idTokenExpected: true,
      });
    } catch {
      res.redirect("/api/login");
      return;
    }

    const returnTo = getSafeReturnTo(req.cookies?.return_to);

    res.clearCookie("code_verifier", { path: "/" });
    res.clearCookie("nonce", { path: "/" });
    res.clearCookie("state", { path: "/" });
    res.clearCookie("return_to", { path: "/" });

    const claims = tokens.claims();
    if (!claims) {
      res.redirect("/api/login");
      return;
    }

    const user = await upsertUserFromOidc(claims as unknown as Record<string, unknown>);
    const token = await createOidcSession(
      user.id,
      req.ip ?? null,
      req.headers["user-agent"] ?? null,
    );

    setSessionCookie(res, token);
    res.redirect(returnTo);
  } catch (err) {
    req.log?.error({ err }, "OIDC callback failed");
    res.redirect("/api/login");
  }
});

router.get("/logout", async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);
    if (token) {
      await deleteOidcSession(token);
    }
    clearSessionCookie(res);

    if (isOidcConfigured()) {
      try {
        const config = await getOidcConfig();
        const origin = getOrigin(req);
        const endSessionUrl = oidc.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: origin,
        });
        res.redirect(endSessionUrl.href);
        return;
      } catch {
        // fall through to simple redirect
      }
    }

    res.redirect("/");
  } catch (err) {
    req.log?.error({ err }, "Logout failed");
    res.redirect("/");
  }
});

router.post("/mobile-auth/token-exchange", async (req: Request, res: Response) => {
  const parsed = ExchangeMobileAuthorizationCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required parameters" });
    return;
  }

  if (!isOidcConfigured()) {
    res.status(503).json({ error: "OIDC not configured" });
    return;
  }

  const { code, code_verifier, redirect_uri, state, nonce } = parsed.data;

  try {
    const config = await getOidcConfig();

    const callbackUrl = new URL(redirect_uri);
    callbackUrl.searchParams.set("code", code);
    callbackUrl.searchParams.set("state", state);
    callbackUrl.searchParams.set("iss", ISSUER_URL);

    const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
      pkceCodeVerifier: code_verifier,
      expectedNonce: nonce ?? undefined,
      expectedState: state,
      idTokenExpected: true,
    });

    const claims = tokens.claims();
    if (!claims) {
      res.status(401).json({ error: "No claims in ID token" });
      return;
    }

    const user = await upsertUserFromOidc(claims as unknown as Record<string, unknown>);
    const token = await createOidcSession(
      user.id,
      req.ip ?? null,
      req.headers["user-agent"] ?? null,
    );

    res.json({ token });
  } catch (err) {
    req.log?.error({ err }, "Mobile token exchange error");
    res.status(500).json({ error: "Token exchange failed" });
  }
});

router.post("/mobile-auth/logout", async (req: Request, res: Response) => {
  const token = getSessionToken(req);
  if (token) {
    await deleteOidcSession(token);
  }
  res.json({ success: true });
});

export default router;
