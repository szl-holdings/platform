export const ERROR_CODES = {
  AUTH_001: "AUTH_001",
  AUTH_002: "AUTH_002",
  AUTH_003: "AUTH_003",
  AUTH_004: "AUTH_004",

  BILLING_001: "BILLING_001",
  BILLING_002: "BILLING_002",
  BILLING_003: "BILLING_003",

  VALIDATION_001: "VALIDATION_001",
  VALIDATION_002: "VALIDATION_002",
  VALIDATION_003: "VALIDATION_003",

  NOT_FOUND_001: "NOT_FOUND_001",

  RATE_LIMIT_001: "RATE_LIMIT_001",

  DB_001: "DB_001",
  DB_002: "DB_002",

  INTERNAL_001: "INTERNAL_001",
  INTERNAL_002: "INTERNAL_002",

  FEATURE_001: "FEATURE_001",
  FEATURE_002: "FEATURE_002",
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export const ERROR_CODE_MESSAGES: Record<ErrorCode, string> = {
  AUTH_001: "Authentication required",
  AUTH_002: "Invalid or expired token",
  AUTH_003: "Insufficient permissions",
  AUTH_004: "Account is inactive",

  BILLING_001: "Subscription not found",
  BILLING_002: "Payment method required",
  BILLING_003: "Plan limit exceeded",

  VALIDATION_001: "Request body is invalid",
  VALIDATION_002: "Invalid path parameter",
  VALIDATION_003: "Invalid query parameter",

  NOT_FOUND_001: "Resource not found",

  RATE_LIMIT_001: "Too many requests — please slow down",

  DB_001: "Database unavailable",
  DB_002: "Query timeout",

  INTERNAL_001: "Internal server error",
  INTERNAL_002: "Service temporarily unavailable",

  FEATURE_001: "Feature flag not found",
  FEATURE_002: "Feature flag key already exists",
};
