import { useState } from "react";
import { m } from "framer-motion";
import { ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

interface FormData {
  name: string;
  email: string;
  organization: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.name.trim()) errors.name = "Name is required";
  if (!data.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Invalid email address";
  if (!data.subject.trim()) errors.subject = "Subject is required";
  if (!data.message.trim()) errors.message = "Message is required";
  else if (data.message.trim().length < 10) errors.message = "Please provide more detail";
  return errors;
}

export function Contact() {
  const [form, setForm] = useState<FormData>({ name: "", email: "", organization: "", subject: "", message: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
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
      const basePath = import.meta.env.BASE_URL || "/";
      const apiBase = basePath.replace(/\/$/, "") + "/api";
      const res = await fetch(`${apiBase}/holdings/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, company: form.organization }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setForm({ name: "", email: "", organization: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const inputClasses = (field: keyof FormErrors) =>
    `w-full bg-transparent border-b px-0 py-3.5 text-szl-text text-sm placeholder:text-szl-text-muted focus:outline-none transition-colors font-light ${
      errors[field]
        ? "border-red-500/40 focus:border-red-400/60"
        : "border-szl-border focus:border-szl-accent/50"
    }`;

  return (
    <section id="contact" className="py-24 lg:py-36 bg-szl-bg border-t border-szl-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4"
          >
            <p className="text-szl-text-muted text-[10px] font-medium uppercase tracking-[0.25em] mb-6">Enquire</p>
            <h2 className="font-[var(--font-display)] text-4xl text-szl-text leading-tight mb-6">
              Strategic conversations welcome.
            </h2>
            <p className="text-szl-text-secondary text-sm leading-relaxed font-light mb-10">
              Investor relations, strategic partnerships, and portfolio company discussions. All inquiries receive a personal response within one business day.
            </p>
            <div className="space-y-1 text-sm text-szl-text-muted">
              <p>inquiries@szlholdings.com</p>
              <p>Washington, D.C. · London · Singapore</p>
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-8"
          >
            {status === "success" ? (
              <div className="flex flex-col items-start gap-4 py-16">
                <CheckCircle size={24} className="text-szl-accent" strokeWidth={1} />
                <h3 className="font-[var(--font-display)] text-2xl text-szl-text">Inquiry received.</h3>
                <p className="text-szl-text-secondary text-sm font-light">
                  Thank you. We will respond within one business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid sm:grid-cols-2 gap-10">
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-szl-text-muted mb-2 block">Full Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      className={inputClasses("name")}
                    />
                    {errors.name && <p className="text-red-400/70 text-xs mt-1.5">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-szl-text-muted mb-2 block">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className={inputClasses("email")}
                    />
                    {errors.email && <p className="text-red-400/70 text-xs mt-1.5">{errors.email}</p>}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-10">
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-szl-text-muted mb-2 block">Organization</label>
                    <input
                      name="organization"
                      value={form.organization}
                      onChange={handleChange}
                      placeholder="Company or fund name"
                      className="w-full bg-transparent border-b border-szl-border px-0 py-3.5 text-szl-text text-sm placeholder:text-szl-text-muted focus:outline-none focus:border-szl-accent/50 transition-colors font-light"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] tracking-[0.2em] uppercase text-szl-text-muted mb-2 block">Subject *</label>
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="Investor inquiry, partnership, or venture"
                      className={inputClasses("subject")}
                    />
                    {errors.subject && <p className="text-red-400/70 text-xs mt-1.5">{errors.subject}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-szl-text-muted mb-2 block">Message *</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Share the context of your inquiry..."
                    rows={5}
                    className={`${inputClasses("message")} resize-none border-b`}
                  />
                  {errors.message && <p className="text-red-400/70 text-xs mt-1.5">{errors.message}</p>}
                </div>

                {status === "error" && (
                  <div className="flex items-center gap-2 text-sm text-red-400/70">
                    <AlertCircle size={14} />
                    Something went wrong. Please try again or email us directly.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="group flex items-center gap-3 px-8 py-3.5 bg-szl-accent text-szl-bg font-semibold text-sm hover:bg-szl-accent-light transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? "Sending..." : "Send inquiry"}
                  {status !== "submitting" && (
                    <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  )}
                </button>
              </form>
            )}
          </m.div>
        </div>
      </div>
    </section>
  );
}
