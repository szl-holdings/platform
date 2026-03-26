import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

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

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email address";
    if (!form.message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/booking/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    `w-full bg-navy-900/40 border ${
      errors[field] ? "border-red-500/50" : "border-gold-500/10"
    } px-4 py-3 text-sm text-cream-100 placeholder:text-cream-300/30 focus:outline-none focus:border-gold-500/30 transition-colors`;

  if (status === "success") {
    return (
      <section id="contact" className="py-24 lg:py-32 bg-navy-950">
        <div className="max-w-2xl mx-auto px-6 lg:px-12 text-center">
          <CheckCircle size={48} className="text-gold-400 mx-auto mb-6" strokeWidth={1} />
          <h3 className="font-serif text-3xl text-cream-50 mb-4">Inquiry Received</h3>
          <p className="text-sm text-cream-300/50">
            Thank you for your interest. A member of our advisory team will respond
            within one business day.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-24 lg:py-32 bg-navy-950">
      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-gold-400/80 mb-4">
            Get In Touch
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50">
            Begin a Conversation
          </h2>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <input
                type="text"
                placeholder="Full Name *"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={inputClass("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-400/70 mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <input
                type="email"
                placeholder="Email Address *"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={inputClass("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-400/70 mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              placeholder="Company"
              value={form.company}
              onChange={(e) => updateField("company", e.target.value)}
              className={inputClass("company")}
            />
            <input
              type="tel"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className={inputClass("phone")}
            />
          </div>

          <select
            value={form.service}
            onChange={(e) => updateField("service", e.target.value)}
            className={`${inputClass("service")} appearance-none`}
          >
            <option value="">Select Service of Interest</option>
            <option value="strategic-advisory">Strategic Advisory</option>
            <option value="portfolio-optimization">Portfolio Optimization</option>
            <option value="technology-transformation">Technology Transformation</option>
            <option value="risk-compliance">Risk & Compliance</option>
            <option value="growth-strategy">Growth Strategy</option>
            <option value="ma-advisory">M&A Advisory</option>
          </select>

          <div>
            <textarea
              placeholder="Tell us about your needs *"
              rows={5}
              value={form.message}
              onChange={(e) => updateField("message", e.target.value)}
              className={`${inputClass("message")} resize-none`}
            />
            {errors.message && (
              <p className="text-xs text-red-400/70 mt-1">{errors.message}</p>
            )}
          </div>

          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-red-400/70">
              <AlertCircle size={16} />
              There was an error submitting your inquiry. Please try again.
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full py-3.5 bg-gold-500/90 text-navy-950 text-sm font-medium tracking-widest uppercase hover:bg-gold-400 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {status === "submitting" ? (
              "Sending..."
            ) : (
              <>
                Submit Inquiry
                <Send size={14} />
              </>
            )}
          </button>
        </motion.form>
      </div>
    </section>
  );
}
