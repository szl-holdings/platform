import { useState, useEffect, useCallback } from "react";
import S01Cover from "./pages/slides/S01Cover";
import S02SeriesProblem from "./pages/slides/S02SeriesProblem";
import S03Category from "./pages/slides/S03Category";
import S04Product from "./pages/slides/S04Product";
import S05Demo from "./pages/slides/S05Demo";
import S06Market from "./pages/slides/S06Market";
import S07SeriesDomains from "./pages/slides/S07SeriesDomains";
import S08BusinessModel from "./pages/slides/S08BusinessModel";
import S09Ask from "./pages/slides/S09Ask";

const SLIDES = [S01Cover, S02SeriesProblem, S03Category, S04Product, S05Demo, S06Market, S07SeriesDomains, S08BusinessModel, S09Ask];
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
          bottom: "2.5vh",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "0.5vw",
          zIndex: 100,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i + 1)}
            style={{
              width: i + 1 === current ? "2.2vw" : "0.55vw",
              height: "0.35vh",
              minHeight: "3px",
              borderRadius: "2px",
              background: i + 1 === current ? "#0cc8d9" : "rgba(255,255,255,0.18)",
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
          bottom: "2.5vh",
          right: "2.5vw",
          fontFamily: "Inter, sans-serif",
          fontSize: "clamp(9px, 1vw, 13px)",
          color: "rgba(255,255,255,0.18)",
          zIndex: 100,
        }}
      >
        {current} / {TOTAL}
      </div>
    </div>
  );
}
