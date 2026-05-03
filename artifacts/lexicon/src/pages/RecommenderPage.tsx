import { useState } from 'react';
import { Link } from 'wouter';
import {
  HelpCircle,
  ChevronRight,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  Check,
  Scale,
  Settings,
} from 'lucide-react';
import { LICENSES, getLicenseById, CATEGORY_LABELS, CATEGORY_COLORS } from '@/data/licenses';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/lexicon';

type Answer = string;

interface Question {
  id: string;
  text: string;
  options: { value: string; label: string; description?: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: 'contentType',
    text: 'What kind of work are you licensing?',
    options: [
      {
        value: 'code',
        label: 'Code / Software',
        description: 'Libraries, applications, tools, scripts',
      },
      {
        value: 'model',
        label: 'AI / ML Model',
        description: 'Model weights, fine-tunes, adapters',
      },
      { value: 'dataset', label: 'Dataset', description: 'Training data, corpora, databases' },
      {
        value: 'creative',
        label: 'Creative Work',
        description: 'Text, images, audio, video, documentation',
      },
    ],
  },
  {
    id: 'commercial',
    text: 'Do you want to permit commercial use?',
    options: [
      {
        value: 'yes',
        label: 'Yes, commercial use is fine',
        description: 'Anyone can use it for profit',
      },
      {
        value: 'no',
        label: 'No, non-commercial only',
        description: 'Restricted to research, personal, or educational use',
      },
      {
        value: 'limited',
        label: 'Limited (some restrictions)',
        description: 'Commercial use allowed under specific thresholds or conditions',
      },
    ],
  },
  {
    id: 'derivatives',
    text: 'How should derivative works be handled?',
    options: [
      {
        value: 'yes',
        label: 'Freely modified',
        description: 'Forks, fine-tunes, and adaptations can use any license',
      },
      {
        value: 'sameLicense',
        label: 'Copyleft (Same License)',
        description: 'Derivative works must be released under the identical license',
      },
      {
        value: 'no',
        label: 'No derivatives allowed',
        description: 'Others can use the original but cannot share modified versions',
      },
    ],
  },
  {
    id: 'attribution',
    text: 'Do you require attribution?',
    options: [
      {
        value: 'yes',
        label: 'Yes, credit required',
        description: 'Users must acknowledge the original creator',
      },
      {
        value: 'no',
        label: 'No attribution needed',
        description: 'Maximum freedom, akin to public domain',
      },
    ],
  },
  {
    id: 'responsibleAI',
    text: 'For AI models: require responsible use?',
    options: [
      {
        value: 'yes',
        label: 'Yes, ethical use clauses',
        description: 'Explicitly prohibit harmful uses (e.g., OpenRAIL)',
      },
      {
        value: 'no',
        label: 'No additional restrictions',
        description: 'Keep the license fundamentally permissive',
      },
      { value: 'na', label: 'Not applicable', description: 'I am not licensing an AI model' },
    ],
  },
  {
    id: 'saas',
    text: 'Should cloud/SaaS usage require source disclosure?',
    options: [
      {
        value: 'yes',
        label: 'Yes (AGPL-style)',
        description: 'Running as a service over a network counts as distribution',
      },
      {
        value: 'no',
        label: 'No',
        description: 'Cloud usage does not trigger source sharing requirements',
      },
      { value: 'na', label: 'Not relevant', description: 'Skip this concern' },
    ],
  },
  {
    id: 'patent',
    text: 'Do you want explicit patent protection?',
    options: [
      {
        value: 'yes',
        label: 'Yes, include a patent grant',
        description: 'Contributors explicitly grant patent rights to users',
      },
      {
        value: 'no',
        label: 'No preference',
        description: 'Rely on implicit grants or basic copyright rules',
      },
    ],
  },
];

interface Recommendation {
  id: string;
  score: number;
  reasons: string[];
}

function scoreRecommendations(answers: Record<string, Answer>): Recommendation[] {
  const scores: Record<string, { score: number; reasons: string[] }> = {};

  function add(id: string, points: number, reason: string) {
    if (!scores[id]) scores[id] = { score: 0, reasons: [] };
    scores[id].score += points;
    if (points > 0 && reason) scores[id].reasons.push(reason);
  }

  const { contentType, commercial, derivatives, attribution, responsibleAI, saas, patent } =
    answers;

  // Domain logic - identical to original but preserved
  if (contentType === 'code') {
    add('mit', 3, 'Simple, widely adopted for code');
    add('apache-2.0', 3, 'Enterprise-friendly for code');
    add('bsd-3-clause', 2, 'Academic/library code');
    add('gpl-3.0', 1, 'Strong copyleft for code');
    add('mpl-2.0', 2, 'File-level copyleft for code');
    add('agpl-3.0', 1, 'Network-copyleft for code');
  } else if (contentType === 'model') {
    add('apache-2.0', 3, 'Standard permissive for ML models');
    add('openrail', 3, 'Purpose-built for AI models');
    add('openrail++', 2, 'Copyleft AI model license');
    add('bigcode-openrail-m', 2, 'Code generation models');
    add('creativeml-openrail-m', 2, 'Image generation models');
    add('llama3', 1, 'Commercial model license (Meta)');
    add('gemma', 1, 'Commercial model license (Google)');
  } else if (contentType === 'dataset') {
    add('cc0-1.0', 4, 'Best for datasets with no restrictions');
    add('pddl', 3, 'Public domain for databases');
    add('cdla-permissive-2.0', 3, 'ML-dataset specific permissive');
    add('cc-by-4.0', 2, 'Attribution required for datasets');
    add('odc-by', 2, 'Open database attribution');
  } else if (contentType === 'creative') {
    add('cc-by-4.0', 4, 'Standard for creative works');
    add('cc0-1.0', 3, 'Public domain for creative works');
    add('cc-by-sa-4.0', 3, 'Share-alike for creative works');
    add('cc-by-nc-4.0', 2, 'Non-commercial creative works');
  }

  // Commercial use
  if (commercial === 'yes') {
    add('mit', 2, 'Allows commercial use');
    add('apache-2.0', 2, 'Allows commercial use');
    add('bsd-3-clause', 2, 'Allows commercial use');
    add('cc-by-4.0', 2, 'Allows commercial use');
    add('openrail', 2, 'Allows commercial use');
    add('apache-2.0', 1, 'Preferred for commercial projects');
    add('cc-by-nc-4.0', -5, 'Restricts commercial use');
    add('cc-by-nc-sa-4.0', -5, 'Restricts commercial use');
    add('deepfloyd-if-license', -5, 'Research-only, not commercial');
    add('mistral-research', -5, 'Research-only');
  } else if (commercial === 'no') {
    add('cc-by-nc-4.0', 4, 'Non-commercial restriction matches your intent');
    add('cc-by-nc-sa-4.0', 3, 'Non-commercial + share-alike');
    add('deepfloyd-if-license', 2, 'Research-only model license');
    add('mit', -2, 'Allows commercial use (not what you want)');
    add('apache-2.0', -2, 'Allows commercial use (not what you want)');
  }

  // Derivatives
  if (derivatives === 'yes') {
    add('mit', 2, 'Allows derivatives freely');
    add('apache-2.0', 2, 'Allows derivatives freely');
    add('cc-by-4.0', 2, 'Allows derivatives');
    add('cc0-1.0', 2, 'Allows derivatives');
    add('cc-by-nd-4.0', -10, 'Prohibits derivatives');
    add('cc-by-nc-nd-4.0', -10, 'Prohibits derivatives');
  } else if (derivatives === 'sameLicense') {
    add('gpl-3.0', 4, 'Strong copyleft requires same license');
    add('gpl-2.0', 3, 'Classic copyleft');
    add('agpl-3.0', 3, 'Copyleft for network use');
    add('cc-by-sa-4.0', 3, 'Share-alike for creative works');
    add('openrail++', 3, 'Copyleft-style AI license');
    add('mit', -3, 'Does not require same license');
    add('apache-2.0', -3, 'Does not require same license');
  } else if (derivatives === 'no') {
    add('cc-by-nd-4.0', 4, 'Prohibits derivatives');
    add('cc-by-nc-nd-4.0', 4, 'Prohibits derivatives');
    add('mit', -4, 'Allows derivatives');
  }

  // Attribution
  if (attribution === 'yes') {
    add('apache-2.0', 1, 'Requires attribution');
    add('cc-by-4.0', 2, 'Requires attribution');
    add('cc-by-sa-4.0', 1, 'Requires attribution');
  } else if (attribution === 'no') {
    add('cc0-1.0', 3, 'No attribution required');
    add('unlicense', 3, 'No attribution required');
    add('mit', 1, 'Minimal attribution (notice in source only)');
    add('cc-by-4.0', -1, 'Requires attribution');
  }

  // Responsible AI
  if (responsibleAI === 'yes') {
    add('openrail', 4, 'Built-in responsible-AI use restrictions');
    add('openrail++', 4, 'Responsible-AI with copyleft');
    add('creativeml-openrail-m', 3, 'Responsible-AI for image models');
    add('bigcode-openrail-m', 3, 'Responsible-AI for code models');
    add('bigscience-openrail-m', 3, 'Responsible-AI for LLMs');
  } else if (responsibleAI === 'no') {
    add('apache-2.0', 2, 'No additional restrictions');
    add('mit', 2, 'No additional restrictions');
    add('openrail', -3, "Includes use restrictions you don't want");
  }

  // Network/SaaS
  if (saas === 'yes') {
    add('agpl-3.0', 5, 'Network use triggers copyleft');
    add('openrail', 1, 'Some network use provisions');
  } else if (saas === 'no') {
    add('mit', 1, 'No network copyleft');
    add('apache-2.0', 1, 'No network copyleft');
    add('mpl-2.0', 1, 'No network copyleft');
    add('agpl-3.0', -3, "Includes network copyleft you don't want");
  }

  // Patent
  if (patent === 'yes') {
    add('apache-2.0', 3, 'Includes explicit patent grant');
    add('gpl-3.0', 2, 'Includes patent protection');
    add('lgpl-3.0', 2, 'Includes patent protection');
    add('mpl-2.0', 2, 'Includes patent grant');
    add('epl-2.0', 2, 'Includes patent grant');
  }

  return Object.entries(scores)
    .filter(([, { score }]) => score > 0)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 4)
    .map(([id, { score, reasons }]) => ({ id, score, reasons }));
}

export default function RecommenderPage() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const currentQuestion = QUESTIONS[step];
  const progress = step / QUESTIONS.length;

  function answer(value: string) {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  }

  function reset() {
    setAnswers({});
    setStep(0);
    setDone(false);
  }

  function goBack() {
    if (step > 0) setStep(step - 1);
  }

  const recommendations = done ? scoreRecommendations(answers) : [];

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8 md:py-12 animate-fade-in">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-lexicon-blue/10 border border-lexicon-blue/20 text-lexicon-blue mb-6 shadow-sm">
          <Settings size={32} />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-lexicon-text mb-4">
          License Recommender
        </h1>
        <p className="text-lexicon-text-muted text-lg max-w-xl mx-auto">
          Answer a few questions to get a ranked shortlist of licenses tailored to your project's
          goals and constraints.
        </p>
      </div>

      {!done ? (
        <div className="bg-lexicon-surface-raised border border-lexicon-border rounded-2xl p-6 md:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-lexicon-surface">
            <div
              className="h-full bg-lexicon-blue transition-all duration-500 ease-out"
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>

          {/* Progress */}
          <div className="mb-8 mt-2 flex justify-between items-center text-sm font-semibold text-lexicon-text-muted tracking-wider uppercase">
            <span>
              Question {step + 1} of {QUESTIONS.length}
            </span>
            <span className="text-lexicon-blue">{Math.round(progress * 100)}%</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-lexicon-text mb-8 leading-tight">
            {currentQuestion.text}
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = answers[currentQuestion.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => answer(opt.value)}
                  className={`relative p-5 md:p-6 text-left rounded-xl border-2 transition-all duration-200 animate-slide-in stagger-${(idx % 5) + 1}
                    ${
                      isSelected
                        ? 'bg-lexicon-blue/10 border-lexicon-blue shadow-[0_0_20px_rgba(79,142,247,0.15)] z-10'
                        : 'bg-lexicon-surface border-lexicon-border hover:border-lexicon-blue/40 hover:bg-lexicon-surface-raised z-0'
                    }`}
                  data-testid={`option-${opt.value}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div
                        className={`font-bold text-lg mb-1 transition-colors ${isSelected ? 'text-lexicon-blue' : 'text-lexicon-text'}`}
                      >
                        {opt.label}
                      </div>
                      {opt.description && (
                        <div className="text-sm text-lexicon-text-muted leading-relaxed">
                          {opt.description}
                        </div>
                      )}
                    </div>
                    <div
                      className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors
                      ${isSelected ? 'border-lexicon-blue bg-lexicon-blue' : 'border-lexicon-border'}`}
                    >
                      {isSelected && (
                        <Check size={14} strokeWidth={3} className="text-lexicon-surface" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {step > 0 && (
            <button
              onClick={goBack}
              className="mt-8 px-4 py-2 text-lexicon-text-muted hover:text-lexicon-text font-medium text-sm rounded-lg hover:bg-lexicon-surface transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-lexicon-border"
              data-testid="button-back"
            >
              <ArrowLeft size={16} /> Previous Question
            </button>
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-lexicon-green/20 p-2 rounded-full border border-lexicon-green/30">
                <CheckCircle2 size={24} className="text-lexicon-green" />
              </div>
              <h2 className="text-2xl font-bold text-lexicon-text">Your Recommendations</h2>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 bg-lexicon-surface-raised border border-lexicon-border hover:border-lexicon-text-muted rounded-lg text-lexicon-text font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-lexicon-border"
              data-testid="button-start-over"
            >
              <RotateCcw size={16} /> Start Over
            </button>
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-20 px-6 bg-lexicon-surface-raised border border-lexicon-border border-dashed rounded-2xl">
              <div className="w-16 h-16 bg-lexicon-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-lexicon-border">
                <Scale size={28} className="text-lexicon-text-muted" />
              </div>
              <h3 className="text-xl font-bold text-lexicon-text mb-2">No definitive match</h3>
              <p className="text-lexicon-text-muted mb-6">
                Your unique combination of requirements doesn't strongly map to standard licenses.
              </p>
              <p className="text-sm font-medium text-lexicon-amber bg-lexicon-amber/10 px-4 py-3 rounded-lg inline-block border border-lexicon-amber/20">
                Consider consulting a legal professional to draft a custom license.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {recommendations.map((rec, i) => {
                const license = getLicenseById(rec.id);
                if (!license) return null;
                const isTop = i === 0;

                return (
                  <div
                    key={rec.id}
                    className={`relative bg-lexicon-surface-raised border-2 rounded-2xl p-6 md:p-8 animate-slide-in stagger-${i + 1} transition-all
                    ${isTop ? 'border-lexicon-blue shadow-[0_10px_40px_rgba(79,142,247,0.15)]' : 'border-lexicon-border hover:border-lexicon-border-hover'}`}
                  >
                    {isTop && (
                      <div className="absolute -top-3.5 left-8 bg-lexicon-blue text-lexicon-surface text-[11px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                        Best Match
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-6 mt-2">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-xl md:text-2xl font-mono font-extrabold text-lexicon-blue bg-lexicon-blue/10 px-2 py-0.5 rounded border border-lexicon-blue/20">
                            {license.id}
                          </code>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${CATEGORY_COLORS[license.category]}`}
                          >
                            {CATEGORY_LABELS[license.category]}
                          </span>
                        </div>
                        <div className="text-base font-medium text-lexicon-text">
                          {license.name}
                        </div>
                      </div>

                      <Link href={`${BASE}/license/${license.id}`}>
                        <span
                          className={`shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer
                          ${isTop ? 'bg-lexicon-blue text-lexicon-surface hover:bg-lexicon-blue-dim' : 'bg-lexicon-surface border border-lexicon-border text-lexicon-text hover:border-lexicon-blue/50'}`}
                        >
                          View Details <ChevronRight size={16} />
                        </span>
                      </Link>
                    </div>

                    <p className="text-lexicon-text-muted leading-relaxed mb-6">{license.tldr}</p>

                    <div className="bg-lexicon-surface rounded-xl p-4 md:p-5 border border-lexicon-border">
                      <h4 className="text-xs font-bold text-lexicon-text uppercase tracking-wider mb-3">
                        Why this matches:
                      </h4>
                      <ul className="space-y-2">
                        {rec.reasons.map((r, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-sm text-lexicon-text-muted"
                          >
                            <span className="text-lexicon-green mt-0.5">✓</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 p-4 bg-lexicon-amber/5 border border-lexicon-amber/20 rounded-xl text-center">
            <p className="text-xs font-medium text-lexicon-amber/90 tracking-wide uppercase">
              Disclaimer: These are algorithmic suggestions, not legal advice. Consult an attorney
              before adoption.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
