import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type HFModel, type ArxivPaper } from "../lib/api";
import { cn, formatNumber, timeAgo } from "../lib/utils";
import { Search, ExternalLink, Download, Heart, Tag, Calendar, ChevronRight, Loader2, AlertCircle, BookOpen, TrendingUp } from "lucide-react";

const HF_TASKS = [
  "text-generation", "text2text-generation", "question-answering", "summarization",
  "translation", "fill-mask", "text-classification", "token-classification",
  "image-classification", "image-to-text", "automatic-speech-recognition"
];

const ARXIV_QUERIES = [
  "large language model", "mixture of experts", "chain of thought reasoning",
  "RAG retrieval augmented generation", "quantization LLM", "instruction tuning",
  "RLHF reinforcement learning human feedback", "multimodal foundation model"
];

export function ModelIntelligence() {
  const [hfTask, setHfTask] = useState("text-generation");
  const [arxivQuery, setArxivQuery] = useState("large language model");
  const [arxivInput, setArxivInput] = useState("");
  const [tab, setTab] = useState<"models" | "papers">("models");

  const hfQuery = useQuery({
    queryKey: ["hf-models", hfTask],
    queryFn: () => api.getHFModels(hfTask, 12),
    staleTime: 300000,
  });

  const arxivQueryResult = useQuery({
    queryKey: ["arxiv-papers", arxivQuery],
    queryFn: () => api.getArxivPapers(arxivQuery, 10),
    staleTime: 300000,
  });

  function handleArxivSearch(e: React.FormEvent) {
    e.preventDefault();
    if (arxivInput.trim()) {
      setArxivQuery(arxivInput.trim());
    }
  }

  const models: HFModel[] = hfQuery.data?.data?.models ?? [];
  const papers: ArxivPaper[] = arxivQueryResult.data?.data?.papers ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Model Intelligence</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Live intelligence feed from HuggingFace and arXiv. Scout models, track research, benchmark candidates.
        </p>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg w-fit">
        <button
          onClick={() => setTab("models")}
          className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "models" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          HuggingFace Models
        </button>
        <button
          onClick={() => setTab("papers")}
          className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "papers" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          arXiv Papers
        </button>
      </div>

      {tab === "models" && (
        <div>
          {/* Task filter */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {HF_TASKS.slice(0, 8).map((task) => (
              <button
                key={task}
                onClick={() => setHfTask(task)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  hfTask === task
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                {task}
              </button>
            ))}
          </div>

          {hfQuery.isLoading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Scouting HuggingFace...</span>
            </div>
          )}

          {hfQuery.isError && (
            <div className="inca-panel p-6 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">Could not reach HuggingFace API. Showing cached data.</div>
            </div>
          )}

          {!hfQuery.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {models.map((model: HFModel, idx: number) => (
                <div key={model.id || idx} className={cn("model-card p-4 animate-fade-in-up", `stagger-${Math.min(idx + 1, 6)}`)}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="text-sm font-mono text-foreground truncate">{model.id}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{model.task || hfTask}</div>
                    </div>
                    <a
                      href={`https://huggingface.co/${model.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Download className="w-3 h-3" />
                      {formatNumber(model.downloads ?? 0)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Heart className="w-3 h-3" />
                      {formatNumber(model.likes ?? 0)}
                    </div>
                    {model.license && (
                      <span className="badge-staged px-1.5 py-0.5 rounded text-xs">{model.license}</span>
                    )}
                  </div>

                  {model.tags && model.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(model.tags as string[]).slice(0, 3).map((tag: string) => (
                        <span key={tag} className="flex items-center gap-0.5 text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                          <Tag className="w-2.5 h-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {model.lastModified ? timeAgo(model.lastModified) : "unknown"}
                    </div>
                    {model.modelSize && (
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(model.modelSize / 1e6, 0)}M params
                      </div>
                    )}
                  </div>

                  {/* Quantization badges */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {["4-bit", "8-bit", "FP16"].map((q) => (
                      <span key={q} className="badge-idle px-1.5 py-0.5 rounded text-xs">{q}</span>
                    ))}
                  </div>
                </div>
              ))}

              {models.length === 0 && !hfQuery.isLoading && (
                <div className="col-span-3 inca-panel p-8 text-center">
                  <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">No models found for this task filter.</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "papers" && (
        <div>
          {/* Search bar */}
          <form onSubmit={handleArxivSearch} className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={arxivInput}
                onChange={(e) => setArxivInput(e.target.value)}
                placeholder="Search arXiv papers..."
                className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-primary/15 border border-primary/25 text-primary rounded-lg text-sm font-medium hover:bg-primary/25 transition-colors">
              Search
            </button>
          </form>

          {/* Quick topics */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {ARXIV_QUERIES.slice(0, 6).map((q) => (
              <button
                key={q}
                onClick={() => { setArxivQuery(q); setArxivInput(q); }}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  arxivQuery === q
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                {q}
              </button>
            ))}
          </div>

          {arxivQueryResult.isLoading && (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Fetching from arXiv...</span>
            </div>
          )}

          <div className="space-y-3">
            {papers.map((paper: ArxivPaper, idx: number) => (
              <div key={paper.id || idx} className={cn("model-card p-4 animate-fade-in-up", `stagger-${Math.min(idx + 1, 6)}`)}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-primary/8 border border-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium text-foreground leading-snug">{paper.title}</div>
                      {paper.pdfUrl && (
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}
                    </div>
                    {paper.abstract && (
                      <div className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{paper.abstract}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {paper.published && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />{paper.published}
                        </span>
                      )}
                      {paper.categories.map((cat: string) => (
                        <span key={cat} className="badge-staged px-1.5 py-0 rounded text-xs">{cat}</span>
                      ))}
                      {paper.source === "live" && (
                        <span className="badge-running px-1.5 py-0 rounded text-xs">live</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {papers.length === 0 && !arxivQueryResult.isLoading && (
              <div className="inca-panel p-8 text-center">
                <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">No papers found for this query.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
