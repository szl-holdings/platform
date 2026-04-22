import { useState, useEffect, useCallback } from "react";

const base = import.meta.env.BASE_URL;

const SLIDES = [
  { id: "slide-01-cover", label: "Cover" },
  { id: "slide-02-thesis", label: "The Thesis" },
  { id: "slide-03-szl-dashboard", label: "SZL Holdings" },
  { id: "slide-04-lyte", label: "KORA" },
  { id: "slide-05-vessels", label: "SEXTANT" },
  { id: "slide-06-terra", label: "DOMAINE" },
  { id: "slide-07-aegis", label: "PARAGON" },
  { id: "slide-08-prism-imperium", label: "PRISM & IMPERIUM" },
  { id: "slide-09-carlota-stephen", label: "Carlota Jo & Founder" },
  { id: "slide-10-thesis", label: "Investment Thesis" },
];

export default function CarouselPreview() {
  const [current, setCurrent] = useState(0);
  const [_preloaded, setPreloaded] = useState(false);
  const goNext = useCallback(() => {
    setCurrent((c) => Math.min(c + 1, SLIDES.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Home") {
        e.preventDefault();
        setCurrent(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setCurrent(SLIDES.length - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  useEffect(() => {
    const imgs = SLIDES.map((s) => {
      const img = new Image();
      img.src = `${base}carousel/${s.id}.jpg`;
      return img;
    });
    Promise.all(imgs.map((img) => new Promise((r) => { img.onload = r; img.onerror = r; }))).then(() => setPreloaded(true));
  }, []);

  const slide = SLIDES[current];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#050709",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "-apple-system, 'Helvetica Neue', Arial, sans-serif",
        color: "#fff",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" as const, color: "rgba(255,255,255,0.25)" }}>
          SZL Holdings
        </span>
        <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 11 }}>|</span>
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1, color: "rgba(255,255,255,0.35)" }}>
          LinkedIn Carousel
        </span>
      </div>

      <div
        style={{
          position: "relative",
          width: "min(80vh, 80vw)",
          height: "min(80vh, 80vw)",
          maxWidth: 720,
          maxHeight: 720,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 0 80px rgba(0,0,0,0.6), 0 0 200px rgba(34,211,238,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <img
          src={`${base}carousel/${slide.id}.jpg`}
          alt={slide.label}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          crossOrigin="anonymous"
        />

        <button
          onClick={goPrev}
          disabled={current === 0}
          aria-label="Previous slide"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "30%",
            background: "transparent",
            border: "none",
            cursor: current === 0 ? "default" : "pointer",
            outline: "none",
          }}
        />
        <button
          onClick={goNext}
          disabled={current === SLIDES.length - 1}
          aria-label="Next slide"
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "30%",
            background: "transparent",
            border: "none",
            cursor: current === SLIDES.length - 1 ? "default" : "pointer",
            outline: "none",
          }}
        />
      </div>

      <div
        style={{
          marginTop: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <button
          onClick={goPrev}
          disabled={current === 0}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6,
            color: current === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)",
            fontSize: 14,
            fontWeight: 600,
            padding: "8px 18px",
            cursor: current === 0 ? "default" : "pointer",
            transition: "all 0.15s",
          }}
        >
          &#8592;
        </button>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? "#22d3ee" : "rgba(255,255,255,0.15)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                padding: 0,
              }}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={current === SLIDES.length - 1}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6,
            color: current === SLIDES.length - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)",
            fontSize: 14,
            fontWeight: 600,
            padding: "8px 18px",
            cursor: current === SLIDES.length - 1 ? "default" : "pointer",
            transition: "all 0.15s",
          }}
        >
          &#8594;
        </button>
      </div>

      <div style={{ marginTop: 12, textAlign: "center" as const }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
          {current + 1} / {SLIDES.length}
        </span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginLeft: 10 }}>
          {slide.label}
        </span>
      </div>

      <div style={{ position: "absolute", bottom: 16, fontSize: 11, color: "rgba(255,255,255,0.15)", letterSpacing: 0.5 }}>
        Arrow keys or click to navigate
      </div>
    </div>
  );
}
