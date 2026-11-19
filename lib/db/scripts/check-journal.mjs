// lib/db/scripts/check-journal.mjs
// Fails CI when a NEW drizzle journal entry would be silently skipped by drizzle-orm's
// pg migrator (it skips entries whose `when` <= newest applied created_at; see
// drizzle-team/drizzle-orm#5316, #5769), or when a drizzle/*.sql file is not journaled.
// Historical violations present at 1fe1d0c75c57 are allow-listed so this guard blocks
// regressions without rewriting applied history; reconciling them is a separate,
// approval-gated task.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HISTORICAL_NON_MONOTONIC = new Set([
  "0040_daily_briefings",
  "0045_eager_bloodstorm",
  "0046_cognitive_runtime_schema",
  "0047_guardian_autonomy_tiers",
  "0048_pulse_schema",
  "0049_constellation_saved_views",
  "0050_executive_briefing_engine",
  "0051_terra_modules",
  "0052_terra_covenants",
  "0053_fund_inbound_deals_attachments",
  "0054_fix_auth_timestamp_timezone",
  "0055_lp_portal_data_room",
  "0056_ot_ics_decoder",
  "0057_password_reset_token",
  "0058_holdings_inquiries_utm",
  "0059_ai_evals_tables",
  "0060_business_events_composite_idx",
  "0061_replay_and_eval_persistence",
  "0062_atlas_execution_runs",
  "0063_carlota_advisory_tables",
  "0096_inference_log",
  "0097_fund_inbound_deal_partner_fields",
  "0098_lyte_pressure_acknowledged",
  "0101_email_suppressions",
  "0109_crisis_arena_tables",
  "0110_backfill_last_digest_sent_at",
  "0102_email_system_completion",
  "0103_export_storage_key",
  "0104_ot_ics_triage_cols",
  "0105_notification_preferences_last_digest_sent_at",
  "0106_alert_rule_notify_cooldown",
  "0107_alert_evaluation_runs",
  "0108_fusion_cortex_alerts",
  "0111_nexus_v1_sessions",
  "0112_rf_intel_tables",
  "0113_digital_twins_hil_pipeline",
  "0114_net30_invoicing",
  "0115_email_send_log",
  "0116_revenue_events"
]);
const HISTORICAL_ORPHANS = new Set(['0146_eval_registry_foundation']);
const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'drizzle/meta/_journal.json'), 'utf8'));
const files = fs.readdirSync(path.join(ROOT, 'drizzle')).filter((f) => f.endsWith('.sql')).map((f) => f.slice(0, -4));
const tags = new Set(j.entries.map((e) => e.tag));
const problems = [];
// Bind the pre-existing 148-entry journal prefix to the reviewed baseline.
// An appended entry with locally increasing 'when' can still be silently skipped
// by the deployed migrator if inserted BEFORE previously applied high-water.
// The prefix hash prevents such mid-journal insertions and edits to applied
// history. SHA-256 here is a structural change detector, not a signature.
const HISTORICAL_ENTRY_COUNT = 148;
const HISTORICAL_PREFIX_SHA256 = '4f34ef497e24cda134a0c8f3542559bb20aee9ca4ac7333f0de848ce0364ae13';
const historicalEntries = j.entries.slice(0, HISTORICAL_ENTRY_COUNT);
const historicalHash = crypto.createHash('sha256').update(JSON.stringify(historicalEntries)).digest('hex');
if (historicalEntries.length !== HISTORICAL_ENTRY_COUNT || historicalHash !== HISTORICAL_PREFIX_SHA256) {
  problems.push('historical journal prefix modified, reordered, or new migration inserted before applied high-water mark');
}
const historicalHighWater = Math.max(...historicalEntries.map((e) => e.when));
let appendHighWater = historicalHighWater;
for (const e of j.entries.slice(HISTORICAL_ENTRY_COUNT)) {
  if (!Number.isSafeInteger(e.when) || e.when <= appendHighWater) {
    problems.push(`new migration ${e.tag} has when=${e.when} <= applied high-water ${appendHighWater}; would be skipped`);
  }
  appendHighWater = Math.max(appendHighWater, e.when);
}
for (const f of files) if (!tags.has(f) && !HISTORICAL_ORPHANS.has(f)) problems.push(`not in journal: ${f}.sql`);
for (const t of tags) if (!files.includes(t)) problems.push(`journal entry without file: ${t}`);
let max = -1;
for (const e of j.entries) {
  if (e.when <= max && !HISTORICAL_NON_MONOTONIC.has(e.tag)) problems.push(`non-monotonic when: ${e.tag} (${e.when} <= ${max}) — drizzle migrate would skip it on existing databases`);
  max = Math.max(max, e.when);
}
j.entries.forEach((e, i) => { if (e.idx !== i) problems.push(`idx gap at ${e.tag}`); });
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`[check-journal] ok — ${j.entries.length} entries, ${HISTORICAL_NON_MONOTONIC.size} allow-listed historical entries`);
