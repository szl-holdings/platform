import type { DataProvider } from "./factory.js";

export interface VesselRecord {
  id: string;
  name: string;
  imo: string;
  mmsi: string;
  type: string;
  flag: string;
  status: "underway" | "anchored" | "moored" | "not_under_command";
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  destination: string;
  eta: string;
  lastUpdate: string;
}

const SEED_DATA: VesselRecord[] = [
  {
    id: "v-001",
    name: "MV Oceanic Pioneer",
    imo: "9876543",
    mmsi: "235098765",
    type: "Bulk Carrier",
    flag: "GB",
    status: "underway",
    latitude: 51.5074,
    longitude: -0.1278,
    speed: 12.5,
    heading: 245,
    destination: "Rotterdam",
    eta: "2026-04-01T08:00:00Z",
    lastUpdate: "2026-03-26T10:00:00Z",
  },
  {
    id: "v-002",
    name: "SS Atlantic Star",
    imo: "9123456",
    mmsi: "636012345",
    type: "Container Ship",
    flag: "LR",
    status: "anchored",
    latitude: 40.6892,
    longitude: -74.0445,
    speed: 0,
    heading: 180,
    destination: "New York",
    eta: "2026-03-27T14:00:00Z",
    lastUpdate: "2026-03-26T09:30:00Z",
  },
  {
    id: "v-003",
    name: "MV Pacific Horizon",
    imo: "9234567",
    mmsi: "440234567",
    type: "Tanker",
    flag: "KR",
    status: "underway",
    latitude: 35.6762,
    longitude: 139.6503,
    speed: 14.2,
    heading: 90,
    destination: "Singapore",
    eta: "2026-04-05T06:00:00Z",
    lastUpdate: "2026-03-26T11:00:00Z",
  },
];

export const vesselsSeedProvider: DataProvider<VesselRecord> = {
  mode: "seed",
  async getAll() {
    return SEED_DATA;
  },
  async getById(id: string) {
    return SEED_DATA.find((v) => v.id === id) ?? null;
  },
  async search(query: string) {
    const q = query.toLowerCase();
    return SEED_DATA.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.destination.toLowerCase().includes(q) ||
        v.imo.includes(q),
    );
  },
};
