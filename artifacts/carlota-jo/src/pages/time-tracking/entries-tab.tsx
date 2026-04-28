import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChevronDown, ChevronUp, Plus, Sparkles, Loader2 } from 'lucide-react';
import { GOLD, RATE_META, type TimeEntry } from './constants';

interface Props {
  entries: TimeEntry[];
  showNewEntry: boolean;
  newEntry: {
    engagement: string;
    phase: string;
    deliverable: string;
    hours: string;
    rateType: TimeEntry['rateType'];
    description: string;
  };
  expandedEntry: string | null;
  aiLoading: boolean;
  aiSuggestion: string | null;
  totalBillable: number;
  onToggleNewEntry: () => void;
  onNewEntryChange: (updates: Partial<Props['newEntry']>) => void;
  onSave: () => void;
  onCancelNew: () => void;
  onToggleExpand: (id: string) => void;
  onApprove: (id: string) => Promise<void>;
  onGenerateAI: () => void;
  entryValue: (e: TimeEntry) => number;
}

export function EntriesTab({
  entries,
  showNewEntry,
  newEntry,
  expandedEntry,
  aiLoading,
  aiSuggestion,
  totalBillable,
  onToggleNewEntry,
  onNewEntryChange,
  onSave,
  onCancelNew,
  onToggleExpand,
  onApprove,
  onGenerateAI,
  entryValue,
}: Props) {
  return (
    <div style={{ marginBottom: 64 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 13, color: '#6B5E47' }}>
          {entries.length} entries · {totalBillable}h billable
        </div>
        <button
          onClick={onToggleNewEntry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 18px',
            background: GOLD,
            border: 'none',
            borderRadius: 10,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Log Time
        </button>
      </div>

      <AnimatePresence>
        {showNewEntry && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: '#FFFBF0',
              border: `1px solid ${GOLD}30`,
              borderRadius: 16,
              padding: 24,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A14', marginBottom: 16 }}>
              New Time Entry
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                marginBottom: 12,
              }}
            >
              {[
                {
                  label: 'Engagement',
                  key: 'engagement',
                  type: 'select',
                  options: [
                    'Luminary Brands',
                    'Vertex Capital Partners',
                    'Aurelius Private Equity',
                    'Oasis Wellness',
                    'Internal',
                  ],
                },
                { label: 'Phase', key: 'phase', type: 'input', placeholder: 'e.g. Strategy Development' },
                { label: 'Deliverable', key: 'deliverable', type: 'input', placeholder: 'e.g. Competitor analysis' },
                { label: 'Hours', key: 'hours', type: 'input', placeholder: 'e.g. 2.5' },
                { label: 'Rate Type', key: 'rateType', type: 'select', options: ['standard', 'premium', 'fixed', 'non-billable'] },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#6B5E47',
                      display: 'block',
                      marginBottom: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={newEntry[field.key as keyof typeof newEntry]}
                      onChange={(e) => onNewEntryChange({ [field.key]: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #E8E2D6',
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: 'inherit',
                        outline: 'none',
                        background: '#fff',
                      }}
                    >
                      {field.options?.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      value={newEntry[field.key as keyof typeof newEntry]}
                      onChange={(e) => onNewEntryChange({ [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #E8E2D6',
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: 'inherit',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6B5E47',
                  display: 'block',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Description
              </label>
              <textarea
                value={newEntry.description}
                onChange={(e) => onNewEntryChange({ description: e.target.value })}
                placeholder="Brief description of work performed..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #E8E2D6',
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onSave}
                style={{
                  padding: '8px 20px',
                  background: GOLD,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Save Entry
              </button>
              <button
                onClick={onCancelNew}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #E8E2D6',
                  borderRadius: 8,
                  color: '#6B5E47',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Suggestions inline */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #E8E2D6',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}
      >
        <Sparkles size={14} color={GOLD} style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {aiSuggestion ? (
            <div
              style={{
                fontSize: 12,
                color: '#1A1A14',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                marginBottom: 8,
              }}
            >
              {aiSuggestion}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#A89878', marginBottom: 8 }}>
              AI analyses your calendar and document activity to suggest entries you may have missed.
            </div>
          )}
          <button
            onClick={onGenerateAI}
            disabled={aiLoading}
            style={{
              padding: '6px 14px',
              background: aiLoading ? '#F5F0E8' : `${GOLD}15`,
              border: `1px solid ${GOLD}30`,
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              color: '#6B5E47',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {aiLoading ? (
              <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Sparkles size={11} color={GOLD} />
            )}
            {aiSuggestion ? 'Refresh Suggestions' : 'Generate AI Suggestions'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry, i) => {
          const rateMeta = RATE_META[entry.rateType];
          const value = entryValue(entry);
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i, 6) * 0.04 }}
              style={{
                background: '#fff',
                border: '1px solid #E8E2D6',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  cursor: 'pointer',
                }}
                onClick={() => onToggleExpand(entry.id)}
              >
                <div style={{ textAlign: 'center', minWidth: 48 }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: entry.billable ? GOLD : '#94A3B8',
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                  >
                    {entry.hours}h
                  </div>
                  <div style={{ fontSize: 9, color: '#A89878', textTransform: 'uppercase' }}>
                    {entry.date.split(',')[0]}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 3,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A14' }}>
                      {entry.engagement}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 100,
                        background: `${rateMeta.color}12`,
                        color: rateMeta.color,
                        fontWeight: 600,
                      }}
                    >
                      {rateMeta.label}
                    </span>
                    {entry.approved && <CheckCircle size={12} color="#059669" />}
                    {entry.invoiceId && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 100,
                          background: '#F5F0E8',
                          color: '#6B5E47',
                          fontWeight: 600,
                        }}
                      >
                        Invoiced · {entry.invoiceId}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B5E47' }}>
                    {entry.phase} · {entry.deliverable}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: entry.billable ? '#1A1A14' : '#A89878',
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                  >
                    {entry.billable ? `£${value.toLocaleString()}` : '—'}
                  </div>
                  <div style={{ fontSize: 10, color: '#A89878' }}>
                    {entry.billable
                      ? `£${entry.rateType === 'fixed' ? 'fixed' : entry.rate}/hr`
                      : 'Non-billable'}
                  </div>
                </div>
                {expandedEntry === entry.id ? (
                  <ChevronUp size={14} color="#A89878" />
                ) : (
                  <ChevronDown size={14} color="#A89878" />
                )}
              </div>
              <AnimatePresence>
                {expandedEntry === entry.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{
                      borderTop: '1px solid #F0EBE0',
                      padding: '12px 20px',
                      background: '#FAFAF8',
                    }}
                  >
                    <p style={{ fontSize: 13, color: '#6B5E47', lineHeight: 1.6 }}>
                      {entry.description}
                    </p>
                    <div
                      style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: '#A89878' }}
                    >
                      <span>{entry.date}</span>
                      <span>·</span>
                      <span>{entry.approved ? '✓ Approved' : 'Pending approval'}</span>
                      {!entry.approved && (
                        <>
                          <span>·</span>
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              void onApprove(entry.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              color: GOLD,
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Approve
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
