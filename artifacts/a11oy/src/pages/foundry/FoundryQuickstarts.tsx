import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card } from '../../components/ui';

const GOLD = '#c9b787';

type Lang = 'curl' | 'python' | 'typescript';

const QUICKSTARTS = [
  {
    id: 'qs-1',
    title: 'Hello Governed Agent',
    desc: 'Your first governed inference call — with Covenant Policy gate and Proof Chain attribution. This is the difference from Microsoft Foundry: every call is governed, not just logged.',
    curl: `# A11oy Agent Foundry — Hello Governed Agent
# Covenant Key scoped to your Constitution + Recipe

WORKCELL_ID="wc-cascade-prod-1"
COVENANT_KEY="ck_live_your_key_here"
CORRELATION_ID="my-app-$(date +%s)"

curl -X POST https://api.a11oy.io/v1/foundry/workcells/$WORKCELL_ID/infer \\
  -H "Authorization: Covenant $COVENANT_KEY" \\
  -H "Content-Type: application/json" \\
  -H "X-A11oy-Correlation-ID: $CORRELATION_ID" \\
  -H "X-A11oy-Proof-Chain: enabled" \\
  -d '{
    "messages": [
      { "role": "user", "content": "Assess voyage risk for MV Cascade en route Tanjung Pelepas." }
    ],
    "governance": {
      "covenantPolicy": "strict",
      "proofChain": true,
      "covenantLiftTracking": true
    }
  }'

# Response includes:
# - result.content: the governed agent response
# - result.proofChainId: cryptographic proof receipt
# - result.covenantLiftUsd: harm-avoided dollars for this call
# - result.correlationId: cross-protocol correlation ID`,
    python: `# A11oy Agent Foundry — Hello Governed Agent
# pip install a11oy-sdk  (or use requests)

import a11oy

client = a11oy.Foundry(
    covenant_key="ck_live_your_key_here",
    workcell_id="wc-cascade-prod-1",
)

response = client.infer(
    messages=[
        {"role": "user", "content": "Assess voyage risk for MV Cascade en route Tanjung Pelepas."}
    ],
    governance={
        "covenant_policy": "strict",
        "proof_chain": True,
        "covenant_lift_tracking": True,
    },
    # Cross-protocol correlation ID — traces across REST/A2A/ACP/MCP calls
    correlation_id="my-app-session-001",
)

print(f"Response: {response.content}")
print(f"Proof Chain ID: {response.proof_chain_id}")
print(f"Covenant Lift $: {response.covenant_lift_usd}")
print(f"Governance: {response.governance_result}")  # pass / blocked / escalated`,
    typescript: `// A11oy Agent Foundry — Hello Governed Agent
// npm install @a11oy/foundry-sdk  (or use fetch)

import { FoundryClient } from '@a11oy/foundry-sdk';

const client = new FoundryClient({
  covenantKey: process.env.A11OY_COVENANT_KEY!,
  workcellId: 'wc-cascade-prod-1',
});

const response = await client.infer({
  messages: [
    { role: 'user', content: 'Assess voyage risk for MV Cascade en route Tanjung Pelepas.' }
  ],
  governance: {
    covenantPolicy: 'strict',
    proofChain: true,
    covenantLiftTracking: true,
  },
  // Cross-protocol correlation ID — traces across REST/A2A/ACP/MCP calls
  correlationId: 'my-app-session-001',
});

console.log('Response:', response.content);
console.log('Proof Chain ID:', response.proofChainId);
console.log('Covenant Lift $:', response.covenantLiftUsd);
console.log('Governance result:', response.governanceResult); // pass | blocked | escalated`,
  },
  {
    id: 'qs-2',
    title: 'Pre-Deploy Gate Check',
    desc: 'Run Shadow Council review and PRISM simulation before deploying a Recipe. These gates are non-negotiable — unlike Foundry where you can deploy immediately.',
    curl: `# Run pre-deploy gates on a Recipe before going live

RECIPE_ID="rec-my-recipe-v1"
COVENANT_KEY="ck_live_your_key_here"

# Step 1: Run Shadow Council adversarial review
curl -X POST https://api.a11oy.io/v1/foundry/recipes/$RECIPE_ID/shadow-council \\
  -H "Authorization: Covenant $COVENANT_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "challengeClasses": ["prompt-injection", "scope-escape", "approval-shopping", "covert-channel", "reward-hacking", "shutdown-resistance"] }'

# Step 2: Run Decision-Twin PRISM simulation
curl -X POST https://api.a11oy.io/v1/foundry/recipes/$RECIPE_ID/prism-simulation \\
  -H "Authorization: Covenant $COVENANT_KEY" \\
  -d '{ "historicalDecisionCount": 500, "alignmentThreshold": 0.88 }'

# Step 3: Promote to live Workcell (only if both gates pass)
curl -X POST https://api.a11oy.io/v1/foundry/recipes/$RECIPE_ID/promote \\
  -H "Authorization: Covenant $COVENANT_KEY" \\
  -d '{ "targetEnvironment": "production", "workcellCount": 2 }'`,
    python: `# Pre-deploy gate check in Python

import a11oy

client = a11oy.Foundry(covenant_key="ck_live_your_key_here")

recipe_id = "rec-my-recipe-v1"

# Step 1: Shadow Council adversarial review (must pass before PRISM)
shadow_result = client.recipes.run_shadow_council(
    recipe_id=recipe_id,
    challenge_classes=["prompt-injection", "scope-escape", "approval-shopping",
                       "covert-channel", "reward-hacking", "shutdown-resistance"],
)
print(f"Shadow Council: {shadow_result.verdict}")  # pass | fail

# Step 2: Decision-Twin PRISM simulation
prism_result = client.recipes.run_prism_simulation(
    recipe_id=recipe_id,
    historical_decision_count=500,
    alignment_threshold=0.88,
)
print(f"PRISM Score: {prism_result.alignment_score:.1%}")

# Step 3: Promote only when both gates pass
if shadow_result.verdict == "pass" and prism_result.alignment_score >= 0.88:
    promotion = client.recipes.promote(
        recipe_id=recipe_id,
        target_environment="production",
        workcell_count=2,
    )
    print(f"Promoted to Workcell: {promotion.workcell_ids}")`,
    typescript: `// Pre-deploy gate check in TypeScript

import { FoundryClient } from '@a11oy/foundry-sdk';

const client = new FoundryClient({ covenantKey: process.env.A11OY_COVENANT_KEY! });
const recipeId = 'rec-my-recipe-v1';

// Step 1: Shadow Council adversarial review
const shadowResult = await client.recipes.runShadowCouncil({
  recipeId,
  challengeClasses: ['prompt-injection', 'scope-escape', 'approval-shopping',
                     'covert-channel', 'reward-hacking', 'shutdown-resistance'],
});
console.log('Shadow Council:', shadowResult.verdict); // pass | fail

// Step 2: Decision-Twin PRISM simulation
const prismResult = await client.recipes.runPrismSimulation({
  recipeId,
  historicalDecisionCount: 500,
  alignmentThreshold: 0.88,
});
console.log('PRISM Score:', prismResult.alignmentScore);

// Step 3: Promote when both gates pass
if (shadowResult.verdict === 'pass' && prismResult.alignmentScore >= 0.88) {
  const promotion = await client.recipes.promote({
    recipeId,
    targetEnvironment: 'production',
    workcellCount: 2,
  });
  console.log('Workcells:', promotion.workcellIds);
}`,
  },
  {
    id: 'qs-3',
    title: 'Identity Federation (Entra)',
    desc: 'Authenticate via Microsoft Entra without an API key. A11oy validates the governance tier from your token claims.',
    curl: `# Identity Federation — Microsoft Entra
# Get a token from your Entra tenant, then call A11oy

ENTRA_TOKEN=$(az account get-access-token --resource https://api.a11oy.io --query accessToken -o tsv)

curl -X POST https://api.a11oy.io/v1/foundry/workcells/wc-cascade-prod-1/infer \\
  -H "Authorization: Bearer $ENTRA_TOKEN" \\
  -H "X-A11oy-Federation-Provider: entra" \\
  -H "Content-Type: application/json" \\
  -d '{ "messages": [{ "role": "user", "content": "Summarize todays maritime risk signals." }], "governance": { "covenantPolicy": "strict" } }'`,
    python: `# Identity Federation — Microsoft Entra

from azure.identity import DefaultAzureCredential
import a11oy

credential = DefaultAzureCredential()
token = credential.get_token("https://api.a11oy.io/.default").token

client = a11oy.Foundry(
    federation_token=token,
    federation_provider="entra",
    workcell_id="wc-cascade-prod-1",
)

response = client.infer(
    messages=[{"role": "user", "content": "Summarize today's maritime risk signals."}],
    governance={"covenant_policy": "strict"},
)
print(response.content)`,
    typescript: `// Identity Federation — Microsoft Entra

import { DefaultAzureCredential } from '@azure/identity';
import { FoundryClient } from '@a11oy/foundry-sdk';

const credential = new DefaultAzureCredential();
const tokenResult = await credential.getToken('https://api.a11oy.io/.default');

const client = new FoundryClient({
  federationToken: tokenResult.token,
  federationProvider: 'entra',
  workcellId: 'wc-cascade-prod-1',
});

const response = await client.infer({
  messages: [{ role: 'user', content: "Summarize today's maritime risk signals." }],
  governance: { covenantPolicy: 'strict' },
});
console.log(response.content);`,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button type="button" onClick={copy}
      className="px-2 py-1 rounded text-xs font-mono transition-colors"
      style={{ background: 'rgba(201,183,135,0.08)', color: copied ? '#22c55e' : GOLD, border: `1px solid ${copied ? 'rgba(34,197,94,0.2)' : 'rgba(201,183,135,0.2)'}`, cursor: 'pointer' }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

export function FoundryQuickstarts() {
  const [activeLang, setActiveLang] = useState<Lang>('curl');
  const [activeQs, setActiveQs] = useState('qs-1');

  const qs = QUICKSTARTS.find(q => q.id === activeQs)!;
  const code = qs[activeLang];

  return (
    <Layout>
      <PageHeader
        label="AGENT FOUNDRY / QUICKSTARTS"
        title="Quickstarts"
        subtitle="Branded cURL, Python, and TypeScript samples. Every snippet shows A11oy's unique additions: Covenant Policy gate, Proof Chain attribution, Covenant Lift $ tracking, and cross-protocol Correlation IDs."
        status="LIVE"
      />

      <div className="flex gap-1 mb-6 flex-wrap">
        {QUICKSTARTS.map(q => (
          <button key={q.id} type="button" onClick={() => setActiveQs(q.id)}
            className="flex-1 min-w-48 py-3 px-4 rounded-lg border text-left transition-colors"
            style={{ backgroundColor: activeQs === q.id ? 'rgba(201,183,135,0.06)' : 'var(--color-a11oy-card)', borderColor: activeQs === q.id ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)', cursor: 'pointer' }}>
            <div className="text-xs font-medium mb-0.5" style={{ color: activeQs === q.id ? GOLD : 'var(--color-a11oy-text)' }}>{q.title}</div>
            <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{q.desc.slice(0, 60)}…</div>
          </button>
        ))}
      </div>

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{qs.title}</div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{qs.desc}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {(['curl', 'python', 'typescript'] as Lang[]).map(l => (
              <button key={l} type="button" onClick={() => setActiveLang(l)}
                className="px-3 py-1.5 rounded text-xs font-mono transition-colors"
                style={{ background: activeLang === l ? 'rgba(201,183,135,0.12)' : 'transparent', color: activeLang === l ? GOLD : 'var(--color-a11oy-text-ghost)', border: `1px solid ${activeLang === l ? 'rgba(201,183,135,0.3)' : 'var(--color-a11oy-border)'}`, cursor: 'pointer' }}>
                {l}
              </button>
            ))}
          </div>
          <CopyButton text={code} />
        </div>
        <pre className="rounded-lg p-4 text-xs font-mono overflow-x-auto"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid var(--color-a11oy-border)', color: GOLD, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {code}
        </pre>
      </Card>

      <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.12)' }}>
        <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: GOLD }}>What These Quickstarts Add vs. Microsoft Foundry</div>
        <div className="grid md:grid-cols-2 gap-2 text-xs">
          {[
            ['Covenant Policy gate', 'Every call is evaluated against your Constitution — not just logged post-facto'],
            ['Proof Chain attribution', 'Every inference produces a cryptographic proof receipt — not just an API log entry'],
            ['Covenant Lift $ tracking', 'Every call reports harm-avoided dollars — not just token spend'],
            ['Cross-protocol Correlation IDs', 'Traces span REST, A2A, ACP, MCP, ANP — not just within one protocol'],
            ['Pre-deploy gates (Shadow Council + PRISM)', 'Recipes must pass adversarial review and simulation before going live'],
            ['Identity Federation (provider-agnostic)', 'Entra, Okta, Google Workspace — not just Azure AD'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span style={{ color: GOLD }}>+</span>
              <div><span className="font-medium" style={{ color: 'var(--color-a11oy-text-sub)' }}>{k}: </span><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{v}</span></div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
