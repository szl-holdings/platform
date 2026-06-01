import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  EyeOff,
  Gift,
  Home,
  Lock,
  Phone,
  Shield,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import {
  CLIENT_DOSSIERS,
  type ClientDossier,
  type ClientTier,
  DEMO_NOTE,
  getSLALabel,
  getTierBadgeColor,
  type SLAStatus,
} from '@/data/concierge-data';

const GOLD = '#9A7D52';
const INK = '#1A1A1A';
const MUTED = '#6B6B6B';
const CREAM = '#F9F7F3';
const BORDER = 'rgba(154,125,82,0.18)';
const RED = '#C0392B';
const AMBER = '#B7862E';
const GREEN = '#2E7D53';

function slaColor(s: SLAStatus) {
  if (s === 'on-track') return GREEN;
  if (s === 'at-risk') return AMBER;
  return RED;
}

function slaIcon(s: SLAStatus) {
  if (s === 'on-track') return <CheckCircle2 size={13} color={GREEN} />;
  if (s === 'at-risk') return <AlertTriangle size={13} color={AMBER} />;
  return <AlertTriangle size={13} color={RED} />;
}

function TierBadge({ tier }: { tier: ClientTier }) {
  const color = getTierBadgeColor(tier);
  return (
    <span
      style={{
        fontSize: 9,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color,
        border: `1px solid ${color}40`,
        background: `${color}10`,
        borderRadius: 4,
        padding: '2px 7px',
        fontWeight: 600,
      }}
    >
      {tier}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: GOLD,
        fontWeight: 600,
        marginBottom: 10,
        marginTop: 20,
        paddingBottom: 6,
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 11,
        color: INK,
        background: 'rgba(154,125,82,0.08)',
        border: `1px solid ${BORDER}`,
        borderRadius: 6,
        padding: '3px 10px',
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      {children}
    </span>
  );
}

function RedactedField({ label, redacted }: { label: string; redacted: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <button
      onClick={() => setShow((s) => !s)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: 12,
        color: MUTED,
        padding: 0,
      }}
    >
      {show ? <Eye size={12} /> : <EyeOff size={12} />}
      <span
        style={{
          fontFamily: show ? 'inherit' : 'monospace',
          letterSpacing: show ? 'normal' : '0.15em',
          color: show ? INK : MUTED,
        }}
      >
        {show ? label : '••••••••'}
      </span>
    </button>
  );
}

function DossierCard({ client }: { client: ClientDossier }) {
  const [expanded, setExpanded] = useState(false);
  const color = getTierBadgeColor(client.tier);

  return (
    <motion.div
      layout
      style={{
        background: '#fff',
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        overflow: 'hidden',
        borderTop: `3px solid ${color}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '22px 24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div style={{ display: 'flex', gap: 16, flex: 1 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: `${color}15`,
              border: `2px solid ${color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              color,
              flexShrink: 0,
              fontFamily: "'Cormorant Garamond', serif",
            }}
          >
            {client.code}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 4,
                flexWrap: 'wrap',
              }}
            >
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 20,
                  fontWeight: 600,
                  color: INK,
                  margin: 0,
                }}
              >
                {client.name}
              </h3>
              <TierBadge tier={client.tier} />
            </div>
            <div style={{ fontSize: 12, color: MUTED, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span>Director: {client.conciergeDirector}</span>
              <span>·</span>
              <span>Member since {client.since}</span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {slaIcon(client.slaRisk)}
                <span style={{ color: slaColor(client.slaRisk) }}>
                  {getSLALabel(client.slaRisk)}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: INK }}>{client.openRequests}</div>
            <div
              style={{
                fontSize: 10,
                color: MUTED,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              Open
            </div>
          </div>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: CREAM,
            }}
          >
            {expanded ? (
              <ChevronUp size={16} color={MUTED} />
            ) : (
              <ChevronDown size={16} color={MUTED} />
            )}
          </div>
        </div>
      </div>

      {/* Expanded dossier */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 24px 28px', borderTop: `1px solid ${BORDER}` }}>
              {/* Access scope notice */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: 'rgba(154,125,82,0.05)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  marginTop: 18,
                  marginBottom: 4,
                }}
              >
                <Lock size={12} color={GOLD} />
                <span style={{ fontSize: 11, color: MUTED }}>
                  Access scoped to:{' '}
                  <strong style={{ color: INK }}>{client.accessScope.join(', ')}</strong>
                  &nbsp;·&nbsp;Tier 4 — Restricted
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                {/* Left column */}
                <div>
                  <SectionLabel>Primary Contact</SectionLabel>
                  <p style={{ fontSize: 13, color: INK, margin: '0 0 4px' }}>
                    {client.primaryContact}
                  </p>

                  <SectionLabel>Household Contacts</SectionLabel>
                  {client.household.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 9,
                        border: `1px solid ${BORDER}`,
                        background: CREAM,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}
                      >
                        <Phone size={11} color={GOLD} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: INK }}>{h.name}</span>
                        <span style={{ fontSize: 10, color: MUTED }}>{h.relationship}</span>
                      </div>
                      {h.directLine && (
                        <div style={{ marginLeft: 19 }}>
                          <RedactedField label={h.directLine} redacted={true} />
                        </div>
                      )}
                      {h.note && (
                        <p style={{ fontSize: 11, color: MUTED, margin: '4px 0 0 19px' }}>
                          {h.note}
                        </p>
                      )}
                    </div>
                  ))}

                  <SectionLabel>Standing Instructions</SectionLabel>
                  {client.standigInstructions.map((instr, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginBottom: 6,
                        fontSize: 12,
                        color: INK,
                        alignItems: 'flex-start',
                      }}
                    >
                      <Star size={10} color={GOLD} style={{ flexShrink: 0, marginTop: 3 }} />
                      <span>{instr}</span>
                    </div>
                  ))}

                  <SectionLabel>Brand Affinities</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {client.brandAffinities.map((b) => (
                      <Pill key={b}>{b}</Pill>
                    ))}
                  </div>
                </div>

                {/* Right column */}
                <div>
                  <SectionLabel>Travel Preferences</SectionLabel>
                  <div
                    style={{
                      background: CREAM,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 10,
                      padding: '14px 16px',
                    }}
                  >
                    {[
                      { label: 'Cabin', value: client.travelPreferences.cabin },
                      { label: 'Seat', value: client.travelPreferences.seatPreference },
                      { label: 'Carriers', value: client.travelPreferences.airlines.join(', ') },
                      { label: 'Hotels', value: client.travelPreferences.hotelBrands.join(', ') },
                      { label: 'Vehicle', value: client.travelPreferences.vehiclePreference },
                    ].map((row) => (
                      <div
                        key={row.label}
                        style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12 }}
                      >
                        <span style={{ color: MUTED, minWidth: 64 }}>{row.label}</span>
                        <span style={{ color: INK }}>{row.value}</span>
                      </div>
                    ))}
                    {client.travelPreferences.allergies.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          marginBottom: 8,
                          fontSize: 12,
                          alignItems: 'flex-start',
                        }}
                      >
                        <span style={{ color: RED, fontWeight: 600, minWidth: 64 }}>Allergies</span>
                        <span style={{ color: RED, fontWeight: 500 }}>
                          {client.travelPreferences.allergies.join(', ')}
                        </span>
                      </div>
                    )}
                    {client.travelPreferences.dietaryRequirements.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 0, fontSize: 12 }}>
                        <span style={{ color: MUTED, minWidth: 64 }}>Dietary</span>
                        <span style={{ color: INK }}>
                          {client.travelPreferences.dietaryRequirements.join(', ')}
                        </span>
                      </div>
                    )}
                    {client.travelPreferences.notes && (
                      <p
                        style={{
                          fontSize: 11,
                          color: MUTED,
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop: `1px solid ${BORDER}`,
                          marginBottom: 0,
                        }}
                      >
                        {client.travelPreferences.notes}
                      </p>
                    )}
                  </div>

                  <SectionLabel>Residences</SectionLabel>
                  {client.residences.map((res, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 9,
                        border: `1px solid ${BORDER}`,
                        background: CREAM,
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                      >
                        <Home size={12} color={GOLD} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: INK }}>
                          {res.name}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: MUTED, margin: '0 0 4px 20px' }}>
                        {res.address}
                      </p>
                      {res.houseManager && (
                        <p style={{ fontSize: 11, color: MUTED, margin: '0 0 4px 20px' }}>
                          House manager: {res.houseManager}
                        </p>
                      )}
                      {res.notes && (
                        <p
                          style={{
                            fontSize: 11,
                            color: INK,
                            margin: '4px 0 0 20px',
                            fontStyle: 'italic',
                          }}
                        >
                          "{res.notes}"
                        </p>
                      )}
                    </div>
                  ))}

                  <SectionLabel>Gift History</SectionLabel>
                  {client.giftHistory.length === 0 ? (
                    <p style={{ fontSize: 12, color: MUTED, fontStyle: 'italic' }}>
                      No gift history recorded.
                    </p>
                  ) : (
                    client.giftHistory.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 9,
                          border: `1px solid ${BORDER}`,
                          background: CREAM,
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}
                        >
                          <Gift size={11} color={GOLD} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: INK }}>
                            {g.description}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: MUTED, marginLeft: 19 }}>
                          {g.occasion} · {g.date} · {g.recipient}
                          {g.value && ` · ${g.value}`}
                        </div>
                        {g.note && (
                          <p
                            style={{
                              fontSize: 11,
                              color: MUTED,
                              margin: '4px 0 0 19px',
                              fontStyle: 'italic',
                            }}
                          >
                            {g.note}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Audit note */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'rgba(154,125,82,0.04)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  marginTop: 16,
                }}
              >
                <Clock size={11} color={MUTED} />
                <span style={{ fontSize: 10, color: MUTED }}>
                  Last touchpoint: {client.lastTouchpoint} · Audit trail active · All reads logged
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ClientDossiers() {
  return (
    <div
      style={{ minHeight: '100vh', background: CREAM, fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Header */}
      <div
        style={{
          padding: '40px 48px 28px',
          borderBottom: `1px solid ${BORDER}`,
          background: '#fff',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: GOLD,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            White-Glove Command · Client Dossiers
          </div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 34,
              fontWeight: 600,
              color: INK,
              margin: '0 0 8px 0',
            }}
          >
            Household Dossiers
          </h1>
          <p style={{ fontSize: 14, color: MUTED, margin: '0 0 16px' }}>
            Preference memory, standing instructions, and household detail — private and scoped.
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              color: MUTED,
              background: 'rgba(154,125,82,0.06)',
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              padding: '4px 10px',
            }}
          >
            <Shield size={10} color={GOLD} />
            {DEMO_NOTE}
          </div>
        </motion.div>
      </div>

      <div style={{ padding: '32px 48px', maxWidth: 1100 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {CLIENT_DOSSIERS.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
            >
              <DossierCard client={client} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
