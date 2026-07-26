import assert from "node:assert/strict";
import { test } from "node:test";
import { validate } from "../index.ts";
import { meshReceiptSchema, meshReceiptV2Schema } from "../schemas.ts";

const v1Receipt = {
  receiptId: "receipt-001",
  eventType: "policy.denied",
  actorId: "a11oy.gate",
  toolName: "policy.evaluate",
  payloadHash: "sha256:payload",
  prevReceiptHash: null,
  timestampIso8601: "2026-07-25T12:00:00.000Z",
  traceId: "0123456789abcdef0123456789abcdef",
};

test("receipt schema v2 remains backward compatible with v1 receipts", () => {
  assert.equal(validate(v1Receipt, meshReceiptSchema).valid, true);
  assert.equal(validate(v1Receipt, meshReceiptV2Schema).valid, true);
});

test("receipt schema v2 validates a complete regulatory mapping", () => {
  const v2Receipt = {
    ...v1Receipt,
    schemaVersion: "2.0",
    regulatory: {
      eu_ai_act: {
        article: "12",
        obligation: "record-keeping and traceability",
        annex_iii_category: null,
        high_risk: false,
        log_retention_class: "lifetime",
      },
      nist_ai_rmf: {
        function: "MEASURE",
        subcategory: "MEASURE 2.7",
      },
      owasp_asi: ["ASI02", "ASI06"],
      iso_42001: {
        control: "A.6.2.6",
      },
    },
  };

  assert.deepEqual(validate(v2Receipt, meshReceiptV2Schema), {
    valid: true,
    errors: [],
  });
});

test("receipt schema v2 rejects unsupported mapping values", () => {
  const invalid = {
    ...v1Receipt,
    schemaVersion: "2.0",
    regulatory: {
      eu_ai_act: {
        article: "Article Twelve",
        obligation: "record-keeping",
        annex_iii_category: null,
        high_risk: false,
        log_retention_class: "forever",
      },
      nist_ai_rmf: {
        function: "AUDIT",
        subcategory: "MEASURE 2.7",
      },
      owasp_asi: ["02"],
      iso_42001: {
        control: "A.6.2.6",
      },
    },
  };

  const result = validate(invalid, meshReceiptV2Schema);
  assert.equal(result.valid, false);
  assert.match(
    result.errors.map((error) => `${error.path}: ${error.message}`).join("\n"),
    /log_retention_class|nist_ai_rmf\.function|owasp_asi/,
  );
});
