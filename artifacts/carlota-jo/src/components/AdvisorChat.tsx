import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, UserCircle2, BookOpen, CalendarCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ServiceSource {
  id: number;
  slug: string;
  name: string;
  category: string | null;
  snippet: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: ServiceSource[];
}

interface ChatResponse {
  success: boolean;
  response: string;
  sessionId: string;
  suggestBooking: boolean;
  qualification: {
    score: number;
    qualified: boolean;
    signals: string[];
  };
  sources: ServiceSource[];
}

interface Availability {
  availableDates: string[];
  timeSlots: string[];
  timezone: string;
}

interface BookingConfirmation {
  confirmationId: string;
  booking: {
    date: string;
    time: string;
    tier: string;
    service: string;
  };
}

const API_BASE = '/api';
const BASE_URL = import.meta.env.BASE_URL ?? '/carlota-jo/';
const GOLD = '#9A7D52';
const GOLD_LIGHT = '#B09060';
const CREAM = '#F9F7F3';
const INK = '#1A1A1A';
const INK_DIM = '#5a5a5a';
const STONE = '#e8e4de';
const STONE_LIGHT = '#f4f1ed';

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    "Hello — I'm Rosa's AI advisor. I'm here to help you understand how Carlota Jo can support your household and estate management needs. What can I tell you about our services?",
};

const TIER_LABELS: Record<string, string> = {
  'strategy-session': 'Strategy Session — 90 min ($4,500)',
  'portfolio-review': 'Portfolio Review ($45,000)',
  'advisory-retainer': 'Advisory Retainer / month ($18,000)',
};

type SchedulerStep = 'idle' | 'loading-avail' | 'date' | 'time' | 'tier' | 'confirm' | 'submitting' | 'done';

export default function AdvisorChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [suggestBooking, setSuggestBooking] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [identityCaptured, setIdentityCaptured] = useState(false);
  const [showIdentityPrompt, setShowIdentityPrompt] = useState(false);
  const [identityNameInput, setIdentityNameInput] = useState('');
  const [identityEmailInput, setIdentityEmailInput] = useState('');

  const [schedulerStep, setSchedulerStep] = useState<SchedulerStep>('idle');
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTier, setSelectedTier] = useState('strategy-session');
  const [bookingError, setBookingError] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const exchangeCount = useRef(0);

  useEffect(() => {
    if (open) {
      setHasNewMessage(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, showIdentityPrompt, schedulerStep]);

  const saveIdentity = () => {
    if (identityNameInput.trim()) setVisitorName(identityNameInput.trim());
    if (identityEmailInput.trim()) setVisitorEmail(identityEmailInput.trim());
    setIdentityCaptured(true);
    setShowIdentityPrompt(false);
  };

  const startScheduler = async () => {
    setSchedulerStep('loading-avail');
    setBookingError('');
    try {
      const res = await fetch(`${API_BASE}/booking/availability`);
      const data: Availability = await res.json();
      setAvailability(data);
      setSelectedDate(data.availableDates[0] ?? '');
      setSelectedTime(data.timeSlots[0] ?? '');
      setSchedulerStep('date');
    } catch {
      setBookingError('Unable to load availability. Please try our booking page instead.');
      setSchedulerStep('idle');
    }
  };

  const confirmBooking = async () => {
    if (!selectedDate || !selectedTime) return;
    setSchedulerStep('submitting');
    setBookingError('');
    try {
      const guestName = visitorName || 'Guest';
      const guestEmail = visitorEmail || 'noreply@carlotajo.com';
      const res = await fetch(`${API_BASE}/booking/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'household-estate-management',
          tier: selectedTier,
          date: selectedDate,
          time: selectedTime,
          name: guestName,
          email: guestEmail,
          notes: `Booked via AI advisor chat. Session: ${sessionId ?? 'n/a'}`,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = (errJson as { error?: string }).error ?? `Booking failed (${res.status})`;
        throw new Error(msg);
      }
      const data: BookingConfirmation = await res.json();
      if (!data.confirmationId) throw new Error('Invalid booking response — no confirmation ID returned.');
      setSchedulerStep('done');
      const confirmMsg: ChatMessage = {
        role: 'assistant',
        content: `Wonderful — your consultation is confirmed. Your reference is ${data.confirmationId}. You'll receive a confirmation at ${guestEmail}. Rosa looks forward to speaking with you on ${selectedDate} at ${selectedTime} (ET).`,
      };
      setMessages((prev) => [...prev, confirmMsg]);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Unable to complete the booking. Please try again or visit our booking page.');
      setSchedulerStep('confirm');
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg: ChatMessage = { role: 'user', content: text };
    const history = messages.filter((m) => m !== INITIAL_MESSAGE);
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    exchangeCount.current += 1;

    try {
      const res = await fetch(`${API_BASE}/carlota/advisor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId,
          history: history.map((m) => ({ role: m.role, content: m.content })),
          name: visitorName || undefined,
          email: visitorEmail || undefined,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const hint = res.status === 429 ? ' Please wait a moment before trying again.' : '';
        const serverMsg = (errJson as { error?: string }).error;
        throw new Error(serverMsg ?? `Request failed (${res.status}).${hint}`);
      }
      const data: ChatResponse = await res.json();
      if (!data.success || typeof data.response !== 'string') {
        throw new Error('Unexpected response from advisor. Please try again.');
      }
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.response,
        sources: data.sources?.length ? data.sources : undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setSessionId(data.sessionId);
      if (data.suggestBooking && schedulerStep === 'idle') setSuggestBooking(true);

      if (exchangeCount.current === 2 && !identityCaptured && !showIdentityPrompt) {
        setShowIdentityPrompt(true);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err instanceof Error
              ? `I apologise — ${err.message} Contact us directly at inquiries@carlotajo.com if the problem persists.`
              : 'I apologise — something went wrong on my end. Please try again or contact us at inquiries@carlotajo.com.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleOpenClose = () => {
    if (!open && messages.length <= 1) setHasNewMessage(false);
    setOpen((v) => !v);
  };

  const formatDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              bottom: '96px',
              right: '24px',
              width: '380px',
              maxWidth: 'calc(100vw - 48px)',
              background: CREAM,
              border: `1px solid ${STONE}`,
              boxShadow: '0 12px 48px rgba(26,26,26,0.12), 0 2px 8px rgba(26,26,26,0.06)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '580px',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${STONE}`,
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: GOLD,
                    fontWeight: 500,
                    marginBottom: '2px',
                  }}
                >
                  Rosa's AI Advisor
                </p>
                <p style={{ fontSize: '13px', color: INK, fontWeight: 300 }}>
                  Carlota Jo Consulting
                </p>
              </div>
              <button
                onClick={handleOpenClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: INK_DIM,
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {messages.map((msg, i) => (
                <div key={i}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '10px 14px',
                        background: msg.role === 'user' ? GOLD : 'white',
                        color: msg.role === 'user' ? CREAM : INK,
                        fontSize: '13px',
                        fontWeight: 300,
                        lineHeight: '1.55',
                        border: msg.role === 'assistant' ? `1px solid ${STONE}` : 'none',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                  {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                    <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {msg.sources.map((src) => (
                        <div
                          key={src.id}
                          title={src.snippet}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            background: STONE_LIGHT,
                            border: `1px solid ${STONE}`,
                            fontSize: '10px',
                            color: INK_DIM,
                            cursor: 'default',
                          }}
                        >
                          <BookOpen size={9} style={{ color: GOLD }} />
                          <span>{src.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'white',
                      border: `1px solid ${STONE}`,
                    }}
                  >
                    <Loader2
                      size={14}
                      style={{ color: GOLD, animation: 'spin 1s linear infinite' }}
                    />
                  </div>
                </div>
              )}

              {showIdentityPrompt && !identityCaptured && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '14px 16px',
                    background: STONE_LIGHT,
                    border: `1px solid rgba(154,125,82,0.20)`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <UserCircle2 size={13} style={{ color: GOLD }} />
                    <p style={{ fontSize: '12px', color: INK_DIM, fontWeight: 400 }}>
                      May I know who I'm speaking with? <span style={{ color: '#b0a898' }}>(Optional)</span>
                    </p>
                  </div>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={identityNameInput}
                    onChange={(e) => setIdentityNameInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: '12px',
                      border: `1px solid ${STONE}`,
                      background: 'white',
                      color: INK,
                      outline: 'none',
                      marginBottom: '6px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Email address (optional)"
                    value={identityEmailInput}
                    onChange={(e) => setIdentityEmailInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      fontSize: '12px',
                      border: `1px solid ${STONE}`,
                      background: 'white',
                      color: INK,
                      outline: 'none',
                      marginBottom: '10px',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={saveIdentity}
                      style={{
                        flex: 1,
                        padding: '7px 0',
                        background: GOLD,
                        color: CREAM,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '0.05em',
                      }}
                    >
                      Continue
                    </button>
                    <button
                      onClick={() => { setIdentityCaptured(true); setShowIdentityPrompt(false); }}
                      style={{
                        padding: '7px 14px',
                        background: 'white',
                        color: INK_DIM,
                        border: `1px solid ${STONE}`,
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                    >
                      Skip
                    </button>
                  </div>
                </motion.div>
              )}

              {suggestBooking && !loading && schedulerStep !== 'done' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '14px 16px',
                    background: STONE_LIGHT,
                    border: `1px solid rgba(154,125,82,0.25)`,
                  }}
                >
                  {schedulerStep === 'idle' && (
                    <>
                      <p style={{ fontSize: '12px', color: INK_DIM, marginBottom: '10px', fontWeight: 300 }}>
                        Ready to speak with Rosa directly?
                      </p>
                      <button
                        onClick={startScheduler}
                        style={{
                          width: '100%',
                          padding: '9px 0',
                          background: GOLD,
                          color: CREAM,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 500,
                          letterSpacing: '0.06em',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = GOLD_LIGHT)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = GOLD)}
                      >
                        <CalendarCheck size={13} />
                        Book a consultation
                      </button>
                      <a
                        href={`${BASE_URL}booking`}
                        style={{ display: 'block', textAlign: 'center', marginTop: '8px', fontSize: '10px', color: INK_DIM, textDecoration: 'underline' }}
                      >
                        Or visit the booking page
                      </a>
                    </>
                  )}

                  {schedulerStep === 'loading-avail' && (
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                      <Loader2 size={16} style={{ color: GOLD, animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                      <p style={{ fontSize: '11px', color: INK_DIM, marginTop: '6px' }}>Loading availability…</p>
                    </div>
                  )}

                  {schedulerStep === 'date' && availability && (
                    <>
                      <p style={{ fontSize: '11px', color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Select a date</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        {availability.availableDates.slice(0, 8).map((d) => (
                          <button
                            key={d}
                            onClick={() => setSelectedDate(d)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '11px',
                              background: selectedDate === d ? GOLD : 'white',
                              color: selectedDate === d ? CREAM : INK,
                              border: `1px solid ${selectedDate === d ? GOLD : STONE}`,
                              cursor: 'pointer',
                            }}
                          >
                            {formatDate(d)}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setSchedulerStep('time')}
                        disabled={!selectedDate}
                        style={{
                          width: '100%',
                          padding: '8px 0',
                          background: selectedDate ? GOLD : STONE,
                          color: CREAM,
                          border: 'none',
                          cursor: selectedDate ? 'pointer' : 'not-allowed',
                          fontSize: '11px',
                          fontWeight: 500,
                        }}
                      >
                        Next →
                      </button>
                    </>
                  )}

                  {schedulerStep === 'time' && availability && (
                    <>
                      <p style={{ fontSize: '11px', color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Select a time — {formatDate(selectedDate)} ({availability.timezone})
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        {availability.timeSlots.map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedTime(t)}
                            style={{
                              padding: '5px 10px',
                              fontSize: '11px',
                              background: selectedTime === t ? GOLD : 'white',
                              color: selectedTime === t ? CREAM : INK,
                              border: `1px solid ${selectedTime === t ? GOLD : STONE}`,
                              cursor: 'pointer',
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => setSchedulerStep('date')}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            background: 'white',
                            color: INK_DIM,
                            border: `1px solid ${STONE}`,
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setSchedulerStep('tier')}
                          disabled={!selectedTime}
                          style={{
                            flex: 2,
                            padding: '8px 0',
                            background: selectedTime ? GOLD : STONE,
                            color: CREAM,
                            border: 'none',
                            cursor: selectedTime ? 'pointer' : 'not-allowed',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}
                        >
                          Next →
                        </button>
                      </div>
                    </>
                  )}

                  {schedulerStep === 'tier' && (
                    <>
                      <p style={{ fontSize: '11px', color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Select engagement type
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                        {Object.entries(TIER_LABELS).map(([value, label]) => (
                          <button
                            key={value}
                            onClick={() => setSelectedTier(value)}
                            style={{
                              padding: '8px 12px',
                              fontSize: '11px',
                              textAlign: 'left',
                              background: selectedTier === value ? GOLD : 'white',
                              color: selectedTier === value ? CREAM : INK,
                              border: `1px solid ${selectedTier === value ? GOLD : STONE}`,
                              cursor: 'pointer',
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => setSchedulerStep('time')}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            background: 'white',
                            color: INK_DIM,
                            border: `1px solid ${STONE}`,
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setSchedulerStep('confirm')}
                          style={{
                            flex: 2,
                            padding: '8px 0',
                            background: GOLD,
                            color: CREAM,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}
                        >
                          Review →
                        </button>
                      </div>
                    </>
                  )}

                  {schedulerStep === 'confirm' && (
                    <>
                      <p style={{ fontSize: '11px', color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
                        Confirm your booking
                      </p>
                      <div style={{ fontSize: '12px', color: INK, lineHeight: '1.8', marginBottom: '10px' }}>
                        <div><span style={{ color: INK_DIM }}>Date:</span> {formatDate(selectedDate)}</div>
                        <div><span style={{ color: INK_DIM }}>Time:</span> {selectedTime} ET</div>
                        <div><span style={{ color: INK_DIM }}>Type:</span> {TIER_LABELS[selectedTier]}</div>
                        {visitorName && <div><span style={{ color: INK_DIM }}>Name:</span> {visitorName}</div>}
                        {visitorEmail && <div><span style={{ color: INK_DIM }}>Email:</span> {visitorEmail}</div>}
                      </div>
                      {bookingError && (
                        <p style={{ fontSize: '11px', color: '#c0392b', marginBottom: '8px' }}>{bookingError}</p>
                      )}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => setSchedulerStep('tier')}
                          style={{
                            flex: 1,
                            padding: '8px 0',
                            background: 'white',
                            color: INK_DIM,
                            border: `1px solid ${STONE}`,
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          ← Edit
                        </button>
                        <button
                          onClick={confirmBooking}
                          style={{
                            flex: 2,
                            padding: '8px 0',
                            background: GOLD,
                            color: CREAM,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}
                        >
                          Confirm booking
                        </button>
                      </div>
                    </>
                  )}

                  {schedulerStep === 'submitting' && (
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                      <Loader2 size={16} style={{ color: GOLD, animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                      <p style={{ fontSize: '11px', color: INK_DIM, marginTop: '6px' }}>Confirming your booking…</p>
                    </div>
                  )}
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            <div
              style={{
                padding: '12px 16px',
                borderTop: `1px solid ${STONE}`,
                background: 'white',
                flexShrink: 0,
              }}
            >
              {(visitorName || visitorEmail) && (
                <p style={{ fontSize: '10px', color: GOLD, marginBottom: '6px' }}>
                  Speaking with: {[visitorName, visitorEmail].filter(Boolean).join(' · ')}
                </p>
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: `1px solid ${STONE}`,
                  padding: '8px 12px',
                  background: CREAM,
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about our services…"
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    fontWeight: 300,
                    color: INK,
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                    color: loading || !input.trim() ? STONE : GOLD,
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  aria-label="Send message"
                >
                  <Send size={14} />
                </button>
              </div>
              <p style={{ fontSize: '10px', color: '#b0a898', marginTop: '8px', textAlign: 'center' }}>
                AI-assisted. All enquiries handled with complete confidentiality.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleOpenClose}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          background: GOLD,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: CREAM,
          zIndex: 9998,
          boxShadow: '0 4px 20px rgba(154,125,82,0.35)',
        }}
        aria-label={open ? 'Close advisor chat' : 'Open advisor chat'}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={20} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle size={20} />
            </motion.span>
          )}
        </AnimatePresence>
        {hasNewMessage && !open && (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#e05a4e',
              border: '1.5px solid white',
            }}
          />
        )}
      </motion.button>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
