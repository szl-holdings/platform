import { writeFileSync, mkdirSync } from 'fs';

const baseUrl = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

if (!baseUrl || !apiKey) {
  console.error('Missing AI_INTEGRATIONS env vars');
  process.exit(1);
}

const outDir = 'artifacts/szl-demo-video/public';

const lines = [
  { id: 'scene1', text: 'Every consequential AI action should carry a receipt. This is a-eleven-oy. Governed orchestration for consequence-bearing AI.' },
  { id: 'scene2', text: 'One backbone. Seven surfaces. Every domain, from defense to maritime to legal, speaks the same language of trust.' },
  { id: 'scene3', text: 'From raw signal to auditable proof. In milliseconds. Signal. Decision. Approval. Execute. Audit. Nothing happens without a receipt.' },
  { id: 'scene4', text: 'Fifty-nine SDK primitives. One hundred thirty-three API endpoints. Seven fabric layers. Every metric is verifiable. Built for proof. Not just demos.' },
  { id: 'scene5', text: 'Governance is structural. Not optional. Proof chain. Constitutional enforcement. Agent welfare. Trust is architected in, not bolted on.' },
  { id: 'scene6', text: 'Seven verticals. One orchestration layer. Defense. Maritime. Real estate. Legal. Advisory. Intelligence. Decision.' },
  { id: 'scene7', text: 'The orchestration layer is taking shape. Signal Mesh. Causal Core. Context Engine. Workcell Engine. Proof Chain. Covenant Layer. Replay.' },
  { id: 'scene8', text: 'S-Z-L Holdings. a-eleven-oy. Governed Operational Intelligence. The era of AI without receipts, is ending.' },
];

async function generateAudio(line) {
  console.log(`Generating ${line.id}...`);
  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-audio',
      modalities: ['text', 'audio'],
      audio: { voice: 'alloy', format: 'mp3' },
      messages: [
        { role: 'system', content: 'You are a professional narrator for a Series A technology demo video. Speak in a calm, authoritative, measured tone — like a premium brand announcement from Apple or Anthropic. Read the text exactly as written. Do not add, omit, or rephrase any words. Pace: deliberate, confident, with natural pauses at periods.' },
        { role: 'user', content: `Read this narration exactly: "${line.text}"` },
      ],
    }),
  });

  const data = await resp.json();
  if (data.error) {
    console.error(`Error for ${line.id}:`, data.error.message || JSON.stringify(data.error));
    return false;
  }

  const audioData = data.choices?.[0]?.message?.audio?.data;
  if (!audioData) {
    console.error(`No audio data for ${line.id}`);
    return false;
  }

  const buffer = Buffer.from(audioData, 'base64');
  writeFileSync(`${outDir}/audio-${line.id}.mp3`, buffer);
  console.log(`  Saved audio-${line.id}.mp3 (${buffer.length} bytes)`);
  return true;
}

for (const line of lines) {
  const ok = await generateAudio(line);
  if (!ok) {
    console.log(`  Skipping ${line.id}, continuing...`);
  }
}

console.log('\nDone!');
