import { m } from "framer-motion";
import { Link, useParams } from "wouter";
import { ArrowLeft, Clock } from "lucide-react";
import { FounderLayout } from "./FounderLayout";
import { getEssay, ESSAYS, type Essay } from "@/content/essays";

const CATEGORY_LABELS: Record<Essay["category"], string> = {
  doctrine: "Doctrine",
  architecture: "Architecture",
  strategy: "Strategy",
  operations: "Operations",
  memo: "Memo",
};

export default function FounderEssayDetail() {
  const params = useParams<{ slug: string }>();
  const essay = getEssay(params.slug);

  if (!essay) {
    return (
      <FounderLayout>
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem)",
            textAlign: "center",
          }}
        >
          <p style={{ color: "hsl(214, 6%, 57%)" }}>Essay not found.</p>
          <Link href="/founder/essays">
            <span
              style={{
                color: "hsl(38, 52%, 58%)",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              ← Back to essays
            </span>
          </Link>
        </div>
      </FounderLayout>
    );
  }

  const formattedDate = new Date(essay.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const otherEssays = ESSAYS.filter((e) => e.slug !== essay.slug).slice(0, 3);

  return (
    <FounderLayout>
      <article
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "clamp(3rem, 6vw, 5rem) clamp(1.5rem, 5vw, 3rem) clamp(4rem, 8vw, 7rem)",
        }}
      >
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/founder/essays">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.8125rem",
                color: "hsl(214, 6%, 57%)",
                cursor: "pointer",
                textDecoration: "none",
                marginBottom: "2.5rem",
              }}
            >
              <ArrowLeft size={14} />
              Essays & Memos
            </span>
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 500,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "hsl(38, 52%, 58%)",
                padding: "0.2rem 0.6rem",
                borderRadius: "4px",
                border: "1px solid hsla(38, 52%, 58%, 0.25)",
                background: "hsla(38, 52%, 58%, 0.06)",
              }}
            >
              {CATEGORY_LABELS[essay.category]}
            </span>
            <span
              style={{ fontSize: "0.8125rem", color: "hsl(214, 6%, 55%)" }}
            >
              {formattedDate}
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                fontSize: "0.8125rem",
                color: "hsl(214, 6%, 55%)",
              }}
            >
              <Clock size={12} />
              {essay.readTime} min read
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "hsl(38, 8%, 95%)",
              marginBottom: "0.75rem",
            }}
          >
            {essay.title}
          </h1>

          <p
            style={{
              fontSize: "1.125rem",
              fontStyle: "italic",
              color: "hsl(214, 7%, 64%)",
              marginBottom: "3rem",
              lineHeight: 1.5,
            }}
          >
            {essay.subtitle}
          </p>
        </m.div>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontSize: "1.0625rem",
            lineHeight: 1.75,
            color: "hsl(214, 7%, 64%)",
          }}
          dangerouslySetInnerHTML={{ __html: essay.body }}
        />

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          style={{
            marginTop: "5rem",
            paddingTop: "3rem",
            borderTop: "1px solid hsla(0,0%,100%,0.055)",
          }}
        >
          <div
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: "0.875rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "hsl(214, 6%, 57%)",
              marginBottom: "1.5rem",
            }}
          >
            More essays
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {otherEssays.map((other) => (
              <Link key={other.slug} href={`/founder/essays/${other.slug}`}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    borderRadius: "8px",
                    border: "1px solid hsla(0,0%,100%,0.055)",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "hsla(0,0%,100%,0.10)";
                    el.style.background = "hsla(0,0%,100%,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "hsla(0,0%,100%,0.055)";
                    el.style.background = "transparent";
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.9375rem",
                        fontWeight: 500,
                        color: "hsl(38, 8%, 95%)",
                        marginBottom: "0.25rem",
                        fontFamily: "'Space Grotesk', system-ui, sans-serif",
                      }}
                    >
                      {other.title}
                    </div>
                    <div
                      style={{ fontSize: "0.8125rem", color: "hsl(214, 6%, 57%)" }}
                    >
                      {CATEGORY_LABELS[other.category]} · {other.readTime} min
                    </div>
                  </div>
                  <ArrowLeft
                    size={15}
                    style={{
                      color: "hsl(214, 6%, 57%)",
                      transform: "rotate(180deg)",
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </m.div>
      </article>

      <style>{`
        article p { margin: 0 0 1.5rem; }
        article h3 {
          font-family: 'Space Grotesk', system-ui, sans-serif;
          font-weight: 600;
          font-size: 1.25rem;
          letter-spacing: -0.01em;
          color: hsl(38, 8%, 95%);
          margin: 2.5rem 0 1rem;
          line-height: 1.3;
        }
      `}</style>
    </FounderLayout>
  );
}
