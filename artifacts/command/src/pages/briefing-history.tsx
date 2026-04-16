import React, { useEffect, useState } from "react";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { BriefingHistory, MorningBriefingCard, DEMO_BRIEFING_HISTORY, PageDataSkeleton } from "@szl-holdings/shared-ui";

const ACCENT = "#8b7ac8";

export default function BriefingHistoryPage() {
  const [todayBriefing, setTodayBriefing] = useState<typeof DEMO_BRIEFING_HISTORY[0] | null>(null);
  const [history, setHistory] = useState<typeof DEMO_BRIEFING_HISTORY>(DEMO_BRIEFING_HISTORY);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [todayRes, historyRes] = await Promise.all([
          fetch("/api/briefing/today", { credentials: "include" }),
          fetch("/api/briefing/history?limit=14", { credentials: "include" }),
        ]);

        if (todayRes.ok) {
          const json = await todayRes.json() as { data?: typeof DEMO_BRIEFING_HISTORY[0] };
          if (json.data) setTodayBriefing(json.data);
          else setTodayBriefing(DEMO_BRIEFING_HISTORY[0]);
        } else {
          setTodayBriefing(DEMO_BRIEFING_HISTORY[0]);
        }

        if (historyRes.ok) {
          const json = await historyRes.json() as { data?: typeof DEMO_BRIEFING_HISTORY };
          if (Array.isArray(json.data) && json.data.length > 0) setHistory(json.data);
        }
      } catch {
        setTodayBriefing(DEMO_BRIEFING_HISTORY[0]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/briefing/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const json = await res.json() as { data?: typeof DEMO_BRIEFING_HISTORY[0] };
        if (json.data) {
          setTodayBriefing(json.data);
          setHistory((prev) => [json.data!, ...prev]);
        }
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-primary, #080a12)", color: "var(--color-fg-primary, rgba(255,255,255,0.9))", fontFamily: "system-ui, sans-serif" }}>
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={ACCENT} />
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${ACCENT}20`, border: `1px solid ${ACCENT}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
              ☀
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Morning Briefing</h1>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: 0, marginTop: "2px" }}>
                CORTEX-generated executive briefings · Cross-domain intelligence synthesis
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{ padding: "8px 18px", borderRadius: "8px", border: `1px solid ${ACCENT}40`, background: generating ? `${ACCENT}20` : `${ACCENT}15`, color: generating ? "rgba(255,255,255,0.4)" : ACCENT, fontSize: "12px", fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", transition: "all 0.15s" }}
            >
              {generating ? "Generating…" : "Generate Now"}
            </button>
          </div>
        </div>

        {loading ? (
          <PageDataSkeleton variant="list" showHeader rows={5} className="opacity-40" />
        ) : (
          <>
            {todayBriefing && (
              <div style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
                  Today's Briefing
                </div>
                <MorningBriefingCard briefing={todayBriefing} accentColor={ACCENT} />
              </div>
            )}

            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px" }}>
                Briefing Archive
              </div>
              <BriefingHistory briefings={history} accentColor={ACCENT} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
