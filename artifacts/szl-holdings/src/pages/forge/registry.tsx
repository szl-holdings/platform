import { Link } from 'wouter';
import {
  ForgeShell,
  Section,
  SeverityPill,
  tableStyle,
  tdStyle,
  thStyle,
  useForgeQuery,
} from './_shared';

interface Agent {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  domain: string;
  riskTier: string;
  currentEnv: string;
  status: string;
  updatedAt: string;
}
interface Model {
  id: string;
  slug: string;
  name: string;
  provider: string;
  approved: boolean;
  riskTier: string;
}
interface Tool {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  riskLevel: string;
  approved: boolean;
}
interface Prompt {
  id: string;
  slug: string;
  name: string;
  versions: Array<{ version: number; evalsPassed: boolean }>;
}

export default function ForgeRegistryPage() {
  const agents = useForgeQuery<Agent[]>('agents', '/api/forge/agents?limit=100');
  const models = useForgeQuery<Model[]>('models', '/api/forge/models');
  const tools = useForgeQuery<Tool[]>('tools', '/api/forge/tools');
  const prompts = useForgeQuery<Prompt[]>('prompts', '/api/forge/prompts');

  return (
    <ForgeShell
      title="Registry"
      subtitle="Versioned agents, models, prompts, and tools — every artefact is governed and auditable."
    >
      <Section title={`Agents (${agents.data?.length ?? 0})`}>
        {agents.data && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Slug</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Domain</th>
                <th style={thStyle}>Risk</th>
                <th style={thStyle}>Env</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {agents.data.map((a) => (
                <tr key={a.id}>
                  <td style={tdStyle}>
                    <code style={{ color: '#d4a054' }}>{a.slug}</code>
                  </td>
                  <td style={tdStyle}>{a.name}</td>
                  <td style={tdStyle}>{a.domain}</td>
                  <td style={tdStyle}>
                    <SeverityPill
                      value={
                        a.riskTier === 'executive' || a.riskTier === 'regulated' ? 'high' : 'low'
                      }
                    />
                  </td>
                  <td style={tdStyle}>{a.currentEnv}</td>
                  <td style={tdStyle}>{a.status}</td>
                  <td style={tdStyle}>
                    <Link href={`/forge/agents/${a.id}`} style={{ color: '#93c5fd' }}>
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title={`Models (${models.data?.length ?? 0})`}>
        {models.data && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Slug</th>
                <th style={thStyle}>Provider</th>
                <th style={thStyle}>Risk tier</th>
                <th style={thStyle}>Approved</th>
              </tr>
            </thead>
            <tbody>
              {models.data.map((m) => (
                <tr key={m.id}>
                  <td style={tdStyle}>
                    <code style={{ color: '#d4a054' }}>{m.slug}</code>
                  </td>
                  <td style={tdStyle}>{m.provider}</td>
                  <td style={tdStyle}>{m.riskTier}</td>
                  <td style={tdStyle}>{m.approved ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title={`Tools (${tools.data?.length ?? 0})`}>
        {tools.data && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Slug</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Risk level</th>
                <th style={thStyle}>Approved</th>
              </tr>
            </thead>
            <tbody>
              {tools.data.map((t) => (
                <tr key={t.id}>
                  <td style={tdStyle}>
                    <code style={{ color: '#d4a054' }}>{t.slug}</code>
                  </td>
                  <td style={tdStyle}>{t.name}</td>
                  <td style={tdStyle}>{t.category ?? '—'}</td>
                  <td style={tdStyle}>
                    <SeverityPill
                      value={t.riskLevel === 'high' || t.riskLevel === 'critical' ? 'high' : 'low'}
                    />
                  </td>
                  <td style={tdStyle}>{t.approved ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title={`Prompts (${prompts.data?.length ?? 0})`}>
        {prompts.data && (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Slug</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Versions</th>
                <th style={thStyle}>Latest evals</th>
              </tr>
            </thead>
            <tbody>
              {prompts.data.map((p) => {
                const latest = [...p.versions].sort((a, b) => b.version - a.version)[0];
                return (
                  <tr key={p.id}>
                    <td style={tdStyle}>
                      <code style={{ color: '#d4a054' }}>{p.slug}</code>
                    </td>
                    <td style={tdStyle}>{p.name}</td>
                    <td style={tdStyle}>{p.versions.length}</td>
                    <td style={tdStyle}>{latest?.evalsPassed ? '✓ passed' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>
    </ForgeShell>
  );
}
