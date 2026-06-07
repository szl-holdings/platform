import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
  PageBreak,
  BorderStyle,
  ShadingType,
} from 'docx';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'SZL-Standby-Content-Calendar.docx';
const SCREENSHOTS = 'screenshots';

// ---------- Posts ----------
const posts = [
  {
    n: 1,
    date: 'Friday, April 24, 2026',
    slug: 'audit-trails-shipped',
    screenshot: '02-command.jpg',
    caption: 'Unified Command — the governance surface every Quick Action now writes to.',
    story: 'audit-trails',
  },
  {
    n: 2,
    date: 'Sunday, April 26, 2026',
    slug: 'kora-vantex',
    screenshot: '15-lyte.jpg',
    caption: 'Lyte — live signal stream catching the Vantex Acquisition stall before the quarter closed.',
    story: 'kora-vantex',
  },
  {
    n: 3,
    date: 'Monday, April 27, 2026',
    slug: 'boring-security',
    screenshot: '19-sentra.jpg',
    caption: 'Sentra — cyber posture turned into a command surface; the same posture we hold ourselves to.',
    story: 'boring-security',
  },
  {
    n: 4,
    date: 'Friday, May 1, 2026',
    slug: 'counsel-ships',
    screenshot: '16-counsel.jpg',
    caption: 'Counsel — turning matters, obligations, and legal exposure into command.',
    story: 'counsel-ships',
  },
  {
    n: 5,
    date: 'Sunday, May 3, 2026',
    slug: 'domaine-live',
    screenshot: '06-terra.jpg',
    caption: 'Terra — the operating surface for serious real estate, now in pilot.',
    story: 'domaine-live',
  },
  {
    n: 6,
    date: 'Monday, May 4, 2026',
    slug: 'one-loop',
    screenshot: '14-szl-portfolio.jpg',
    caption: 'SZL Holdings — six command surfaces, one decision loop, one accountability spine.',
    story: 'one-loop',
  },
];

// ---------- Copy ----------
const copy = {
  // -------- POST 1: Audit trails shipped --------
  'audit-trails': {
    medium: {
      title: 'Every AI Decision Now Has a Per-User Audit Trail. Here Is Why That Matters.',
      body: [
        'Most "AI in the enterprise" stories end at the recommendation. The model produces an answer, the operator clicks something, and the trail goes cold. That is the gap that breaks accountability. Today we closed it across the SZL Decision OS.',
        'This week we shipped per-user decision history for every Quick Action surfaced through APEX, our governed action layer. When an executive approves or rejects an AI-recommended action — on the dashboard, on mobile, anywhere — we now record who decided, when, against what evidence, and under which policy. That history is queryable per user, per organization, and per action type, ordered chronologically by the decision timestamp itself rather than the side effect of the action.',
        'The detail that took the most care was the smallest: ordering by COALESCE(approved_at, rejected_at) DESC. A rejected action and an approved one are both decisions; both deserve the same treatment in the timeline. Most audit systems quietly drop the rejections. Ours does not.',
        'The default scope is the user themselves. A super_admin can read across the org for incident review, but no other role can. This is enforced in the route, in the storage layer, and in the policy package — three independent gates so a single mistake cannot leak someone else\'s decision history. We wrote seven tests against that contract before we wrote the screen.',
        'Why does this matter for a Series A pitch? Because the failure mode for "AI for executives" is invisible decisions. If the model recommends, the human clicks, and nothing is recorded with attribution, you have built faster bureaucracy, not better governance. Investors who have seen the inside of a regulated enterprise know exactly what that costs.',
        'Per-user history is unglamorous infrastructure. So is the underlying covenant policy that gates the action in the first place, and the proof chain that ties it back to the original signal. Together they are the difference between a demo and a production system.',
        'On the user side, the new screen lives in the mobile shell at /quick-actions-history and on the web command surface inside APEX. Each row shows the recommendation, the decision, the actor, the timestamp, the policy that allowed it, and a deep link to the full proof chain.',
        'We are pausing for a short funding window. When we resume, the next layer is the SZL Agent Mesh — a single contract for how every artifact participates in the same decision loop. The audit trail we shipped this week is the substrate it will sit on.',
      ],
    },
    substack: {
      subject: 'Per-user audit trails for every AI decision — shipped',
      body: [
        'Quick update from inside the build:',
        'We shipped per-user decision history this week for every Quick Action in the SZL Decision OS. When an executive approves or rejects an AI-recommended action, we now record who, when, against what evidence, under which policy — and we let them see their own history, ordered by the decision timestamp itself.',
        'The boring detail that mattered: rejections count as decisions. Most audit systems drop them. Ours uses COALESCE(approved_at, rejected_at) DESC so the timeline tells the truth.',
        'The default scope is the user themselves. Super_admin can read across the org for incident review; no other role can. Three independent gates enforce it — route, storage, policy package — and seven tests pin the contract.',
        'This is the substrate the Agent Mesh will sit on when we resume after a short funding pause. Unglamorous, load-bearing, exactly the kind of work we want investors to ask about.',
      ],
    },
    linkedin: {
      hook: 'Most "AI for executives" demos end at the recommendation. That is the gap that breaks accountability.',
      body: [
        'This week we shipped per-user decision history across the SZL Decision OS.',
        'Every Quick Action — approved or rejected — now writes a record with:',
        '• Actor (who decided)',
        '• Timestamp (when, on the decision itself, not the side effect)',
        '• Evidence chain (what was on the screen)',
        '• Policy gate (what allowed it)',
        '',
        'Default scope: the user themselves. Cross-org review: super_admin only, three independent gates, seven tests pinning the contract.',
        '',
        'Boring infrastructure. Series A conviction is built on it.',
      ],
      cta: 'If you are building governance into AI tools for the enterprise, I want to compare notes.',
    },
    x: [
      'shipped this week: per-user decision history for every AI Quick Action across the SZL Decision OS.',
      'every approval and every rejection now writes: actor, timestamp on the decision (not the side effect), evidence chain, policy gate.',
      'the small detail that took the most care: COALESCE(approved_at, rejected_at) DESC. rejections are decisions too. most audit systems quietly drop them. ours doesn\'t.',
      'default scope is the user themselves. super_admin can read across the org for incident review. no other role can. three independent gates, route → storage → policy package.',
      'seven tests pin the contract before the screen existed. unglamorous, load-bearing.',
      'this is the substrate the Agent Mesh sits on when we resume. brief funding pause, then back.',
    ],
  },

  // -------- POST 2: Lyte Vantex --------
  'kora-vantex': {
    medium: {
      title: 'How Lyte Caught a $4.2M Stalled Deal Before the CFO Did',
      body: [
        'Inside the SZL portfolio there is a synthetic enterprise we use to demonstrate Lyte, our decision intelligence platform. The synthetic CFO has a real problem: the Vantex Acquisition has been stalled for forty-seven days, and the approval chain is silently void because the original approver left the company without a recorded handoff.',
        'In a normal business intelligence stack, this is a forensic exercise. Someone notices revenue is short, someone pulls a report, someone schedules a meeting, someone asks where the deal got stuck. Two weeks pass while the answer reassembles itself out of email.',
        'Lyte does not work like that. It is an outcome graph, not a dashboard. It traces signals — approval chain failures, escalation attempts blocked by policy, workflow health degradation, buyer engagement decay — to the single root cause that explains them. On the Vantex incident, that root is a self-locked approval chain, with three automated escalations refused because the policy never named a fallback approver.',
        'The intelligence summary on screen this morning reads, with 91% confidence: "$4.2M revenue exposure elevated — approval chain failure is the root cause." Below it: 47 active signals, 8 stalled approvals, workflow health at 62% (down 11 points), 14 unaddressed recommendations in the decision backlog, 94% evidence coverage on the decisions that have been made.',
        'Each of those numbers has a defensible source. Each signal has a citation. Each recommendation has a confidence score and a retrieval provenance. None of it is a hallucinated narrative. This is the part that matters for executives who have learned not to trust AI summaries: every line on the screen is auditable down to the underlying event.',
        'The pattern Lyte caught — departed-approver chain failures — is a category, not a one-off. We have a backlog of customers describing the same incident in different industries: a procurement chain locks because the buyer left, a clinical trial site stalls because the medical monitor rotated off, a syndicated loan freezes because the lead bank changed deal teams. The chain is "silently void" until something forces an audit. Lyte forces the audit on day three, not day forty-seven.',
        'For Vantex specifically, the recommended next action is on the screen in the Decision Backlog: "Emergency CFO escalation — reassign Vantex approval." The action is governed; it routes through the covenant policy package, requires explicit confirmation, writes a per-user audit trail, and only then executes. This is the loop the SZL Decision OS exists to compress: from signal to recommendation to approved action to verified outcome, with full attribution at every step.',
        'When investors ask what we are selling, this is the answer: not a faster dashboard, not a smarter alert, but the closed loop that makes the next decision a recorded one.',
      ],
    },
    substack: {
      subject: 'Lyte caught a $4.2M stalled deal before the CFO did',
      body: [
        'A short story from inside the demo, because it is the cleanest version of the thesis:',
        'Inside our portfolio, the Vantex Acquisition has been stalled for 47 days. The approval chain is silently void — the original approver left, no handoff was recorded, three automated escalations were refused by policy.',
        'Lyte, our decision intelligence platform, surfaces this morning with 91% confidence: $4.2M revenue exposure elevated, approval chain failure is the root cause. 47 active signals. 8 stalled approvals. Workflow health 62%, down 11 points. 94% evidence coverage on the decisions that have been made.',
        'Every number has a defensible source. Every recommendation has a confidence score and a retrieval provenance. The recommended next action — "Emergency CFO escalation, reassign Vantex approval" — is governed: covenant policy gate, explicit confirmation, per-user audit trail, then execute.',
        'This is the loop. Not a faster dashboard. The closed loop that makes the next decision a recorded one.',
      ],
    },
    linkedin: {
      hook: '$4.2M revenue exposure. 47 days stalled. Approval chain silently void because the approver left without a handoff.',
      body: [
        'This is a real pattern in real companies. Procurement chains lock when the buyer leaves. Clinical trials stall when the monitor rotates. Loans freeze when the lead bank changes deal teams.',
        '',
        'Lyte, our decision intelligence platform, caught the Vantex stall on day three with 91% confidence. Root cause named, recommended action governed, audit trail attached. The CFO did not have to discover the problem from a quarterly review.',
        '',
        'Most BI stacks tell you what happened. The SZL Decision OS tells you what to do next, who is accountable, and whether it is safe to execute.',
      ],
      cta: 'Building decision infrastructure for the enterprises that have learned not to trust dashboards.',
    },
    x: [
      'real pattern: procurement chain stalls because the original approver left and no one recorded the handoff. forty-seven days later the CFO finds out from a revenue miss.',
      'Lyte caught the same pattern on day three: $4.2M exposure, 91% confidence, root cause named — approval chain failure, three automated escalations refused by policy.',
      'every number on the screen has a citation. 47 active signals. 8 stalled approvals. workflow health 62%. 94% evidence coverage on decisions already made.',
      'recommended next action is governed: covenant policy gate, explicit confirmation, per-user audit trail, then execute.',
      'most BI stacks tell you what happened. SZL\'s decision OS tells you what to do next, who\'s accountable, and whether it\'s safe to run.',
      'closed loop. recorded decisions. that\'s the product.',
    ],
  },

  // -------- POST 3: Boring security --------
  'boring-security': {
    medium: {
      title: 'The Boring Security Work That Earns Series A Conviction',
      body: [
        'There is a kind of work that does not show up in a demo and does not survive a feature roadmap. It is the work that makes the difference between a startup that can sell to a regulated enterprise and one that cannot. We did three weeks of it, and I want to write it down because it is exactly the kind of thing investors do not ask about — and exactly the thing they should.',
        'First: cross-tenant data isolation. Every API route now scopes by organization identifier. Cross-org access returns 404, not 403, so an attacker cannot enumerate organizations they do not belong to. We wrote the property test that asserts this for the entire route table. It runs in CI on every commit. We did not announce this because it is the floor, not a feature.',
        'Second: historical IP-hash backfill. The audit log records the requesting IP for every action so that an incident can be reconstructed. We were storing the raw value. We rewrote the migration to hash on a per-org salt, backfilled every historical row, and pinned the new contract with a migration test plus an IP-hashing unit test. Three hundred lines of test code for forty lines of migration code, and that ratio is correct.',
        'Third: full-history credential scan. We ran gitleaks across every commit, every branch, every reflog. We tuned the allowlist after the first real CI run so the signal is actionable. We documented the rotation runbook for Firebase and Google Play credentials, including the exact CLI invocations, because the runbook that lives in someone\'s head fails the audit. This work is recorded in KNOWN-GAPS.md, which is a document we are proud to send to a customer.',
        'Why this matters: the failure mode for AI-assisted operations platforms is exactly the failure mode for any multi-tenant SaaS — boring tenant leakage, boring credential exposure, boring audit gaps. Layer AI on top of those failure modes and the blast radius is larger, not smaller. The structural answer is the same as the answer for any serious enterprise platform: deny by default, scope by organization, record everything with attribution, rotate on a schedule, and write the test before you write the feature.',
        'Sentra is the SZL artifact that turns this posture into a product surface for the customer. Sentra, the brand we run it under, gives security leaders a command center for cyber posture, recovery readiness, and live incidents — not a SIEM dashboard, but the operating surface where the recommended next action is governed and recorded. We hold ourselves to the same posture. The platform that runs Sentra is built the way Sentra tells customers to build.',
        'When we resume after the funding pause, the next investment is the Agent Mesh — a unified contract for how every artifact participates in the same governed loop. That contract starts with the security primitives we hardened these last three weeks. It is the load-bearing floor. Series A conviction is built on it.',
      ],
    },
    substack: {
      subject: 'The boring security work that earns Series A conviction',
      body: [
        'Three weeks of unglamorous work I want to record:',
        '1) Cross-tenant data isolation across every API route. Cross-org access returns 404, not 403. Property test asserts the contract on every commit.',
        '2) Historical IP-hash backfill in the audit log. Per-org salt. 300 lines of test for 40 lines of migration, and that ratio is correct.',
        '3) Full-history gitleaks scan across every commit, branch, reflog. Allowlist tuned. Firebase + Google Play rotation runbook written down because the runbook that lives in someone\'s head fails the audit.',
        'This is the structural posture. Deny by default, scope by org, record with attribution, rotate on a schedule, test before feature. We hold ourselves to the same posture our cyber resilience product (Sentra, on the Sentra surface) tells customers to hold.',
        'Series A conviction is built on this floor.',
      ],
    },
    linkedin: {
      hook: 'Three weeks of work that did not ship as a feature, and that is exactly the point.',
      body: [
        'The work investors do not ask about, and should:',
        '',
        '→ Cross-tenant isolation: every route scoped by org identifier; cross-org access returns 404 (not 403, so attackers can\'t enumerate). Property test on every commit.',
        '→ IP-hash backfill in the audit log, per-org salt. 300 lines of test for 40 lines of migration. The ratio is correct.',
        '→ Full-history gitleaks scan, allowlist tuned, Firebase + Google Play rotation runbook written down.',
        '',
        'The same posture we hold ourselves to is the posture our cyber resilience product (Sentra) tells customers to hold. The platform that runs the product is built the way the product says to build.',
      ],
      cta: 'If you sell into regulated enterprises, this floor is non-negotiable. Happy to compare runbooks.',
    },
    x: [
      'three weeks of security work that did not ship as a feature. exactly the point.',
      'cross-tenant isolation: every API route scoped by org identifier. cross-org access returns 404, not 403, so attackers can\'t enumerate. property test asserts the contract on every commit.',
      'IP-hash backfill in the audit log, per-org salt. 300 lines of test for 40 lines of migration. the ratio is correct.',
      'full-history gitleaks across every commit, branch, reflog. allowlist tuned after the first real CI run. firebase + google play rotation runbook written down.',
      'the platform that runs our cyber resilience product (Sentra) is built the way Sentra tells customers to build. that\'s the discipline that earns series A conviction.',
    ],
  },

  // -------- POST 4: Counsel ships --------
  'counsel-ships': {
    medium: {
      title: 'Counsel Ships: Turning Matters, Obligations, and Legal Exposure into Command',
      body: [
        'General counsel and legal operations teams have the same problem the rest of the enterprise has, but worse. They have more matters than they can hold in their head, more obligations than any matter management tool tracks, and more dependencies between matters than any spreadsheet can model. The next decision is always upstream of the one they were just asked to make.',
        'Counsel is the SZL artifact for that audience. It is not a matter management replacement. It is a command surface that sits on top of whatever already exists — the matter system, the contract repository, the obligations registry, the spend tracker — and shows the legal organization three things: where the exposure is, what the matters depend on, and which decision someone has to make this week.',
        'It is built on FORGE, our governed execution fabric. That means every recommendation Counsel surfaces carries a citation back to the source matter and the relevant clauses, every action it suggests is gated by policy, and every decision someone makes through it is written to a per-user audit trail that survives the audit committee.',
        'The launch surface today is the public landing — the brand statement and a request-a-pilot path. Behind it, the matter command center is built and seeded for design partners. The seed data is real-shaped: live matters, layered obligations, dependency edges that are not just labels. That matters because the failure mode of legal-tech demos is fictional crispness; ours is shaped like the messes a general counsel actually walks into on Monday morning.',
        'Why ship Counsel inside SZL Holdings rather than as a standalone? Because the same governance primitives — covenant policy, proof chain, decision backlog, evidence coverage — are the spine for every artifact in our portfolio. Counsel reuses what Lyte, Sentra, Terra, and Vessels all sit on. The legal organization gets the same recorded decision loop as finance, security, real estate, and maritime. That loop is the company.',
        'We are pausing for a short funding window. When we resume, Counsel\'s pilot cohort opens. If you are general counsel or head of legal ops at a mid-market or enterprise organization and you want to be in that cohort, the request path is on the landing page.',
      ],
    },
    substack: {
      subject: 'Counsel ships — legal exposure as a command surface',
      body: [
        'Counsel is live on its public surface today. It is the SZL artifact for general counsel and legal ops.',
        'Not a matter management replacement. A command surface that sits on top of the matter system, the contract repo, the obligations registry, and shows the legal organization three things: where the exposure is, what matters depend on each other, and what decision someone has to make this week.',
        'Built on FORGE, our governed execution fabric. Every recommendation has a citation back to the source matter and clauses. Every action is policy-gated. Every decision writes a per-user audit trail.',
        'Seeded with real-shaped data — live matters, layered obligations, dependency edges that are not just labels. Failure mode of most legal-tech demos is fictional crispness. Ours is shaped like the Monday morning a real general counsel walks into.',
        'Pilot cohort opens after a short funding pause. Request path is on the landing.',
      ],
    },
    linkedin: {
      hook: 'General counsel: the next decision you have to make is always upstream of the one you were just asked to make.',
      body: [
        'Counsel is live today on its public surface — the SZL artifact for general counsel and legal operations.',
        '',
        'It is not a matter management replacement. It is a command surface that sits on top of the matter system, the contract repo, and the obligations registry, and shows three things:',
        '• Where the exposure is (across all matters, not just open ones)',
        '• What matters depend on each other (real edges, not labels)',
        '• Which decision someone has to make this week',
        '',
        'Built on FORGE, our governed execution fabric. Every recommendation cites the source matter and clauses. Every action is policy-gated. Every decision writes a per-user audit trail.',
      ],
      cta: 'Pilot cohort opens after a short funding window. If you run a legal organization and want in, the request path is on the landing.',
    },
    x: [
      'Counsel is live. SZL\'s artifact for general counsel and legal ops.',
      'not a matter management replacement. a command surface that sits on top of the matter system, the contract repo, the obligations registry — and shows you where the exposure is, what depends on what, and what decision someone has to make this week.',
      'built on FORGE, our governed execution fabric. every recommendation cites the source matter and clauses. every action is policy-gated. every decision writes a per-user audit trail that survives the audit committee.',
      'seeded with real-shaped data: live matters, layered obligations, dependency edges that aren\'t just labels. failure mode of most legal-tech demos is fictional crispness. ours is shaped like the monday morning a real GC walks into.',
      'pilot cohort opens after a short funding pause. request path is on the landing.',
    ],
  },

  // -------- POST 5: Terra live --------
  'domaine-live': {
    medium: {
      title: 'Terra: The Operating Surface for Serious Real Estate',
      body: [
        'The serious real estate organization — the one that actually owns property, runs portfolios, and underwrites distressed acquisitions — does not need another listings tool. It needs an operating surface. That is what Terra is.',
        'Terra is the SZL artifact for investors, brokers, and portfolio teams who carry real-estate decisions on a balance sheet. It runs on a single intelligence layer that spans distressed property discovery, ownership analysis, pipeline management, and deal execution. Discovery flows into analysis flows into pipeline flows into execution; the same evidence travels with the asset from the first signal to the closed deal.',
        'The technical interesting bit is the spatial runtime underneath it. Terra shares an ATLAS spatial layer with Vessels (our maritime intelligence artifact) and the Unified Command surface. That means a property in Terra is the same kind of object as a vessel in Vessels — an entity in the worldline registry, with positions, ownership, jurisdiction, and policy attached. Cross-domain queries are real, not stitched.',
        'Why does that matter for a real estate operator? Because the messy real-world questions are cross-domain by nature. "Who owns the LLC that owns this distressed property, and have they had a vessel arrest in the last three years?" "Which of our portfolio properties are in jurisdictions where my buyer is currently subject to a regulatory action?" Those questions take a forensics team in most firms. In Terra they are queries.',
        'What is shipping today is the public landing and the pilot request path, with the live operator surface behind sign-in for the design partner cohort. The pilot is gated because the seed data and the policy posture are calibrated to the partner — Terra is not a self-serve product yet, by design.',
        'When we resume after the funding pause, Terra expands its pilot cohort to a small number of additional partners. If you are running real-estate decisions on a balance sheet and you want to be evaluated, the request path is on the landing.',
      ],
    },
    substack: {
      subject: 'Terra is live — the operating surface for serious real estate',
      body: [
        'Terra is live on its public surface today. It is the SZL artifact for real-estate investors, brokers, and portfolio teams who carry decisions on a balance sheet.',
        'Single intelligence layer across distressed discovery, ownership analysis, pipeline, and execution. Same evidence travels with the asset from first signal to closed deal.',
        'Underneath it is ATLAS, our spatial runtime, shared with Vessels (maritime intelligence) and Unified Command. A property in Terra is the same kind of object as a vessel in Vessels — an entity in the worldline registry with positions, ownership, jurisdiction, policy. Cross-domain queries are real, not stitched.',
        'Pilot is gated by design. Seed data and policy posture calibrated to the partner.',
        'Cohort expands after a short funding pause. Request path is on the landing.',
      ],
    },
    linkedin: {
      hook: 'The serious real estate organization does not need another listings tool. It needs an operating surface.',
      body: [
        'Terra is live today — the SZL artifact for investors, brokers, and portfolio teams who carry real-estate decisions on a balance sheet.',
        '',
        'One intelligence layer across:',
        '→ Distressed property discovery',
        '→ Ownership analysis (entities, layers, real beneficial owners)',
        '→ Pipeline management',
        '→ Deal execution',
        '',
        'Same evidence travels with the asset from first signal to closed deal.',
        '',
        'Underneath sits ATLAS, our spatial runtime — shared with Vessels (maritime). A property and a vessel are the same kind of object: an entity with positions, ownership, jurisdiction, and policy. Cross-domain queries are queries, not forensic projects.',
      ],
      cta: 'Pilot cohort opens after a short funding pause. Request path is on the landing.',
    },
    x: [
      'Terra is live. SZL\'s artifact for real-estate investors, brokers, and portfolio teams who carry decisions on a balance sheet.',
      'one intelligence layer across distressed discovery, ownership analysis, pipeline, execution. same evidence travels with the asset from first signal to closed deal.',
      'underneath: ATLAS, our spatial runtime. shared with Vessels (maritime intelligence) and Unified Command. a property in Terra is the same kind of object as a vessel in Vessels — entity, positions, ownership, jurisdiction, policy.',
      'cross-domain question: "who owns the LLC that owns this distressed property, and have they had a vessel arrest in the last three years?" — that is a query in Terra, not a forensics project.',
      'pilot is gated by design. cohort expands after a short funding pause. request path is on the landing.',
    ],
  },

  // -------- POST 6: One Loop --------
  'one-loop': {
    medium: {
      title: 'Six Command Surfaces, One Decision Loop: How SZL\'s Operating System Holds Together',
      body: [
        'The most common question we get from investors is some version of: "Is this one product or six?" The honest answer is that the visible layer is six command surfaces — Lyte, Terra, Vessels, Sentra, FORGE, Carlota Jo — and the invisible layer is one decision loop. The thesis is the loop. The surfaces exist because the loop is domain-aware, and an operator does not want to leave their domain to do their job.',
        'The loop is short enough to write on a napkin: signal → context → recommendation → simulation → policy → approval → execution → proof → outcome. Every step is instrumented. Every decision is attributed. Every AI recommendation carries source citations and confidence scores. Every consequential action requires human confirmation. That sequence is the same in every artifact, and that is what makes SZL Holdings one company instead of a portfolio of unrelated tools.',
        'Lyte is the loop applied to enterprise decision intelligence — signals from business systems, recommendations to operators, governed actions back into those systems. Terra is the loop applied to real estate. Vessels is the loop applied to maritime. Sentra is the loop applied to cyber posture and incident response. FORGE is the execution fabric every other artifact runs on. Counsel is the loop applied to legal exposure. Carlota Jo is the loop applied to private advisory and household operations — yes, the same primitives apply, because the failure modes are the same: too many open threads, no record of who decided what, no continuity between advisor and principal.',
        'The Unified Command surface is the operator\'s view of all of it together. It is the cross-domain workspace where a CFO can look at a Lyte signal next to a Counsel obligation and a Sentra exposure on the same screen, with the same evidence model behind each one. Two participants viewing live in the screenshot at the top of this post is not a stage prop; it is the actual collaborative session model the surface uses.',
        'What we have not built yet — and have been deliberate about not over-promising — is the Agent Mesh. That is the unified contract for how every artifact registers its agents, exposes its actions, and participates in the same governed loop. We mapped it, scoped it into five phases, and parked Phase 0 (the audit) as the first task to file when we resume. We did not start it yet because the right time to design the mesh is after the security floor is hardened and after the audit-trail substrate is in place. Both of those happened in the last three weeks.',
        'We are pausing here for a short funding window. The platform stays up. The decision loop stays recorded. The deferred work is documented. Series A conversations are open; the artifact set on the screen is the demo, the architecture documents are the diligence pack, and the audit-trail history we shipped this week is the receipts.',
        'If you want to talk, the contact path is on the SZL Holdings portfolio dashboard. We will be back in a few weeks.',
      ],
    },
    substack: {
      subject: 'Six command surfaces, one decision loop',
      body: [
        'The honest answer to "is SZL one product or six?" is that the visible layer is six command surfaces — Lyte, Terra, Vessels, Sentra, FORGE, Carlota Jo — and the invisible layer is one decision loop. The thesis is the loop.',
        'signal → context → recommendation → simulation → policy → approval → execution → proof → outcome.',
        'Every step instrumented. Every decision attributed. Every recommendation cited. Every consequential action requires human confirmation. Same sequence in every artifact. That is what makes SZL Holdings one company.',
        'Unified Command is the cross-domain workspace where a CFO can look at a Lyte signal next to a Counsel obligation and a Sentra exposure on the same screen, same evidence model behind each.',
        'What we have not built yet: the Agent Mesh — the unified contract for how every artifact participates in the same loop. Mapped, scoped, parked. First task to file when we resume.',
        'Pausing for a short funding window. Platform stays up. Decision loop stays recorded. Series A conversations are open.',
      ],
    },
    linkedin: {
      hook: 'Most common investor question: is SZL one product or six?',
      body: [
        'Honest answer: the visible layer is six command surfaces. The invisible layer is one decision loop. The thesis is the loop.',
        '',
        'signal → context → recommendation → simulation → policy → approval → execution → proof → outcome',
        '',
        'Same sequence in every artifact:',
        '• Lyte — enterprise decision intelligence',
        '• Terra — real estate',
        '• Vessels — maritime',
        '• Sentra — cyber posture and incident response',
        '• FORGE — the execution fabric every artifact runs on',
        '• Counsel — legal exposure',
        '• Carlota Jo — private advisory continuity',
        '',
        'Unified Command is the cross-domain workspace. A CFO looks at a Lyte signal next to a Counsel obligation and a Sentra exposure on the same screen with the same evidence model behind each.',
      ],
      cta: 'Pausing for a short funding window. Platform stays up. Series A conversations are open. Contact path on the portfolio dashboard.',
    },
    x: [
      'most common investor question: is SZL one product or six?',
      'honest answer: visible layer is six command surfaces — Lyte, Terra, Vessels, Sentra, FORGE, Counsel, Carlota Jo. invisible layer is one decision loop. the thesis is the loop.',
      'signal → context → recommendation → simulation → policy → approval → execution → proof → outcome. every step instrumented. every decision attributed. every recommendation cited. every consequential action requires human confirmation.',
      'Unified Command is the cross-domain workspace. a CFO can look at a Lyte signal next to a Counsel obligation and a Sentra exposure on the same screen, same evidence model behind each.',
      'what we haven\'t built yet: the Agent Mesh. unified contract for how every artifact participates in the same loop. mapped, scoped, parked as first task to file when we resume.',
      'pausing for a short funding window. platform stays up. decision loop stays recorded. series A conversations are open. contact path on the portfolio dashboard.',
    ],
  },
};

// ---------- Doc helpers ----------
const COLOR = {
  primary: '0B1E2D',
  accent: '5DA88C',
  muted: '6B7280',
  rule: 'D1D5DB',
};

const H1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 240, after: 120 },
  children: [new TextRun({ text, bold: true, size: 36, color: COLOR.primary })],
});

const H2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 200, after: 100 },
  children: [new TextRun({ text, bold: true, size: 28, color: COLOR.primary })],
});

const H3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 160, after: 80 },
  children: [new TextRun({ text, bold: true, size: 24, color: COLOR.accent, allCaps: true })],
});

const P = (text, opts = {}) => new Paragraph({
  spacing: { before: 60, after: 120, line: 320 },
  children: [new TextRun({ text, size: 22, ...opts })],
});

const PMuted = (text) => new Paragraph({
  spacing: { before: 40, after: 80 },
  children: [new TextRun({ text, italics: true, size: 20, color: COLOR.muted })],
});

const Divider = () => new Paragraph({
  border: { bottom: { color: COLOR.rule, space: 1, style: BorderStyle.SINGLE, size: 6 } },
  spacing: { before: 120, after: 120 },
});

const PageBreakP = () => new Paragraph({ children: [new PageBreak()] });

const Bullet = (text) => new Paragraph({
  bullet: { level: 0 },
  spacing: { before: 30, after: 30 },
  children: [new TextRun({ text, size: 22 })],
});

function imageParagraph(filepath, caption) {
  if (!fs.existsSync(filepath)) return P(`[image missing: ${filepath}]`, { italics: true, color: COLOR.muted });
  const data = fs.readFileSync(filepath);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [
        new ImageRun({
          data,
          transformation: { width: 560, height: 315 },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [new TextRun({ text: caption, italics: true, size: 18, color: COLOR.muted })],
    }),
  ];
}

// ---------- Build sections per post ----------
function buildPost(post) {
  const c = copy[post.story];
  const blocks = [];

  blocks.push(H1(`Post ${post.n} · ${post.date}`));
  blocks.push(PMuted(`Story slug: ${post.slug}`));
  blocks.push(...imageParagraph(path.join(SCREENSHOTS, post.screenshot), post.caption));
  blocks.push(Divider());

  // Medium
  blocks.push(H2('Medium'));
  blocks.push(H3('Title'));
  blocks.push(P(c.medium.title, { bold: true, size: 26 }));
  blocks.push(H3('Body'));
  for (const para of c.medium.body) blocks.push(P(para));
  blocks.push(Divider());

  // Substack
  blocks.push(H2('Substack'));
  blocks.push(H3('Subject Line'));
  blocks.push(P(c.substack.subject, { bold: true }));
  blocks.push(H3('Body'));
  for (const para of c.substack.body) blocks.push(P(para));
  blocks.push(Divider());

  // LinkedIn
  blocks.push(H2('LinkedIn'));
  blocks.push(H3('Hook'));
  blocks.push(P(c.linkedin.hook, { bold: true }));
  blocks.push(H3('Body'));
  for (const line of c.linkedin.body) {
    if (line.startsWith('•') || line.startsWith('→')) blocks.push(Bullet(line.replace(/^[•→]\s*/, '')));
    else if (line === '') blocks.push(P(' '));
    else blocks.push(P(line));
  }
  blocks.push(H3('Call to action'));
  blocks.push(P(c.linkedin.cta, { italics: true }));
  blocks.push(Divider());

  // X
  blocks.push(H2('X (Twitter Thread)'));
  c.x.forEach((tweet, i) => {
    blocks.push(P(`${i + 1}/${c.x.length} — ${tweet}`, { size: 22 }));
    blocks.push(PMuted(`(${tweet.length} chars)`));
  });

  blocks.push(PageBreakP());
  return blocks;
}

// ---------- Build whole document ----------
const sections = [];

// Cover page
sections.push(H1('SZL Holdings — Standby Content Calendar'));
sections.push(P('Six unique posts. Four platform variants each. One professional in-app screenshot per story.', { italics: true, size: 24 }));
sections.push(P('Built ahead of a short funding pause. Schedule covers Friday, Sunday, Monday for two consecutive weeks.', { color: COLOR.muted }));
sections.push(Divider());

sections.push(H2('Schedule overview'));
for (const p of posts) {
  sections.push(P(`Post ${p.n} — ${p.date} — ${copy[p.story].medium.title}`, { bold: true }));
}
sections.push(Divider());

sections.push(H2('How to use'));
sections.push(Bullet('Each post is fully drafted across Medium, Substack, LinkedIn, and X (Twitter thread).'));
sections.push(Bullet('Each story is unique — different angle, different evidence, different screenshot.'));
sections.push(Bullet('Screenshots are real captures of the running platform from 2026-04-23.'));
sections.push(Bullet('LinkedIn copy uses arrows (→) for visual hierarchy; replace with bullet character if your account prefers.'));
sections.push(Bullet('X threads are pre-numbered; each tweet is well under 280 characters.'));
sections.push(Bullet('Substack subject line is the email subject; body is the post body.'));
sections.push(PageBreakP());

for (const post of posts) {
  for (const block of buildPost(post)) sections.push(block);
}

const doc = new Document({
  creator: 'SZL Holdings',
  title: 'Standby Content Calendar',
  description: 'Six unique posts × four platforms, with in-app screenshots, ahead of a funding pause.',
  sections: [{ properties: {}, children: sections }],
});

const buf = await Packer.toBuffer(doc);
fs.writeFileSync(OUT, buf);
console.log(`Wrote ${OUT} (${(buf.length / 1024).toFixed(0)} KB)`);
