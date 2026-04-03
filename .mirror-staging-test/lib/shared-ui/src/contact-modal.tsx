import React, { useState } from "react";
import { X, CheckCircle2, Loader2, Send } from "lucide-react";
import { apiFetch } from "./api-fetch";

export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "demo" | "consultation" | "general" | "trial";
  app?: string;
  title?: string;
  subtitle?: string;
  baseUrl?: string;
}

interface FormState {
  name: string;
  email: string;
  company: string;
  role: string;
  message: string;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

const TYPE_LABELS: Record<string, { heading: string; cta: string; placeholder: string }> = {
  demo: {
    heading: "Request a Demo",
    cta: "Request Demo",
    placeholder: "Tell us about your use case and what you'd like to see…",
  },
  consultation: {
    heading: "Request a Consultation",
    cta: "Request Consultation",
    placeholder: "Describe the challenge you're working on…",
  },
  trial: {
    heading: "Start Your Free Trial",
    cta: "Get Started",
    placeholder: "What are you hoping to accomplish?",
  },
  general: {
    heading: "Get in Touch",
    cta: "Send Message",
    placeholder: "How can we help?",
  },
};

export function ContactModal({
  isOpen,
  onClose,
  type = "demo",
  app = "unknown",
  title,
  subtitle,
  baseUrl,
}: ContactModalProps) {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    company: "",
    role: "",
    message: "",
  });
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const labels = TYPE_LABELS[type] ?? TYPE_LABELS.general;
  const heading = title ?? labels.heading;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    setSubmitState("submitting");
    setErrorMsg("");

    try {
      const base = baseUrl ?? "";
      const response = await fetch(`${base}/api/contact/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          app,
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim() || undefined,
          role: form.role.trim() || undefined,
          message: form.message.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as Record<string, unknown>;
        throw new Error((err.error as string) ?? `Request failed (${response.status})`);
      }

      setSubmitState("success");
      setForm({ name: "", email: "", company: "", role: "", message: "" });
    } catch (err) {
      setSubmitState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const handleClose = () => {
    setSubmitState("idle");
    setErrorMsg("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <div>
            <h2 id="contact-modal-title" className="text-base font-bold text-foreground">
              {heading}
            </h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitState === "success" ? (
          <div className="px-6 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-2">Request Received</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Thank you. We'll be in touch within 1 business day.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 px-5 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Work Email <span className="text-destructive">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@company.com"
                  className="w-full px-3 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Company</label>
                <input
                  name="company"
                  type="text"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Acme Corp"
                  className="w-full px-3 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Role</label>
                <input
                  name="role"
                  type="text"
                  value={form.role}
                  onChange={handleChange}
                  placeholder="VP of Operations"
                  className="w-full px-3 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={3}
                placeholder={labels.placeholder}
                className="w-full px-3 py-2 text-sm bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50 resize-none"
              />
            </div>

            {submitState === "error" && errorMsg && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-muted-foreground">
                Your information is handled with strict confidentiality.
              </p>
              <button
                type="submit"
                disabled={submitState === "submitting"}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitState === "submitting" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {submitState === "submitting" ? "Sending…" : labels.cta}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function useContactModal(initialType: ContactModalProps["type"] = "demo") {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<ContactModalProps["type"]>(initialType);

  const open = (t?: ContactModalProps["type"]) => {
    if (t) setType(t);
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);

  return { isOpen, type, open, close };
}
