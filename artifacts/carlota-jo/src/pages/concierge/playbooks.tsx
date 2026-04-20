import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Shield,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import {
  DEMO_NOTE,
  getCategoryLabel,
  type PlaybookTask,
  SERVICE_PLAYBOOKS,
  type ServicePlaybook,
} from '@/data/concierge-data';

const GOLD = '#9A7D52';
const INK = '#1A1A1A';
const MUTED = '#6B6B6B';
const CREAM = '#F9F7F3';
const BORDER = 'rgba(154,125,82,0.18)';
const AMBER = '#B7862E';

const categoryIcons: Record<string, string> = {
  'private-travel': '✈',
  'restaurant-access': '🥂',
  'residence-prep': '🏛',
  gifting: '🎁',
  events: '✨',
  wellness: '🌿',
  'family-office': '🔐',
};

function TaskRow({
  task,
  index,
  totalTasks,
}: {
  task: PlaybookTask;
  index: number;
  totalTasks: number;
}) {
  const isLast = index === totalTasks - 1;
  return (
    <div style={{ display: 'flex', gap: 14, position: 'relative' }}>
      {/* Timeline stem */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0,
          width: 28,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background:
              task.connectorStatus === 'stub' ? 'rgba(183,134,46,0.12)' : 'rgba(154,125,82,0.12)',
            border: `1.5px solid ${task.connectorStatus === 'stub' ? AMBER : GOLD}60`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: task.connectorStatus === 'stub' ? AMBER : GOLD,
            zIndex: 1,
            position: 'relative',
          }}
        >
          {task.order}
        </div>
        {!isLast && (
          <div
            style={{
              width: 1,
              flex: 1,
              minHeight: 20,
              background: `${BORDER}`,
              marginTop: 2,
            }}
          />
        )}
      </div>
      {/* Task detail */}
      <div
        style={{
          flex: 1,
          paddingBottom: isLast ? 0 : 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
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
              <span style={{ fontSize: 13, fontWeight: 500, color: INK }}>{task.title}</span>
              {task.connectorStatus === 'stub' && (
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: AMBER,
                    background: `${AMBER}12`,
                    border: `1px solid ${AMBER}40`,
                    borderRadius: 4,
                    padding: '1px 6px',
                    fontWeight: 600,
                  }}
                >
                  Integration pending
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: MUTED, margin: '0 0 5px' }}>{task.description}</p>
            <div style={{ display: 'flex', gap: 14, fontSize: 11, color: MUTED, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={10} color={GOLD} />
                SLA: {task.slaDays < 1 ? `${task.slaDays * 24}h` : `${task.slaDays}d`}
              </span>
              <span>Specialist: {task.specialist}</span>
              {task.externalConnector && (
                <span style={{ color: AMBER }}>via {task.externalConnector}</span>
              )}
            </div>
          </div>
          {task.dependencies.length > 0 && (
            <div style={{ fontSize: 10, color: MUTED, flexShrink: 0, marginTop: 2 }}>
              After {task.dependencies.map((d) => `#${d.replace('t', '')}`).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaybookCard({ playbook }: { playbook: ServicePlaybook }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      style={{
        background: '#fff',
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        overflow: 'hidden',
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
        <div style={{ display: 'flex', gap: 14, flex: 1 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: 'rgba(154,125,82,0.08)',
              border: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            {categoryIcons[playbook.category] || '✦'}
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 19,
                fontWeight: 600,
                color: INK,
                margin: '0 0 4px 0',
              }}
            >
              {playbook.name}
            </h3>
            <p style={{ fontSize: 12, color: MUTED, margin: 0, lineHeight: 1.5 }}>
              {playbook.description}
            </p>
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
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: MUTED }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={11} color={GOLD} /> ~{playbook.estimatedDays}d
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={11} color={GOLD} /> {playbook.usageCount} deployments
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Layers size={11} color={GOLD} /> {playbook.tasks.length} steps
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              color: MUTED,
            }}
          >
            <span
              style={{
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: GOLD,
                border: `1px solid ${GOLD}40`,
                background: `${GOLD}08`,
                borderRadius: 4,
                padding: '2px 7px',
                fontWeight: 600,
              }}
            >
              {getCategoryLabel(playbook.category)}
            </span>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                border: `1px solid ${BORDER}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: CREAM,
              }}
            >
              {expanded ? (
                <ChevronUp size={14} color={MUTED} />
              ) : (
                <ChevronDown size={14} color={MUTED} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded task list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '16px 24px 24px', borderTop: `1px solid ${BORDER}` }}>
              <div
                style={{ marginBottom: 16, fontSize: 11, color: MUTED, display: 'flex', gap: 20 }}
              >
                <span>Last deployed: {playbook.lastUsed}</span>
                <span>·</span>
                <span style={{ color: AMBER }}>
                  {playbook.tasks.filter((t) => t.connectorStatus === 'stub').length} integration(s)
                  pending credentials
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {playbook.tasks.map((task, i) => (
                  <TaskRow key={task.id} task={task} index={i} totalTasks={playbook.tasks.length} />
                ))}
              </div>

              {/* Integration stubs notice */}
              {playbook.tasks.some((t) => t.connectorStatus === 'stub') && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    marginTop: 16,
                    padding: '12px 14px',
                    background: `${AMBER}08`,
                    border: `1px solid ${AMBER}30`,
                    borderRadius: 9,
                  }}
                >
                  <AlertCircle size={14} color={AMBER} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 11, color: INK, lineHeight: 1.55 }}>
                    <strong>Integration stubs:</strong> Steps marked "Integration pending" connect
                    to third-party providers (VistaJet, SevenRooms, DHL). These stubs are ready for
                    credential connection — no workflow logic changes are required when activated.
                  </div>
                </div>
              )}

              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 16,
                  padding: '10px 20px',
                  background: GOLD,
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                }}
              >
                Deploy choreography <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ServicePlaybooks() {
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
            White-Glove Command · Service Choreographies
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
            Service Choreographies
          </h1>
          <p style={{ fontSize: 14, color: MUTED, margin: '0 0 16px' }}>
            Named sequences that orchestrate every task, specialist, and SLA for recurring service
            types.
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

      <div style={{ padding: '32px 48px', maxWidth: 960 }}>
        {/* Stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginBottom: 32,
          }}
        >
          {[
            { label: 'Choreographies', value: SERVICE_PLAYBOOKS.length },
            {
              label: 'Total Deployments',
              value: SERVICE_PLAYBOOKS.reduce((s, p) => s + p.usageCount, 0),
            },
            {
              label: 'Avg. Completion',
              value: `${SERVICE_PLAYBOOKS.reduce((s, p) => s + p.estimatedDays, 0) / SERVICE_PLAYBOOKS.length}d`,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: '#fff',
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: '16px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: INK, marginBottom: 4 }}>
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: MUTED,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SERVICE_PLAYBOOKS.map((pb, i) => (
            <motion.div
              key={pb.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
            >
              <PlaybookCard playbook={pb} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
