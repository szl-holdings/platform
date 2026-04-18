export interface SystemCheck {
  id: string;
  system: string;
  status: "online" | "offline" | "pending";
  criticality: "critical" | "standard";
  details: string;
}

export interface VendorTwin {
  id: string;
  name: string;
  specialty: string;
  status: "online" | "offline";
  lastActive: string;
}

export interface EstateRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  freshness: "live" | "recent" | "stale";
  policyState: "cleared" | "conditional" | "flagged";
  evidence: string;
}

export interface PropertyTwin {
  id: string;
  name: string;
  readinessScore: number;
  expectedArrival: {
    guestName: string;
    countdown: string;
  };
  systemChecks: SystemCheck[];
  vendors: VendorTwin[];
  recommendations: EstateRecommendation[];
}

export const CASTELLANO_ESTATE_TWIN: PropertyTwin = {
  id: "prop-castellano",
  name: "Castellano Estate",
  readinessScore: 60,
  expectedArrival: {
    guestName: "Marchetti Family",
    countdown: "T-18h",
  },
  systemChecks: [
    {
      id: "sys-pool-heat",
      system: "Pool Heating",
      status: "offline",
      criticality: "critical",
      details: "Sensor breach at heat exchanger.",
    },
    {
      id: "sys-wine-temp",
      system: "Wine Cellar Temp",
      status: "offline",
      criticality: "critical",
      details: "3°C over threshold (16°C current).",
    },
    {
      id: "sys-linen",
      system: "Master Suite Linen",
      status: "pending",
      criticality: "standard",
      details: "Housekeeping in progress.",
    },
    {
      id: "sys-security-reset",
      system: "Security Code Reset",
      status: "pending",
      criticality: "standard",
      details: "Awaiting guest confirmation of preferred salt.",
    },
  ],
  vendors: [
    {
      id: "vend-pool",
      name: "BlueWave Pool Services",
      specialty: "Aquatic Systems",
      status: "online",
      lastActive: "10m ago",
    },
    {
      id: "vend-climate",
      name: "Artisan Climate Control",
      specialty: "HVAC & Cellar",
      status: "online",
      lastActive: "4h ago",
    },
    {
      id: "vend-security",
      name: "Sentra Home Defense",
      specialty: "Physical Security",
      status: "online",
      lastActive: "1m ago",
    },
  ],
  recommendations: [
    {
      id: "rec-sensor-breach",
      title: "Immediate Maintenance Dispatch",
      description: "Sensor breach detected in pool heat exchanger coincided with a localized power surge. High probability of ignition failure.",
      confidence: 0.94,
      freshness: "live",
      policyState: "cleared",
      evidence: "Sensor 491-B reported open circuit + VIP arrival proximity (T-18h).",
    },
  ],
};
