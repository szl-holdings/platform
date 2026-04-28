import { motion } from 'framer-motion';
import { RATE_CARDS } from '@/data/operationalData';
import { GOLD } from './constants';

export function RatesTab() {
  return (
    <div style={{ marginBottom: 64 }}>
      <div style={{ marginBottom: 20, fontSize: 13, color: '#6B5E47' }}>
        Rate cards by engagement — configure billing rates, discounts, and fee structures.
      </div>
      {RATE_CARDS.map((rc, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          style={{
            background: '#fff',
            border: '1px solid #E8E2D6',
            borderRadius: 14,
            padding: '20px 24px',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A14' }}>{rc.engagement}</div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: GOLD,
                background: `${GOLD}12`,
                padding: '4px 12px',
                borderRadius: 100,
              }}
            >
              Blended target: {rc.blendedTarget}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Standard Rate', value: rc.standard, color: '#0284C7' },
              { label: 'Premium Rate', value: rc.premium, color: '#7C3AED' },
              { label: 'Fixed Fee', value: rc.fixed, color: '#D97706' },
            ].map((r) => (
              <div
                key={r.label}
                style={{
                  background: `${r.color}08`,
                  border: `1px solid ${r.color}20`,
                  borderRadius: 10,
                  padding: '12px 16px',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: r.color,
                    fontWeight: 600,
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {r.label}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#1A1A14',
                    fontFamily: "'Cormorant Garamond', serif",
                  }}
                >
                  {r.value}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
