import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { Code2, Eye, FlaskConical, History, Sparkles, Zap, CheckCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ACCENT, BG, BORDER, INITIAL_INPUT, PATTERN_SUGGESTIONS, PREVIEW_ACTIONS, TEXT } from './constants';
import { compileNaturalLanguage } from './compiler';
import { diffPolicies, effectToOutcome, runPolicyAgainstContext } from './evaluator';
import { AuthorTab } from './author-tab';
import { PreviewTab } from './preview-tab';
import { TestsTab } from './tests-tab';
import { HistoryTab } from './history-tab';
import {
  API_BASE, LLM_THRESHOLD, STUDIO_ID,
  fromServerTestCase, fromServerVersion,
  type ApiEnvelope, type CompiledPolicy, type CompiledRule, type LLMAssistResponse,
  type LLMAssistResponseRule, type ParsedCondition, type PolicyCompilerStateResponse,
  type PolicyVersion, type PreviewCase, type ServerPolicyVersion, type ServerTestCase,
  type Tab, type TestCase,
} from './types';

export default function AlloyPolicyCompilerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('author');
  const [input, setInput] = useState(INITIAL_INPUT);
  const [compiled, setCompiled] = useState<CompiledPolicy | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [savingVersion, setSavingVersion] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testRunning, setTestRunning] = useState(false);
  const [showAddTest, setShowAddTest] = useState(false);
  const [previewCases, setPreviewCases] = useState<PreviewCase[]>(PREVIEW_ACTIONS as PreviewCase[]);
  const [previewRan, setPreviewRan] = useState(false);
  const [auditLog, setAuditLog] = useState<Array<{ event: string; at: number; actor: string }>>([
    { event: 'Policy Authoring Studio opened', at: Date.now() - 120_000, actor: 'Sarah Mitchell' },
  ]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const latestVersion = versions[versions.length - 1] ?? null;
  const prevPolicy = latestVersion?.policy ?? null;
  const diffLines = useMemo(() => (compiled ? diffPolicies(prevPolicy, compiled) : []), [compiled, prevPolicy]);

  function addAudit(event: string) {
    setAuditLog((prev) => [...prev, { event, at: Date.now(), actor: 'Sarah Mitchell' }]);
  }

  const handleCompile = useCallback(() => {
    if (!input.trim()) return;
    setCompiling(true);
    setTimeout(() => {
      const result = compileNaturalLanguage(input);
      setCompiled(result);
      setCompiling(false);
      addAudit('Policy compiled from natural language input');
    }, 600);
  }, [input]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { if (input.trim().length > 10) handleCompile(); }, 1200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [input, handleCompile]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<ApiEnvelope<PolicyCompilerStateResponse> | PolicyCompilerStateResponse>(
          `/continuum/policy-compiler/state?studioId=${encodeURIComponent(STUDIO_ID)}`,
        );
        const payload = (res as ApiEnvelope<PolicyCompilerStateResponse>).data ?? (res as PolicyCompilerStateResponse);
        if (cancelled || !payload) return;
        const loadedVersions = (payload.versions ?? []).map(fromServerVersion);
        const loadedTestCases = (payload.testCases ?? []).map(fromServerTestCase);
        setVersions(loadedVersions);
        setTestCases(loadedTestCases);
        if (loadedVersions.length > 0) {
          const latest = loadedVersions[loadedVersions.length - 1]!;
          setInput(latest.input);
          setCompiled(latest.policy);
        }
      } catch { /* silent – API may not be running */ }
    })();
    return () => { cancelled = true; };
  }, []);

  function handleSaveVersion() {
    if (!compiled) return;
    setSavingVersion(true);
    (async () => {
      try {
        const res = await apiFetch<ApiEnvelope<ServerPolicyVersion> | ServerPolicyVersion>(`/continuum/policy-compiler/versions`, {
          method: 'POST',
          body: JSON.stringify({ studioId: STUDIO_ID, input, policy: compiled, author: 'Sarah Mitchell', authorId: 'usr_compliance_sarah', message: saveMessage || 'Policy update', signers: [] }),
        });
        const payload = (res as ApiEnvelope<ServerPolicyVersion>).data ?? (res as ServerPolicyVersion);
        const newVersion = fromServerVersion(payload);
        setVersions((prev) => [...prev, newVersion]);
        setSaveMessage('');
        addAudit(`Policy version ${newVersion.versionNumber} saved by Sarah Mitchell`);
      } catch (err) {
        addAudit(`Failed to save policy version: ${err instanceof Error ? err.message : 'unknown error'}`);
      } finally { setSavingVersion(false); }
    })();
  }

  function applyLLMResponseToRule(rule: CompiledRule, llm: LLMAssistResponseRule, note?: string): CompiledRule {
    const snapshot = rule.deterministicSnapshot ?? { effect: rule.effect, conditions: rule.conditions, requiredApproverRole: rule.requiredApproverRole, escalateTo: rule.escalateTo, reason: rule.reason, confidence: rule.confidence, warnings: rule.warnings };
    const llmConf = typeof llm.confidence === 'number' && Number.isFinite(llm.confidence) ? Math.max(0, Math.min(1, llm.confidence)) : undefined;
    const newConditions: ParsedCondition[] = llm.conditions && llm.conditions.length > 0
      ? llm.conditions.map((c) => ({ field: c.field, operator: c.operator, value: c.value, label: `${c.field} ${c.operator} ${typeof c.value === 'object' ? JSON.stringify(c.value) : String(c.value)}` }))
      : rule.conditions;
    return { ...rule, effect: llm.effect ?? rule.effect, conditions: newConditions, requiredApproverRole: llm.requiredApproverRole ?? rule.requiredApproverRole, escalateTo: llm.escalateTo ?? rule.escalateTo, reason: llm.reason ?? rule.reason, confidence: Math.max(rule.confidence, llmConf ?? 0), llmAssisted: true, llmConfidence: llmConf, llmStatus: 'applied', llmError: undefined, llmNote: note ?? llm.notes, deterministicSnapshot: snapshot };
  }

  function revertLLMOnRule(rule: CompiledRule): CompiledRule {
    const snap = rule.deterministicSnapshot;
    if (!snap) return { ...rule, llmAssisted: false, llmStatus: 'idle' };
    return { ...rule, effect: snap.effect, conditions: snap.conditions, requiredApproverRole: snap.requiredApproverRole, escalateTo: snap.escalateTo, reason: snap.reason, confidence: snap.confidence, warnings: snap.warnings, llmAssisted: false, llmConfidence: undefined, llmStatus: 'idle', llmError: undefined, llmNote: undefined, deterministicSnapshot: undefined };
  }

  function recomputeOverallConfidence(rules: CompiledRule[]): number {
    if (rules.length === 0) return 0;
    return rules.reduce((s, r) => s + r.confidence, 0) / rules.length;
  }

  async function resolveSingleRuleViaLLM(ruleSnapshot: CompiledRule): Promise<void> {
    const ruleId = ruleSnapshot.id;
    setCompiled((prev) => prev && { ...prev, rules: prev.rules.map((r) => r.id === ruleId ? { ...r, llmStatus: 'loading', llmError: undefined } : r) });
    try {
      const res = await fetch(`${API_BASE}/api/continuum/policies/llm-assist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sentence: ruleSnapshot.sourceText, deterministic: { effect: ruleSnapshot.effect, confidence: ruleSnapshot.confidence, conditions: ruleSnapshot.conditions.map((c) => ({ field: c.field, operator: c.operator, value: c.value })), requiredApproverRole: ruleSnapshot.requiredApproverRole, escalateTo: ruleSnapshot.escalateTo, warnings: ruleSnapshot.warnings } }) });
      const body = (await res.json()) as LLMAssistResponse & { error?: string };
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      if (!body.result) {
        const reason = body.fallbackReason ?? 'AI assistant returned no usable result.';
        setCompiled((prev) => prev && { ...prev, rules: prev.rules.map((r) => r.id === ruleId ? { ...r, llmStatus: 'error', llmError: reason } : r) });
        addAudit(`AI policy assist unavailable for rule "${ruleSnapshot.name.slice(0, 40)}…" — ${reason.slice(0, 80)}`);
        return;
      }
      setCompiled((prev) => {
        if (!prev) return prev;
        const updated = prev.rules.map((r) => r.id === ruleId ? applyLLMResponseToRule(r, body.result!, body.result!.notes) : r);
        return { ...prev, rules: updated, overallConfidence: recomputeOverallConfidence(updated) };
      });
      addAudit(`AI assistant resolved ambiguous rule "${ruleSnapshot.name.slice(0, 40)}…" via ${body.modelUsed}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCompiled((prev) => prev && { ...prev, rules: prev.rules.map((r) => r.id === ruleId ? { ...r, llmStatus: 'error', llmError: msg } : r) });
      addAudit(`AI policy assist failed for rule "${ruleSnapshot.name.slice(0, 40)}…": ${msg.slice(0, 80)}`);
    }
  }

  function handleResolveWithAI(rule: CompiledRule) { void resolveSingleRuleViaLLM(rule); }

  function handleRevertAI(rule: CompiledRule) {
    if (!compiled) return;
    setCompiled((prev) => {
      if (!prev) return prev;
      const updated = prev.rules.map((r) => r.id === rule.id ? revertLLMOnRule(r) : r);
      return { ...prev, rules: updated, overallConfidence: recomputeOverallConfidence(updated) };
    });
    addAudit('Operator reverted AI-assisted rule back to deterministic parse');
  }

  async function handleResolveAllWithAI() {
    if (!compiled) return;
    const ruleSnapshots = compiled.rules.filter((r) => r.confidence < LLM_THRESHOLD && !r.llmAssisted);
    await Promise.all(ruleSnapshots.map((r) => resolveSingleRuleViaLLM(r)));
  }

  function handleRollback(version: PolicyVersion) {
    setInput(version.input);
    setCompiled(compileNaturalLanguage(version.input));
    addAudit(`Rolled back to version ${version.versionNumber} (${version.author})`);
  }

  function handleSignVersion(versionId: string) {
    (async () => {
      try {
        const res = await apiFetch<ApiEnvelope<ServerPolicyVersion> | ServerPolicyVersion>(`/continuum/policy-compiler/versions/${encodeURIComponent(versionId)}/sign`, { method: 'POST', body: JSON.stringify({ name: 'Sarah Mitchell', role: 'compliance_officer' }) });
        const payload = (res as ApiEnvelope<ServerPolicyVersion>).data ?? (res as ServerPolicyVersion);
        setVersions((prev) => prev.map((v) => v.id === versionId ? fromServerVersion(payload) : v));
        addAudit('Policy version signed by Sarah Mitchell (compliance_officer)');
      } catch (err) { addAudit(`Failed to sign policy version: ${err instanceof Error ? err.message : 'unknown error'}`); }
    })();
  }

  function handleActivateVersion(versionId: string) {
    (async () => {
      const version = versions.find((v) => v.id === versionId);
      if (!version) return;
      if (version.signers.length < 1) { addAudit('Activation blocked — policy must be signed by at least one approver first'); return; }
      try {
        const res = await apiFetch<ApiEnvelope<ServerPolicyVersion> | ServerPolicyVersion>(`/continuum/policy-compiler/versions/${encodeURIComponent(versionId)}/activate`, { method: 'POST' });
        const payload = (res as ApiEnvelope<ServerPolicyVersion>).data ?? (res as ServerPolicyVersion);
        setVersions((prev) => prev.map((v) => v.id === versionId ? fromServerVersion(payload) : { ...v, isActive: false }));
        addAudit(`Policy v${version.versionNumber} activated — all other versions deactivated`);
      } catch (err) { addAudit(`Failed to activate policy version: ${err instanceof Error ? err.message : 'unknown error'}`); }
    })();
  }

  function handleDeactivateVersion(versionId: string) {
    (async () => {
      const version = versions.find((v) => v.id === versionId);
      if (!version) return;
      try {
        const res = await apiFetch<ApiEnvelope<ServerPolicyVersion> | ServerPolicyVersion>(`/continuum/policy-compiler/versions/${encodeURIComponent(versionId)}/deactivate`, { method: 'POST' });
        const payload = (res as ApiEnvelope<ServerPolicyVersion>).data ?? (res as ServerPolicyVersion);
        setVersions((prev) => prev.map((v) => v.id === versionId ? fromServerVersion(payload) : v));
        addAudit(`Policy v${version.versionNumber} deactivated`);
      } catch (err) { addAudit(`Failed to deactivate policy version: ${err instanceof Error ? err.message : 'unknown error'}`); }
    })();
  }

  function runPreview() {
    if (!compiled) return;
    const results = PREVIEW_ACTIONS.map((a) => {
      const { effect, matchedRule, reasoning } = runPolicyAgainstContext(compiled, a.context);
      return { ...a, outcome: effectToOutcome(effect), matchedRule, reasoning };
    });
    setPreviewCases(results);
    setPreviewRan(true);
    addAudit('Preview run against 7 historical actions');
  }

  function runTests() {
    if (!compiled) return;
    setTestRunning(true);
    setTimeout(() => {
      const results = testCases.map((tc) => {
        const { effect, reasoning } = runPolicyAgainstContext(compiled, tc.context);
        const actual = effectToOutcome(effect);
        const actualOutcome = actual === 'audited' ? 'allowed' : (actual as TestCase['expectedOutcome']);
        return { ...tc, actualOutcome, passed: actualOutcome === tc.expectedOutcome, reasoning, ran: true };
      });
      setTestCases(results);
      setTestRunning(false);
      addAudit(`Test harness run: ${results.filter((r) => r.passed).length}/${results.length} passed`);
    }, 800);
  }

  function addTestCase(name: string, action: string, amount: string, expected: TestCase['expectedOutcome']) {
    if (!name.trim()) return;
    const payload = { studioId: STUDIO_ID, name, context: { action: action || 'payout', estimatedCostUsd: parseFloat(amount) || 0 }, expectedOutcome: expected };
    (async () => {
      try {
        const res = await apiFetch<ApiEnvelope<ServerTestCase> | ServerTestCase>(`/continuum/policy-compiler/test-cases`, { method: 'POST', body: JSON.stringify(payload) });
        const body = (res as ApiEnvelope<ServerTestCase>).data ?? (res as ServerTestCase);
        setTestCases((prev) => [...prev, fromServerTestCase(body)]);
      } catch (err) { addAudit(`Failed to add test case: ${err instanceof Error ? err.message : 'unknown error'}`); }
    })();
  }

  function removeTestCase(id: string) {
    const prevList = testCases;
    setTestCases((prev) => prev.filter((t) => t.id !== id));
    (async () => {
      try {
        await apiFetch<unknown>(`/continuum/policy-compiler/test-cases/${encodeURIComponent(id)}?studioId=${encodeURIComponent(STUDIO_ID)}`, { method: 'DELETE' });
      } catch (err) {
        setTestCases(prevList);
        addAudit(`Failed to remove test case: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    })();
  }

  const passedTests = testCases.filter((t) => t.ran && t.passed).length;
  const failedTests = testCases.filter((t) => t.ran && !t.passed).length;
  const totalRan = testCases.filter((t) => t.ran).length;

  const tabs: { key: Tab; label: string; Icon: React.ElementType }[] = [
    { key: 'author', label: 'Author', Icon: Code2 },
    { key: 'preview', label: 'Preview', Icon: Eye },
    { key: 'tests', label: 'Test Harness', Icon: FlaskConical },
    { key: 'history', label: 'Version History', Icon: History },
  ];

  return (
    <div className="min-h-screen" style={{ background: BG.page, color: TEXT.primary }}>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}>
              <Sparkles className="w-4.5 h-4.5" style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] font-bold tracking-wide" style={{ color: TEXT.primary }}>Policy Authoring Studio</h1>
                <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}>Counsel Compiler v1.0</span>
              </div>
              <div className="text-[10px] font-mono mt-0.5" style={{ color: TEXT.secondary }}>Write rules in plain English → versioned, machine-enforceable governance</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {compiled && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-mono" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                <CheckCircle className="w-3 h-3" />
                Compiled · {compiled.rules.length} rule{compiled.rules.length !== 1 ? 's' : ''}
              </div>
            )}
            <button onClick={handleCompile} disabled={compiling || !input.trim()} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-semibold transition-opacity disabled:opacity-50" style={{ color: ACCENT, background: `${ACCENT}12`, border: `1px solid ${ACCENT}35` }}>
              <Zap className={`w-3 h-3 ${compiling ? 'animate-pulse' : ''}`} />
              {compiling ? 'Compiling…' : 'Compile'}
            </button>
          </div>
        </div>

        <div className="flex border-b mb-5" style={{ borderColor: BORDER.subtle }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-semibold transition-colors relative" style={{ color: activeTab === t.key ? ACCENT : TEXT.secondary }}>
              <t.Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.key === 'tests' && totalRan > 0 && (
                <span className="text-[9px] font-mono px-1 py-px rounded" style={{ color: failedTests > 0 ? '#ef4444' : '#22c55e', background: failedTests > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)' }}>{passedTests}/{totalRan}</span>
              )}
              {activeTab === t.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: ACCENT }} />}
            </button>
          ))}
        </div>

        {activeTab === 'author' && (
          <AuthorTab
            input={input} setInput={setInput} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions}
            patternSuggestions={PATTERN_SUGGESTIONS} saveMessage={saveMessage} setSaveMessage={setSaveMessage}
            compiled={compiled} compiling={compiling} savingVersion={savingVersion}
            handleCompile={handleCompile} handleSaveVersion={handleSaveVersion}
            handleResolveAllWithAI={handleResolveAllWithAI} handleResolveWithAI={handleResolveWithAI} handleRevertAI={handleRevertAI}
            LLM_THRESHOLD={LLM_THRESHOLD} prevPolicy={prevPolicy} diffLines={diffLines}
          />
        )}
        {activeTab === 'preview' && <PreviewTab previewCases={previewCases} previewRan={previewRan} compiled={compiled} runPreview={runPreview} />}
        {activeTab === 'tests' && (
          <TestsTab testCases={testCases} testRunning={testRunning} showAddTest={showAddTest} setShowAddTest={setShowAddTest}
            compiled={compiled} passedTests={passedTests} failedTests={failedTests} totalRan={totalRan}
            auditLog={auditLog} runTests={runTests} addTestCase={addTestCase} removeTestCase={removeTestCase}
          />
        )}
        {activeTab === 'history' && (
          <HistoryTab versions={versions} auditLog={auditLog}
            handleRollback={handleRollback} handleSignVersion={handleSignVersion}
            handleActivateVersion={handleActivateVersion} handleDeactivateVersion={handleDeactivateVersion}
          />
        )}
      </div>
    </div>
  );
}
