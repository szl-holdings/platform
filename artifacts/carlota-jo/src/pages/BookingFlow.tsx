import { trackEvent } from '@szl-holdings/observability/react';
import { formatDate as formatSharedDate } from '@szl-holdings/shared-ui/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, Check, CreditCard, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import servicesData from '@/data/services.json';
import tiersData from '@/data/tiers.json';

type Step = 'service' | 'tier' | 'schedule' | 'details' | 'confirmation';

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'service', label: 'Practice Area', icon: Check },
  { id: 'tier', label: 'Engagement', icon: CreditCard },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'details', label: 'Details', icon: User },
  { id: 'confirmation', label: 'Review', icon: Check },
];

interface BookingData {
  service: string;
  tier: string;
  date: string;
  time: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  notes: string;
}

export default function BookingFlow() {
  const [currentStep, setCurrentStep] = useState<Step>('service');
  const [booking, setBooking] = useState<BookingData>({
    service: '',
    tier: '',
    date: '',
    time: '',
    name: '',
    email: '',
    company: '',
    phone: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmationId, setConfirmationId] = useState('');
  const [stripeError, setStripeError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tier = params.get('tier');
    if (tier) {
      const found = tiersData.find((t) => t.id === tier);
      if (found) {
        setBooking((b) => ({ ...b, tier: found.id }));
        setCurrentStep('service');
      }
    }
  }, []);

  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'service':
        return !!booking.service;
      case 'tier':
        return !!booking.tier;
      case 'schedule':
        return !!booking.date && !!booking.time;
      case 'details':
        return (
          !!booking.name.trim() &&
          !!booking.email.trim() &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)
        );
      default:
        return true;
    }
  };

  const goNext = () => {
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setStripeError('');
    setBookingError('');
    try {
      const res = await fetch('/api/booking/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setBookingError(errData.error || 'Failed to confirm your booking. Please try again.');
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setConfirmationId(data.confirmationId || `CJ-${Date.now().toString(36).toUpperCase()}`);
      setBookingConfirmed(true);
    } catch {
      setBookingError('Unable to reach the booking service. Please try again shortly.');
    }
    setSubmitting(false);
  };

  const handlePayment = async () => {
    setStripeError('');
    trackEvent('cta_clicked', {
      feature: 'carlota_booking_checkout',
      service: booking.service,
      tier: booking.tier,
    });
    try {
      const selectedTier = tiersData.find((t) => t.id === booking.tier);
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: booking.tier,
          tierName: selectedTier?.name,
          service: booking.service,
          email: booking.email,
          confirmationId,
          date: booking.date,
          time: booking.time,
          name: booking.name,
          successUrl: `${window.location.origin + import.meta.env.BASE_URL}booking/success`,
          cancelUrl: `${window.location.origin + import.meta.env.BASE_URL}booking/cancel`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          trackEvent('conversion', {
            feature: 'carlota_booking_checkout',
            service: booking.service,
            tier: booking.tier,
          });
          window.location.href = data.url;
          return;
        }
      }
      setStripeError(
        'Payment processing is not currently available. Your booking has been recorded and our team will follow up with payment details.',
      );
    } catch {
      setStripeError(
        'Payment processing is not currently available. Your booking has been recorded and our team will follow up with payment details.',
      );
    }
  };

  const selectedService = servicesData.find((s) => s.id === booking.service);
  const selectedTier = tiersData.find((t) => t.id === booking.tier);

  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

  const getNextBusinessDays = (): string[] => {
    const days: string[] = [];
    const today = new Date();
    const d = new Date(today);
    d.setDate(d.getDate() + 3);
    while (days.length < 14) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        days.push(d.toISOString().split('T')[0]);
      }
      d.setDate(d.getDate() + 1);
    }
    return days;
  };

  const formatDate = (dateStr: string) => {
    return formatSharedDate(new Date(`${dateStr}T12:00:00`), {
      intlOptions: { weekday: 'short', month: 'short', day: 'numeric' },
    });
  };

  const inputClass =
    'w-full bg-navy-900/30 border border-gold-500/8 px-5 py-3.5 text-sm text-cream-100 placeholder:text-cream-300/25 focus:outline-none focus:border-gold-500/25 transition-colors font-light';

  if (bookingConfirmed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20">
          <div className="max-w-lg mx-auto px-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 mx-auto mb-8 border border-gold-500/20 flex items-center justify-center">
                <Check size={32} className="text-gold-400" strokeWidth={1.2} />
              </div>
              <h2 className="font-serif text-3xl text-cream-50 mb-3">Consultation Reserved</h2>
              <p className="text-sm text-cream-300/40 mb-2 font-light">
                Your advisory session has been secured.
              </p>
              <p className="text-sm text-cream-300/40 mb-8 font-light">
                Reference: <span className="text-gold-400 font-medium">{confirmationId}</span>
              </p>
              <div className="border border-gold-500/8 bg-navy-900/20 p-8 text-left space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-cream-300/40 font-light">Practice Area</span>
                  <span className="text-cream-100">{selectedService?.title}</span>
                </div>
                <div className="w-full h-px bg-gold-500/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-cream-300/40 font-light">Engagement</span>
                  <span className="text-cream-100">{selectedTier?.name}</span>
                </div>
                <div className="w-full h-px bg-gold-500/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-cream-300/40 font-light">Date</span>
                  <span className="text-cream-100">{formatDate(booking.date)}</span>
                </div>
                <div className="w-full h-px bg-gold-500/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-cream-300/40 font-light">Time</span>
                  <span className="text-cream-100">{booking.time} ET</span>
                </div>
              </div>

              <p className="text-xs text-cream-300/30 mb-6 font-light leading-relaxed">
                A senior partner will reach out within 24 hours with a pre-session briefing document
                and any preparatory materials for your consultation.
              </p>

              <button
                onClick={handlePayment}
                className="w-full py-4 bg-gold-500/90 text-navy-950 text-xs font-medium tracking-[0.2em] uppercase hover:bg-gold-400 transition-all duration-300 mb-3"
              >
                Proceed to Payment
              </button>

              {stripeError && (
                <p className="text-xs text-gold-400/70 mt-2 mb-4 font-light">{stripeError}</p>
              )}

              <div className="flex items-center justify-center gap-6 mt-6">
                <a
                  href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/booking/follow-up`}
                  className="text-[11px] text-gold-400/60 hover:text-gold-400 transition-colors tracking-wider uppercase"
                >
                  What Happens Next
                </a>
                <a
                  href={import.meta.env.BASE_URL}
                  className="text-[11px] text-cream-300/30 hover:text-gold-400 transition-colors tracking-wider uppercase"
                >
                  Return Home
                </a>
              </div>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-4">
            <p className="text-[11px] font-medium tracking-[0.4em] uppercase text-gold-400/60 mb-3">
              Private Advisory
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-cream-50 mb-3">
              Request a Consultation
            </h1>
            <p className="text-sm text-cream-300/35 font-light max-w-md mx-auto">
              Configure your engagement below. All consultations begin with a confidential scoping
              conversation with a senior partner.
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-14 mt-10">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-1.5">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`w-9 h-9 flex items-center justify-center text-xs font-medium transition-all ${
                      i < stepIndex
                        ? 'bg-gold-500/15 text-gold-400 border border-gold-500/25'
                        : i === stepIndex
                          ? 'bg-gold-500/90 text-navy-950 border border-gold-500'
                          : 'border border-gold-500/8 text-cream-300/25'
                    }`}
                  >
                    {i < stepIndex ? <Check size={14} /> : i + 1}
                  </div>
                  <span
                    className={`text-[10px] tracking-wider uppercase hidden sm:block ${
                      i <= stepIndex ? 'text-gold-400/60' : 'text-cream-300/20'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-10 h-px mb-5 sm:mb-0 ${
                      i < stepIndex ? 'bg-gold-500/25' : 'bg-gold-500/8'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 'service' && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl text-cream-50 mb-2">Select a Practice Area</h3>
                  <p className="text-xs text-cream-300/30 font-light mb-6">
                    Choose the capability most aligned with your strategic needs. Your assigned
                    partner will refine the scope during the initial consultation.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {servicesData.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => setBooking({ ...booking, service: service.id })}
                        className={`text-left border p-6 transition-all duration-300 ${
                          booking.service === service.id
                            ? 'border-gold-500/35 bg-gold-500/5'
                            : 'border-gold-500/8 bg-navy-900/15 hover:border-gold-500/15'
                        }`}
                      >
                        <h4 className="text-sm font-medium text-cream-100 mb-1.5">
                          {service.title}
                        </h4>
                        <p className="text-xs text-cream-300/35 leading-relaxed font-light italic">
                          {service.summary}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 'tier' && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl text-cream-50 mb-2">
                    Choose Your Engagement Model
                  </h3>
                  <p className="text-xs text-cream-300/30 font-light mb-6">
                    Select the engagement structure that best fits your timeline and scope
                    requirements.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {tiersData.map((tier) => (
                      <button
                        key={tier.id}
                        onClick={() => setBooking({ ...booking, tier: tier.id })}
                        className={`text-left border p-7 transition-all duration-300 ${
                          booking.tier === tier.id
                            ? 'border-gold-500/35 bg-gold-500/5'
                            : 'border-gold-500/8 bg-navy-900/15 hover:border-gold-500/15'
                        }`}
                      >
                        <div className="flex items-baseline justify-between mb-2">
                          <h4 className="text-sm font-medium text-cream-100">{tier.name}</h4>
                          <span className="font-serif text-lg text-cream-50">{tier.price}</span>
                        </div>
                        <p className="text-xs text-cream-300/35 font-light">
                          {tier.type} &middot; {tier.priceNote}
                        </p>
                        <p className="text-xs text-cream-300/25 font-light mt-2 leading-relaxed">
                          {tier.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 'schedule' && (
                <div className="space-y-6">
                  <h3 className="font-serif text-xl text-cream-50 mb-2">
                    Select a Preferred Date & Time
                  </h3>
                  <p className="text-xs text-cream-300/30 font-light mb-6">
                    All times are Eastern. Your partner's office will confirm availability within 24
                    hours.
                  </p>
                  <div>
                    <label className="text-[11px] font-medium tracking-[0.15em] uppercase text-cream-200/40 mb-3 block">
                      Available Dates
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                      {getNextBusinessDays().map((d) => (
                        <button
                          key={d}
                          onClick={() => setBooking({ ...booking, date: d })}
                          className={`py-3 px-2 text-xs text-center border transition-all ${
                            booking.date === d
                              ? 'border-gold-500/35 bg-gold-500/8 text-gold-400'
                              : 'border-gold-500/8 text-cream-300/40 hover:border-gold-500/15'
                          }`}
                        >
                          {formatDate(d)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium tracking-[0.15em] uppercase text-cream-200/40 mb-3 block">
                      Preferred Time (ET)
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {timeSlots.map((t) => (
                        <button
                          key={t}
                          onClick={() => setBooking({ ...booking, time: t })}
                          className={`py-3 px-2 text-xs border transition-all ${
                            booking.time === t
                              ? 'border-gold-500/35 bg-gold-500/8 text-gold-400'
                              : 'border-gold-500/8 text-cream-300/40 hover:border-gold-500/15'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'details' && (
                <div className="space-y-6">
                  <h3 className="font-serif text-xl text-cream-50 mb-2">Your Information</h3>
                  <p className="text-xs text-cream-300/30 font-light mb-6">
                    This information is used solely for partner assignment and pre-session
                    preparation.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[11px] tracking-[0.15em] uppercase text-cream-300/35 mb-2 block font-medium">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Chen"
                        value={booking.name}
                        onChange={(e) => setBooking({ ...booking, name: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] tracking-[0.15em] uppercase text-cream-300/35 mb-2 block font-medium">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. s.chen@company.com"
                        value={booking.email}
                        onChange={(e) => setBooking({ ...booking, email: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[11px] tracking-[0.15em] uppercase text-cream-300/35 mb-2 block font-medium">
                        Organization
                      </label>
                      <input
                        type="text"
                        placeholder="Company or fund name"
                        value={booking.company}
                        onChange={(e) => setBooking({ ...booking, company: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] tracking-[0.15em] uppercase text-cream-300/35 mb-2 block font-medium">
                        Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="Direct line preferred"
                        value={booking.phone}
                        onChange={(e) => setBooking({ ...booking, phone: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] tracking-[0.15em] uppercase text-cream-300/35 mb-2 block font-medium">
                      Pre-Session Context
                    </label>
                    <textarea
                      placeholder="Briefly describe the strategic challenge or decision you'd like to discuss. This helps your assigned partner prepare a more productive session."
                      rows={4}
                      value={booking.notes}
                      onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              )}

              {currentStep === 'confirmation' && (
                <div className="space-y-6">
                  <h3 className="font-serif text-xl text-cream-50 mb-2">
                    Review Your Consultation Request
                  </h3>
                  <p className="text-xs text-cream-300/30 font-light mb-6">
                    Please confirm the details below. You will receive a confirmation email with
                    pre-session materials within 24 hours.
                  </p>
                  <div className="border border-gold-500/8 bg-navy-900/20 p-8 lg:p-10 space-y-5">
                    <div className="flex justify-between text-sm">
                      <span className="text-cream-300/40 font-light">Practice Area</span>
                      <span className="text-cream-100">{selectedService?.title}</span>
                    </div>
                    <div className="w-full h-px bg-gold-500/5" />
                    <div className="flex justify-between text-sm">
                      <span className="text-cream-300/40 font-light">Engagement Model</span>
                      <span className="text-cream-100">
                        {selectedTier?.name} &mdash; {selectedTier?.price}
                      </span>
                    </div>
                    <div className="w-full h-px bg-gold-500/5" />
                    <div className="flex justify-between text-sm">
                      <span className="text-cream-300/40 font-light">Preferred Date & Time</span>
                      <span className="text-cream-100">
                        {formatDate(booking.date)} at {booking.time} ET
                      </span>
                    </div>
                    <div className="w-full h-px bg-gold-500/5" />
                    <div className="flex justify-between text-sm">
                      <span className="text-cream-300/40 font-light">Name</span>
                      <span className="text-cream-100">{booking.name}</span>
                    </div>
                    <div className="w-full h-px bg-gold-500/5" />
                    <div className="flex justify-between text-sm">
                      <span className="text-cream-300/40 font-light">Email</span>
                      <span className="text-cream-100">{booking.email}</span>
                    </div>
                    {booking.company && (
                      <>
                        <div className="w-full h-px bg-gold-500/5" />
                        <div className="flex justify-between text-sm">
                          <span className="text-cream-300/40 font-light">Organization</span>
                          <span className="text-cream-100">{booking.company}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-cream-300/25 tracking-wide">
                    <Shield size={12} />
                    All engagement details are held in strict confidence.
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {bookingError && (
            <div className="mt-6 border border-red-500/20 bg-red-500/5 p-4 text-center">
              <p className="text-sm text-red-400/80">{bookingError}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-12">
            <button
              onClick={goBack}
              disabled={stepIndex === 0}
              className="flex items-center gap-2 text-[11px] tracking-wider uppercase text-cream-300/40 hover:text-gold-400 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={14} />
              Back
            </button>

            {currentStep === 'confirmation' ? (
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="px-10 py-3.5 bg-gold-500/90 text-navy-950 text-xs font-medium tracking-[0.2em] uppercase hover:bg-gold-400 transition-all duration-300 disabled:opacity-50"
              >
                {submitting ? 'Confirming...' : 'Confirm & Reserve'}
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-10 py-3.5 bg-gold-500/90 text-navy-950 text-xs font-medium tracking-[0.2em] uppercase hover:bg-gold-400 transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
