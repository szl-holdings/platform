import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Clock } from "lucide-react";
import { FounderLayout } from "./FounderLayout";
import { ESSAYS, type Essay } from "@/content/essays";

const CATEGORY_LABELS: Record<Essay["category"], string> = {
  doctrine: "Doctrine",
  architecture: "Architecture",
  strategy: "Strategy",
  operations: "Operations",
  memo: "Memo",
};

function EssayCard({ essay, index }: { essay: Essay; index: number }) {
  const formattedDate = new Date(essay.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
    >
      <Link href={`/founder/essays/${essay.slug}`}>
        <div
          style={{
            padding: "2rem 0",
            borderBottom: "1px solid hsla(0,0%,100%,0.055)",
            cursor: "pointer",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "2rem",
            alignItems: "start",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0.8";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "0.75rem",
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
                style={{
                  fontSize: "0.8125rem",
                  color: "hsl(214, 6%, 55%)",
                }}
              >
                {formattedDate}
              </span>
            </div>
            <h2
              style={{
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontWeight: 600,
                fontSize: "clamp(1.125rem, 2.5vw, 1.5rem)",
                letterSpacing: "-0.015em",
                color: "hsl(38, 8%, 95%)",
                marginBottom: "0.625rem",
                lineHeight: 1.25,
              }}
            >
              {essay.title}
            </h2>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "hsl(214, 7%, 64%)",
                lineHeight: 1.6,
                fontStyle: "italic",
                marginBottom: "0.875rem",
              }}
            >
              {essay.subtitle}
            </p>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "hsl(214, 6%, 57%)",
                lineHeight: 1.65,
                maxWidth: "64ch",
              }}
            >
              {essay.excerpt}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "0.5rem",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.8125rem",
                color: "hsl(214, 6%, 55%)",
              }}
            >
              <Clock size={13} />
              {essay.readTime} min
            </div>
            <ArrowRight size={16} style={{ color: "hsl(214, 6%, 57%)" }} />
          </div>
        </div>
      </Link>
    </m.div>
  );
}

export default function FounderEssays() {
  return (
    <FounderLayout>
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem) clamp(3rem, 6vw, 5rem)",
        }}
      >
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              marginBottom: "1.5rem",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "hsl(38, 52%, 58%)",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "0.8125rem",
                color: "hsl(214, 6%, 57%)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Essays & Memos
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "hsl(38, 8%, 95%)",
              marginBottom: "1.25rem",
              maxWidth: "22ch",
            }}
          >
            Writing on architecture, doctrine, and craft.
          </h1>
          <p
            style={{
              fontSize: "1.0625rem",
              lineHeight: 1.65,
              color: "hsl(214, 6%, 57%)",
              maxWidth: "56ch",
              marginBottom: "0",
            }}
          >
            Long-form essays, architecture memos, and strategy thinking. All written from first principles, based on what's actually been built and deployed.
          </p>
        </m.div>

        <div
          style={{
            marginTop: "3rem",
            borderTop: "1px solid hsla(0,0%,100%,0.055)",
          }}
        >
          {ESSAYS.map((essay, i) => (
            <EssayCard key={essay.slug} essay={essay} index={i} />
          ))}
        </div>
      </section>
    </FounderLayout>
  );
}
