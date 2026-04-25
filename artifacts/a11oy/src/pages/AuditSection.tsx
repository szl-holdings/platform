import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { findings } from '../data/findings';
import { Badge } from '../components/ui/Badge';
import { DemoBadge } from '../components/ui/DemoBadge';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, ChevronRight, ChevronDown } from 'lucide-react';

export function AuditSection() {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    critical: true,
    high: true,
    medium: false,
    low: false
  });

  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});

  const toggleGroup = (severity: string) => {
    setExpandedGroups(prev => ({ ...prev, [severity]: !prev[severity] }));
  };

  const toggleFinding = (id: string) => {
    setExpandedFindings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const groupedFindings = findings.reduce((acc, finding) => {
    if (!acc[finding.severity]) acc[finding.severity] = [];
    acc[finding.severity].push(finding);
    return acc;
  }, {} as Record<string, typeof findings>);

  const severities = [
    { id: 'critical', name: 'Critical', icon: ShieldAlert, color: 'text-[var(--color-a11oy-critical)]', bg: 'bg-[var(--color-a11oy-critical)]/10' },
    { id: 'high', name: 'High', icon: AlertTriangle, color: 'text-[var(--color-a11oy-warn)]', bg: 'bg-[var(--color-a11oy-warn)]/10' },
    { id: 'medium', name: 'Medium', icon: AlertCircle, color: 'text-[var(--color-a11oy-gold)]', bg: 'bg-[var(--color-a11oy-gold)]/10' },
    { id: 'low', name: 'Low', icon: Info, color: 'text-[var(--color-a11oy-blue)]', bg: 'bg-[var(--color-a11oy-blue)]/10' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 h-full flex flex-col"
    >
      <div className="mb-8 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-medium text-[var(--color-a11oy-text)]">Audit Findings</h1>
          <p className="text-[var(--color-a11oy-text-sub)] mt-1">Automated compliance, accessibility, and brand drift analysis.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <div className="text-[10px] uppercase tracking-widest text-[var(--color-a11oy-text-ghost)]">Total Findings</div>
            <div className="text-2xl font-mono font-medium text-[var(--color-a11oy-text)]">{findings.length}</div>
          </div>
          <div className="w-px bg-[var(--color-a11oy-border)] h-10" />
          <div className="flex flex-col items-end">
            <div className="text-[10px] uppercase tracking-widest text-[var(--color-a11oy-critical)]">Critical</div>
            <div className="text-2xl font-mono font-medium text-[var(--color-a11oy-critical)]">{groupedFindings.critical?.length || 0}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-4">
        {severities.map(sev => {
          const groupFindings = groupedFindings[sev.id] || [];
          if (groupFindings.length === 0) return null;

          return (
            <div key={sev.id} className="bg-[var(--color-a11oy-card)] border border-[var(--color-a11oy-border)] rounded-lg overflow-hidden">
              <button 
                onClick={() => toggleGroup(sev.id)}
                className={`w-full flex items-center justify-between p-4 ${sev.bg} border-b border-[var(--color-a11oy-border)] hover:brightness-110 transition-all`}
              >
                <div className="flex items-center gap-3">
                  <sev.icon className={`w-5 h-5 ${sev.color}`} />
                  <h2 className={`font-medium uppercase tracking-widest text-sm ${sev.color}`}>{sev.name} Priority</h2>
                  <Badge variant="outline" className="ml-2 font-mono bg-[var(--color-a11oy-surface)]">{groupFindings.length}</Badge>
                </div>
                {expandedGroups[sev.id] ? <ChevronDown className="w-5 h-5 text-[var(--color-a11oy-text-sub)]" /> : <ChevronRight className="w-5 h-5 text-[var(--color-a11oy-text-sub)]" />}
              </button>

              <AnimatePresence>
                {expandedGroups[sev.id] && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="divide-y divide-[var(--color-a11oy-border)]"
                  >
                    {groupFindings.map(finding => (
                      <div key={finding.id} className="p-4 hover:bg-[var(--color-a11oy-surface)]/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 cursor-pointer" onClick={() => toggleFinding(finding.id)}>
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="ghost" size="sm" className="bg-[var(--color-a11oy-surface)] font-mono border border-[var(--color-a11oy-border)]">
                                {finding.surface}
                              </Badge>
                              <Badge variant="outline" size="sm" className="uppercase tracking-wider text-[10px]">
                                {finding.category.replace('-', ' ')}
                              </Badge>
                            </div>
                            <h3 className="text-sm font-medium text-[var(--color-a11oy-text)] mb-1">
                              {finding.description}
                            </h3>
                            {finding.element && !expandedFindings[finding.id] && (
                              <div className="text-xs font-mono text-[var(--color-a11oy-text-ghost)] truncate max-w-2xl">
                                {finding.element}
                              </div>
                            )}
                          </div>
                          
                          <button 
                            onClick={() => toggleFinding(finding.id)}
                            className="text-xs text-[var(--color-a11oy-blue)] hover:text-[var(--color-a11oy-text)] flex items-center gap-1 font-medium px-3 py-1.5 rounded-md hover:bg-[var(--color-a11oy-surface)] transition-colors"
                          >
                            {expandedFindings[finding.id] ? 'Hide Details' : 'View Remediation'}
                          </button>
                        </div>

                        {expandedFindings[finding.id] && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[var(--color-a11oy-border)] pt-4"
                          >
                            <div className="space-y-4">
                              {finding.element && (
                                <div>
                                  <div className="text-[10px] uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-1">Target Element</div>
                                  <div className="bg-[var(--color-a11oy-navy)] border border-[var(--color-a11oy-border)] p-2 rounded text-xs font-mono text-[var(--color-a11oy-text-sub)] overflow-x-auto">
                                    {finding.element}
                                  </div>
                                </div>
                              )}
                              {(finding.currentValue || finding.requiredValue) && (
                                <div className="flex gap-4">
                                  {finding.currentValue && (
                                    <div className="flex-1">
                                      <div className="text-[10px] uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-1">Observed</div>
                                      <div className="font-mono text-sm text-[var(--color-a11oy-critical)] bg-[var(--color-a11oy-critical)]/10 px-2 py-1 rounded inline-block">
                                        {finding.currentValue}
                                      </div>
                                    </div>
                                  )}
                                  {finding.requiredValue && (
                                    <div className="flex-1">
                                      <div className="text-[10px] uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mb-1">Required</div>
                                      <div className="font-mono text-sm text-[var(--color-a11oy-ok)] bg-[var(--color-a11oy-ok)]/10 px-2 py-1 rounded inline-block">
                                        {finding.requiredValue}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="bg-[var(--color-a11oy-surface)] border border-[var(--color-a11oy-border)] rounded p-4 flex flex-col">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-[10px] uppercase tracking-widest text-[var(--color-a11oy-blue)] font-medium">Scripted Remediation</div>
                                <DemoBadge className="scale-75 origin-right" />
                              </div>
                              <p className="text-sm text-[var(--color-a11oy-text)] mt-2">
                                {finding.scriptedRecommendation}
                              </p>
                              <div className="mt-auto pt-4">
                                <button className="w-full py-2 bg-[var(--color-a11oy-blue)]/10 hover:bg-[var(--color-a11oy-blue)]/20 text-[var(--color-a11oy-blue)] text-xs font-medium rounded transition-colors border border-[var(--color-a11oy-blue)]/30">
                                  Generate PR to fix
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
