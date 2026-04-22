import { Button } from '@szl-holdings/shared-ui/ui/button';
import { Input } from '@szl-holdings/shared-ui/ui/input';
import { Label } from '@szl-holdings/shared-ui/ui/label';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Link, useLocation } from 'wouter';
import { MarketingNav } from '../../components/marketing/MarketingNav';

const SOCIAL_PROOF = [
  { initials: 'DL', name: 'Director of Logistics', company: 'Vantage Global' },
  { initials: 'JS', name: 'CTO', company: 'Ironclad Maritime' },
  { initials: 'AM', name: 'VP Intelligence', company: 'Kairos Defense' },
  { initials: 'PR', name: 'Head of Operations', company: 'Meridian Capital' },
];

export function MarketingSignup() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [capturedEmail, setCapturedEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setStep(3);
    }
    const saved = sessionStorage.getItem('mkt_signup_email');
    if (saved) setCapturedEmail(saved);
  }, []);

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const name = nameRef.current?.value?.trim() ?? '';
    const email = emailRef.current?.value?.trim() ?? '';
    const password = passwordRef.current?.value ?? '';

    if (!name || !email || !password) {
      setError('Name, email, and password are required.');
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setIsLoading(false);
      return;
    }

    setCapturedEmail(email);
    sessionStorage.setItem('mkt_signup_email', email);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name, email, password }),
      });

      if (res.status === 201) {
        setStep(2);
      } else if (res.status === 409) {
        setError(
          'An account with this email already exists. Please log in or use a different email.',
        );
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? `Registration failed (${res.status}). Please try again.`);
      }
    } catch {
      setError('Could not connect to the server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = async (plan: 'free' | 'pro') => {
    if (plan === 'free') {
      setStep(3);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/billing/command/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'command-pro-monthly',
          successUrl: `${window.location.origin}/command/marketing/signup?success=true`,
          cancelUrl: `${window.location.origin}/command/marketing/signup`,
          email: capturedEmail || undefined,
        }),
      });

      if (res.status === 503) {
        toast.error(
          'Pro subscriptions are not yet configured. Please select the Free plan to continue, or contact sales@szlholdings.com for Pro access.',
        );
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error(`Checkout returned ${res.status}`);
      }

      const data = await res.json();
      const url = data.url ?? data.data?.url;
      if (url?.startsWith('http')) {
        window.location.href = url;
        return;
      } else {
        throw new Error('Checkout session did not return a payment URL.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(
        `Payment initialization failed: ${msg}. Please select the free plan or try again.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = ['Create Account', 'Choose Plan', 'Access Granted'];

  return (
    <div className="min-h-[100dvh] bg-black text-white font-sans flex flex-col">
      <MarketingNav />

      <main className="flex-1 flex flex-col md:flex-row pt-16">
        {/* Left Form */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          <div className="w-full max-w-md relative z-10">
            {/* Step Indicator */}
            <div className="flex items-center gap-1 mb-10">
              {stepLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-1 flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        step > i + 1
                          ? 'bg-emerald-500 text-white'
                          : step === i + 1
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-white/30'
                      }`}
                      data-testid={`step-indicator-${i + 1}`}
                    >
                      {step > i + 1 ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                    </div>
                    <span
                      className={`text-[9px] mt-1 text-center leading-tight transition-colors ${
                        step === i + 1 ? 'text-white/60' : 'text-white/25'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div
                      className={`h-px flex-1 mb-4 transition-colors ${
                        step > i + 1 ? 'bg-emerald-500/50' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Create Your Account</h1>
                    <p className="text-white/50 text-sm">
                      Join 200+ elite teams already on the platform.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-5 text-sm text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleRegistration} className="space-y-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-name" className="text-white/70 text-sm">
                        Full Name
                      </Label>
                      <Input
                        id="signup-name"
                        ref={nameRef}
                        required
                        className="bg-white/5 border-white/10 text-white h-11"
                        placeholder="Jane Smith"
                        data-testid="input-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-white/70 text-sm">
                        Work Email
                      </Label>
                      <Input
                        id="signup-email"
                        ref={emailRef}
                        type="email"
                        required
                        className="bg-white/5 border-white/10 text-white h-11"
                        placeholder="jane@organization.com"
                        data-testid="input-email"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-white/70 text-sm">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          ref={passwordRef}
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          className="bg-white/5 border-white/10 text-white h-11 pr-10"
                          placeholder="At least 8 characters"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 bg-white text-black hover:bg-white/90 font-medium mt-2"
                      data-testid="button-create-account"
                    >
                      {isLoading ? (
                        'Creating account...'
                      ) : (
                        <>
                          Create Account <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                  <p className="text-center text-white/30 text-xs mt-5">
                    By signing up you agree to our{' '}
                    <span className="underline cursor-pointer hover:text-white/50 transition-colors">
                      Terms of Service
                    </span>{' '}
                    and{' '}
                    <span className="underline cursor-pointer hover:text-white/50 transition-colors">
                      Privacy Policy
                    </span>
                    .
                  </p>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tight mb-2">Choose Your Plan</h2>
                    <p className="text-white/50 text-sm">
                      Start free, upgrade anytime. No credit card required for the free plan.
                    </p>
                    {capturedEmail && (
                      <p className="text-xs text-white/35 mt-2">
                        Account registered for{' '}
                        <span className="text-white/55">{capturedEmail}</span>
                      </p>
                    )}
                  </div>

                  {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-blue-400 mb-4 animate-pulse">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                      Initializing payment session...
                    </div>
                  )}

                  <div className="space-y-4">
                    <button
                      onClick={() => handlePlanSelect('free')}
                      disabled={isLoading}
                      className="w-full p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-all text-left group disabled:opacity-50"
                      data-testid="plan-select-free"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold mb-0.5">Initiate — Free</div>
                          <div className="text-sm text-white/50">
                            1 User, 1 Platform, community support
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
                      </div>
                    </button>

                    <button
                      onClick={() => handlePlanSelect('pro')}
                      disabled={isLoading}
                      className="w-full p-5 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/15 cursor-pointer transition-all text-left group disabled:opacity-50"
                      data-testid="plan-select-pro"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-blue-300 mb-0.5">
                            Command Pro — $99/mo
                          </div>
                          <div className="text-sm text-blue-200/50">
                            10 Users, All Platforms, 14-day free trial
                          </div>
                          <div className="text-xs text-blue-200/35 mt-1">
                            → Redirects to secure payment
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  </div>

                  <div className="mt-6 text-center">
                    <Link
                      href="/marketing/pricing"
                      className="text-sm text-white/40 hover:text-white/60 underline underline-offset-4 transition-colors"
                      data-testid="link-full-pricing"
                    >
                      View full feature comparison
                    </Link>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight mb-3">Access Granted</h2>
                  <p className="text-white/55 text-sm mb-2">
                    Welcome to the SZL Command Ecosystem.
                  </p>
                  {capturedEmail && (
                    <p className="text-white/35 text-xs mb-8">
                      Account registered: {capturedEmail}
                    </p>
                  )}
                  {!capturedEmail && <div className="mb-8" />}
                  <Button
                    onClick={() => setLocation('/marketing/onboarding')}
                    className="w-full h-11 bg-white text-black hover:bg-white/90 font-medium"
                    data-testid="button-enter-onboarding"
                  >
                    Configure Your Platforms
                  </Button>
                  <button
                    onClick={() => setLocation('/')}
                    className="block w-full text-center text-white/30 text-xs mt-4 hover:text-white/50 transition-colors"
                    data-testid="button-skip-onboarding"
                  >
                    Skip setup, go to dashboard
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel — Social Proof */}
        <div className="hidden md:flex flex-1 bg-zinc-950 border-l border-white/5 items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-zinc-950 to-zinc-950" />
          <div className="relative z-10 max-w-md w-full space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex -space-x-2">
                {SOCIAL_PROOF.map((u, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 border-2 border-zinc-950 flex items-center justify-center text-xs font-bold text-white"
                  >
                    {u.initials}
                  </div>
                ))}
              </div>
              <div className="text-sm text-white/60 font-medium">
                Join 200+ elite teams worldwide
              </div>
            </div>

            {[
              {
                quote:
                  'SZL Command replaced 14 disparate tools with a single, unified intelligence layer. Our operational tempo increased by 40% in the first quarter.',
                author: 'Director of Operations',
                org: 'Global Logistics Firm',
              },
              {
                quote:
                  "The cross-domain signal correlation is unlike anything we've seen. We caught a supply chain risk 6 weeks before it would have materialized.",
                author: 'VP of Intelligence',
                org: 'Kairos Defense',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-white/[0.025] border border-white/[0.06] backdrop-blur-md"
              >
                <div className="flex text-amber-400 mb-3 text-xs">{'★★★★★'}</div>
                <p className="text-white/80 text-sm leading-relaxed mb-3 font-light">"{t.quote}"</p>
                <div>
                  <div className="font-medium text-white text-sm">{t.author}</div>
                  <div className="text-xs text-white/40">{t.org}</div>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3 flex-wrap">
              {['SOC 2 Type II', 'GDPR Compliant', 'E2E Encrypted'].map((badge, i) => (
                <span
                  key={i}
                  className="text-xs text-white/40 border border-white/[0.08] rounded-full px-3 py-1"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
