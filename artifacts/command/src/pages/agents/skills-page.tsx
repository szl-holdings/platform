import { useState } from 'react';
import { BookOpen, Clock, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import { SKILLS } from '@szl/a11oy-runtime';

const DOMAIN_COLORS: Record<string, string> = {
  revops: '#8b7ac8',
  all: '#0ea5e9',
  command: '#d4a054',
  aegis: '#ef4444',
  vessels: '#22c55e',
  counsel: '#ec4899',
  prism: '#f59e0b',
  carlota: '#6366f1',
};

export function SkillsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedSkill = selected ? SKILLS.find((s) => s.id === selected) : null;

  return (
    <div style={{ background: '#080c14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e293b', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={18} color="#ec4899" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>Skills Catalog</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>9 A11oy skills — domain-specific operator instructions · eval criteria · policy bindings</div>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 73px)' }}>
        {/* Skill List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          <div style={{ display: 'grid', gap: 10 }}>
            {SKILLS.map((skill) => {
              const domainColor = DOMAIN_COLORS[skill.domain] ?? '#64748b';
              const isSelected = selected === skill.id;

              return (
                <div
                  key={skill.id}
                  onClick={() => setSelected(isSelected ? null : skill.id)}
                  style={{
                    background: isSelected ? 'rgba(236,72,153,0.05)' : '#0f172a',
                    border: `1px solid ${isSelected ? 'rgba(236,72,153,0.25)' : '#1e293b'}`,
                    borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 3 }}>{skill.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{skill.objective.slice(0, 100)}…</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                      <span style={{ fontSize: 10, color: domainColor, background: `${domainColor}10`, border: `1px solid ${domainColor}28`, borderRadius: 10, padding: '2px 8px' }}>{skill.domain}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} color="#64748b" />
                        <span style={{ fontSize: 10, color: '#64748b' }}>{(skill.estimatedDurationMs / 1000).toFixed(0)}s</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: '#64748b' }}>Tools:</span>
                      {skill.allowedTools.slice(0, 4).map((t) => (
                        <span key={t} style={{ fontSize: 9, color: '#22c55e', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, padding: '1px 6px' }}>{t}</span>
                      ))}
                      {skill.allowedTools.length > 4 && <span style={{ fontSize: 9, color: '#64748b' }}>+{skill.allowedTools.length - 4}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: '#64748b' }}>Blocked:</span>
                      {skill.blockedTools.slice(0, 2).map((t) => (
                        <span key={t} style={{ fontSize: 9, color: '#ef4444', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '1px 6px' }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedSkill && (
          <div style={{ width: 400, borderLeft: '1px solid #1e293b', overflow: 'auto', padding: 20, background: '#080c14' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 }}>{selectedSkill.name}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 16 }}>{selectedSkill.objective}</div>

            {/* Required Inputs */}
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Required Inputs</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedSkill.requiredInputs.map((inp) => (
                  <span key={inp} style={{ fontSize: 10, color: '#0ea5e9', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 4, padding: '2px 8px' }}>{inp}</span>
                ))}
              </div>
            </div>

            {/* Allowed Tools */}
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Allowed Tools</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {selectedSkill.allowedTools.map((t) => (
                  <span key={t} style={{ fontSize: 10, color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 4, padding: '2px 8px' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Blocked Tools */}
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Blocked Tools</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {selectedSkill.blockedTools.map((t) => (
                  <span key={t} style={{ fontSize: 10, color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 4, padding: '2px 8px' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Policies */}
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Policy Bindings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {selectedSkill.policies.map((p) => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={10} color="#8b7ac8" />
                    <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Eval Criteria */}
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>MirrorEval Criteria</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedSkill.evalCriteria.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <AlertTriangle size={10} color="#d4a054" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expected Outputs */}
            <div style={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b', padding: 14 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Expected Outputs</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {selectedSkill.expectedOutputs.map((o) => (
                  <span key={o} style={{ fontSize: 10, color: '#d4a054', background: 'rgba(212,160,84,0.08)', border: '1px solid rgba(212,160,84,0.2)', borderRadius: 4, padding: '2px 8px' }}>{o}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SkillsPage;
