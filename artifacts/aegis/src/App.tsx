import { useState, useEffect, useCallback } from "react";
import S01 from "./pages/slides/S01Title";
import S02 from "./pages/slides/S02Problem";
import S03 from "./pages/slides/S03Thesis";
import S04 from "./pages/slides/S04Loop";
import S05 from "./pages/slides/S05Architecture";
import S06 from "./pages/slides/S06Primitives";
import S07 from "./pages/slides/S07Domains";
import S08 from "./pages/slides/S08DividerMoat";
import S09 from "./pages/slides/S09Competitive";
import S10 from "./pages/slides/S10Evidence";
import S11 from "./pages/slides/S11Market";
import S12 from "./pages/slides/S12GoToMarket";
import S13 from "./pages/slides/S13DividerVerdict";
import S14 from "./pages/slides/S14Commercial";
import S15 from "./pages/slides/S15Closing";

const SLIDES = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15];
const TOTAL = SLIDES.length;

function getInitialSlide(): number {
  const match = window.location.pathname.match(/slide(\d+)/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= TOTAL) return n;
  }
  return 1;
}

export default function App() {
  const [current, setCurrent] = useState(getInitialSlide);
  const Slide = SLIDES[current - 1];

  const goTo = useCallback((n: number) => {
    const clamped = Math.min(Math.max(n, 1), TOTAL);
    setCurrent(clamped);
    history.replaceState(null, "", `${import.meta.env.BASE_URL}slide${clamped}`);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        setCurrent((c) => {
          const next = Math.min(c + 1, TOTAL);
          history.replaceState(null, "", `${import.meta.env.BASE_URL}slide${next}`);
          return next;
        });
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setCurrent((c) => {
          const prev = Math.max(c - 1, 1);
          history.replaceState(null, "", `${import.meta.env.BASE_URL}slide${prev}`);
          return prev;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}
      onClick={() => goTo(current + 1)}
    >
      <Slide />
      <div
        style={{
          position: "fixed",
          bottom: "2vh",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "0.6vw",
          zIndex: 100,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i + 1)}
            style={{
              width: i + 1 === current ? "2vw" : "0.6vw",
              height: "0.4vh",
              minHeight: "3px",
              borderRadius: "2px",
              background: i + 1 === current ? "#0cc8d9" : "rgba(255,255,255,0.2)",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "fixed",
          bottom: "2vh",
          right: "2vw",
          fontFamily: "Inter, sans-serif",
          fontSize: "clamp(10px, 1.1vw, 14px)",
          color: "rgba(255,255,255,0.2)",
          zIndex: 100,
        }}
      >
        {current} / {TOTAL}
      </div>
    </div>
  );
}
