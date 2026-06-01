-- Counsel GC: seed 6 demo matters with fixed dates anchored to 2026-04-26
-- Dates: d(N) = 2026-04-26 + N days
-- d(-200)=2025-10-08  d(-120)=2025-12-27  d(-90)=2026-01-26  d(-85)=2026-01-31
-- d(-60)=2026-02-25   d(-45)=2026-03-12   d(-30)=2026-03-27  d(-20)=2026-04-06
-- d(-15)=2026-04-11   d(-14)=2026-04-12   d(-10)=2026-04-16  d(-7)=2026-04-19
-- d(-5)=2026-04-21    d(-3)=2026-04-23    d(-2)=2026-04-24   d(-1)=2026-04-25
-- d(2)=2026-04-28     d(3)=2026-04-29     d(5)=2026-05-01    d(7)=2026-05-03
-- d(8)=2026-05-04     d(10)=2026-05-06    d(12)=2026-05-08   d(14)=2026-05-10
-- d(15)=2026-05-11    d(18)=2026-05-14    d(21)=2026-05-17   d(25)=2026-05-21
-- d(28)=2026-05-24    d(30)=2026-05-26    d(35)=2026-05-31   d(45)=2026-06-10
-- d(180)=2026-10-23

-- ─── Matter M-2024-001: Apex Capital — Series C Acquisition ─────────────────
INSERT INTO pc_gc_matters (id, org_id, name, client_name, matter_number, type, status, privilege_level,
  pressure_score, complexity_score, opened_date, closing_date, next_deadline, next_deadline_label,
  lead_counsel, jurisdiction, estimated_exposure, summary, tags, parties, wall)
VALUES (
  'M-2024-001', 'demo', 'Apex Capital — Series C Acquisition', 'Apex Capital Partners LP',
  '2024-MA-001', 'transaction', 'active', 'restricted',
  87, 82, '2026-03-12', '2026-05-08', '2026-04-29', 'HSR Filing Deadline',
  'M. Farooq', 'Delaware / Federal', 340000000.00,
  'Acquisition of Meridian Software Group by Apex Capital Partners. Pending HSR antitrust review and regulatory approvals. Integration planning underway.',
  '["M&A","Antitrust","HSR","Urgent"]'::jsonb,
  '[{"id":"p1","name":"Apex Capital Partners LP","role":"client","counsel":"M. Farooq, R. Chen"},{"id":"p2","name":"Meridian Software Group","role":"opposing-counsel","counsel":"Latham & Watkins LLP"},{"id":"p3","name":"Federal Trade Commission","role":"regulator","jurisdiction":"Federal"},{"id":"p4","name":"Goldman Sachs — Financial Advisor","role":"third-party"}]'::jsonb,
  '{"enabled":true,"reason":"Client-requested confidentiality wall — Meridian board members may have conflicting interests","blockedRoles":["associate","paralegal"],"approvedUsers":["partner","gc"],"createdAt":"2026-03-27T09:00:00Z","createdBy":"m.farooq"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pc_gc_obligations (id, matter_id, title, description, due_date, status, assignee, dependencies, privilege_level, filing_required, court_id, consequence, completed_date, sort_order) VALUES
  ('o1','M-2024-001','HSR Premerger Notification Filing','Submit Hart-Scott-Rodino notification to FTC and DOJ','2026-04-29','in-progress','M. Farooq','[]'::jsonb,'confidential',true,'FTC-2024-HSR-0887','Transaction cannot close without HSR clearance. $50K/day penalty for late filing.',null,0),
  ('o2','M-2024-001','Board Approval Resolution','Meridian board meeting and shareholder vote approval documentation','2026-05-01','complete','R. Chen','["o1"]'::jsonb,'restricted',false,null,null,'2026-04-24',1),
  ('o3','M-2024-001','Merger Agreement Execution','Final execution of definitive merger agreement','2026-05-04','pending','M. Farooq','["o1","o2"]'::jsonb,'restricted',true,null,null,null,2),
  ('o4','M-2024-001','Employee Notification (WARN Act)','60-day advance notice to affected employees if required','2026-05-08','pending','J. Whitmore','["o3"]'::jsonb,'confidential',false,null,'WARN Act violation: $500/employee/day + benefits',null,3)
ON CONFLICT (matter_id, id) DO NOTHING;

INSERT INTO pc_gc_audit_entries (id, matter_id, timestamp, user_id, role, action, detail, ip) VALUES
  ('a1','M-2024-001','2026-03-27T09:00:00Z','m.farooq','Partner','accessed-wall','Created matter wall: Meridian board conflict screen','10.1.2.3'),
  ('a2','M-2024-001','2026-04-11T09:00:00Z','r.chen','Associate','edited','Updated HSR filing timeline','10.1.2.4'),
  ('a3','M-2024-001','2026-04-23T09:00:00Z','m.farooq','Partner','viewed','Reviewed merger agreement draft v4','10.1.2.3'),
  ('a4','M-2024-001','2026-04-25T09:00:00Z','j.whitmore','Partner','deadline-updated','Closing date extended by 5 days per FTC request','10.1.2.5')
ON CONFLICT (matter_id, id) DO NOTHING;

INSERT INTO pc_gc_proof_chain_entries (id, matter_id, timestamp, event_type, title, summary, privilege_level, author, parties, hash) VALUES
  ('pc1','M-2024-001','2026-03-12T09:00:00Z','communication','Engagement Letter Executed','Engagement letter signed between Apex Capital and firm. Scope: M&A advisory, regulatory, employment.','confidential','M. Farooq','["Apex Capital Partners LP"]'::jsonb,'sha256:a3f1e2b4c5d6...'),
  ('pc2','M-2024-001','2026-03-27T09:00:00Z','discovery','Due Diligence Data Room Access','Access granted to Meridian VDR. 14,200 documents reviewed.','restricted','R. Chen','["Meridian Software Group"]'::jsonb,'sha256:b8f2c3a1d4e5...'),
  ('pc3','M-2024-001','2026-04-16T09:00:00Z','filing','HSR Pre-Notification Filing Draft','Draft HSR notification prepared. Awaiting financial data from Goldman Sachs.','confidential','M. Farooq','["FTC","DOJ"]'::jsonb,'sha256:c9d4e5f6a1b2...')
ON CONFLICT (matter_id, id) DO NOTHING;

-- ─── Matter M-2024-002: NeuralTech v. Prometheus AI — Patent Infringement ────
INSERT INTO pc_gc_matters (id, org_id, name, client_name, matter_number, type, status, privilege_level,
  pressure_score, complexity_score, opened_date, trial_date, next_deadline, next_deadline_label,
  lead_counsel, jurisdiction, estimated_exposure, summary, tags, parties, wall)
VALUES (
  'M-2024-002', 'demo', 'NeuralTech v. Prometheus AI — Patent Infringement', 'NeuralTech Corporation',
  '2024-LIT-004', 'ip', 'active', 'privileged',
  94, 78, '2025-12-27', '2026-06-10', '2026-05-03', 'Expert Witness Disclosure',
  'S. Okafor', 'N.D. Cal. (San Jose)', 125000000.00,
  'NeuralTech alleges Prometheus AI willfully infringed 4 patents covering transformer attention mechanisms. Trial set for Q2. Expert reports due imminently.',
  '["Patent","IP","Trial Prep","Critical"]'::jsonb,
  '[{"id":"p1","name":"NeuralTech Corporation","role":"client","counsel":"S. Okafor, T. Park"},{"id":"p2","name":"Prometheus AI Inc.","role":"opposing-counsel","counsel":"Quinn Emanuel Urquhart"},{"id":"p3","name":"Hon. M. Chen, USDC N.D. Cal.","role":"regulator"},{"id":"p4","name":"Dr. Alan Voss — Technical Expert","role":"expert"}]'::jsonb,
  '{"enabled":false,"reason":"","blockedRoles":[],"approvedUsers":[],"createdAt":"","createdBy":""}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pc_gc_obligations (id, matter_id, title, description, due_date, status, assignee, dependencies, privilege_level, filing_required, court_id, consequence, sort_order) VALUES
  ('o1','M-2024-002','Expert Witness Disclosure','Disclose expert witnesses and provide CV/report summaries to opposing counsel','2026-05-03','at-risk','S. Okafor','[]'::jsonb,'privileged',true,'5:24-cv-03817-MC','Preclusion of expert testimony at trial',0),
  ('o2','M-2024-002','Expert Report — Technical Infringement','Dr. Voss final technical infringement opinion report','2026-05-10','in-progress','T. Park','["o1"]'::jsonb,'privileged',false,null,null,1),
  ('o3','M-2024-002','Pretrial Conference','Joint pretrial conference with Judge Chen','2026-05-24','pending','S. Okafor','["o2"]'::jsonb,'confidential',true,'5:24-cv-03817-MC',null,2),
  ('o4','M-2024-002','Trial Brief Filing','File trial brief outlining legal theories, witness list, exhibit list','2026-05-31','pending','S. Okafor','["o3"]'::jsonb,'confidential',true,'5:24-cv-03817-MC',null,3)
ON CONFLICT (matter_id, id) DO NOTHING;

INSERT INTO pc_gc_audit_entries (id, matter_id, timestamp, user_id, role, action, detail, ip) VALUES
  ('a1','M-2024-002','2025-12-27T09:00:00Z','s.okafor','Partner','edited','Matter opened. Complaint filed N.D. Cal.','10.1.3.1'),
  ('a2','M-2024-002','2026-02-25T09:00:00Z','t.park','Associate','edited','Claim construction brief filed','10.1.3.2'),
  ('a3','M-2024-002','2026-04-19T09:00:00Z','s.okafor','Partner','deadline-updated','Expert disclosure flagged at-risk — Dr. Voss report delayed','10.1.3.1')
ON CONFLICT (matter_id, id) DO NOTHING;

INSERT INTO pc_gc_proof_chain_entries (id, matter_id, timestamp, event_type, title, summary, privilege_level, author, parties, document_ref, hash) VALUES
  ('pc1','M-2024-002','2025-12-27T09:00:00Z','filing','Complaint Filed — N.D. Cal.','Patent infringement complaint filed. Patents-in-suit: US 11,234,567; US 11,345,678; US 11,456,789; US 11,567,890.','public','S. Okafor','["NeuralTech Corporation","Prometheus AI Inc."]'::jsonb,'ECF No. 1','sha256:d2e3f4a5b6c7...'),
  ('pc2','M-2024-002','2026-01-26T09:00:00Z','order','Scheduling Order Issued','Trial date set for 45 days out. Expert disclosure: 7 days. Pretrial: 28 days.','public','Hon. M. Chen','["NeuralTech Corporation","Prometheus AI Inc."]'::jsonb,'ECF No. 47','sha256:e3f4a5b6c7d8...'),
  ('pc3','M-2024-002','2026-04-12T09:00:00Z','expert-report','Dr. Voss Preliminary Infringement Opinion','Preliminary technical opinion: high probability of literal infringement on claims 1, 4, 7. Doctrine of equivalents analysis pending.','privileged','Dr. Alan Voss','["NeuralTech Corporation"]'::jsonb,null,'sha256:f4a5b6c7d8e9...')
ON CONFLICT (matter_id, id) DO NOTHING;

-- ─── Matter M-2024-003: Citadel Financial — SEC Investigation ────────────────
INSERT INTO pc_gc_matters (id, org_id, name, client_name, matter_number, type, status, privilege_level,
  pressure_score, complexity_score, opened_date, next_deadline, next_deadline_label,
  lead_counsel, jurisdiction, estimated_exposure, summary, tags, parties, wall)
VALUES (
  'M-2024-003', 'demo', 'Citadel Financial — SEC Investigation', 'Citadel Financial Holdings',
  '2024-REG-002', 'regulatory', 'escalated', 'restricted',
  96, 91, '2026-01-26', '2026-04-28', 'Document Production Response',
  'P. Rodriguez', 'Federal (SEC / SDNY)', 850000000.00,
  'SEC Enforcement Division investigation into Citadel''s dark pool trading practices. Civil investigative demand outstanding. Criminal referral risk elevated.',
  '["SEC","Regulatory","Criminal Risk","Escalated","Dark Pool"]'::jsonb,
  '[{"id":"p1","name":"Citadel Financial Holdings","role":"client","counsel":"P. Rodriguez, K. Morrison"},{"id":"p2","name":"SEC Enforcement Division","role":"regulator","jurisdiction":"Federal"},{"id":"p3","name":"DOJ Criminal Division","role":"regulator","jurisdiction":"Federal"},{"id":"p4","name":"C. Nakamura — Forensic Accountant","role":"expert"}]'::jsonb,
  '{"enabled":true,"reason":"Firewall: Citadel trading desk vs. compliance function — privilege segregation required","blockedRoles":["associate","paralegal","billing"],"approvedUsers":["partner","gc"],"createdAt":"2026-01-31T09:00:00Z","createdBy":"p.rodriguez"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pc_gc_obligations (id, matter_id, title, description, due_date, status, assignee, dependencies, privilege_level, filing_required, consequence, sort_order) VALUES
  ('o1','M-2024-003','Document Production Response','Produce 45,000 documents in response to SEC subpoena. Privilege log required.','2026-04-28','at-risk','P. Rodriguez','[]'::jsonb,'restricted',true,'Contempt of subpoena — criminal exposure',0),
  ('o2','M-2024-003','Privilege Log Compilation','Prepare attorney-client privilege log for 3,200 withheld documents','2026-04-28','in-progress','K. Morrison','[]'::jsonb,'restricted',true,'Waiver of privilege if log not timely provided',1),
  ('o3','M-2024-003','Wells Submission','Respond to SEC Wells Notice with factual and legal defenses','2026-05-17','pending','P. Rodriguez','["o1","o2"]'::jsonb,'restricted',false,null,2),
  ('o4','M-2024-003','Board Audit Committee Briefing','Privileged briefing to Citadel board audit committee on exposure assessment','2026-05-10','pending','P. Rodriguez','["o2"]'::jsonb,'restricted',false,null,3)
ON CONFLICT (matter_id, id) DO NOTHING;

INSERT INTO pc_gc_audit_entries (id, matter_id, timestamp, user_id, role, action, detail, ip) VALUES
  ('a1','M-2024-003','2026-01-26T09:00:00Z','p.rodriguez','Partner','accessed-wall','Firewall established per ethics counsel review','10.1.4.1'),
  ('a2','M-2024-003','2026-03-12T09:00:00Z','k.morrison','Partner','edited','Document hold notice issued to Citadel trading desk','10.1.4.2'),
  ('a3','M-2024-003','2026-04-21T09:00:00Z','j.gold','Partner','escalated','Matter escalated: DOJ parallel investigation confirmed','10.1.4.3'),
  ('a4','M-2024-003','2026-04-25T09:00:00Z','p.rodriguez','Partner','privilege-changed','Production set reclassified — 847 documents downgraded from restricted to confidential','10.1.4.1')
ON CONFLICT (matter_id, id) DO NOTHING;

INSERT INTO pc_gc_proof_chain_entries (id, matter_id, timestamp, event_type, title, summary, privilege_level, author, parties, hash) VALUES
  ('pc1','M-2024-003','2026-01-26T09:00:00Z','communication','SEC Formal Order of Investigation','Formal Order received. Scope: dark pool order routing, best execution obligations, 2022-2024.','confidential','SEC Enforcement','["Citadel Financial Holdings"]'::jsonb,'sha256:a1b2c3d4e5f6...'),
  ('pc2','M-2024-003','2026-02-25T09:00:00Z','discovery','Document Hold Notice Issued','Legal hold notice issued to 340 Citadel employees. Trading systems preserved.','restricted','K. Morrison','["Citadel Financial Holdings"]'::jsonb,'sha256:b2c3d4e5f6a7...'),
  ('pc3','M-2024-003','2026-04-11T09:00:00Z','communication','DOJ Parallel Investigation Confirmed','[REDACTED — Restricted]','restricted','P. Rodriguez','["DOJ Criminal Division"]'::jsonb,'sha256:c3d4e5f6a7b8...')
ON CONFLICT (matter_id, id) DO NOTHING;

UPDATE pc_gc_proof_chain_entries SET redacted = true WHERE matter_id = 'M-2024-003' AND id = 'pc3';

-- ─── Matter M-2024-004: Rosario v. TechGiant — Employment Class Action ────────
INSERT INTO pc_gc_matters (id, org_id, name, client_name, matter_number, type, status, privilege_level,
  pressure_score, complexity_score, opened_date, trial_date, next_deadline, next_deadline_label,
  lead_counsel, jurisdiction, estimated_exposure, summary, tags, parties, wall)
VALUES (
  'M-2024-004', 'demo', 'Rosario v. TechGiant — Employment Class Action', 'TechGiant Inc.',
  '2024-LIT-007', 'employment', 'active', 'privileged',
  71, 68, '2025-10-08', '2026-10-23', '2026-05-14', 'Class Certification Opposition',
  'L. Tanaka', 'C.D. Cal. (Los Angeles)', 45000000.00,
  'Class action alleging discriminatory pay practices affecting 2,400 female engineers. Class certification motion pending. Internal pay equity audit completed.',
  '["Employment","Class Action","Pay Equity","Title VII"]'::jsonb,
  '[{"id":"p1","name":"TechGiant Inc.","role":"client","counsel":"L. Tanaka, B. Osei"},{"id":"p2","name":"Rosario et al. (Class Plaintiffs)","role":"opposing-counsel","counsel":"Outten & Golden LLP"},{"id":"p3","name":"Hon. R. Yamamoto, USDC C.D. Cal.","role":"regulator"},{"id":"p4","name":"Dr. E. Goldman — Compensation Expert","role":"expert"}]'::jsonb,
  '{"enabled":false,"reason":"","blockedRoles":[],"approvedUsers":[],"createdAt":"","createdBy":""}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pc_gc_obligations (id, matter_id, title, description, due_date, status, assignee, dependencies, privilege_level, filing_required, court_id, sort_order) VALUES
  ('o1','M-2024-004','Class Certification Opposition Brief','File opposition to plaintiffs'' motion for class certification','2026-05-14','in-progress','L. Tanaka','[]'::jsonb,'privileged',true,'2:24-cv-07234-RY',0),
  ('o2','M-2024-004','Expert Declaration (Compensation)','Dr. Goldman declaration opposing numerosity and commonality arguments','2026-05-11','at-risk','B. Osei','[]'::jsonb,'privileged',false,null,1),
  ('o3','M-2024-004','Deposition: 30(b)(6) HR Witness','Defend corporate designee deposition on compensation practices','2026-05-26','pending','L. Tanaka','["o1"]'::jsonb,'privileged',false,null,2)
ON CONFLICT (matter_id, id) DO NOTHING;

INSERT INTO pc_gc_audit_entries (id, matter_id, timestamp, user_id, role, action, detail, ip) VALUES
  ('a1','M-2024-004','2025-10-08T09:00:00Z','l.tanaka','Partner','edited','Matter opened. Class action complaint filed.','10.1.5.1'),
  ('a2','M-2024-004','2026-03-27T09:00:00Z','b.osei','Associate','edited','Internal pay equity audit report marked privileged','10.1.5.2')
ON CONFLICT (matter_id, id) DO NOTHING;

INSERT INTO pc_gc_proof_chain_entries (id, matter_id, timestamp, event_type, title, summary, privilege_level, author, parties, document_ref, hash) VALUES
  ('pc1','M-2024-004','2025-10-08T09:00:00Z','filing','Class Action Complaint Filed','Complaint alleges Title VII and EPA violations. Putative class: 2,400 female engineers. Damages: $45M+.','public','Outten & Golden LLP','["Rosario et al.","TechGiant Inc."]'::jsonb,'ECF No. 1','sha256:d4e5f6a7b8c9...'),
  ('pc2','M-2024-004','2026-02-25T09:00:00Z','expert-report','Privileged Pay Equity Audit (Internal)','Pay equity regression analysis. Unexplained gender gap: 4.7% after controls. Scope: 2,400 employees, 2020-2023.','privileged','Dr. E. Goldman','["TechGiant Inc."]'::jsonb,null,'sha256:e5f6a7b8c9d0...'),
  ('pc3','M-2024-004','2026-04-11T09:00:00Z','hearing','Class Cert Motion Filed by Plaintiffs','Plaintiffs moved for class certification. 28-day opposition window opened.','public','Outten & Golden LLP','["Rosario et al."]'::jsonb,'ECF No. 89','sha256:f6a7b8c9d0e1...')
ON CONFLICT (matter_id, id) DO NOTHING;

-- ─── Matter M-2024-005: Orion Logistics — Supply Agreement Dispute ────────────
INSERT INTO pc_gc_matters (id, org_id, name, client_name, matter_number, type, status, privilege_level,
  pressure_score, complexity_score, opened_date, next_deadline, next_deadline_label,
  lead_counsel, jurisdiction, estimated_exposure, summary, tags, parties, wall)
VALUES (
  'M-2024-005', 'demo', 'Orion Logistics — Supply Agreement Dispute', 'Orion Logistics Group',
  '2024-ARB-003', 'contract', 'pending', 'confidential',
  52, 44, '2026-03-27', '2026-05-21', 'Arbitration Demand Filing',
  'A. Patel', 'AAA Commercial Arbitration (NY)', 18500000.00,
  'Orion disputes exclusive supply agreement termination by Nordic Cold Chain AS. Seeking damages for lost profits and injunctive relief. Arbitration panel selection pending.',
  '["Contract","Arbitration","Supply Chain","International"]'::jsonb,
  '[{"id":"p1","name":"Orion Logistics Group","role":"client","counsel":"A. Patel"},{"id":"p2","name":"Nordic Cold Chain AS","role":"opposing-counsel","counsel":"Clifford Chance LLP"},{"id":"p3","name":"AAA Commercial Panel","role":"regulator"}]'::jsonb,
  '{"enabled":false,"reason":"","blockedRoles":[],"approvedUsers":[],"createdAt":"","createdBy":""}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pc_gc_obligations (id, matter_id, title, description, due_date, status, assignee, dependencies, privilege_level, filing_required, consequence, sort_order) VALUES
  ('o1','M-2024-005','Arbitration Demand Filing','File AAA commercial arbitration demand with statement of claim','2026-05-21','pending','A. Patel','[]'::jsonb,'confidential',true,'Statute of limitations may bar claims after 90 days',0),
  ('o2','M-2024-005','Arbitrator Selection (3-Panel)','Submit ranked arbitrator preferences to AAA for 3-person panel','2026-05-31','pending','A. Patel','["o1"]'::jsonb,'confidential',false,null,1)
ON CONFLICT (matter_id, id) DO NOTHING;

INSERT INTO pc_gc_audit_entries (id, matter_id, timestamp, user_id, role, action, detail, ip) VALUES
  ('a1','M-2024-005','2026-03-27T09:00:00Z','a.patel','Partner','edited','Matter opened. Contract termination notice received.','10.1.6.1')
ON CONFLICT (matter_id, id) DO NOTHING;

INSERT INTO pc_gc_proof_chain_entries (id, matter_id, timestamp, event_type, title, summary, privilege_level, author, parties, hash) VALUES
  ('pc1','M-2024-005','2026-03-12T09:00:00Z','communication','Termination Notice from Nordic Cold Chain','Nordic served 30-day termination notice citing Orion material breach — disputed. Contract value $18.5M.','confidential','Nordic Cold Chain AS','["Orion Logistics Group"]'::jsonb,'sha256:a7b8c9d0e1f2...'),
  ('pc2','M-2024-005','2026-03-27T09:00:00Z','communication','Orion Dispute Letter','Orion disputes breach characterization. Demands reinstatement or damages. Invokes arbitration clause (AAA Commercial Rules).','confidential','A. Patel','["Nordic Cold Chain AS"]'::jsonb,'sha256:b8c9d0e1f2a3...')
ON CONFLICT (matter_id, id) DO NOTHING;

-- ─── Matter M-2024-006: Harborview Tower — Commercial Lease Closing ───────────
INSERT INTO pc_gc_matters (id, org_id, name, client_name, matter_number, type, status, privilege_level,
  pressure_score, complexity_score, opened_date, closing_date, next_deadline, next_deadline_label,
  lead_counsel, jurisdiction, estimated_exposure, summary, tags, parties, wall)
VALUES (
  'M-2024-006', 'demo', 'Harborview Tower — Commercial Lease Closing', 'Harborview Development LLC',
  '2024-RE-009', 'real-estate', 'active', 'confidential',
  43, 35, '2026-04-06', '2026-05-26', '2026-05-06', 'Title Commitment Review',
  'D. Williams', 'New York State', 92000000.00,
  '125,000 SF Class A office lease for Harborview Tower, Financial District. 15-year term. Tenant improvement allowance of $45M negotiated. Closing in 30 days.',
  '["Real Estate","Commercial Lease","Title","NYC"]'::jsonb,
  '[{"id":"p1","name":"Harborview Development LLC","role":"client","counsel":"D. Williams"},{"id":"p2","name":"300 West Partners LP (Landlord)","role":"opposing-counsel","counsel":"Fried Frank Harris"},{"id":"p3","name":"First Republic Title Co.","role":"third-party"}]'::jsonb,
  '{"enabled":false,"reason":"","blockedRoles":[],"approvedUsers":[],"createdAt":"","createdBy":""}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO pc_gc_obligations (id, matter_id, title, description, due_date, status, assignee, dependencies, privilege_level, filing_required, sort_order) VALUES
  ('o1','M-2024-006','Title Commitment Review','Review title commitment and schedule of exceptions. Clear title objections.','2026-05-06','in-progress','D. Williams','[]'::jsonb,'confidential',false,0),
  ('o2','M-2024-006','Lease Agreement Final Execution','Execution of 15-year commercial lease with all amendments','2026-05-21','pending','D. Williams','["o1"]'::jsonb,'confidential',true,1),
  ('o3','M-2024-006','TI Allowance Escrow Setup','Establish $45M tenant improvement escrow per lease terms','2026-05-26','pending','D. Williams','["o2"]'::jsonb,'confidential',false,2)
ON CONFLICT (matter_id, id) DO NOTHING;

INSERT INTO pc_gc_audit_entries (id, matter_id, timestamp, user_id, role, action, detail, ip) VALUES
  ('a1','M-2024-006','2026-04-06T09:00:00Z','d.williams','Partner','edited','Matter opened. LOI executed. Formal lease negotiation commenced.','10.1.7.1'),
  ('a2','M-2024-006','2026-04-21T09:00:00Z','d.williams','Partner','edited','TI allowance increased to $45M following negotiation','10.1.7.1')
ON CONFLICT (matter_id, id) DO NOTHING;

INSERT INTO pc_gc_proof_chain_entries (id, matter_id, timestamp, event_type, title, summary, privilege_level, author, parties, hash) VALUES
  ('pc1','M-2024-006','2026-04-06T09:00:00Z','communication','Letter of Intent Executed','LOI for 125,000 SF, 15-year term, $85/SF base rent, $45M TI allowance. Non-binding except exclusivity period.','confidential','D. Williams','["Harborview Development LLC","300 West Partners LP"]'::jsonb,'sha256:c9d0e1f2a3b4...'),
  ('pc2','M-2024-006','2026-04-23T09:00:00Z','discovery','Title Commitment Received','Commitment from First Republic Title. Schedule B exceptions: 3 restrictive covenants, 1 utility easement under review.','confidential','First Republic Title Co.','["Harborview Development LLC"]'::jsonb,'sha256:d0e1f2a3b4c5...')
ON CONFLICT (matter_id, id) DO NOTHING;
