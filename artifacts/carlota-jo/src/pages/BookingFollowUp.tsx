import { motion } from "framer-motion";
import { CalendarCheck, Mail, Phone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function BookingFollowUp() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-2xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 mx-auto mb-8 border border-gold-500/30 flex items-center justify-center">
              <CalendarCheck size={32} className="text-gold-400" strokeWidth={1.5} />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-cream-50 mb-4">
              What Happens Next
            </h1>
            <p className="text-sm text-cream-300/50 leading-relaxed max-w-md mx-auto">
              Thank you for scheduling a consultation with Carlota Jo. Here's what
              you can expect in the coming days.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="border border-gold-500/10 bg-navy-900/30 p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center border border-gold-500/20 text-gold-400 shrink-0">
                  <span className="text-sm font-serif">1</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg text-cream-50 mb-2">
                    Confirmation Email
                  </h3>
                  <p className="text-sm text-cream-300/50 leading-relaxed">
                    Within the next hour, you will receive a detailed confirmation
                    email with your booking reference, selected service, engagement
                    tier, and scheduled date and time.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gold-500/10 bg-navy-900/30 p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center border border-gold-500/20 text-gold-400 shrink-0">
                  <span className="text-sm font-serif">2</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg text-cream-50 mb-2">
                    Pre-Engagement Briefing
                  </h3>
                  <p className="text-sm text-cream-300/50 leading-relaxed">
                    A senior partner will reach out within one business day to
                    introduce themselves, discuss preliminary objectives, and share
                    a brief pre-engagement questionnaire to ensure your consultation
                    is as productive as possible.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gold-500/10 bg-navy-900/30 p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center border border-gold-500/20 text-gold-400 shrink-0">
                  <span className="text-sm font-serif">3</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg text-cream-50 mb-2">
                    Your Consultation
                  </h3>
                  <p className="text-sm text-cream-300/50 leading-relaxed">
                    On the scheduled date, your dedicated advisory team will meet
                    with you to explore your strategic challenge, present initial
                    frameworks, and outline a recommended path forward.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gold-500/10 bg-navy-900/30 p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 flex items-center justify-center border border-gold-500/20 text-gold-400 shrink-0">
                  <span className="text-sm font-serif">4</span>
                </div>
                <div>
                  <h3 className="font-serif text-lg text-cream-50 mb-2">
                    Post-Session Deliverables
                  </h3>
                  <p className="text-sm text-cream-300/50 leading-relaxed">
                    Within five business days of your session, you will receive a
                    written executive summary, strategic options analysis, and
                    recommended next steps tailored to your situation.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 border border-gold-500/10 bg-navy-900/20 p-8 text-center"
          >
            <h3 className="font-serif text-lg text-cream-50 mb-4">
              Questions Before Your Session?
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-cream-300/50">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gold-400/60" />
                inquiries@carlotajo.com
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gold-400/60" />
                +1 (212) 555-0184
              </div>
            </div>
          </motion.div>

          <div className="mt-10 text-center">
            <a
              href={import.meta.env.BASE_URL}
              className="inline-block px-8 py-3.5 border border-gold-500/30 text-gold-400 text-sm font-medium tracking-widest uppercase hover:bg-gold-500/10 transition-all duration-300"
            >
              Return to Home
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
