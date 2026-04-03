import * as React from "react";
import { useState } from "react";
import { cn } from "../utils";

export type InquiryType = "investor" | "client" | "partner" | "recruiter" | "general";

export interface InquiryTypeConfig {
  label: string;
  description?: string;
  subjectPlaceholder?: string;
  messagePlaceholder?: string;
  extraFields?: { name: string; label: string; placeholder: string }[];
}

export interface InquiryFormProps {
  types?: Record<InquiryType, InquiryTypeConfig>;
  defaultType?: InquiryType;
  showTypeSelector?: boolean;
  className?: string;
  accentColor?: string;
  onSubmit?: (data: Record<string, string>) => Promise<void>;
  onTrack?: (event: "start" | "submit", type: InquiryType) => void;
}

const DEFAULT_TYPES: Record<InquiryType, InquiryTypeConfig> = {
  investor: {
    label: "Investor",
    description: "Investment thesis, portfolio performance, and strategic briefings.",
    subjectPlaceholder: "e.g. Investment interest, Due diligence request",
    messagePlaceholder: "Tell us about your investment mandate and thesis...",
    extraFields: [
      { name: "firmName", label: "Firm Name", placeholder: "Your fund or family office" },
    ],
  },
  client: {
    label: "Client / Demo",
    description: "Product demonstrations, pilot programs, and enterprise deployments.",
    subjectPlaceholder: "e.g. Demo request, Pilot inquiry",
    messagePlaceholder: "Tell us about your organization and the challenge you're solving...",
    extraFields: [
      { name: "organization", label: "Organization", placeholder: "Your company name" },
    ],
  },
  partner: {
    label: "Partnership",
    description: "Integration partnerships, co-development, and strategic alliances.",
    subjectPlaceholder: "e.g. Integration opportunity, Co-development proposal",
    messagePlaceholder: "Describe the partnership opportunity...",
  },
  recruiter: {
    label: "Recruiting",
    description: "Executive hiring, board advisory, and specialist engagement.",
    subjectPlaceholder: "e.g. Executive search, Advisory board inquiry",
    messagePlaceholder: "Describe the role and engagement type...",
  },
  general: {
    label: "General",
    description: "All other questions, introductions, and correspondence.",
    subjectPlaceholder: "What's on your mind?",
    messagePlaceholder: "Tell us what you'd like to discuss...",
  },
};

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  [key: string]: string;
}

type FormErrors = Record<string, string | undefined>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!form.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Invalid email address";
  if (!form.subject.trim()) errors.subject = "Subject is required";
  if (!form.message.trim()) errors.message = "Message is required";
  else if (form.message.trim().length < 10) errors.message = "Please provide more detail (10+ chars)";
  return errors;
}

export function InquiryForm({
  types = DEFAULT_TYPES,
  defaultType = "general",
  showTypeSelector = true,
  className,
  accentColor = "hsl(215 45% 32%)",
  onSubmit,
  onTrack,
}: InquiryFormProps) {
  const [inquiryType, setInquiryType] = useState<InquiryType>(defaultType);
  const [form, setForm] = useState<FormState>({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [started, setStarted] = useState(false);

  const config = types[inquiryType] ?? DEFAULT_TYPES[inquiryType];
  const allTypes = Object.keys(types) as InquiryType[];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!started) {
      setStarted(true);
      onTrack?.("start", inquiryType);
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setStatus("submitting");
    try {
      await onSubmit?.({ ...form, inquiryType });
      onTrack?.("submit", inquiryType);
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const inputCls = (field: string) =>
    cn(
      "w-full px-4 py-3 rounded-xl border text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 transition-all bg-white",
      errors[field]
        ? "border-[#c45a4a] focus:ring-red-200"
        : "border-neutral-200 focus:border-current focus:ring-current/15"
    );

  return (
    <div className={className}>
      {showTypeSelector && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">
            I am reaching out as a...
          </p>
          <div className="flex flex-wrap gap-2">
            {allTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => { setInquiryType(type); setErrors({}); }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200",
                  inquiryType === type
                    ? "text-white border-transparent"
                    : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-900 bg-white"
                )}
                style={inquiryType === type ? { backgroundColor: accentColor } : undefined}
              >
                {types[type]?.label ?? type}
              </button>
            ))}
          </div>
          {config.description && (
            <p className="text-xs text-neutral-400 mt-2">{config.description}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-neutral-900 text-xs font-semibold mb-1.5">Name *</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className={inputCls("name")} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-neutral-900 text-xs font-semibold mb-1.5">Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className={inputCls("email")} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>

        {config.extraFields && (
          <div className="grid sm:grid-cols-2 gap-4">
            {config.extraFields.map((field) => (
              <div key={field.name}>
                <label className="block text-neutral-900 text-xs font-semibold mb-1.5">{field.label}</label>
                <input type="text" name={field.name} value={form[field.name] || ""} onChange={handleChange} placeholder={field.placeholder} className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 placeholder-neutral-400 text-sm focus:outline-none focus:ring-2 transition-all bg-white" />
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-neutral-900 text-xs font-semibold mb-1.5">Subject *</label>
          <input type="text" name="subject" value={form.subject} onChange={handleChange} placeholder={config.subjectPlaceholder ?? "Subject"} className={inputCls("subject")} />
          {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
        </div>

        <div>
          <label className="block text-neutral-900 text-xs font-semibold mb-1.5">Message *</label>
          <textarea name="message" value={form.message} onChange={handleChange} placeholder={config.messagePlaceholder ?? "Your message"} rows={5} className={inputCls("message")} />
          {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
        </div>

        {status === "success" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            ✓ Thank you. We'll respond within 24 hours.
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            ⚠ Something went wrong. Please try again.
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          {status === "submitting" ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            "Send Message"
          )}
        </button>
      </form>
    </div>
  );
}
