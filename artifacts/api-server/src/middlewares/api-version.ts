import type { Request, Response, NextFunction } from "express";
import { sendError } from "../lib/api-response";

const CURRENT_VERSION = "2026-04-15";
const SUPPORTED_VERSIONS = ["2025-01-01", "2026-04-15"] as const;
const DEPRECATED_VERSIONS = new Set(["2025-01-01"]);
const SUNSET_DATES: Record<string, string> = {
  "2025-01-01": "2027-01-01",
};

export type ApiVersion = (typeof SUPPORTED_VERSIONS)[number];

declare global {
  namespace Express {
    interface Request {
      apiVersion?: string;
    }
  }
}

export function apiVersionMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestedVersion = req.headers["x-api-version"] as string | undefined;

  if (requestedVersion && !SUPPORTED_VERSIONS.includes(requestedVersion as ApiVersion)) {
    sendError(
      res,
      `API version '${requestedVersion}' is not supported. Use one of: ${SUPPORTED_VERSIONS.join(", ")}`,
      400,
      "UNSUPPORTED_API_VERSION",
      { requestedVersion, currentVersion: CURRENT_VERSION, supportedVersions: SUPPORTED_VERSIONS },
    );
    return;
  }

  const version = requestedVersion ?? CURRENT_VERSION;
  req.apiVersion = version;

  res.setHeader("X-Api-Version", version);
  res.setHeader("X-Api-Versions-Supported", SUPPORTED_VERSIONS.join(", "));

  if (DEPRECATED_VERSIONS.has(version)) {
    res.setHeader("Deprecation", "true");
    res.setHeader("X-Api-Deprecated", "true");
    const sunset = SUNSET_DATES[version];
    if (sunset) {
      res.setHeader("Sunset", new Date(sunset).toUTCString());
    }
    res.setHeader(
      "X-Api-Deprecation-Notice",
      `API version ${version} is deprecated. Migrate to ${CURRENT_VERSION} before sunset date.`
    );
  }

  next();
}

export function requireMinVersion(minVersion: ApiVersion) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientVersion = req.apiVersion ?? CURRENT_VERSION;
    const clientIdx = SUPPORTED_VERSIONS.indexOf(clientVersion as ApiVersion);
    const minIdx = SUPPORTED_VERSIONS.indexOf(minVersion);

    if (clientIdx < minIdx) {
      sendError(
        res,
        `This endpoint requires API version ${minVersion} or later. Your version: ${clientVersion}`,
        400,
        "UNSUPPORTED_API_VERSION",
        { minVersion, clientVersion, currentVersion: CURRENT_VERSION, supportedVersions: SUPPORTED_VERSIONS },
      );
      return;
    }
    next();
  };
}

export { CURRENT_VERSION, SUPPORTED_VERSIONS, DEPRECATED_VERSIONS };
