import { useState } from "react";
import { Copy, Check, ChevronDown, AlertCircle, Lock, Shield } from "lucide-react";



export function CodeBlock({
  code,
  language = "bash",
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "hsl(214, 16%, 4%)",
        border: "1px solid hsla(0,0%,100%,0.08)",
      }}
    >
      {filename && (
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{
            background: "hsla(214,14%,7%,0.8)",
            borderBottom: "1px solid hsla(0,0%,100%,0.06)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "hsl(214,8%,55%)",
            }}
          >
            {filename}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 transition-colors"
            style={{ color: copied ? "hsl(142,62%,48%)" : "hsl(214,8%,55%)" }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span style={{ fontSize: "0.7rem" }}>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      )}
      {!filename && (
        <div className="flex justify-end px-4 pt-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 transition-colors"
            style={{ color: copied ? "hsl(142,62%,48%)" : "hsl(214,8%,45%)" }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono)" }}>
              {copied ? "copied" : "copy"}
            </span>
          </button>
        </div>
      )}
      <pre
        className="overflow-x-auto px-4 py-4"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.8125rem",
          lineHeight: "1.7",
          color: "hsl(214,10%,82%)",
          margin: 0,
        }}
      >
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}



export function LanguageTabs({
  tabs,
}: {
  tabs: { label: string; language: string; code: string; filename?: string }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div
        className="flex gap-0 rounded-t-lg overflow-hidden"
        style={{ borderBottom: "1px solid hsla(0,0%,100%,0.08)" }}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className="px-4 py-2.5 text-sm transition-colors"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              background:
                active === i
                  ? "hsl(214, 16%, 4%)"
                  : "hsla(214,14%,7%,0.6)",
              color:
                active === i
                  ? "hsl(214,10%,90%)"
                  : "hsl(214,8%,50%)",
              borderBottom:
                active === i
                  ? "2px solid hsl(38,55%,60%)"
                  : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <CodeBlock
        code={tabs[active].code}
        language={tabs[active].language}
        filename={tabs[active].filename}
      />
    </div>
  );
}



export function SectionHeader({
  id,
  title,
  subtitle,
  badge,
}: {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div id={id} className="mb-6 pt-4 scroll-mt-24">
      <div className="flex items-center gap-3 mb-2">
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "hsl(38,10%,94%)",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
        {badge && (
          <span
            className="px-2 py-0.5 rounded text-xs"
            style={{
              background: "hsla(218,72%,52%,0.15)",
              color: "hsl(218,72%,72%)",
              border: "1px solid hsla(218,72%,52%,0.25)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {subtitle && (
        <p style={{ color: "hsl(214,8%,60%)", lineHeight: "1.6" }}>{subtitle}</p>
      )}
      <div
        className="mt-4"
        style={{ height: "1px", background: "hsla(0,0%,100%,0.06)" }}
      />
    </div>
  );
}

export function SubSectionHeader({ id, title }: { id: string; title: string }) {
  return (
    <h3
      id={id}
      className="mb-3 mt-8 scroll-mt-24"
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.0625rem",
        fontWeight: 600,
        color: "hsl(38,10%,88%)",
        letterSpacing: "-0.01em",
      }}
    >
      {title}
    </h3>
  );
}

export function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "tip" | "danger";
  children: React.ReactNode;
}) {
  const styles = {
    info: {
      bg: "hsla(218,72%,52%,0.08)",
      border: "hsla(218,72%,52%,0.25)",
      icon: "hsl(218,72%,65%)",
    },
    warning: {
      bg: "hsla(38,88%,50%,0.08)",
      border: "hsla(38,88%,50%,0.25)",
      icon: "hsl(38,88%,60%)",
    },
    tip: {
      bg: "hsla(142,64%,42%,0.08)",
      border: "hsla(142,64%,42%,0.25)",
      icon: "hsl(142,64%,52%)",
    },
    danger: {
      bg: "hsla(0,72%,52%,0.08)",
      border: "hsla(0,72%,52%,0.25)",
      icon: "hsl(0,72%,62%)",
    },
  };
  const s = styles[type];
  const Icon = type === "warning" ? AlertCircle : type === "danger" ? AlertCircle : type === "tip" ? Check : Shield;

  return (
    <div
      className="flex gap-3 rounded-lg px-4 py-3.5 my-4"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      <Icon size={16} style={{ color: s.icon, flexShrink: 0, marginTop: "2px" }} />
      <div style={{ color: "hsl(214,8%,75%)", fontSize: "0.875rem", lineHeight: "1.6" }}>
        {children}
      </div>
    </div>
  );
}

export function InlineCode({ children }: { children: string }) {
  return (
    <code
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.8125em",
        background: "hsla(214,14%,12%,0.8)",
        border: "1px solid hsla(0,0%,100%,0.08)",
        padding: "0.1em 0.4em",
        borderRadius: "3px",
        color: "hsl(200,80%,72%)",
      }}
    >
      {children}
    </code>
  );
}
