import { CheckCircle } from 'lucide-react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

export default function BookingSuccess() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center pt-20">
        <div className="max-w-lg mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto mb-8 border border-gold-500/30 flex items-center justify-center">
            <CheckCircle size={32} className="text-gold-400" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-3xl text-cream-50 mb-4">Payment Successful</h1>
          <p className="text-sm text-cream-300/50 mb-8 leading-relaxed">
            Your payment has been processed successfully. A confirmation email with all engagement
            details will be sent to your registered address shortly. Our advisory team will reach
            out within one business day to begin the onboarding process.
          </p>
          <a
            href={import.meta.env.BASE_URL}
            className="inline-block px-8 py-3.5 border border-gold-500/30 text-gold-400 text-sm font-medium tracking-widest uppercase hover:bg-gold-500/10 transition-all duration-300"
          >
            Return to Home
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
