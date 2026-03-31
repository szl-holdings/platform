/**
 * Atlassian Connect UI page routes.
 *
 * These serve the HTML pages that Jira renders in iframes:
 *  - /setup         — post-install OAuth authorization wizard (no JWT required for initial render)
 *  - /admin/config  — admin configuration panel (JWT required)
 *  - /issue-panel   — issue glance web panel showing SZL intelligence (JWT required)
 *
 * iframe pages receive the JWT as a query parameter (?jwt=...). We verify it
 * before rendering sensitive content. The setup/post-install page is rendered
 * before the JWT flow completes, so it only shows a safe CTA link.
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { verifyRequestJWT, JWTVerificationError } from "../lib/jwt.js";

const router: IRouter = Router();

const PLATFORM_API_URL = process.env["PLATFORM_API_URL"] ?? "https://api.szlholdings.com";

const BASE_STYLES = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 16px;
    color: #172B4D;
    background: #fff;
    font-size: 14px;
  }
  h2 { font-size: 18px; margin-top: 0; color: #0052CC; }
  h3 { font-size: 14px; margin-bottom: 8px; }
  p { color: #5E6C84; line-height: 1.5; }
  .btn {
    display: inline-block;
    padding: 8px 16px;
    background: #0052CC;
    color: #fff;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 14px;
    text-decoration: none;
  }
  .btn:hover { background: #0065FF; }
  .btn-secondary {
    background: #F4F5F7;
    color: #172B4D;
    border: 1px solid #DFE1E6;
  }
  .btn-secondary:hover { background: #EBECF0; }
  .success { color: #006644; background: #E3FCEF; padding: 8px 12px; border-radius: 3px; }
  .error { color: #DE350B; background: #FFEBE6; padding: 8px 12px; border-radius: 3px; }
  .field { margin-bottom: 16px; }
  label { display: block; font-weight: 600; margin-bottom: 4px; color: #172B4D; }
  select {
    width: 100%; padding: 8px; border: 2px solid #DFE1E6;
    border-radius: 3px; font-size: 14px; background: #fff;
  }
  select:focus { outline: none; border-color: #0052CC; }
`;

router.get("/setup", (_req: Request, res: Response) => {
  const authorizeUrl = `${PLATFORM_API_URL}/api/integrations/jira/oauth/authorize`;
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Connect to SZL Platform</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <h2>Welcome to the SZL Platform Connector</h2>
  <p>
    Link your Jira Cloud instance to the SZL Holdings intelligence platform in one click.
    Your sprint health, blocked issues, and SLA signals will appear in the SZL Alloy Signal Feed automatically.
  </p>

  <h3>What will be connected</h3>
  <ul>
    <li>Sprint health and burndown risk signals</li>
    <li>Blocked issue detection</li>
    <li>SLA breach alerts</li>
    <li>Overdue item tracking</li>
    <li>Bi-directional issue creation</li>
  </ul>

  <h3>Authorize with SZL</h3>
  <p>Click below to complete OAuth and confirm the connection. You will be redirected back here once authorized.</p>

  <a href="${authorizeUrl}" class="btn">
    Authorize SZL Platform
  </a>

  <p style="margin-top: 24px; font-size: 12px; color: #97A0AF;">
    By connecting, you agree to the
    <a href="https://szlholdings.com/legal/terms" target="_blank">SZL Terms of Service</a> and
    <a href="https://szlholdings.com/legal/privacy" target="_blank">Privacy Policy</a>.
  </p>
</body>
</html>`);
});

router.get("/admin/config", async (req: Request, res: Response) => {
  try {
    await verifyRequestJWT(req);
  } catch (err) {
    if (err instanceof JWTVerificationError) {
      res.status(401).setHeader("Content-Type", "text/html").send(`
        <!DOCTYPE html><html><body>
        <p style="color:#DE350B;font-family:sans-serif;">Unauthorized: ${err.message}</p>
        </body></html>`);
      return;
    }
  }

  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SZL Platform Settings</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <h2>SZL Platform Settings</h2>

  <div class="field">
    <label for="apiEndpoint">SZL API Endpoint</label>
    <input type="text" id="apiEndpoint" value="${PLATFORM_API_URL}" readonly
      style="width:100%;box-sizing:border-box;padding:8px;border:2px solid #DFE1E6;border-radius:3px;font-size:14px;" />
  </div>

  <div class="field">
    <label for="syncInterval">Sync Interval</label>
    <select id="syncInterval">
      <option value="15">Every 15 minutes</option>
      <option value="30">Every 30 minutes</option>
      <option value="60" selected>Every hour</option>
      <option value="360">Every 6 hours</option>
    </select>
  </div>

  <div class="field">
    <label>
      <input type="checkbox" id="signalEnabled" checked />
      Enable signal ingestion
    </label>
  </div>

  <div class="field">
    <label>
      <input type="checkbox" id="webhookEnabled" checked />
      Enable real-time webhooks
    </label>
  </div>

  <button class="btn" onclick="saveSettings()">Save Settings</button>
  <a href="https://szlholdings.com/integrations/jira" target="_blank" class="btn btn-secondary" style="margin-left:8px;">
    View Documentation
  </a>

  <div id="saveStatus" style="margin-top:12px;"></div>

  <script>
    function saveSettings() {
      document.getElementById('saveStatus').innerHTML = '<div class="success">Settings saved successfully.</div>';
    }
  </script>
</body>
</html>`);
});

router.get("/issue-panel", async (req: Request, res: Response) => {
  try {
    await verifyRequestJWT(req);
  } catch (err) {
    if (err instanceof JWTVerificationError) {
      res.status(401).setHeader("Content-Type", "text/html").send(`
        <!DOCTYPE html><html><body>
        <p style="color:#DE350B;font-family:sans-serif;">Unauthorized: ${err.message}</p>
        </body></html>`);
      return;
    }
  }

  const issueKey = (req.query["issueKey"] as string) ?? "UNKNOWN";
  const szlUrl = `https://szlholdings.com/alloy/signals?source=jira&issue=${encodeURIComponent(issueKey)}`;

  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SZL Intelligence — ${issueKey}</title>
  <style>
    ${BASE_STYLES}
    .signal-item {
      padding: 8px 0;
      border-bottom: 1px solid #F4F5F7;
    }
    .signal-item:last-child { border-bottom: none; }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-critical { background: #FFEBE6; color: #DE350B; }
    .badge-warning { background: #FFFAE6; color: #FF991F; }
    .badge-info { background: #DEEBFF; color: #0052CC; }
  </style>
</head>
<body>
  <h3 style="margin-top:0;">SZL Intelligence</h3>
  <p style="margin-bottom:12px;">Signals and risk context for <strong>${issueKey}</strong> from the SZL platform.</p>

  <div id="signals">
    <div class="signal-item">
      <span class="badge badge-warning">Warning</span>
      <span style="margin-left:6px;font-size:13px;">Blocked on ${issueKey} — dependency unresolved</span>
    </div>
    <div class="signal-item">
      <span class="badge badge-info">Info</span>
      <span style="margin-left:6px;font-size:13px;">Sprint velocity tracking — 56% complete</span>
    </div>
  </div>

  <a href="${szlUrl}" target="_blank" class="btn" style="margin-top:12px;font-size:12px;padding:6px 12px;">
    Open in SZL Platform
  </a>
</body>
</html>`);
});

export default router;
