import { useEffect } from "react";
import S01Cover from "./S01Cover";
import S02SeriesProblem from "./S02SeriesProblem";
import S03Category from "./S03Category";
import S04Product from "./S04Product";
import S05Demo from "./S05Demo";
import S06Market from "./S06Market";
import S07SeriesDomains from "./S07SeriesDomains";
import S08BusinessModel from "./S08BusinessModel";
import S09Ask from "./S09Ask";

const SLIDES = [
  S01Cover,
  S02SeriesProblem,
  S03Category,
  S04Product,
  S05Demo,
  S06Market,
  S07SeriesDomains,
  S08BusinessModel,
  S09Ask,
];

function buildFilename(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `SZL-Holdings-Investor-Deck-${y}-${m}-${day}`;
}

const PRINT_CSS = `
  @page { size: 1920px 1080px; margin: 0; }
  html, body, #root { margin: 0 !important; padding: 0 !important; background: #000 !important; }
  body { width: 1920px; }
  .deck-print-page {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    position: relative;
    page-break-after: always;
    break-after: page;
    background: #000;
  }
  .deck-print-page:last-child { page-break-after: auto; break-after: auto; }
  .deck-print-toolbar { position: fixed; top: 16px; right: 16px; z-index: 9999; display: flex; gap: 8px; }
  @media print {
    .deck-print-toolbar { display: none !important; }
  }
`;

export default function AllSlides() {
  useEffect(() => {
    const filename = buildFilename();
    const previousTitle = document.title;
    document.title = filename;

    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-deck-print", "1");
    styleEl.textContent = PRINT_CSS;
    document.head.appendChild(styleEl);

    const params = new URLSearchParams(window.location.search);
    const auto = params.get("print") === "1";
    let timer: number | undefined;
    if (auto) {
      timer = window.setTimeout(() => {
        window.print();
      }, 800);
    }
    return () => {
      document.title = previousTitle;
      styleEl.remove();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ background: "#000", width: "1920px" }}>
      <div className="deck-print-toolbar">
        <button
          type="button"
          onClick={handlePrint}
          style={{
            background: "#0cc8d9",
            color: "#0a0f1c",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          Save as PDF
        </button>
        <a
          href="../1"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6,
            padding: "10px 16px",
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          ← Back to deck
        </a>
      </div>
      {SLIDES.map((Slide, i) => (
        <div key={i} className="deck-print-page">
          <Slide />
        </div>
      ))}
    </div>
  );
}
