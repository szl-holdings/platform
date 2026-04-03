import { XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function BookingCancel() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center pt-20">
        <div className="max-w-lg mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-8 border border-cream-300/10 flex items-center justify-center">
            <XCircle size={32} className="text-cream-300/40" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-3xl text-cream-50 mb-4">
            Payment Cancelled
          </h1>
          <p className="text-sm text-cream-300/50 mb-8 leading-relaxed">
            Your payment was not processed. If you experienced any difficulties
            or have questions about our engagement models, please don't hesitate
            to contact our team directly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/book`}
              className="px-8 py-3.5 bg-gold-500/90 text-navy-950 text-sm font-medium tracking-widest uppercase hover:bg-gold-400 transition-all duration-300"
            >
              Try Again
            </a>
            <a
              href={import.meta.env.BASE_URL}
              className="px-8 py-3.5 border border-gold-500/30 text-gold-400 text-sm font-medium tracking-widest uppercase hover:bg-gold-500/10 transition-all duration-300"
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
