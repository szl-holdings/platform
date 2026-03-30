import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertCircle, Lock } from "lucide-react";
import testimonialsData from "@/data/testimonials.json";

interface FormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  service: string;
  message: string;
}

const socialProof = [
  { metric: "95%", label: "Client retention rate" },
  { metric: "140+", label: "Engagements delivered" },
  { metric: "12", label: "Industries served" },
  { metric: "$4.8B", label: "Aggregate client value created" },
];

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
    if (!form.message.trim()) newErrors.message = "Please describe your strategic needs";
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
    `w-full bg-transparent border-b ${
      errors[field] ? "border-red-500/50" : "border-cream-200/10"
    } px-0 py-3.5 text-sm text-cream-100 placeholder:text-cream-300/20 focus:outline-none focus:border-gold-400/40 transition-colors font-light`;

  if (status === "success") {
    return (
      <section id="contact" className="py-24 lg:py-32 bg-navy-950 border-t border-cream-200/5">
        <div className="max-w-2xl mx-auto px-6 lg:px-12 text-center">
          <div className="w-16 h-16 mx-auto mb-8 border border-gold-500/20 flex items-center justify-center">
            <CheckCircle size={28} className="text-gold-400" strokeWidth={1} />
          </div>
          <h3 className="font-serif text-3xl text-cream-50 mb-4">Inquiry Received</h3>
          <p className="text-sm text-cream-300/45 leading-relaxed max-w-md mx-auto font-light">
            Thank you for your interest in Carlota Jo. A senior member of our
            advisory team will review your inquiry and respond within one
            business day.
          </p>
        </div>
      </section>
    );
  }

  const featuredTestimonial = testimonialsData[0];

  return (
    <section id="contact" className="py-24 lg:py-32 bg-navy-950 border-t border-cream-200/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-[11px] font-medium tracking-[0.35em] uppercase text-gold-400 mb-5">
                Begin a Conversation
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-light text-cream-50 leading-tight mb-6">
                Confidential
                <br />
                inquiry
              </h2>
              <p className="text-sm text-cream-200/40 font-light leading-relaxed mb-12 max-w-sm">
                Share the broad contours of your strategic needs. All inquiries
                are reviewed by a senior partner and held in strict confidence.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="grid grid-cols-2 gap-px bg-cream-200/5 mb-12"
            >
              {socialProof.map((item) => (
                <div key={item.label} className="bg-navy-950 p-5">
                  <p className="font-serif text-2xl font-light text-gold-400 mb-1">
                    {item.metric}
                  </p>
                  <p className="text-[10px] tracking-wider uppercase text-cream-300/30">
                    {item.label}
                  </p>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="border-t border-cream-200/5 pt-8"
            >
              <p className="font-serif text-base text-cream-100/60 leading-relaxed italic mb-4">
                "{featuredTestimonial.quote.slice(0, 140)}..."
              </p>
              <div>
                <p className="text-xs font-medium text-cream-50">{featuredTestimonial.name}</p>
                <p className="text-[11px] text-cream-300/30 mt-0.5">{featuredTestimonial.title}, {featuredTestimonial.company}</p>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-7">
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[11px] tracking-[0.15em] uppercase text-cream-300/30 mb-1 block font-medium">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Chen"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className={inputClass("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-400/70 mt-1.5">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-[11px] tracking-[0.15em] uppercase text-cream-300/30 mb-1 block font-medium">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. s.chen@company.com"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={inputClass("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-400/70 mt-1.5">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[11px] tracking-[0.15em] uppercase text-cream-300/30 mb-1 block font-medium">
                    Organization
                  </label>
                  <input
                    type="text"
                    placeholder="Company or fund name"
                    value={form.company}
                    onChange={(e) => updateField("company", e.target.value)}
                    className={inputClass("company")}
                  />
                </div>
                <div>
                  <label className="text-[11px] tracking-[0.15em] uppercase text-cream-300/30 mb-1 block font-medium">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="Direct line preferred"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className={inputClass("phone")}
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] tracking-[0.15em] uppercase text-cream-300/30 mb-1 block font-medium">
                  Area of Interest
                </label>
                <select
                  value={form.service}
                  onChange={(e) => updateField("service", e.target.value)}
                  className={`${inputClass("service")} appearance-none cursor-pointer`}
                >
                  <option value="">Select a practice area</option>
                  <option value="strategic-advisory">Strategic Advisory</option>
                  <option value="portfolio-optimization">Portfolio Optimization</option>
                  <option value="technology-transformation">Technology Transformation</option>
                  <option value="risk-compliance">Risk & Compliance</option>
                  <option value="growth-strategy">Growth Strategy</option>
                  <option value="ma-advisory">M&A Advisory</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] tracking-[0.15em] uppercase text-cream-300/30 mb-1 block font-medium">
                  Strategic Context *
                </label>
                <textarea
                  placeholder="Briefly describe the strategic challenge or opportunity you're facing."
                  rows={4}
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  className={`${inputClass("message")} resize-none border border-cream-200/10 px-4 focus:border-gold-400/40`}
                />
                {errors.message && (
                  <p className="text-xs text-red-400/70 mt-1.5">{errors.message}</p>
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
                className="w-full py-4 bg-gold-500 text-navy-950 text-xs font-medium tracking-[0.15em] uppercase hover:bg-gold-400 transition-colors duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {status === "submitting" ? (
                  "Submitting..."
                ) : (
                  <>
                    Submit Confidential Inquiry
                    <Send size={14} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-cream-300/20 tracking-wide">
                <Lock size={11} />
                All communications are confidential and protected under NDA upon request.
              </div>
            </motion.form>
          </div>
        </div>
      </div>
    </section>
  );
}
