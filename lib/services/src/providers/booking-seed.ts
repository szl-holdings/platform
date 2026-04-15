import type { DataProvider } from "./factory.js";

export interface BookingAppointment {
  id: string;
  clientName: string;
  clientEmail: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  advisor: string;
  notes: string;
}

const SEED_DATA: BookingAppointment[] = [
  {
    id: "b-001",
    clientName: "Alexandra Whitfield",
    clientEmail: "a.whitfield@example.com",
    service: "Strategic Portfolio Review",
    date: "2026-04-02",
    time: "10:00",
    duration: 60,
    status: "confirmed",
    advisor: "Carlota J. Méndez",
    notes: "Quarterly review of venture holdings",
  },
  {
    id: "b-002",
    clientName: "James Chen",
    clientEmail: "j.chen@example.com",
    service: "Market Entry Advisory",
    date: "2026-04-03",
    time: "14:30",
    duration: 90,
    status: "pending",
    advisor: "Carlota J. Méndez",
    notes: "APAC expansion strategy session",
  },
  {
    id: "b-003",
    clientName: "Sofia Reyes",
    clientEmail: "s.reyes@example.com",
    service: "Investment Due Diligence",
    date: "2026-04-05",
    time: "09:00",
    duration: 120,
    status: "confirmed",
    advisor: "Carlota J. Méndez",
    notes: "Series B evaluation for maritime tech startup",
  },
];

export const bookingSeedProvider: DataProvider<BookingAppointment> = {
  mode: "seed",
  async getAll() {
    return SEED_DATA;
  },
  async getById(id: string) {
    return SEED_DATA.find((b) => b.id === id) ?? null;
  },
  async search(query: string) {
    const q = query.toLowerCase();
    return SEED_DATA.filter(
      (b) =>
        b.clientName.toLowerCase().includes(q) ||
        b.service.toLowerCase().includes(q) ||
        b.advisor.toLowerCase().includes(q),
    );
  },
};
