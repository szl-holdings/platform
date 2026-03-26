import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Calendar, User, CreditCard } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import servicesData from "@/data/services.json";
import tiersData from "@/data/tiers.json";

type Step = "service" | "tier" | "schedule" | "details" | "confirmation";

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "service", label: "Service", icon: Check },
  { id: "tier", label: "Tier", icon: CreditCard },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "details", label: "Details", icon: User },
  { id: "confirmation", label: "Confirm", icon: Check },
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
  const [currentStep, setCurrentStep] = useState<Step>("service");
  const [booking, setBooking] = useState<BookingData>({
    service: "",
    tier: "",
    date: "",
    time: "",
    name: "",
    email: "",
    company: "",
    phone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [confirmationId, setConfirmationId] = useState("");
  const [stripeError, setStripeError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tier = params.get("tier");
    if (tier) {
      const found = tiersData.find((t) => t.id === tier);
      if (found) {
        setBooking((b) => ({ ...b, tier: found.id }));
        setCurrentStep("service");
      }
    }
  }, []);

  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "service":
        return !!booking.service;
      case "tier":
        return !!booking.tier;
      case "schedule":
        return !!booking.date && !!booking.time;
      case "details":
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
    setStripeError("");
    setBookingError("");
    try {
      const res = await fetch("/api/booking/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setBookingError(errData.error || "Failed to confirm your booking. Please try again.");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setConfirmationId(data.confirmationId || "CJ-" + Date.now().toString(36).toUpperCase());
      setBookingConfirmed(true);
    } catch {
      setBookingError("Unable to reach the booking service. Please try again shortly.");
    }
    setSubmitting(false);
  };

  const handlePayment = async () => {
    setStripeError("");
    try {
      const selectedTier = tiersData.find((t) => t.id === booking.tier);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierId: booking.tier,
          tierName: selectedTier?.name,
          service: booking.service,
          email: booking.email,
          confirmationId,
          date: booking.date,
          time: booking.time,
          name: booking.name,
          successUrl: window.location.origin + import.meta.env.BASE_URL + "booking/success",
          cancelUrl: window.location.origin + import.meta.env.BASE_URL + "booking/cancel",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
      setStripeError(
        "Payment processing is not currently available. Your booking has been recorded and our team will follow up with payment details."
      );
    } catch {
      setStripeError(
        "Payment processing is not currently available. Your booking has been recorded and our team will follow up with payment details."
      );
    }
  };

  const selectedService = servicesData.find((s) => s.id === booking.service);
  const selectedTier = tiersData.find((t) => t.id === booking.tier);

  const timeSlots = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
  ];

  const getNextBusinessDays = (): string[] => {
    const days: string[] = [];
    const today = new Date();
    let d = new Date(today);
    d.setDate(d.getDate() + 3);
    while (days.length < 14) {
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        days.push(d.toISOString().split("T")[0]);
      }
      d.setDate(d.getDate() + 1);
    }
    return days;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const inputClass =
    "w-full bg-navy-900/40 border border-gold-500/10 px-4 py-3 text-sm text-cream-100 placeholder:text-cream-300/30 focus:outline-none focus:border-gold-500/30 transition-colors";

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
              <div className="w-20 h-20 mx-auto mb-8 border border-gold-500/30 flex items-center justify-center">
                <Check size={32} className="text-gold-400" strokeWidth={1.5} />
              </div>
              <h2 className="font-serif text-3xl text-cream-50 mb-4">
                Consultation Confirmed
              </h2>
              <p className="text-sm text-cream-300/50 mb-6">
                Your booking reference is{" "}
                <span className="text-gold-400 font-medium">{confirmationId}</span>
              </p>
              <div className="border border-gold-500/10 bg-navy-900/30 p-6 text-left space-y-3 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-cream-300/50">Service</span>
                  <span className="text-cream-100">{selectedService?.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cream-300/50">Tier</span>
                  <span className="text-cream-100">{selectedTier?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cream-300/50">Date</span>
                  <span className="text-cream-100">{formatDate(booking.date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-cream-300/50">Time</span>
                  <span className="text-cream-100">{booking.time} ET</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                className="w-full py-3.5 bg-gold-500/90 text-navy-950 text-sm font-medium tracking-widest uppercase hover:bg-gold-400 transition-all duration-300 mb-3"
              >
                Proceed to Payment
              </button>

              {stripeError && (
                <p className="text-xs text-gold-400/70 mt-2 mb-4">{stripeError}</p>
              )}

              <div className="flex items-center justify-center gap-6 mt-4">
                <a
                  href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/booking/follow-up`}
                  className="text-xs text-gold-400/70 hover:text-gold-400 transition-colors"
                >
                  What Happens Next?
                </a>
                <a
                  href={import.meta.env.BASE_URL}
                  className="text-xs text-cream-300/40 hover:text-gold-400 transition-colors"
                >
                  Return to Home
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
          <div className="text-center mb-12">
            <h1 className="font-serif text-3xl md:text-4xl font-light text-cream-50 mb-3">
              Book a Consultation
            </h1>
            <p className="text-sm text-cream-300/50">
              Select your service, choose your engagement tier, and schedule your session.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-12">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 flex items-center justify-center text-xs font-medium transition-all ${
                    i < stepIndex
                      ? "bg-gold-500/20 text-gold-400 border border-gold-500/30"
                      : i === stepIndex
                      ? "bg-gold-500/90 text-navy-950 border border-gold-500"
                      : "border border-gold-500/10 text-cream-300/30"
                  }`}
                >
                  {i < stepIndex ? <Check size={14} /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-8 h-px ${
                      i < stepIndex ? "bg-gold-500/30" : "bg-gold-500/10"
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
              {currentStep === "service" && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl text-cream-50 mb-6">
                    Select a Service Area
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {servicesData.map((service) => (
                      <button
                        key={service.id}
                        onClick={() =>
                          setBooking({ ...booking, service: service.id })
                        }
                        className={`text-left border p-5 transition-all duration-300 ${
                          booking.service === service.id
                            ? "border-gold-500/40 bg-gold-500/5"
                            : "border-gold-500/10 bg-navy-900/20 hover:border-gold-500/20"
                        }`}
                      >
                        <h4 className="text-sm font-medium text-cream-100 mb-1">
                          {service.title}
                        </h4>
                        <p className="text-xs text-cream-300/40 leading-relaxed">
                          {service.summary}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === "tier" && (
                <div className="space-y-4">
                  <h3 className="font-serif text-xl text-cream-50 mb-6">
                    Choose Your Engagement Tier
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {tiersData.map((tier) => (
                      <button
                        key={tier.id}
                        onClick={() =>
                          setBooking({ ...booking, tier: tier.id })
                        }
                        className={`text-left border p-6 transition-all duration-300 ${
                          booking.tier === tier.id
                            ? "border-gold-500/40 bg-gold-500/5"
                            : "border-gold-500/10 bg-navy-900/20 hover:border-gold-500/20"
                        }`}
                      >
                        <div className="flex items-baseline justify-between mb-2">
                          <h4 className="text-sm font-medium text-cream-100">
                            {tier.name}
                          </h4>
                          <span className="font-serif text-lg text-cream-50">
                            {tier.price}
                          </span>
                        </div>
                        <p className="text-xs text-cream-300/40">
                          {tier.type} &middot; {tier.priceNote}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === "schedule" && (
                <div className="space-y-6">
                  <h3 className="font-serif text-xl text-cream-50 mb-6">
                    Select a Date & Time
                  </h3>
                  <div>
                    <label className="text-xs font-medium tracking-widest uppercase text-cream-200/60 mb-3 block">
                      Available Dates
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                      {getNextBusinessDays().map((d) => (
                        <button
                          key={d}
                          onClick={() => setBooking({ ...booking, date: d })}
                          className={`py-2.5 px-2 text-xs text-center border transition-all ${
                            booking.date === d
                              ? "border-gold-500/40 bg-gold-500/10 text-gold-400"
                              : "border-gold-500/10 text-cream-300/50 hover:border-gold-500/20"
                          }`}
                        >
                          {formatDate(d)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium tracking-widest uppercase text-cream-200/60 mb-3 block">
                      Preferred Time (ET)
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {timeSlots.map((t) => (
                        <button
                          key={t}
                          onClick={() => setBooking({ ...booking, time: t })}
                          className={`py-2.5 px-2 text-xs border transition-all ${
                            booking.time === t
                              ? "border-gold-500/40 bg-gold-500/10 text-gold-400"
                              : "border-gold-500/10 text-cream-300/50 hover:border-gold-500/20"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === "details" && (
                <div className="space-y-6">
                  <h3 className="font-serif text-xl text-cream-50 mb-6">
                    Your Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={booking.name}
                      onChange={(e) =>
                        setBooking({ ...booking, name: e.target.value })
                      }
                      className={inputClass}
                    />
                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={booking.email}
                      onChange={(e) =>
                        setBooking({ ...booking, email: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Company"
                      value={booking.company}
                      onChange={(e) =>
                        setBooking({ ...booking, company: e.target.value })
                      }
                      className={inputClass}
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={booking.phone}
                      onChange={(e) =>
                        setBooking({ ...booking, phone: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                  <textarea
                    placeholder="Any additional notes or context for your consultation"
                    rows={4}
                    value={booking.notes}
                    onChange={(e) =>
                      setBooking({ ...booking, notes: e.target.value })
                    }
                    className={`${inputClass} resize-none`}
                  />
                </div>
              )}

              {currentStep === "confirmation" && (
                <div className="space-y-6">
                  <h3 className="font-serif text-xl text-cream-50 mb-6">
                    Review Your Booking
                  </h3>
                  <div className="border border-gold-500/10 bg-navy-900/30 p-8 space-y-4">
                    <div className="flex justify-between text-sm border-b border-gold-500/5 pb-3">
                      <span className="text-cream-300/50">Service</span>
                      <span className="text-cream-100">{selectedService?.title}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gold-500/5 pb-3">
                      <span className="text-cream-300/50">Engagement Tier</span>
                      <span className="text-cream-100">
                        {selectedTier?.name} — {selectedTier?.price}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gold-500/5 pb-3">
                      <span className="text-cream-300/50">Date & Time</span>
                      <span className="text-cream-100">
                        {formatDate(booking.date)} at {booking.time} ET
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gold-500/5 pb-3">
                      <span className="text-cream-300/50">Name</span>
                      <span className="text-cream-100">{booking.name}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gold-500/5 pb-3">
                      <span className="text-cream-300/50">Email</span>
                      <span className="text-cream-100">{booking.email}</span>
                    </div>
                    {booking.company && (
                      <div className="flex justify-between text-sm">
                        <span className="text-cream-300/50">Company</span>
                        <span className="text-cream-100">{booking.company}</span>
                      </div>
                    )}
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

          <div className="flex items-center justify-between mt-10">
            <button
              onClick={goBack}
              disabled={stepIndex === 0}
              className="flex items-center gap-2 text-sm text-cream-300/50 hover:text-gold-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {currentStep === "confirmation" ? (
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="px-8 py-3 bg-gold-500/90 text-navy-950 text-sm font-medium tracking-widest uppercase hover:bg-gold-400 transition-all duration-300 disabled:opacity-50"
              >
                {submitting ? "Confirming..." : "Confirm Booking"}
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-8 py-3 bg-gold-500/90 text-navy-950 text-sm font-medium tracking-widest uppercase hover:bg-gold-400 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
