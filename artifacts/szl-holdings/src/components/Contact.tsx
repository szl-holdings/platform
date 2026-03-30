import { useState } from "react";
import { m } from "framer-motion";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import siteData from "@/data/site.json";

interface FormData {
  name: string;
  email: string;
  company: string;
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
  else if (data.message.trim().length < 10) errors.message = "Message must be at least 10 characters";
  return errors;
}

export function Contact() {
  const { contact } = siteData;
  const [form, setForm] = useState<FormData>({ name: "", email: "", company: "", subject: "", message: "" });
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
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setStatus("success");
      setForm({ name: "", email: "", company: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const inputClasses = (field: keyof FormErrors) =>
    `w-full px-4 py-3 rounded-lg bg-white border text-szl-text placeholder-szl-text-muted text-sm focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? "border-red-400 focus:ring-red-400/20"
        : "border-szl-border focus:border-szl-accent focus:ring-szl-accent/15"
    }`;

  return (
    <section id="contact" className="py-24 lg:py-32 bg-szl-bg-secondary border-t border-szl-border">
      <div className="max-w-3xl mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <p className="text-szl-text-muted text-xs font-semibold uppercase tracking-widest mb-4">Contact</p>
          <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-bold text-szl-text mb-3">
            {contact.title}
          </h2>
          <p className="text-szl-text-secondary text-base max-w-xl">
            {contact.subtitle}
          </p>
        </m.div>

        <m.form
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="rounded-2xl border border-szl-border bg-white p-6 sm:p-8 space-y-5"
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="contact-name" className="block text-szl-text text-sm font-medium mb-1.5">{contact.labels.name}</label>
              <input
                id="contact-name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder={contact.placeholders.name}
                className={inputClasses("name")}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1" role="alert">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-szl-text text-sm font-medium mb-1.5">{contact.labels.email}</label>
              <input
                id="contact-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder={contact.placeholders.email}
                className={inputClasses("email")}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1" role="alert">{errors.email}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="contact-company" className="block text-szl-text text-sm font-medium mb-1.5">{contact.labels.company}</label>
              <input
                id="contact-company"
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder={contact.placeholders.company}
                className="w-full px-4 py-3 rounded-lg bg-white border border-szl-border text-szl-text placeholder-szl-text-muted text-sm focus:outline-none focus:ring-2 focus:border-szl-accent focus:ring-szl-accent/15 transition-all"
              />
            </div>
            <div>
              <label htmlFor="contact-subject" className="block text-szl-text text-sm font-medium mb-1.5">{contact.labels.subject}</label>
              <input
                id="contact-subject"
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder={contact.placeholders.subject}
                className={inputClasses("subject")}
              />
              {errors.subject && <p className="text-red-500 text-xs mt-1" role="alert">{errors.subject}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-szl-text text-sm font-medium mb-1.5">{contact.labels.message}</label>
            <textarea
              id="contact-message"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder={contact.placeholders.message}
              rows={5}
              className={inputClasses("message")}
            />
            {errors.message && <p className="text-red-500 text-xs mt-1" role="alert">{errors.message}</p>}
          </div>

          {status === "success" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle size={16} />
              {contact.successMessage}
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={16} />
              {contact.errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-szl-primary text-white font-semibold text-sm hover:bg-szl-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "submitting" ? (
              <>{contact.submittingLabel}</>
            ) : (
              <>
                {contact.submitLabel} <Send size={15} />
              </>
            )}
          </button>
        </m.form>
      </div>
    </section>
  );
}
