import { useState } from "react";
import { m } from "framer-motion";
import { FounderLayout } from "./FounderLayout";
import { Link } from "wouter";
import { CheckCircle2, AlertCircle, ArrowRight, ExternalLink } from "lucide-react";
import { registry } from "@szl-holdings/brand-registry";

const { founder, company } = registry;

const CONTACT_TYPES = [
  { value: "investment", label: "Investment / Investor relations" },
  { value: "partnership", label: "Partnership or integration" },
  { value: "design-partner", label: "Design partner inquiry" },
  { value: "press", label: "Press or media" },
  { value: "speaking", label: "Speaking or advisory" },
  { value: "other", label: "Other" },
];

type FormState = "idle" | "submitting" | "success" | "error";

const BASE_PATH = import.meta.env.BASE_URL ?? "/";

function apiUrl(path: string) {
  const base = BASE_PATH.replace(/\/$/, "");
  return `${base}/api${path}`;
}

export default function FounderContact() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    type: "",
    message: "",
  });

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message || !form.type) {
      setErrorMessage("Please fill in all required fields.");
      setFormState("error");
      return;
    }
    setFormState("submitting");
    setErrorMessage("");
    try {
      const res = await fetch(apiUrl("/stephen/booking-requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim() || undefined,
          type: form.type,
          message: form.message.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      setFormState("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setFormState("error");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid hsla(0,0%,100%,0.10)",
    background: "hsla(214, 14%, 6%, 0.8)",
    color: "hsl(38, 8%, 95%)",
    fontSize: "0.9375rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
    fontFamily: "'Inter', system-ui, sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "hsl(214, 7%, 64%)",
    marginBottom: "0.5rem",
    letterSpacing: "0.02em",
  };

  return (
    <FounderLayout>
      <section
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem) clamp(3rem, 6vw, 5rem)",
        }}
      >
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: "4rem" }}
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
              Contact
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
            }}
          >
            Get in touch.
          </h1>
          <p
            style={{
              fontSize: "1.0625rem",
              lineHeight: 1.65,
              color: "hsl(214, 6%, 57%)",
              maxWidth: "52ch",
            }}
          >
            I read every message. For investment, press, and design-partner conversations: direct to me. For everything else — same.
          </p>
        </m.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr min(480px, 100%)",
            gap: "4rem",
            alignItems: "start",
          }}
          className="contact-grid"
        >
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "hsl(214, 6%, 57%)",
                    marginBottom: "0.75rem",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Principals only
                </div>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "hsl(214, 6%, 57%)",
                    lineHeight: 1.65,
                    marginBottom: "0.875rem",
                  }}
                >
                  Investor conversations are direct. No pitch scheduling tools, no junior team routing. If you're running money and want to understand the architecture, write directly.
                </p>
                <a
                  href={`mailto:${company.email}`}
                  style={{
                    fontSize: "0.9375rem",
                    color: "hsl(38, 52%, 58%)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                  }}
                >
                  {company.email}
                  <ExternalLink size={13} />
                </a>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "hsl(214, 6%, 57%)",
                    marginBottom: "0.75rem",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Design partner program
                </div>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "hsl(214, 6%, 57%)",
                    lineHeight: 1.65,
                    marginBottom: "0.875rem",
                  }}
                >
                  If you have a real operational problem and want to instrument it through the governed intelligence stack, the structured path is the design partner application.
                </p>
                <Link href="/founder/design-partner">
                  <span
                    style={{
                      fontSize: "0.9375rem",
                      color: "hsl(38, 52%, 58%)",
                      cursor: "pointer",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    Apply to design partner program
                    <ArrowRight size={13} />
                  </span>
                </Link>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "hsl(214, 6%, 57%)",
                    marginBottom: "0.75rem",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Social
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {[
                    { label: "LinkedIn", href: founder.linkedin },
                    { label: "Substack", href: "https://szlholdings.substack.com" },
                    { label: "Medium", href: "https://medium.com/@stephen_38454" },
                  ].map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.9375rem",
                        color: "hsl(214, 6%, 57%)",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "hsl(38, 8%, 95%)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "hsl(214, 6%, 57%)";
                      }}
                    >
                      {social.label}
                      <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              padding: "2rem",
              borderRadius: "14px",
              border: "1px solid hsla(0,0%,100%,0.10)",
              background: "hsla(214, 14%, 6%, 0.8)",
            }}
          >
            {formState === "success" ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "hsla(38, 52%, 58%, 0.12)",
                    border: "1px solid hsla(38, 52%, 58%, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.5rem",
                  }}
                >
                  <CheckCircle2 size={22} style={{ color: "hsl(38, 52%, 58%)" }} />
                </div>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: "1.125rem",
                    color: "hsl(38, 8%, 95%)",
                    marginBottom: "0.625rem",
                  }}
                >
                  Message received.
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "hsl(214, 6%, 57%)" }}>
                  I'll respond personally within a few business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: "1.0625rem",
                    color: "hsl(38, 8%, 95%)",
                    marginBottom: "1.5rem",
                  }}
                >
                  Send a message
                </h3>
                <div style={{ display: "grid", gap: "1.125rem" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>
                        Name <span style={{ color: "hsl(38, 52%, 58%)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={update("name")}
                        placeholder="Your name"
                        style={inputStyle}
                        disabled={formState === "submitting"}
                        onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.22)"; }}
                        onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.10)"; }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>
                        Email <span style={{ color: "hsl(38, 52%, 58%)" }}>*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={update("email")}
                        placeholder="you@example.com"
                        style={inputStyle}
                        disabled={formState === "submitting"}
                        onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.22)"; }}
                        onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.10)"; }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Company / Organization</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={update("company")}
                      placeholder="Optional"
                      style={inputStyle}
                      disabled={formState === "submitting"}
                      onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.22)"; }}
                      onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.10)"; }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Reason for reaching out{" "}
                      <span style={{ color: "hsl(38, 52%, 58%)" }}>*</span>
                    </label>
                    <select
                      value={form.type}
                      onChange={update("type")}
                      style={{ ...inputStyle, cursor: "pointer" }}
                      disabled={formState === "submitting"}
                    >
                      <option value="">Select...</option>
                      {CONTACT_TYPES.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                          {ct.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Message <span style={{ color: "hsl(38, 52%, 58%)" }}>*</span>
                    </label>
                    <textarea
                      value={form.message}
                      onChange={update("message")}
                      rows={4}
                      placeholder="What's on your mind?"
                      style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
                      disabled={formState === "submitting"}
                      onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.22)"; }}
                      onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.10)"; }}
                    />
                  </div>

                  {formState === "error" && errorMessage && (
                    <m.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        background: "hsla(0, 70%, 50%, 0.08)",
                        border: "1px solid hsla(0, 70%, 50%, 0.20)",
                        fontSize: "0.875rem",
                        color: "hsl(0, 70%, 65%)",
                      }}
                    >
                      <AlertCircle size={14} style={{ flexShrink: 0 }} />
                      {errorMessage}
                    </m.div>
                  )}

                  <button
                    type="submit"
                    disabled={formState === "submitting"}
                    style={{
                      width: "100%",
                      padding: "0.875rem 1.5rem",
                      borderRadius: "8px",
                      background: formState === "submitting"
                        ? "hsla(38, 52%, 58%, 0.6)"
                        : "hsl(38, 52%, 58%)",
                      color: "hsl(214, 18%, 3%)",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      border: "none",
                      cursor: formState === "submitting" ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      transition: "background 0.15s",
                      fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                  >
                    {formState === "submitting" ? "Sending..." : (
                      <>Send message <ArrowRight size={15} /></>
                    )}
                  </button>
                </div>
              </form>
            )}
          </m.div>
        </div>
      </section>

      <style>{`
        @media (max-width: 860px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </FounderLayout>
  );
}
