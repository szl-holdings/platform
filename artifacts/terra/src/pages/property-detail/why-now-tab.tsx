import { AlertTriangle, ChevronRight, Flame, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';

interface WhyNowFactor {
  name: string;
  score: number;
  maxScore: number;
  summary: string;
}

interface WhyNowData {
  distressScore: number;
  distressTier: string;
  dealNarrative: string;
  factors: WhyNowFactor[];
  computedAt: string;
  partialOutage?: boolean;
}

interface Props {
  propertyId: string;
  whyNowLoading: boolean;
  whyNowError: string | null;
  whyNowData: WhyNowData | null;
  onRetry: () => void;
}

export function WhyNowTab({ propertyId, whyNowLoading, whyNowError, whyNowData, onRetry }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Flame className="w-5 h-5" style={{ color: '#ef4444' }} />
          <div>
            <h3 className="font-bold text-white text-sm">Why This Property Now</h3>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Explainable distress score — HPD · ACRIS · ECB · DOB · DOF live NYC public data
            </p>
          </div>
          <Link href={`/why-this-property/${propertyId}`} className="ml-auto">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all" style={{ background: '#ef4444', color: 'white' }}>
              <Flame className="w-3.5 h-3.5" /> Full Analysis
            </button>
          </Link>
        </div>

        {whyNowLoading && (
          <div className="flex items-center gap-2 py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#ef4444' }} />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Querying NYC public data sources…</span>
          </div>
        )}

        {!whyNowLoading && whyNowError === 'not-found' && (
          <div className="rounded-lg p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <AlertTriangle className="w-5 h-5 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.25)' }} />
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Not yet in the distress pipeline</p>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Add this property to a distress source to trigger live scoring.</p>
            <Link href="/distress-pipeline">
              <button className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                Browse Distress Pipeline
              </button>
            </Link>
          </div>
        )}

        {!whyNowLoading && whyNowError && whyNowError !== 'not-found' && (
          <div className="rounded-lg p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <AlertTriangle className="w-4 h-4 mx-auto mb-2" style={{ color: 'rgba(255,200,0,0.6)' }} />
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Could not load distress data — NYC Open Data may be unavailable.</p>
            <button onClick={onRetry} className="mt-2 text-[10px] underline" style={{ color: 'rgba(255,255,255,0.3)' }}>Retry</button>
          </div>
        )}

        {!whyNowLoading && whyNowData && (() => {
          const d = whyNowData;
          const tierColor = d.distressTier === 'Critical' ? '#ef4444' : d.distressTier === 'High' ? '#f97316' : d.distressTier === 'Medium' ? '#eab308' : '#40856a';
          const topFactors = [...d.factors].sort((a, b) => b.score - a.score).slice(0, 3);
          return (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-full flex flex-col items-center justify-center" style={{ background: `${tierColor}18`, border: `2px solid ${tierColor}50` }}>
                  <span className="text-2xl font-black" style={{ color: tierColor }}>{d.distressScore}</span>
                  <span className="text-[8px] font-semibold uppercase tracking-wide" style={{ color: `${tierColor}aa` }}>/100</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold" style={{ color: tierColor }}>{d.distressTier} Distress</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${tierColor}18`, color: tierColor, border: `1px solid ${tierColor}30` }}>
                      {d.distressScore >= 70 ? 'Act Now' : d.distressScore >= 40 ? 'Monitor' : 'Low Risk'}
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>{d.dealNarrative}</p>
                </div>
              </div>

              <div className="space-y-2">
                {topFactors.map((f) => {
                  const pct = f.maxScore > 0 ? Math.round((f.score / f.maxScore) * 100) : 0;
                  const factorColor = pct >= 70 ? '#ef4444' : pct >= 40 ? '#f97316' : '#40856a';
                  return (
                    <div key={f.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>{f.name}</span>
                        <span className="text-[10px] font-bold" style={{ color: factorColor }}>{f.score}/{f.maxScore}</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: factorColor }} />
                      </div>
                      <p className="text-[9px] mt-0.5 line-clamp-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{f.summary}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Computed {new Date(d.computedAt).toLocaleString()} · HPD · ACRIS · ECB · DOB · DOF{d.partialOutage ? ' · ⚠ partial data' : ''}
                </p>
                <Link href={`/why-this-property/${propertyId}`}>
                  <button className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#ef4444' }}>
                    Full breakdown <ChevronRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            </>
          );
        })()}
      </div>
    </motion.div>
  );
}
