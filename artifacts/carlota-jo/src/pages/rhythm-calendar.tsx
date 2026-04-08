import { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays, ChevronLeft, ChevronRight, Home, Plane, Wrench,
  Users, Star, Clock, MapPin, Circle,
} from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const GOLD = "rgba(196,170,126,1)";
const GOLD_DIM = "rgba(196,170,126,0.08)";
const GOLD_BORDER = "rgba(196,170,126,0.15)";
const CREAM = "rgba(244,237,224,0.88)";
const CREAM_DIM = "rgba(244,237,224,0.45)";
const CREAM_FAINT = "rgba(244,237,224,0.07)";
const MUTED = "rgba(244,237,224,0.25)";

type EventKind = "confirmed" | "predicted" | "maintenance" | "travel" | "seasonal" | "review";

type CalEvent = {
  id: string;
  date: string;
  title: string;
  kind: EventKind;
  location?: string;
  duration?: string;
  notes?: string;
};

const kindConfig: Record<EventKind, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  confirmed: { color: GOLD, bg: GOLD_DIM, icon: Star, label: "Confirmed" },
  predicted: { color: "rgba(139,92,246,0.85)", bg: "rgba(139,92,246,0.07)", icon: Circle, label: "Predicted" },
  maintenance: { color: "rgba(245,158,11,0.85)", bg: "rgba(245,158,11,0.07)", icon: Wrench, label: "Maintenance" },
  travel: { color: "rgba(6,182,212,0.85)", bg: "rgba(6,182,212,0.07)", icon: Plane, label: "Travel" },
  seasonal: { color: "rgba(16,185,129,0.8)", bg: "rgba(16,185,129,0.07)", icon: Home, label: "Seasonal" },
  review: { color: GOLD, bg: GOLD_DIM, icon: Users, label: "Review" },
};

const events: CalEvent[] = [
  { id: "e1", date: "2026-04-07", title: "Q2 Review Session", kind: "review", location: "London, Mayfair", duration: "2 hours", notes: "Quarterly engagement review with Rosa. Focus: Q2 priorities, summer transition plan." },
  { id: "e2", date: "2026-04-14", title: "Oxfordshire opening inspection", kind: "predicted", location: "Oxfordshire Estate", duration: "Half day", notes: "Anticipated based on 2-year pattern. Anticipation Engine flagged — not yet confirmed." },
  { id: "e3", date: "2026-04-21", title: "Oxfordshire Property Walkthrough", kind: "confirmed", location: "Oxfordshire", duration: "Full day", notes: "On-site visit confirmed. Rosa + property team. Vendor reviews included." },
  { id: "e4", date: "2026-04-28", title: "Summer vendor contract reviews", kind: "predicted", location: "Remote / Mayfair", notes: "Predicted: Summer Oxfordshire vendors (landscaping, pool, cleaning) — renewals due." },
  { id: "e5", date: "2026-05-04", title: "Seasonal transition: Oxfordshire opens", kind: "seasonal", location: "Oxfordshire Estate", notes: "Historical pattern: estate opens first week of May. Staff transition and seasonal prep." },
  { id: "e6", date: "2026-05-11", title: "Summer staffing briefing", kind: "predicted", location: "Mayfair / Oxfordshire", notes: "Predicted: Brief summer staff, confirm cover for Mrs. Chambers July leave." },
  { id: "e7", date: "2026-06-08", title: "New York travel", kind: "travel", location: "New York — The Carlyle", duration: "5–7 days", notes: "Historical June pattern. Predicted. Suite pre-hold recommended." },
  { id: "e8", date: "2026-07-06", title: "Q3 Review Session", kind: "review", location: "London, Mayfair", duration: "2 hours", notes: "Quarterly review — predicted based on Q1 and Q2 patterns." },
  { id: "e9", date: "2026-07-13", title: "Mrs. Chambers summer leave begins", kind: "predicted", location: "Mayfair", notes: "Predicted: 6-week leave (2024, 2025 pattern). Cover arrangement must be confirmed." },
  { id: "e10", date: "2026-09-08", title: "Heating system service — Mayfair", kind: "maintenance", location: "Mayfair Residence", notes: "Annual boiler + heating service. Early booking required (Heritage Heating, 4–6 week lead)." },
  { id: "e11", date: "2026-09-14", title: "Heating system service — Oxfordshire", kind: "maintenance", location: "Oxfordshire Estate", notes: "Annual service. Back-to-back with Mayfair where possible." },
  { id: "e12", date: "2026-09-28", title: "Seasonal transition: Oxfordshire closes", kind: "seasonal", location: "Oxfordshire Estate", notes: "Historical pattern: estate closes late September. Winterisation, caretaker handover." },
  { id: "e13", date: "2026-10-05", title: "Q4 Review Session", kind: "review", location: "London, Mayfair", duration: "2 hours", notes: "Quarterly review — predicted. Focus: winter season planning, year-end preparations." },
  { id: "e14", date: "2026-11-15", title: "Monaco travel — predicted", kind: "travel", location: "Monaco", duration: "4–5 days", notes: "Historical November pattern observed in 2024 and 2025." },
  { id: "e15", date: "2026-12-14", title: "Festive staffing uplift — Oxfordshire", kind: "seasonal", location: "Oxfordshire Estate", notes: "Family gathering pattern. Elevated staffing, additional catering. 2-week window before Christmas." },
  { id: "e16", date: "2026-12-20", title: "Festive period — Oxfordshire base", kind: "seasonal", location: "Oxfordshire Estate", notes: "Annual: client and family at Oxfordshire for Christmas and New Year period." },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  const startDow = (firstDay.getDay() + 6) % 7;
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -startDow + i + 1);
    days.push(d);
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    days.push(next);
  }
  return days;
}

function dateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function EventDot({ kind }: { kind: EventKind }) {
  const cfg = kindConfig[kind];
  return (
    <div
      className="w-1.5 h-1.5 rounded-full shrink-0"
      style={{ background: cfg.color }}
    />
  );
}

function EventPill({ event }: { event: CalEvent }) {
  const cfg = kindConfig[event.kind];
  const Icon = cfg.icon;
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 mb-0.5 truncate"
      style={{ background: cfg.bg, borderLeft: `2px solid ${cfg.color}` }}
    >
      <Icon size={8} style={{ color: cfg.color, shrink: 0 }} />
      <span className="text-[9px] truncate" style={{ color: cfg.color }}>{event.title}</span>
    </div>
  );
}

export default function RhythmCalendar() {
  usePageMeta({
    title: "Household Rhythm Calendar | Carlota Jo",
    description: "Predicted service windows, seasonal transitions, travel rhythms, and confirmed bookings — all in one view.",
    canonical: "https://szlholdings.com/carlota-jo/rhythm-calendar",
  });

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = getDaysInMonth(viewYear, viewMonth);
  const currentMonth = viewMonth;

  const eventsForDate = (ds: string) => events.filter(e => e.date === ds);
  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const activeKinds = Object.keys(kindConfig) as EventKind[];

  return (
    <div className="min-h-screen" style={{ background: "#0e0c09", color: CREAM }}>
      <div className="max-w-6xl mx-auto px-6 py-10 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 flex items-center justify-center" style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}` }}>
              <CalendarDays size={15} style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-[9px] tracking-[0.32em] uppercase font-medium" style={{ color: "rgba(196,170,126,0.5)" }}>
                Intelligence Layer
              </p>
              <h1 className="text-xl font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: CREAM }}>
                Household Rhythm Calendar
              </h1>
            </div>
          </div>

          <p className="text-[13px] font-light leading-relaxed max-w-2xl mb-6" style={{ color: CREAM_DIM }}>
            Confirmed bookings and predicted service windows, seasonal transitions, travel rhythms, and review sessions in a single view. Predicted events are derived from the Preference Genome and Anticipation Engine — they appear dimmed until confirmed.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            {activeKinds.map((k) => {
              const cfg = kindConfig[k];
              const Icon = cfg.icon;
              return (
                <div key={k} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                  <Icon size={10} style={{ color: cfg.color }} />
                  <span className="text-[9px] tracking-wider uppercase" style={{ color: MUTED }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div style={{ border: `1px solid ${GOLD_BORDER}`, background: "rgba(14,12,9,0.6)" }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${CREAM_FAINT}` }}>
                <button onClick={prevMonth} className="p-1.5 transition-opacity hover:opacity-75" style={{ color: MUTED }}>
                  <ChevronLeft size={16} />
                </button>
                <div className="text-center">
                  <p className="text-[14px] font-light" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: CREAM }}>
                    {MONTHS[viewMonth]} {viewYear}
                  </p>
                </div>
                <button onClick={nextMonth} className="p-1.5 transition-opacity hover:opacity-75" style={{ color: MUTED }}>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 border-b" style={{ borderColor: CREAM_FAINT }}>
                {DAYS.map(d => (
                  <div key={d} className="py-2 text-center text-[9px] tracking-[0.15em] uppercase" style={{ color: MUTED }}>
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {days.map((day, i) => {
                  const ds = dateStr(day);
                  const dayEvents = eventsForDate(ds);
                  const isCurrentMonth = day.getMonth() === currentMonth;
                  const isToday = ds === dateStr(today);
                  const isSelected = ds === selectedDate;

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(isSelected ? null : ds)}
                      className="min-h-[72px] p-1.5 text-left transition-colors"
                      style={{
                        borderRight: (i + 1) % 7 !== 0 ? `1px solid ${CREAM_FAINT}` : "none",
                        borderBottom: i < days.length - 7 ? `1px solid ${CREAM_FAINT}` : "none",
                        background: isSelected ? "rgba(196,170,126,0.06)" : "transparent",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-[11px] w-5 h-5 flex items-center justify-center"
                          style={{
                            color: !isCurrentMonth ? "rgba(244,237,224,0.12)" : isToday ? "#0e0c09" : MUTED,
                            background: isToday ? GOLD : "transparent",
                            borderRadius: isToday ? "50%" : 0,
                            fontFamily: isToday ? "'Cormorant Garamond', Georgia, serif" : undefined,
                          }}
                        >
                          {day.getDate()}
                        </span>
                        {dayEvents.length > 1 && (
                          <span className="text-[8px]" style={{ color: MUTED }}>{dayEvents.length}</span>
                        )}
                      </div>
                      {dayEvents.slice(0, 2).map(ev => (
                        <EventPill key={ev.id} event={ev} />
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[8px] pl-1" style={{ color: MUTED }}>+{dayEvents.length - 2} more</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {selectedDate && selectedEvents.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-[9px] tracking-[0.25em] uppercase mb-3" style={{ color: MUTED }}>
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
                <div className="space-y-3">
                  {selectedEvents.map(ev => {
                    const cfg = kindConfig[ev.kind];
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={ev.id}
                        className="p-4"
                        style={{ border: `1px solid ${cfg.color}30`, background: cfg.bg }}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <Icon size={12} style={{ color: cfg.color, marginTop: 1 }} />
                          <div className="flex-1">
                            <p className="text-[11px] tracking-wider uppercase mb-0.5" style={{ color: cfg.color }}>{cfg.label}</p>
                            <p className="text-[13px] font-light" style={{ color: CREAM, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                              {ev.title}
                            </p>
                          </div>
                        </div>
                        {ev.location && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <MapPin size={10} style={{ color: MUTED }} />
                            <p className="text-[11px] font-light" style={{ color: CREAM_DIM }}>{ev.location}</p>
                          </div>
                        )}
                        {ev.duration && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <Clock size={10} style={{ color: MUTED }} />
                            <p className="text-[11px] font-light" style={{ color: CREAM_DIM }}>{ev.duration}</p>
                          </div>
                        )}
                        {ev.notes && (
                          <p className="text-[11px] font-light leading-relaxed mt-2" style={{ color: CREAM_DIM }}>
                            {ev.notes}
                          </p>
                        )}
                        {ev.kind === "predicted" && (
                          <p className="text-[9px] mt-2 tracking-wider uppercase" style={{ color: "rgba(139,92,246,0.6)" }}>
                            Predicted — awaiting confirmation
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <div>
                <p className="text-[9px] tracking-[0.25em] uppercase mb-4" style={{ color: MUTED }}>Upcoming events</p>
                <div className="space-y-2">
                  {events
                    .filter(e => e.date >= dateStr(today))
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(0, 6)
                    .map(ev => {
                      const cfg = kindConfig[ev.kind];
                      const Icon = cfg.icon;
                      const d = new Date(ev.date + "T12:00:00");
                      return (
                        <button
                          key={ev.id}
                          onClick={() => { setSelectedDate(ev.date); setViewMonth(d.getMonth()); setViewYear(d.getFullYear()); }}
                          className="w-full text-left p-3 transition-colors"
                          style={{ border: `1px solid ${CREAM_FAINT}`, background: "rgba(14,12,9,0.4)" }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = GOLD_BORDER)}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = CREAM_FAINT)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <EventDot kind={ev.kind} />
                            <span className="text-[9px] tracking-wider uppercase" style={{ color: cfg.color }}>{cfg.label}</span>
                          </div>
                          <p className="text-[12px] font-light" style={{ color: CREAM }}>{ev.title}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>
                            {d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            {ev.location ? ` · ${ev.location}` : ""}
                          </p>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
