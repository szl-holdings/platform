import { m } from 'framer-motion';
import { AlertCircle, CheckCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export type InquiryType = 'investor' | 'client' | 'partner' | 'recruiter' | 'general';

const INQUIRY_CONFIG: Record<
  InquiryType,
  {
    label: string;
    description: string;
    subjectPlaceholder: string;
    messagePlaceholder: string;
    extraFields?: { name: string; label: string; placeholder: string }[];
  }
> = {
  investor: {
    label: 'Investor Inquiry',
    description: 'Investment thesis, portfolio performance, and strategic briefings.',
    subjectPlaceholder: 'e.g. Investment interest, Due diligence request',
    messagePlaceholder:
      'Tell us about your investment mandate, thesis, and what draws you to the SZL ecosystem...',
    extraFields: [
      { name: 'firmName', label: 'Firm Name', placeholder: 'Your fund or family office' },
      { name: 'aum', label: 'AUM Range (optional)', placeholder: 'e.g. $250M - $500M' },
    ],
  },
  client: {
    label: 'Client / Demo Request',
    description: 'Product demonstrations, pilot programs, and enterprise deployments.',
    subjectPlaceholder: 'e.g. Demo request for KORA, Pilot inquiry',
    messagePlaceholder:
      "Tell us about your organization, the challenge you're solving, and which venture you're interested in...",
    extraFields: [
      { name: 'organization', label: 'Organization', placeholder: 'Your company name' },
      { name: 'role', label: 'Your Role', placeholder: 'e.g. COO, VP Engineering, CISO' },
    ],
  },
  partner: {
    label: 'Partnership Inquiry',
    description: 'Integration partnerships, co-development, and strategic alliances.',
    subjectPlaceholder: 'e.g. Integration opportunity, Co-development proposal',
    messagePlaceholder:
      'Describe the partnership opportunity and how it aligns with the SZL ecosystem...',
    extraFields: [
      { name: 'organization', label: 'Organization', placeholder: 'Your company name' },
      {
        name: 'partnerType',
        label: 'Partnership Type',
        placeholder: 'e.g. Technology, Channel, Strategic',
      },
    ],
  },
  recruiter: {
    label: 'Talent & Recruiting',
    description: 'Executive hiring, board advisory, and specialist engagement.',
    subjectPlaceholder: 'e.g. Executive search, Advisory board inquiry',
    messagePlaceholder:
      'Describe the role, engagement type, and how you see the fit with SZL Holdings...',
    extraFields: [
      { name: 'firm', label: 'Firm / Organization', placeholder: 'Your firm or company' },
      {
        name: 'engagementType',
        label: 'Engagement Type',
        placeholder: 'e.g. Full-time, Advisory, Contract',
      },
    ],
  },
  general: {
    label: 'General Inquiry',
    description: 'All other questions, introductions, and correspondence.',
    subjectPlaceholder: "What's on your mind?",
    messagePlaceholder: "Tell us what you'd like to discuss...",
  },
};

interface InquiryFormProps {
  defaultType?: InquiryType;
  showTypeSelector?: boolean;
  className?: string;
}

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  _hp: string;
  [key: string]: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const INQUIRY_TYPES: InquiryType[] = ['investor', 'client', 'partner', 'recruiter', 'general'];

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email address';
  if (!form.subject.trim()) errors.subject = 'Subject is required';
  if (!form.message.trim()) errors.message = 'Message is required';
  else if (form.message.trim().length < 10)
    errors.message = 'Please provide more detail (10+ chars)';
  return errors;
}

export function InquiryForm({
  defaultType = 'general',
  showTypeSelector = true,
  className,
}: InquiryFormProps) {
  const [inquiryType, setInquiryType] = useState<InquiryType>(defaultType);
  const [form, setForm] = useState<FormState>({ name: '', email: '', subject: '', message: '', _hp: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [started, setStarted] = useState(false);

  const config = INQUIRY_CONFIG[inquiryType];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (!started) {
      setStarted(true);
      analytics.contactFunnelStart(inquiryType);
    }
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleTypeChange = (type: InquiryType) => {
    setInquiryType(type);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form._hp) {
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '', _hp: '' });
      return;
    }
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setStatus('submitting');
    try {
      const apiBase = '/api';
      const res = await fetch(`${apiBase}/cms/contact-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: 1,
          formKey: 'szl_contact',
          fullName: form.name,
          email: form.email,
          company: form.firmName || form.organization || form.firm || '',
          message: `[${inquiryType}] ${form.subject}\n\n${form.message}`,
          metadataJson: { inquiryType, ...form },
          _hp: form._hp,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      analytics.contactFormSubmit(inquiryType);
      analytics.formSubmit('szl_contact', '/contact');
      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '', _hp: '' });
    } catch {
      setStatus('error');
    }
  };

  const inputClasses = (field: string) =>
    cn(
      'w-full px-4 py-3 rounded-xl border text-szl-text placeholder-szl-text-muted text-sm focus:outline-none focus:ring-2 transition-all bg-white',
      errors[field]
        ? 'border-red-400 focus:ring-red-200'
        : 'border-szl-border focus:border-szl-accent focus:ring-szl-accent/15',
    );

  return (
    <div className={className}>
      {showTypeSelector && (
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-3">
            I am reaching out as a...
          </p>
          <div className="flex flex-wrap gap-2">
            {INQUIRY_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-200',
                  inquiryType === type
                    ? 'bg-szl-primary text-white border-transparent'
                    : 'border-szl-border text-szl-text-secondary hover:border-szl-border-hover hover:text-szl-text bg-white',
                )}
              >
                {INQUIRY_CONFIG[type].label}
              </button>
            ))}
          </div>
          {config.description && (
            <p className="text-xs text-szl-text-muted mt-2">{config.description}</p>
          )}
        </div>
      )}

      <m.form
        key={inquiryType}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-szl-text text-xs font-semibold mb-1.5">Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              className={inputClasses('name')}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-szl-text text-xs font-semibold mb-1.5">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className={inputClasses('email')}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>

        {config.extraFields && (
          <div className="grid sm:grid-cols-2 gap-4">
            {config.extraFields.map((field) => (
              <div key={field.name}>
                <label className="block text-szl-text text-xs font-semibold mb-1.5">
                  {field.label}
                </label>
                <input
                  type="text"
                  name={field.name}
                  value={form[field.name] || ''}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border border-szl-border text-szl-text placeholder-szl-text-muted text-sm focus:outline-none focus:ring-2 focus:border-szl-accent focus:ring-szl-accent/15 transition-all bg-white',
                  )}
                />
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-szl-text text-xs font-semibold mb-1.5">Subject *</label>
          <input
            type="text"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder={config.subjectPlaceholder}
            className={inputClasses('subject')}
          />
          {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
        </div>

        <div>
          <label className="block text-szl-text text-xs font-semibold mb-1.5">Message *</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder={config.messagePlaceholder}
            rows={5}
            className={inputClasses('message')}
          />
          {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
        </div>

        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
          <label htmlFor="_hp_field">Leave this blank</label>
          <input
            id="_hp_field"
            type="text"
            name="_hp"
            value={form._hp}
            onChange={handleChange}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <CheckCircle size={16} />
            Thank you. We'll respond within 24 hours.
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle size={16} />
            Something went wrong. Please try again or email inquiries@szlholdings.com
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-szl-primary text-white font-semibold text-sm hover:bg-szl-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {status === 'submitting' ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </span>
          ) : (
            <>
              Send Message <Send size={15} />
            </>
          )}
        </button>
      </m.form>
    </div>
  );
}
