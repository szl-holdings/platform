import { m } from 'framer-motion';
import {
  Anchor,
  BarChart3,
  Brain,
  Building2,
  Download,
  Globe,
  Package,
  Scale,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';

const BLUEPRINTS = [
  {
    id: 'legal-analysis',
    name: 'Legal Analysis Blueprint',
    domain: 'Legal',
    icon: Scale,
    color: '#8b5cf6',
    desc: 'Contract review, risk extraction, compliance gap analysis, regulatory monitoring',
    models: ['Claude 4 Sonnet', 'GPT-5.2'],
    prompts: 12,
    pipelines: 3,
    governance: 'strict',
    deploys: 47,
    rating: 4.8,
  },
  {
    id: 'maritime-risk',
    name: 'Maritime Risk Blueprint',
    domain: 'Maritime',
    icon: Anchor,
    color: '#06b6d4',
    desc: 'AIS analysis, route optimization, port risk scoring, sanctions screening',
    models: ['Qwen3-8B', 'Gemini 2.5 Pro'],
    prompts: 8,
    pipelines: 2,
    governance: 'strict',
    deploys: 34,
    rating: 4.6,
  },
  {
    id: 'cyber-threat',
    name: 'Cybersecurity Threat Blueprint',
    domain: 'Cyber',
    icon: Shield,
    color: '#3b82f6',
    desc: 'IOC scanning, MITRE ATT&CK mapping, incident response, threat hunting',
    models: ['Llama 4 Scout', 'Claude 4 Sonnet'],
    prompts: 15,
    pipelines: 4,
    governance: 'strict',
    deploys: 62,
    rating: 4.9,
  },
  {
    id: 'financial-model',
    name: 'Financial Modeling Blueprint',
    domain: 'Financial',
    icon: Building2,
    color: '#10b981',
    desc: 'Portfolio analysis, deal scoring, LP reporting, fund performance tracking',
    models: ['Mistral Large', 'GPT-5.2'],
    prompts: 10,
    pipelines: 3,
    governance: 'strict',
    deploys: 28,
    rating: 4.5,
  },
  {
    id: 'real-estate',
    name: 'Real Estate Intelligence Blueprint',
    domain: 'Real Estate',
    icon: Globe,
    color: '#d4a054',
    desc: 'Property valuation, market analysis, comparable scoring, due diligence',
    models: ['GPT-5.2', 'Claude 4 Sonnet'],
    prompts: 9,
    pipelines: 2,
    governance: 'moderate',
    deploys: 19,
    rating: 4.4,
  },
  {
    id: 'advisory',
    name: 'Advisory & Consulting Blueprint',
    domain: 'Advisory',
    icon: Sparkles,
    color: '#c4a265',
    desc: 'Client proposals, knowledge graphs, competitive analysis, engagement scoring',
    models: ['Claude 4 Sonnet', 'Gemini 2.5 Pro'],
    prompts: 11,
    pipelines: 2,
    governance: 'moderate',
    deploys: 15,
    rating: 4.3,
  },
  {
    id: 'executive-intel',
    name: 'Executive Intelligence Blueprint',
    domain: 'Leadership',
    icon: Brain,
    color: '#ec4899',
    desc: 'Cross-domain briefings, decision support, scenario modeling, risk aggregation',
    models: ['Claude 4 Sonnet', 'GPT-5.2', 'Gemini 2.5 Pro'],
    prompts: 14,
    pipelines: 5,
    governance: 'strict',
    deploys: 23,
    rating: 4.7,
  },
  {
    id: 'ops-automation',
    name: 'Operations Automation Blueprint',
    domain: 'Operations',
    icon: BarChart3,
    color: '#f59e0b',
    desc: 'Process mining, anomaly detection, capacity planning, SLA monitoring',
    models: ['Qwen3-8B', 'Phi-4 Mini'],
    prompts: 7,
    pipelines: 2,
    governance: 'moderate',
    deploys: 38,
    rating: 4.5,
  },
  {
    id: 'research',
    name: 'Research & Analysis Blueprint',
    domain: 'Research',
    icon: Brain,
    color: '#a855f7',
    desc: 'Literature review, hypothesis generation, data synthesis, trend forecasting',
    models: ['Gemini 2.5 Pro', 'DeepSeek V3'],
    prompts: 13,
    pipelines: 3,
    governance: 'relaxed',
    deploys: 41,
    rating: 4.6,
  },
];

export default function BlueprintMarketplacePage() {
  const [selectedBlueprint, setSelectedBlueprint] = useState<(typeof BLUEPRINTS)[0] | null>(null);

  return (
    <div className="min-h-screen" style={{ background: '#070a10' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(168,85,247,0.12)',
              border: '1px solid rgba(168,85,247,0.2)',
            }}
          >
            <Package className="w-4 h-4" style={{ color: '#a855f7' }} />
          </div>
          <div>
            <h1
              className="text-xl font-bold tracking-tight"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Domain Blueprint Marketplace
            </h1>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {BLUEPRINTS.length} blueprints · Pre-built intelligence packages
            </p>
          </div>
        </m.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BLUEPRINTS.map((bp, i) => (
            <m.div
              key={bp.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedBlueprint(selectedBlueprint?.id === bp.id ? null : bp)}
              className="rounded-lg p-5 cursor-pointer group"
              style={{
                background:
                  selectedBlueprint?.id === bp.id ? `${bp.color}06` : 'rgba(255,255,255,0.015)',
                border: `1px solid ${selectedBlueprint?.id === bp.id ? `${bp.color}20` : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${bp.color}12`, border: `1px solid ${bp.color}20` }}
                >
                  <bp.icon className="w-5 h-5" style={{ color: bp.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-[12px] font-semibold truncate"
                    style={{ color: 'rgba(255,255,255,0.8)' }}
                  >
                    {bp.name}
                  </h3>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: `${bp.color}10`, color: bp.color }}
                  >
                    {bp.domain}
                  </span>
                </div>
              </div>
              <p
                className="text-[10px] mb-4 leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {bp.desc}
              </p>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: 'Models', value: bp.models.length },
                  { label: 'Prompts', value: bp.prompts },
                  { label: 'Pipelines', value: bp.pipelines },
                  { label: 'Deploys', value: bp.deploys },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-[12px] font-bold tabular-nums" style={{ color: bp.color }}>
                      {s.value}
                    </div>
                    <div className="text-[8px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="flex items-center justify-between pt-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div
                      key={j}
                      className="w-2.5 h-2.5"
                      style={{
                        color: j < Math.round(bp.rating) ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      ★
                    </div>
                  ))}
                  <span
                    className="text-[9px] ml-1 tabular-nums"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    {bp.rating}
                  </span>
                </div>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                  style={{ background: `rgba(16,185,129,0.1)`, color: '#10b981' }}
                >
                  {bp.governance}
                </span>
              </div>

              {selectedBlueprint?.id === bp.id && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div
                    className="text-[10px] font-medium mb-2"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    Included Models
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {bp.models.map((m) => (
                      <span
                        key={m}
                        className="text-[9px] px-2 py-1 rounded-full"
                        style={{
                          background: `${bp.color}10`,
                          color: bp.color,
                          border: `1px solid ${bp.color}20`,
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <button
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium"
                    style={{
                      background: `${bp.color}15`,
                      color: bp.color,
                      border: `1px solid ${bp.color}25`,
                    }}
                  >
                    <Download className="w-3.5 h-3.5" /> Deploy Blueprint
                  </button>
                </m.div>
              )}
            </m.div>
          ))}
        </div>
      </div>
    </div>
  );
}
