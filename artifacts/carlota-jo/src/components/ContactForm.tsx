import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertCircle, Lock } from "lucide-react";
import testimonialsData from "../data/testimonials.json";

interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  service: string;
  message: string;
}

export default function ContactForm() {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    phone: "",
    service: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const featuredTestimonial = (testimonialsData as Array<{ quote: string; name: string; title: string; company: string }>)[0];

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email address";
    if (!form.message.trim()) newErrors.message = "Please describe your needs";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    try {
      const apiBase = "/api";
      const res = await fetch(`${apiBase}/cms/contact-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: 4,
          formKey: "carlota_private_inquiry",
          fullName: form.name,
          email: form.email,
          company: form.company || "",
          message: form.message,
          metadataJson: { phone: form.phone, service: form.service },
        }),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", company: "", phone: "", service: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setForm({ ...form, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: undefined });
  };

  const inputClass = (field: keyof FormData) =>
    `w-full bg-transparent border-b ${
      errors[field] ? "border-red-400/50" : "border-stone-200"
    } px-0 py-3.5 text-sm text-ink-900 placeholder:text-stone-400 focus:outline-none focus:border-warm-gold/50 transition-colors font-light`;

  if (status === "success") {
    return (
      <section id="contact" className="py-24 lg:py-40 bg-taupe-50 border-t border-stone-200">
        <div className="max-w-2xl mx-auto px-6 lg:px-16 text-center">
          <div className="w-14 h-14 mx-auto mb-8 border border-warm-gold/25 flex items-center justify-center">
            <CheckCircle size={24} className="text-warm-gold" strokeWidth={1} />
          </div>
          <h3 className="font-serif text-3xl text-ink-900 mb-4 font-light">Inquiry received.</h3>
          <p className="text-sm text-ink-500 leading-relaxed max-w-md mx-auto font-light">
            Thank you for your interest. A senior member of the advisory team will review your inquiry and respond within one business day.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-24 lg:py-40 bg-taupe-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-warm-gold mb-6">
                Start a Conversation
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-ink-900 leading-tight mb-6">
                Inquire
                <br />
                <span className="italic">privately.</span>
              </h2>
              <p className="text-sm text-ink-600 font-light leading-relaxed mb-12 max-w-sm">
                Tell us about your household environment. All inquiries are handled with absolute discretion and responded to within 24 hours.
              </p>
            </motion.div>

            {featuredTestimonial && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="border-t border-stone-200 pt-8 mb-12"
              >
                <p className="font-serif text-base text-ink-600 leading-relaxed italic mb-5">
                  "{featuredTestimonial.quote.slice(0, 150)}..."
                </p>
                <div>
                  <p className="text-xs font-medium text-ink-900 tracking-wide">{featuredTestimonial.name}</p>
                  <p className="text-[11px] text-ink-500 mt-0.5 font-light">{featuredTestimonial.title}, {featuredTestimonial.company}</p>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 gap-px bg-stone-200"
            >
              {[
                { metric: "100%", label: "Client retention" },
                { metric: "8", label: "Pilot clients" },
                { metric: "< 2hr", label: "Response SLA" },
                { metric: "NDA", label: "On request" },
              ].map((item) => (
                <div key={item.label} className="bg-taupe-50 p-5">
                  <p className="font-serif text-2xl font-light text-warm-gold mb-1">{item.metric}</p>
                  <p className="text-[10px] tracking-wider uppercase text-stone-400 font-light">{item.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="lg:col-span-7">
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-9"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1.5 block font-medium">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className={inputClass("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500/70 mt-1.5">Please complete the required fields.</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1.5 block font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={inputClass("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500/70 mt-1.5">Please complete the required fields.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1.5 block font-medium">
                    How can we help?
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of your needs"
                    value={form.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    className={inputClass("company")}
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1.5 block font-medium">
                    Preferred timeline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. This quarter, flexible"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={inputClass("phone")}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1.5 block font-medium">
                  Service Area
                </label>
                <select
                  value={form.service}
                  onChange={(e) => updateField("service", e.target.value)}
                  className={`${inputClass("service")} appearance-none cursor-pointer bg-transparent`}
                >
                  <option value="">Select a service area</option>
                  <option value="residence-management">Residence Management</option>
                  <option value="household-operations">Household Staff Coordination</option>
                  <option value="travel-architecture">Bespoke Travel Architecture</option>
                  <option value="discreet-projects">Discreet Project Execution</option>
                  <option value="general">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-stone-400 mb-1.5 block font-medium">
                  Additional context
                </label>
                <textarea
                  placeholder="Share a few details and we will follow up thoughtfully."
                  rows={4}
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  className={`${inputClass("message")} resize-none`}
                />
                {errors.message && (
                  <p className="text-xs text-red-500/70 mt-1.5">Please complete the required fields.</p>
                )}
              </div>

              {status === "error" && (
                <div className="flex items-center gap-2 text-sm text-red-500/70">
                  <AlertCircle size={14} />
                  Please complete the required fields.
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full py-4 bg-ink-900 text-stone-50 text-xs font-medium tracking-[0.15em] uppercase hover:bg-ink-700 transition-colors duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {status === "submitting" ? (
                  "Sending..."
                ) : (
                  <>
                    Send private inquiry
                    <Send size={13} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400 tracking-wide font-light">
                <Lock size={10} />
                All communications are confidential and protected under NDA upon request.
              </div>
            </motion.form>
          </div>
        </div>
      </div>
    </section>
  );
}
