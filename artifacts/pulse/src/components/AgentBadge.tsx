import { AGENTS, } from '../lib/data';

interface Props {
  agentId: string;
  showDomain?: boolean;
  size?: 'sm' | 'md';
}

export default function AgentBadge({ agentId, showDomain = false, size = 'md' }: Props) {
  const agent = AGENTS[agentId];
  if (!agent) return null;

  const fontSize = size === 'sm' ? '0.62rem' : '0.68rem';

  return (
    <span
      className="agent-badge"
      style={{
        fontSize,
        color: agent.color,
        borderColor: agent.borderColor,
        background: agent.bgColor,
      }}
    >
      <span style={{ fontWeight: 700 }}>{agent.name}</span>
      {showDomain && <span style={{ opacity: 0.7 }}>· {agent.domain.replace('_', ' ')}</span>}
    </span>
  );
}
