import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  MessageSquare,
  Shield,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import {
  CLIENT_DOSSIERS,
  type ClientTier,
  COMMUNICATION_LOGS,
  DEMO_NOTE,
  getCategoryLabel,
  getRequestPriorityLabel,
  getSLALabel,
  getStatusLabel,
  getTierBadgeColor,
  SERVICE_REQUESTS,
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

function tierBadge(tier: ClientTier) {
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

const today = new Date('2026-04-19');

const activeRequests = SERVICE_REQUESTS.filter(
  (r) => r.status !== 'resolved' && r.status !== 'deferred',
);
const vipExceptions = activeRequests.filter((r) => r.priority === 'vip-exception');
const atRisk = activeRequests.filter(
  (r) => r.slaStatus === 'at-risk' || r.slaStatus === 'breached',
);
const recentComms = COMMUNICATION_LOGS.slice(0, 3);

const statCards = [
  {
    label: 'Active Households',
    value: CLIENT_DOSSIERS.length,
    icon: <Users size={18} color={GOLD} />,
    href: '/concierge/clients',
    detail: 'Founding, Diamond & Platinum',
  },
  {
    label: 'Open Requests',
    value: activeRequests.length,
    icon: <BookOpen size={18} color={GOLD} />,
    href: '/concierge/requests',
    detail: `${atRisk.length} requiring attention`,
  },
  {
    label: 'VIP Exceptions',
    value: vipExceptions.length,
    icon: <Crown size={18} color={GOLD} />,
    href: '/concierge/requests',
    detail: 'Escalated to senior director',
  },
  {
    label: 'Correspondence',
    value: COMMUNICATION_LOGS.length,
    icon: <MessageSquare size={18} color={GOLD} />,
    href: '/concierge/communications',
    detail: 'Last 30 days',
  },
];

export default function ConciergeCommand() {
  const [_today] = useState(today);

  return (
    <div
      style={{ minHeight: '100vh', background: CREAM, fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Header */}
      <div
        style={{
          padding: '40px 48px 0',
          borderBottom: `1px solid ${BORDER}`,
          background: '#fff',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              paddingBottom: 28,
            }}
          >
            <div>
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
                White-Glove Command
              </div>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', 'Georgia', serif",
                  fontSize: 36,
                  fontWeight: 600,
                  color: INK,
                  margin: '0 0 8px 0',
                  letterSpacing: '-0.01em',
                }}
              >
                Concierge Atelier
              </h1>
              <p style={{ fontSize: 14, color: MUTED, margin: 0 }}>
                Sunday, 19 April 2026 · Private & Confidential
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <Link
                href="/concierge/requests"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  background: GOLD,
                  color: '#fff',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                }}
              >
                <Bell size={14} />
                New Request
              </Link>
            </div>
          </div>

          {/* Demo notice */}
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
              marginBottom: 24,
            }}
          >
            <Shield size={10} color={GOLD} />
            {DEMO_NOTE}
          </div>
        </motion.div>
      </div>

      <div style={{ padding: '32px 48px', maxWidth: 1280 }}>
        {/* Stat cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
            marginBottom: 36,
          }}
        >
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.45 }}
            >
              <Link href={card.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: '#fff',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 14,
                    padding: '22px 22px 18px',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow = '0 4px 20px rgba(154,125,82,0.1)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: 'rgba(154,125,82,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {card.icon}
                    </div>
                    <ArrowUpRight size={14} color={MUTED} />
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 600,
                      color: INK,
                      lineHeight: 1,
                      marginBottom: 6,
                    }}
                  >
                    {card.value}
                  </div>
                  <div style={{ fontSize: 13, color: INK, fontWeight: 500, marginBottom: 3 }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED }}>{card.detail}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 28 }}>
          {/* Active requests */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 22,
                    fontWeight: 600,
                    color: INK,
                    margin: '0 0 2px 0',
                  }}
                >
                  Today's Docket
                </h2>
                <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
                  Active requests across all households
                </p>
              </div>
              <Link
                href="/concierge/requests"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  color: GOLD,
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Full docket <ChevronRight size={12} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeRequests.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.06, duration: 0.35 }}
                >
                  <Link href={`/concierge/requests`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        background: '#fff',
                        border:
                          req.priority === 'vip-exception'
                            ? `1px solid ${AMBER}50`
                            : `1px solid ${BORDER}`,
                        borderRadius: 12,
                        padding: '16px 18px',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.15s',
                        borderLeft:
                          req.priority === 'vip-exception'
                            ? `3px solid ${AMBER}`
                            : `3px solid ${BORDER}`,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.boxShadow = '0 2px 12px rgba(154,125,82,0.09)')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 6,
                              flexWrap: 'wrap',
                            }}
                          >
                            {tierBadge(req.clientTier)}
                            {req.priority === 'vip-exception' && (
                              <span
                                style={{
                                  fontSize: 9,
                                  letterSpacing: '0.12em',
                                  textTransform: 'uppercase',
                                  color: AMBER,
                                  background: `${AMBER}15`,
                                  border: `1px solid ${AMBER}40`,
                                  borderRadius: 4,
                                  padding: '2px 7px',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Crown size={9} /> VIP Exception
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: MUTED }}>{req.clientName}</span>
                          </div>
                          <div
                            style={{ fontSize: 14, color: INK, fontWeight: 500, marginBottom: 4 }}
                          >
                            {req.title}
                          </div>
                          <div style={{ fontSize: 12, color: MUTED }}>
                            {getCategoryLabel(req.category)} · {req.assignedTo}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: 8,
                            flexShrink: 0,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {slaIcon(req.slaStatus)}
                            <span
                              style={{
                                fontSize: 11,
                                color: slaColor(req.slaStatus),
                                fontWeight: 500,
                              }}
                            >
                              {getSLALabel(req.slaStatus)}
                            </span>
                          </div>
                          <div
                            style={{
                              width: 100,
                              height: 4,
                              background: `${BORDER}`,
                              borderRadius: 4,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${req.progressPct}%`,
                                height: '100%',
                                background: req.progressPct === 100 ? GREEN : GOLD,
                                borderRadius: 4,
                                transition: 'width 0.5s',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 10, color: MUTED }}>
                            {req.progressPct}% complete
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Households at a glance */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.45 }}
            >
              <div
                style={{
                  background: '#fff',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: '20px 20px',
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
                  <h3
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: INK,
                      margin: 0,
                    }}
                  >
                    Households
                  </h3>
                  <Link
                    href="/concierge/clients"
                    style={{
                      fontSize: 11,
                      color: GOLD,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    All dossiers <ChevronRight size={11} />
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {CLIENT_DOSSIERS.map((client) => (
                    <Link
                      key={client.id}
                      href="/concierge/clients"
                      style={{ textDecoration: 'none' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: 9,
                          border: `1px solid ${BORDER}`,
                          cursor: 'pointer',
                          background: CREAM,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'rgba(154,125,82,0.06)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = CREAM)}
                      >
                        <div>
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: `${getTierBadgeColor(client.tier)}18`,
                              border: `1px solid ${getTierBadgeColor(client.tier)}30`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 700,
                              color: getTierBadgeColor(client.tier),
                              marginRight: 10,
                              verticalAlign: 'middle',
                            }}
                          >
                            {client.code.charAt(0)}
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              color: INK,
                              fontWeight: 500,
                              verticalAlign: 'middle',
                            }}
                          >
                            {client.name.split(' ')[0]} {client.name.split(' ').slice(-1)[0]}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {tierBadge(client.tier)}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            {slaIcon(client.slaRisk)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Recent correspondence */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.45 }}
            >
              <div
                style={{
                  background: '#fff',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: '20px 20px',
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
                  <h3
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 18,
                      fontWeight: 600,
                      color: INK,
                      margin: 0,
                    }}
                  >
                    Recent Correspondence
                  </h3>
                  <Link
                    href="/concierge/communications"
                    style={{
                      fontSize: 11,
                      color: GOLD,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    Full log <ChevronRight size={11} />
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentComms.map((comm) => (
                    <div
                      key={comm.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 9,
                        border: `1px solid ${BORDER}`,
                        background: CREAM,
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            color: MUTED,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                          }}
                        >
                          {comm.direction === 'inbound' ? '↓ Received' : '↑ Sent'}
                        </span>
                        {comm.redacted && (
                          <span
                            style={{
                              fontSize: 9,
                              background: 'rgba(192,57,43,0.1)',
                              color: RED,
                              border: `1px solid ${RED}30`,
                              padding: '1px 6px',
                              borderRadius: 3,
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                            }}
                          >
                            Redacted
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: INK, fontWeight: 500, marginBottom: 2 }}>
                        {comm.subject}
                      </div>
                      <div style={{ fontSize: 11, color: MUTED }}>{comm.clientName}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.45 }}
            >
              <div
                style={{
                  background: 'rgba(154,125,82,0.05)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: '18px 20px',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: GOLD,
                    fontWeight: 600,
                    marginBottom: 14,
                  }}
                >
                  Quick Access
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    {
                      label: 'Service Choreographies',
                      href: '/concierge/playbooks',
                      icon: <Star size={13} color={GOLD} />,
                    },
                    {
                      label: 'Client Dossiers',
                      href: '/concierge/clients',
                      icon: <Users size={13} color={GOLD} />,
                    },
                    {
                      label: 'Priority Routing',
                      href: '/concierge/requests',
                      icon: <TrendingUp size={13} color={GOLD} />,
                    },
                    {
                      label: 'Discreet Correspondence',
                      href: '/concierge/communications',
                      icon: <Shield size={13} color={GOLD} />,
                    },
                  ].map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: 13,
                        color: INK,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'rgba(154,125,82,0.08)')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                      <ChevronRight size={12} color={MUTED} style={{ marginLeft: 'auto' }} />
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
