import { motion } from 'framer-motion';
import { AlertTriangle, Clock, DollarSign, Shield } from 'lucide-react';
import { FreshnessTag, ProvenanceTag } from './shared';

interface OwnershipRecord {
  entity: string;
  type: string;
  jurisdiction: string;
  principals: string[];
  lender: string;
  loanBalance: string;
  maturityDate: string;
  ltv: string;
  dscr: string;
  counsel: string;
  lastTransfer: string;
  sourceLabel: string;
  freshness: string;
}

interface Props {
  ownership: OwnershipRecord | null;
}

export function OwnershipTab({ ownership }: Props) {
  const TODAY = '2026-04-02';
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {ownership ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5 space-y-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: '#40856a' }} />
              <h3 className="font-bold text-white text-sm">Ownership Entity</h3>
              <ProvenanceTag source={ownership.sourceLabel} />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Legal Entity
                </p>
                <p className="text-sm font-semibold text-white">{ownership.entity}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {ownership.type} · {ownership.jurisdiction}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Principals
                </p>
                <div className="space-y-1.5">
                  {ownership.principals.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#40856a' }} />
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Last Transfer</p>
                  <p className="text-xs text-white/70">{new Date(ownership.lastTransfer).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Counsel</p>
                  <p className="text-xs text-white/70">{ownership.counsel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <FreshnessTag label={ownership.freshness} confidence="High" />
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-5 space-y-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" style={{ color: '#3b82f6' }} />
              <h3 className="font-bold text-white text-sm">Debt & Capital Stack</h3>
              <ProvenanceTag source="Lender Report · DSCR Model" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Senior Lender</p>
                <p className="text-sm font-semibold text-white">{ownership.lender}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Loan Balance', value: ownership.loanBalance },
                  { label: 'Maturity Date', value: new Date(ownership.maturityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                  { label: 'LTV', value: ownership.ltv, alert: parseFloat(ownership.ltv) > 70 },
                  { label: 'DSCR', value: ownership.dscr, alert: parseFloat(ownership.dscr) < 1.0 },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="p-2.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <p className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{m.label}</p>
                    <p className="text-sm font-bold" style={{ color: m.alert ? '#ef4444' : 'white' }}>{m.value}</p>
                  </div>
                ))}
              </div>
              {parseFloat(ownership.dscr) < 1.0 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
                  <p className="text-[10px]" style={{ color: 'rgba(239,68,68,0.8)' }}>
                    DSCR below 1.0x — debt service not covered by NOI. Lender covenant breach risk. Immediate capital plan required.
                  </p>
                </div>
              )}
              {new Date(ownership.maturityDate).getTime() - new Date(TODAY).getTime() < 1000 * 60 * 60 * 24 * 180 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
                  <p className="text-[10px]" style={{ color: 'rgba(245,158,11,0.8)' }}>
                    Loan matures within 6 months. Begin refi/extension process immediately.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Shield className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Ownership data not available for this asset</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Request title search to populate ownership context</p>
        </div>
      )}
    </motion.div>
  );
}
