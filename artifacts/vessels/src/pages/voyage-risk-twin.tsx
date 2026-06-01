import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  EyeOff,
  FileText,
  Fuel,
  GitBranch,
  Info,
  Layers,
  Loader2,
  Navigation,
  Radio,
  RefreshCw,
  Shield,
  Ship,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const ACCENT = '#4d8fcc';
const BG_CARD = 'rgba(10,22,40,0.85)';
const BG_CARD_INNER = 'rgba(255,255,255,0.03)';
const BORDER = 'rgba(77,143,204,0.12)';

// ── Data contracts ───────────────────────────────────────────────────────────

interface EvidenceItem {
  signal: string;
  source: string;
  confidence: number;
}

interface RiskDimension {
  score: number;
  level: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  summary: string;
  evidence: EvidenceItem[];
}

interface EconomicsSnapshot {
  fuelMt: number;
  fuelCostUsd: number;
  bunkerprice: number;
  transitDays: number;
  revenueUsd: number;
  tce: number;
  profitUsd: number;
  portDisbursementsUsd: number;
  canalFeesUsd: number;
  totalCostsUsd: number;
  marginPct: number;
}

interface OwnerNode {
  name: string;
  jurisdiction: string;
  type: 'vessel' | 'company' | 'person' | 'state';
  sanctioned: boolean;
  opacity: 'transparent' | 'partial' | 'opaque';
  notes?: string;
}

interface CounterpartySnapshot {
  charterer: string;
  chartererCountry: string;
  sanctionRisk: 'none' | 'watch' | 'elevated' | 'critical';
  creditRating: string;
  beneficialControl: OwnerNode[];
  keyRisk: string;
}

interface VoyageScenario {
  id: string;
  label: string;
  vessel: { name: string; imo: string; flag: string; type: string; dwt: number; age: number };
  route: {
    origin: string;
    destination: string;
    variant: string;
    distanceNm: number;
    chokepoints: string[];
  };
  dataLabel: 'demo' | 'sampled';
  risk: {
    sanctions: RiskDimension;
    darkActivity: RiskDimension;
    weather: RiskDimension;
    sts: RiskDimension;
    counterparty: RiskDimension;
    composite: number;
  };
  economics: EconomicsSnapshot;
  counterparty: CounterpartySnapshot;
}

// ── API types (from backend voyage-risk contract) ─────────────────────────────

interface ApiEvidenceSignal {
  signal: string;
  source: string;
  confidence: number;
  dataLabel: 'live' | 'sampled' | 'demo';
}

interface ApiRiskDimension {
  score: number;
  level: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  summary: string;
  evidence: ApiEvidenceSignal[];
}

interface ApiVoyageRiskScore {
  scenarioId: string;
  vessel: { name: string; imo: string; flag: string; type: string; dwt: number; ageYears: number };
  route: {
    origin: string;
    destination: string;
    variant: string;
    distanceNm: number;
    chokepoints: string[];
  };
  risk: {
    sanctions: ApiRiskDimension;
    darkActivity: ApiRiskDimension;
    weather: ApiRiskDimension;
    sts: ApiRiskDimension;
    counterparty: ApiRiskDimension;
    composite: number;
    compositeLevel: string;
    recommendation: string;
  };
  economics: {
    fuelMt: number;
    bunkerPriceUsd: number;
    fuelCostUsd: number;
    transitDays: number;
    distanceNm: number;
    revenueUsd: number;
    tce: number;
    profitUsd: number;
    portDisbursementsUsd: number;
    canalFeesUsd: number;
    totalCostsUsd: number;
    marginPct: number;
    dataLabel: string;
  };
  counterparty: {
    charterer: string;
    chartererCountry: string;
    sanctionRisk: 'none' | 'watch' | 'elevated' | 'critical';
    creditRating: string;
    beneficialControlChain: {
      name: string;
      jurisdiction: string;
      entityType: string;
      sanctioned: boolean;
      opacity: string;
      notes?: string;
    }[];
    keyRisk: string;
  };
  provenance: {
    dataLabel: string;
    confidence: number;
    attestation: string;
    generatedAt: string;
    note: string;
  };
}

// ── Scenario params for API ────────────────────────────────────────────────────

const SCENARIO_PARAMS: Record<
  string,
  {
    vesselName: string;
    vesselImo: string;
    origin: string;
    destination: string;
    routeVariant: string;
    cargoType: string;
    chartererName: string;
  }
> = {
  'SCN-001': {
    vesselName: 'Pacific Guardian',
    vesselImo: '9821045',
    origin: 'Ras Tanura, SA',
    destination: 'Rotterdam, NL',
    routeVariant: 'Suez Canal',
    cargoType: 'Crude Oil',
    chartererName: 'Apex Voyages DMCC',
  },
  'SCN-002': {
    vesselName: 'Nordic Carrier',
    vesselImo: '9445566',
    origin: 'Houston, USA',
    destination: 'Rotterdam, NL',
    routeVariant: 'Cape of Good Hope',
    cargoType: 'Refined Products',
    chartererName: 'Shell Trading Rotterdam BV',
  },
  'SCN-003': {
    vesselName: 'Orient Meridian',
    vesselImo: '9654789',
    origin: 'Novorossiysk, RU',
    destination: 'Fujairah, UAE',
    routeVariant: 'Turkish Straits Suez',
    cargoType: 'Russian Crude (URALS)',
    chartererName: 'Caspian Energy Partners Ltd.',
  },
};

async function fetchVoyageRiskScore(scenarioId: string): Promise<ApiVoyageRiskScore | null> {
  const params = SCENARIO_PARAMS[scenarioId];
  if (!params) return null;
  try {
    const res = await fetch('/api/vessels/voyage-risk/score', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: ApiVoyageRiskScore };
    return json.data ?? null;
  } catch {
    return null;
  }
}

async function downloadPdfMemo(apiScore: ApiVoyageRiskScore): Promise<boolean> {
  try {
    const res = await fetch('/api/vessels/voyage-risk/memo/pdf', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiScore),
    });
    if (!res.ok) return false;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-memo-${apiScore.scenarioId.toLowerCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

// ── Demo scenarios ────────────────────────────────────────────────────────────

const SCENARIOS: VoyageScenario[] = [
  {
    id: 'SCN-001',
    label: 'Pacific Guardian — Ras Tanura → Rotterdam (Suez)',
    vessel: {
      name: 'Pacific Guardian',
      imo: '9821045',
      flag: 'Marshall Islands',
      type: 'VLCC',
      dwt: 299_000,
      age: 7,
    },
    route: {
      origin: 'Ras Tanura, SA',
      destination: 'Rotterdam, NL',
      variant: 'Suez Canal',
      distanceNm: 11_450,
      chokepoints: ['Strait of Hormuz', 'Bab-el-Mandeb', 'Suez Canal'],
    },
    dataLabel: 'demo',
    risk: {
      sanctions: {
        score: 68,
        level: 'high',
        summary:
          'Charterer entity partially matched on EU Consolidated list. Beneficial-control chain passes through Iranian-adjacent intermediary registered in UAE.',
        evidence: [
          {
            signal: "Charterer 'Apex Voyages DMCC' — 72% name-match on EU SDN (case #EU-2024-0881)",
            source: 'EU Consolidated List',
            confidence: 72,
          },
          {
            signal:
              "Beneficial controller 'Mehr Shipping Holdings' — Cayman entity; known correspondent of IRISL subsidiary",
            source: 'OFAC SDN / WorldCheck',
            confidence: 61,
          },
          {
            signal: 'Vessel called Port of Bandar Abbas (sanctioned port) 14 months ago — 2 calls',
            source: 'AIS Historical (MarineTraffic sample)',
            confidence: 84,
          },
        ],
      },
      darkActivity: {
        score: 34,
        level: 'moderate',
        summary:
          'Two AIS gaps detected in the previous voyage: 8h in Persian Gulf, 4h near Djibouti. No confirmed STS event but gap pattern warrants monitoring.',
        evidence: [
          {
            signal:
              'AIS gap: 8h 12m at 26.1°N 55.8°E (Persian Gulf anchorage cluster) — prior voyage',
            source: 'AIS Gap Analysis (sampled feed)',
            confidence: 78,
          },
          {
            signal: 'AIS gap: 4h 05m near 11.6°N 43.2°E (Bab-el-Mandeb approach) — prior voyage',
            source: 'AIS Gap Analysis (sampled feed)',
            confidence: 65,
          },
          {
            signal: 'Speed anomaly: drop from 13kts to 0.4kts for 3.5h — no declared anchorage',
            source: 'AIS Speed Profile',
            confidence: 71,
          },
        ],
      },
      weather: {
        score: 22,
        level: 'low',
        summary:
          'Arabian Sea moderate swell (1.8m) expected Days 3–5. Red Sea passage expected calm. North Atlantic approach within norms for the season.',
        evidence: [
          {
            signal: 'Arabian Sea: Swell 1.8m, wind 18kts — moderate — ETA impact +6h modeled',
            source: 'ECMWF 10-day forecast (demo)',
            confidence: 80,
          },
          {
            signal: 'Red Sea: Calm conditions, wind <12kts, wave height 0.9m',
            source: 'ECMWF 10-day forecast (demo)',
            confidence: 85,
          },
          {
            signal: 'No tropical storm systems in routing corridor for voyage window',
            source: 'NHC / JTWC advisory (demo)',
            confidence: 90,
          },
        ],
      },
      sts: {
        score: 41,
        level: 'moderate',
        summary:
          "Vessel's prior voyage included a probable STS event in the Persian Gulf (AIS gap + proximity cluster). Current voyage routing passes known STS anchor zones.",
        evidence: [
          {
            signal:
              "Prior voyage: proximity <200m to 'Kazan Spirit' (Russia flag) for 4h at 26.1°N 55.8°E during AIS blackout",
            source: 'AIS Proximity Analysis',
            confidence: 76,
          },
          {
            signal:
              'Route passes Khor Fakkan anchorage — active STS coordination zone (12 events in 90 days)',
            source: 'Vessels STS Intelligence',
            confidence: 80,
          },
          {
            signal:
              'Owner chain includes 2 shell entities linked to Gulf-based dark fleet intermediaries',
            source: 'Ownership Graph Analysis',
            confidence: 58,
          },
        ],
      },
      counterparty: {
        score: 61,
        level: 'high',
        summary:
          'Charterer opacity is elevated. Beneficial controller is a Cayman entity with potential IRISL links. Credit quality is unrated.',
        evidence: [
          {
            signal:
              'Charterer: 3-entity chain — UAE LLC → Cayman holding → Unknown beneficial owner',
            source: 'Ownership Graph / GLEIF',
            confidence: 62,
          },
          {
            signal: 'Payment record: 1 overdue event (47 days) in past 12 months',
            source: 'Credit Bureau (demo)',
            confidence: 70,
          },
          {
            signal: 'No public credit rating; comparable peer rated CCC+ by S&P',
            source: 'Credit Assessment (demo)',
            confidence: 55,
          },
        ],
      },
      composite: 54,
    },
    economics: {
      fuelMt: 4_820,
      bunkerprice: 620,
      fuelCostUsd: 2_988_400,
      transitDays: 22,
      revenueUsd: 7_200_000,
      tce: 48_000,
      profitUsd: 1_432_000,
      portDisbursementsUsd: 340_000,
      canalFeesUsd: 410_000,
      totalCostsUsd: 5_768_400,
      marginPct: 19.9,
    },
    counterparty: {
      charterer: 'Apex Voyages DMCC',
      chartererCountry: 'UAE',
      sanctionRisk: 'elevated',
      creditRating: 'Unrated',
      keyRisk: 'Beneficial controller linked to IRISL-adjacent intermediary; opacity elevated',
      beneficialControl: [
        {
          name: 'Apex Voyages DMCC',
          jurisdiction: 'UAE',
          type: 'company',
          sanctioned: false,
          opacity: 'partial',
        },
        {
          name: 'Meridian Bulk Holdings Ltd.',
          jurisdiction: 'Cayman Islands',
          type: 'company',
          sanctioned: false,
          opacity: 'opaque',
          notes: 'UBO unknown',
        },
        {
          name: 'Mehr Shipping Holdings (suspected)',
          jurisdiction: 'Unknown',
          type: 'company',
          sanctioned: true,
          opacity: 'opaque',
          notes: 'Probable IRISL correspondent',
        },
      ],
    },
  },
  {
    id: 'SCN-002',
    label: 'Nordic Carrier — Houston → Rotterdam (Cape of Good Hope alt)',
    vessel: {
      name: 'Nordic Carrier',
      imo: '9445566',
      flag: 'Norway',
      type: 'Suezmax',
      dwt: 157_000,
      age: 4,
    },
    route: {
      origin: 'Houston, USA',
      destination: 'Rotterdam, NL',
      variant: 'Cape of Good Hope',
      distanceNm: 11_800,
      chokepoints: ['Cape of Good Hope', 'Gulf of Guinea'],
    },
    dataLabel: 'demo',
    risk: {
      sanctions: {
        score: 8,
        level: 'low',
        summary:
          'No sanctions exposure detected. Charterer (Shell Trading) is a well-known, publicly listed entity. Beneficial ownership fully transparent.',
        evidence: [
          {
            signal: 'Charterer Shell Trading Rotterdam BV — OFAC clear, EU clear, UK clear',
            source: 'OFAC / EU / UK OFSI',
            confidence: 98,
          },
          {
            signal: 'Registered owner: Nordic Tankers AS — Norway, publicly listed (Oslo Bors)',
            source: "Lloyd's Register / GLEIF",
            confidence: 99,
          },
          {
            signal: 'No port calls in sanctioned jurisdictions in past 36 months',
            source: 'AIS Historical',
            confidence: 95,
          },
        ],
      },
      darkActivity: {
        score: 6,
        level: 'low',
        summary:
          'No AIS gaps detected in past 6 voyages. Speed profiles consistent with declared routes. No dark-fleet indicators.',
        evidence: [
          {
            signal: 'Zero AIS gaps in past 6 voyages — transponder continuous',
            source: 'AIS Continuity Check',
            confidence: 97,
          },
          {
            signal: 'Speed variance within 1σ of declared speed schedule on all legs',
            source: 'AIS Speed Profile',
            confidence: 95,
          },
        ],
      },
      weather: {
        score: 47,
        level: 'moderate',
        summary:
          'Cape of Good Hope passage forecast for elevated swell (3.2–4.1m) and wind 28kts on Days 14–16. ETA impact modeled at +18h.',
        evidence: [
          {
            signal: 'Cape of Good Hope: Swell 3.2m peak, wind 28kts — elevated — ETA +18h modeled',
            source: 'ECMWF 10-day forecast (demo)',
            confidence: 78,
          },
          {
            signal: 'Gulf of Guinea: Calm. No tropical storm risk in routing corridor.',
            source: 'NHC advisory (demo)',
            confidence: 88,
          },
          {
            signal: 'North Atlantic approach: Moderate swell 2.1m — within routing tolerance',
            source: 'ECMWF forecast (demo)',
            confidence: 82,
          },
        ],
      },
      sts: {
        score: 5,
        level: 'none',
        summary:
          "No STS indicators. Routing does not pass known STS anchor zones. Vessel's recent port behavior is fully compliant.",
        evidence: [
          {
            signal: 'No AIS proximity events with dark-fleet vessels in past 24 months',
            source: 'AIS Proximity Analysis',
            confidence: 96,
          },
          {
            signal: 'Cape route does not intersect known STS coordination areas',
            source: 'Vessels STS Intelligence',
            confidence: 92,
          },
        ],
      },
      counterparty: {
        score: 9,
        level: 'low',
        summary:
          'Shell Trading Rotterdam — investment grade (A+ S&P), full ownership transparency, excellent payment record.',
        evidence: [
          {
            signal:
              'Shell Trading Rotterdam BV — Shell plc subsidiary, publicly listed ultimate parent',
            source: 'GLEIF / Bloomberg',
            confidence: 99,
          },
          {
            signal: 'Credit rating: A+ (S&P) — investment grade',
            source: 'S&P Global (demo)',
            confidence: 97,
          },
          {
            signal: 'Zero overdue invoices in 5-year history',
            source: 'Credit Bureau (demo)',
            confidence: 98,
          },
        ],
      },
      composite: 14,
    },
    economics: {
      fuelMt: 5_100,
      bunkerprice: 610,
      fuelCostUsd: 3_111_000,
      transitDays: 24,
      revenueUsd: 6_850_000,
      tce: 42_000,
      profitUsd: 982_000,
      portDisbursementsUsd: 310_000,
      canalFeesUsd: 0,
      totalCostsUsd: 5_868_000,
      marginPct: 14.3,
    },
    counterparty: {
      charterer: 'Shell Trading Rotterdam BV',
      chartererCountry: 'Netherlands',
      sanctionRisk: 'none',
      creditRating: 'A+',
      keyRisk: 'Negligible — investment-grade publicly listed parent',
      beneficialControl: [
        {
          name: 'Shell Trading Rotterdam BV',
          jurisdiction: 'Netherlands',
          type: 'company',
          sanctioned: false,
          opacity: 'transparent',
        },
        {
          name: 'Shell plc',
          jurisdiction: 'United Kingdom',
          type: 'company',
          sanctioned: false,
          opacity: 'transparent',
          notes: 'London Stock Exchange listed',
        },
      ],
    },
  },
  {
    id: 'SCN-003',
    label: 'Orient Meridian — Novorossiysk → Fujairah (Black Sea exit)',
    vessel: {
      name: 'Orient Meridian',
      imo: '9654789',
      flag: 'Cameroon',
      type: 'Aframax',
      dwt: 113_000,
      age: 18,
    },
    route: {
      origin: 'Novorossiysk, RU',
      destination: 'Fujairah, UAE',
      variant: 'Turkish Straits → Suez',
      distanceNm: 8_820,
      chokepoints: ['Bosporus', 'Dardanelles', 'Suez Canal'],
    },
    dataLabel: 'demo',
    risk: {
      sanctions: {
        score: 91,
        level: 'critical',
        summary:
          'CRITICAL: Vessel originates from a Russian crude export port. Owner chain traces to sanctioned Russian state entity. Cargo likely Russian ESPO crude — EU/UK embargo applies.',
        evidence: [
          {
            signal:
              'Origin port Novorossiysk — primary Russian crude export terminal (EU/UK sanctioned cargo source)',
            source: 'OFAC / EU Reg 833/2014',
            confidence: 97,
          },
          {
            signal:
              "Registered owner 'Black Sea Tanker Holdings' — traced to Sovcomflot subsidiary (US SDN list)",
            source: 'OFAC SDN / Sovcomflot designations',
            confidence: 89,
          },
          {
            signal: 'Cargo suspected URALS crude — EU price cap applies; no attestation provided',
            source: 'CREA / Cargo Manifest Analysis (demo)',
            confidence: 78,
          },
          {
            signal: 'Flag state Cameroon — non-signatory to EU cargo attestation framework',
            source: 'IMO / EU Reg 2022/1904',
            confidence: 85,
          },
        ],
      },
      darkActivity: {
        score: 72,
        level: 'high',
        summary:
          'Vessel has a pattern of AIS manipulation: 3 gaps in past 90 days, including one extended 26h blackout in the Black Sea. Shadow-fleet behavioral profile.',
        evidence: [
          {
            signal:
              'AIS gap: 26h 18m at 43.1°N 37.4°E (open Black Sea) — prior voyage; no distress declared',
            source: 'AIS Gap Analysis',
            confidence: 88,
          },
          {
            signal:
              'AIS gap: 7h 44m near Turkish Strait approach — possible loitering or speed manipulation',
            source: 'AIS Gap Analysis',
            confidence: 79,
          },
          {
            signal:
              'Vessel direction reversal twice in 30-day period — evasion pattern consistent with shadow fleet',
            source: 'AIS Route Analysis',
            confidence: 74,
          },
          {
            signal: 'MMSI number changed once in past 18 months — flag-switch indicator',
            source: 'Equasis / IMO Database',
            confidence: 83,
          },
        ],
      },
      weather: {
        score: 18,
        level: 'low',
        summary:
          'Routing conditions favorable. Black Sea calm through departure window. Mediterranean and Red Sea within seasonal norms.',
        evidence: [
          {
            signal: 'Black Sea: Calm departure window, wind <10kts through Day 3',
            source: 'ECMWF forecast (demo)',
            confidence: 88,
          },
          {
            signal: 'Mediterranean: Moderate conditions — swell 1.4m, wind 14kts',
            source: 'ECMWF forecast (demo)',
            confidence: 84,
          },
        ],
      },
      sts: {
        score: 63,
        level: 'high',
        summary:
          'Vessel linked to 2 confirmed STS events in past 12 months — both in proximity to sanctioned vessel counterparties. Current route passes Ceuta STS zone.',
        evidence: [
          {
            signal:
              "STS event confirmed: 14 Apr 2025 — proximity to 'Bravery Star' (OFAC-listed) at 36.1°N 5.3°W for 9h",
            source: 'AIS Proximity / OFAC match',
            confidence: 91,
          },
          {
            signal:
              "STS event confirmed: 07 Dec 2024 — proximity to 'Fortune Seeker' (shadow fleet) at 37.8°N 26.2°E",
            source: 'AIS Proximity Analysis',
            confidence: 85,
          },
          {
            signal:
              'Route passes Ceuta Strait — 31 documented STS events in 90 days, 8 involving sanctioned cargo',
            source: 'Vessels STS Intelligence',
            confidence: 80,
          },
        ],
      },
      counterparty: {
        score: 88,
        level: 'critical',
        summary:
          'Beneficial ownership terminates at sanctioned Russian state entity. No independent creditworthy counterparty identified.',
        evidence: [
          {
            signal:
              "'Black Sea Tanker Holdings' — nominee director structure; beneficial owner = Sovcomflot JSC (US SDN)",
            source: 'OFAC SDN / corporate registry',
            confidence: 90,
          },
          {
            signal:
              'No independent credit rating — comparable shadow-fleet operators carry unrated or withdrawn ratings',
            source: 'S&P / Fitch (demo)',
            confidence: 75,
          },
          {
            signal:
              '3 unpaid demurrage claims outstanding (total $1.4M) — Clarkson Platou reference',
            source: 'Industry Reference (demo)',
            confidence: 68,
          },
        ],
      },
      composite: 79,
    },
    economics: {
      fuelMt: 3_680,
      bunkerprice: 580,
      fuelCostUsd: 2_134_400,
      transitDays: 18,
      revenueUsd: 5_400_000,
      tce: 39_000,
      profitUsd: 1_018_000,
      portDisbursementsUsd: 280_000,
      canalFeesUsd: 390_000,
      totalCostsUsd: 4_382_000,
      marginPct: 18.9,
    },
    counterparty: {
      charterer: 'Caspian Energy Partners Ltd.',
      chartererCountry: 'UAE',
      sanctionRisk: 'critical',
      creditRating: 'Unrated',
      keyRisk:
        'Owner chain terminates at Sovcomflot subsidiary (US SDN list); CRITICAL block recommended',
      beneficialControl: [
        {
          name: 'Caspian Energy Partners Ltd.',
          jurisdiction: 'UAE',
          type: 'company',
          sanctioned: false,
          opacity: 'opaque',
        },
        {
          name: 'Black Sea Tanker Holdings',
          jurisdiction: 'Cyprus',
          type: 'company',
          sanctioned: true,
          opacity: 'opaque',
          notes: 'SDN-adjacent via Sovcomflot',
        },
        {
          name: 'Sovcomflot JSC',
          jurisdiction: 'Russia',
          type: 'state',
          sanctioned: true,
          opacity: 'partial',
          notes: 'US/EU/UK sanctioned state entity',
        },
      ],
    },
  },
];

// ── Risk config ──────────────────────────────────────────────────────────────

const RISK_CFG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  none: {
    color: '#34d399',
    bg: 'rgba(52,211,153,0.07)',
    border: 'rgba(52,211,153,0.18)',
    label: 'None',
  },
  low: {
    color: '#34d399',
    bg: 'rgba(52,211,153,0.07)',
    border: 'rgba(52,211,153,0.18)',
    label: 'Low',
  },
  moderate: {
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.07)',
    border: 'rgba(251,191,36,0.20)',
    label: 'Moderate',
  },
  high: {
    color: '#f87171',
    bg: 'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.22)',
    label: 'High',
  },
  critical: {
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.09)',
    border: 'rgba(239,68,68,0.30)',
    label: 'Critical',
  },
};

const SANCTION_RISK_CFG = {
  none: { color: '#34d399', label: 'Clear' },
  watch: { color: '#fbbf24', label: 'Watch' },
  elevated: { color: '#f87171', label: 'Elevated' },
  critical: { color: '#ef4444', label: 'Critical' },
};

// ── Sub-components ───────────────────────────────────────────────────────────

function RiskScore({ score, level }: { score: number; level: string }) {
  const cfg = RISK_CFG[level] ?? RISK_CFG.low;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${score}%`, background: cfg.color }}
        />
      </div>
      <span className="text-[10px] font-mono w-6 text-right" style={{ color: cfg.color }}>
        {score}
      </span>
    </div>
  );
}

function CompositeGauge({ score }: { score: number }) {
  const level = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 35 ? 'moderate' : 'low';
  const cfg = RISK_CFG[level];
  const arc = 2 * Math.PI * 40;
  const filled = (score / 100) * arc;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={cfg.color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${arc - filled}`}
          strokeDashoffset={arc * 0.25}
          style={{ transition: 'all 0.6s ease' }}
        />
        <text
          x="50"
          y="46"
          textAnchor="middle"
          className="font-mono"
          style={{ fill: cfg.color, fontSize: 22, fontWeight: 700 }}
        >
          {score}
        </text>
        <text
          x="50"
          y="61"
          textAnchor="middle"
          style={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
        >
          composite
        </text>
      </svg>
      <span className="text-xs font-medium capitalize" style={{ color: cfg.color }}>
        {cfg.label} Risk
      </span>
    </div>
  );
}

function EvidenceList({ items }: { items: EvidenceItem[] }) {
  return (
    <div className="space-y-1.5">
      {items.map((ev, i) => (
        <div
          key={i}
          className="flex items-start gap-2 p-2 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.025)' }}
        >
          <Info className="w-3 h-3 text-sky-400/50 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-sky-200/80 leading-snug">{ev.signal}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-sky-400/40">{ev.source}</span>
              <span
                className="text-[9px] px-1.5 rounded"
                style={{
                  color:
                    ev.confidence >= 80 ? '#34d399' : ev.confidence >= 60 ? '#fbbf24' : '#f87171',
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                {ev.confidence}% conf.
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RiskPanel({
  dim,
  icon: Icon,
  title,
  expanded,
  onToggle,
}: {
  dim: RiskDimension;
  icon: React.ElementType;
  title: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = RISK_CFG[dim.level] ?? RISK_CFG.low;
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: expanded ? cfg.border : BORDER, background: BG_CARD }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="p-1.5 rounded-lg shrink-0" style={{ background: cfg.bg }}>
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-sky-100">{title}</span>
            <span
              className="text-[9px] px-2 py-0.5 rounded-full border capitalize shrink-0"
              style={{ color: cfg.color, borderColor: cfg.border, background: cfg.bg }}
            >
              {cfg.label}
            </span>
          </div>
          {!expanded && <p className="text-[9px] text-sky-400/40 truncate mt-0.5">{dim.summary}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <RiskScore score={dim.score} level={dim.level} />
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-sky-400/30" />
          ) : (
            <ChevronRight className="w-3 h-3 text-sky-400/30" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: BORDER }}>
          <p className="text-[10px] text-sky-300/70 leading-relaxed pt-3">{dim.summary}</p>
          <div>
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-2">
              Evidence & Signals
            </p>
            <EvidenceList items={dim.evidence} />
          </div>
        </div>
      )}
    </div>
  );
}

function OwnerNodeRow({ node }: { node: OwnerNode }) {
  const opacityColor = { transparent: '#34d399', partial: '#fbbf24', opaque: '#f87171' }[
    node.opacity
  ];
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: node.sanctioned ? '#ef4444' : '#34d399' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-sky-100">{node.name}</span>
          {node.sanctioned && (
            <Badge
              variant="outline"
              className="text-[8px] text-red-400 bg-red-500/10 border-red-500/20"
            >
              Sanctioned
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] text-sky-400/40">
            {node.jurisdiction} · {node.type}
          </span>
          <span className="text-[9px] capitalize" style={{ color: opacityColor }}>
            Opacity: {node.opacity}
          </span>
        </div>
        {node.notes && <p className="text-[9px] text-amber-300/60 mt-0.5 italic">{node.notes}</p>}
      </div>
    </div>
  );
}

function EconomicsPanel({ econ, transitDays }: { econ: EconomicsSnapshot; transitDays: number }) {
  const metrics = [
    {
      label: 'Gross Revenue',
      value: `$${(econ.revenueUsd / 1e6).toFixed(2)}M`,
      color: '#34d399',
      icon: DollarSign,
    },
    {
      label: 'Total Costs',
      value: `$${(econ.totalCostsUsd / 1e6).toFixed(2)}M`,
      color: '#f87171',
      icon: BarChart3,
    },
    {
      label: 'Net Profit',
      value: `$${(econ.profitUsd / 1e6).toFixed(2)}M`,
      color: econ.profitUsd > 0 ? '#34d399' : '#f87171',
      icon: TrendingUp,
    },
    {
      label: 'TCE / day',
      value: `$${(econ.tce / 1000).toFixed(0)}K`,
      color: ACCENT,
      icon: Activity,
    },
    { label: 'Transit Days', value: `${econ.transitDays}d`, color: '#a78bfa', icon: Clock },
    {
      label: 'Margin',
      value: `${econ.marginPct.toFixed(1)}%`,
      color: econ.marginPct > 20 ? '#34d399' : econ.marginPct > 10 ? '#fbbf24' : '#f87171',
      icon: TrendingDown,
    },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-lg p-3 border border-sky-500/10"
              style={{ background: BG_CARD_INNER }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="w-3 h-3" style={{ color: m.color }} />
                <span className="text-[9px] text-sky-400/50 uppercase tracking-wider">
                  {m.label}
                </span>
              </div>
              <span className="text-sm font-bold font-mono" style={{ color: m.color }}>
                {m.value}
              </span>
            </div>
          );
        })}
      </div>
      <div className="space-y-2">
        <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Cost Breakdown</p>
        {[
          { label: 'Bunker / Fuel', value: econ.fuelCostUsd, color: '#f87171' },
          { label: 'Port Disbursements', value: econ.portDisbursementsUsd, color: '#a78bfa' },
          { label: 'Canal Fees', value: econ.canalFeesUsd, color: '#fbbf24' },
          {
            label: 'Other Op Ex',
            value:
              econ.totalCostsUsd - econ.fuelCostUsd - econ.portDisbursementsUsd - econ.canalFeesUsd,
            color: ACCENT,
          },
        ].map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-sky-400/50">{item.label}</span>
              <span className="text-[9px] font-mono" style={{ color: item.color }}>
                ${(item.value / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div
                className="h-1 rounded-full"
                style={{
                  width: `${Math.min((item.value / econ.totalCostsUsd) * 100, 100)}%`,
                  background: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div
        className="p-2.5 rounded-lg border border-sky-500/10 text-[9px] text-sky-400/40"
        style={{ background: BG_CARD_INNER }}
      >
        Fuel: {econ.fuelMt.toLocaleString()} MT @ ${econ.bunkerprice}/MT (VLSFO demo benchmark)
      </div>
    </div>
  );
}

// ── Compliance Memo — server-side PDF export ──────────────────────────────────

function buildApiScoreFromScenario(scn: VoyageScenario): ApiVoyageRiskScore {
  const mapDim = (d: RiskDimension): ApiRiskDimension => ({
    score: d.score,
    level: d.level,
    summary: d.summary,
    evidence: d.evidence.map((e) => ({
      signal: e.signal,
      source: e.source,
      confidence: e.confidence,
      dataLabel: 'demo' as const,
    })),
  });
  return {
    scenarioId: scn.id,
    vessel: {
      name: scn.vessel.name,
      imo: scn.vessel.imo,
      flag: scn.vessel.flag,
      type: scn.vessel.type,
      dwt: scn.vessel.dwt,
      ageYears: scn.vessel.age,
    },
    route: {
      origin: scn.route.origin,
      destination: scn.route.destination,
      variant: scn.route.variant,
      distanceNm: scn.route.distanceNm,
      chokepoints: scn.route.chokepoints,
    },
    risk: {
      sanctions: mapDim(scn.risk.sanctions),
      darkActivity: mapDim(scn.risk.darkActivity),
      weather: mapDim(scn.risk.weather),
      sts: mapDim(scn.risk.sts),
      counterparty: mapDim(scn.risk.counterparty),
      composite: scn.risk.composite,
      compositeLevel:
        scn.risk.composite >= 80
          ? 'critical'
          : scn.risk.composite >= 60
            ? 'high'
            : scn.risk.composite >= 35
              ? 'moderate'
              : 'low',
      recommendation:
        scn.risk.composite >= 80
          ? 'HOLD — Compliance block recommended'
          : scn.risk.composite >= 60
            ? 'CAUTION — Escalate to compliance'
            : scn.risk.composite >= 35
              ? 'MONITOR — Enhanced due diligence'
              : 'PROCEED — Within acceptable parameters',
    },
    economics: {
      fuelMt: scn.economics.fuelMt,
      bunkerPriceUsd: scn.economics.bunkerprice,
      fuelCostUsd: scn.economics.fuelCostUsd,
      transitDays: scn.economics.transitDays,
      distanceNm: scn.route.distanceNm,
      revenueUsd: scn.economics.revenueUsd,
      tce: scn.economics.tce,
      profitUsd: scn.economics.profitUsd,
      portDisbursementsUsd: scn.economics.portDisbursementsUsd,
      canalFeesUsd: scn.economics.canalFeesUsd,
      totalCostsUsd: scn.economics.totalCostsUsd,
      marginPct: scn.economics.marginPct,
      dataLabel: 'demo',
    },
    counterparty: {
      charterer: scn.counterparty.charterer,
      chartererCountry: scn.counterparty.chartererCountry,
      sanctionRisk: scn.counterparty.sanctionRisk,
      creditRating: scn.counterparty.creditRating,
      beneficialControlChain: scn.counterparty.beneficialControl.map((n) => ({
        name: n.name,
        jurisdiction: n.jurisdiction,
        entityType: n.type,
        sanctioned: n.sanctioned,
        opacity: n.opacity,
        notes: n.notes,
      })),
      keyRisk: scn.counterparty.keyRisk,
    },
    provenance: {
      dataLabel: 'demo',
      confidence: 0.78,
      attestation: 'VESSELS-RISK-ENGINE-v1.0',
      generatedAt: new Date().toISOString(),
      note: 'Scores are heuristic-modeled. Connect live feeds for real-time screening.',
    },
  };
}

// ── Main page ─────────────────────────────────────────────────────────────────

type ExpandedKey = 'sanctions' | 'darkActivity' | 'weather' | 'sts' | 'counterparty';

export default function VoyageRiskTwinPage() {
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [expanded, setExpanded] = useState<ExpandedKey | null>(null);
  const [showOwnership, setShowOwnership] = useState(false);
  const [memoExported, setMemoExported] = useState(false);
  const [memoLoading, setMemoLoading] = useState(false);
  const [apiScore, setApiScore] = useState<ApiVoyageRiskScore | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setApiLoading(true);
    setApiScore(null);
    fetchVoyageRiskScore(scenarioId)
      .then((score) => {
        if (!ctrl.signal.aborted) {
          setApiScore(score);
          setApiLoading(false);
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setApiLoading(false);
      });
    return () => ctrl.abort();
  }, [scenarioId]);

  const toggleExpand = useCallback((key: ExpandedKey) => {
    setExpanded((prev) => (prev === key ? null : key));
  }, []);

  const handleExport = useCallback(async () => {
    if (memoLoading) return;
    setMemoLoading(true);
    const scoreToUse = apiScore ?? buildApiScoreFromScenario(scenario);
    const ok = await downloadPdfMemo(scoreToUse);
    if (ok) {
      setMemoExported(true);
      setTimeout(() => setMemoExported(false), 3000);
    }
    setMemoLoading(false);
  }, [apiScore, scenario, memoLoading]);

  const displayRisk = apiScore
    ? {
        sanctions: {
          score: apiScore.risk.sanctions.score,
          level: apiScore.risk.sanctions.level,
          summary: apiScore.risk.sanctions.summary,
          evidence: apiScore.risk.sanctions.evidence,
        },
        darkActivity: {
          score: apiScore.risk.darkActivity.score,
          level: apiScore.risk.darkActivity.level,
          summary: apiScore.risk.darkActivity.summary,
          evidence: apiScore.risk.darkActivity.evidence,
        },
        weather: {
          score: apiScore.risk.weather.score,
          level: apiScore.risk.weather.level,
          summary: apiScore.risk.weather.summary,
          evidence: apiScore.risk.weather.evidence,
        },
        sts: {
          score: apiScore.risk.sts.score,
          level: apiScore.risk.sts.level,
          summary: apiScore.risk.sts.summary,
          evidence: apiScore.risk.sts.evidence,
        },
        counterparty: {
          score: apiScore.risk.counterparty.score,
          level: apiScore.risk.counterparty.level,
          summary: apiScore.risk.counterparty.summary,
          evidence: apiScore.risk.counterparty.evidence,
        },
        composite: apiScore.risk.composite,
      }
    : scenario.risk;

  const displayEcon: EconomicsSnapshot = apiScore
    ? {
        fuelMt: apiScore.economics.fuelMt,
        bunkerprice: apiScore.economics.bunkerPriceUsd,
        fuelCostUsd: apiScore.economics.fuelCostUsd,
        transitDays: apiScore.economics.transitDays,
        revenueUsd: apiScore.economics.revenueUsd,
        tce: apiScore.economics.tce,
        profitUsd: apiScore.economics.profitUsd,
        portDisbursementsUsd: apiScore.economics.portDisbursementsUsd,
        canalFeesUsd: apiScore.economics.canalFeesUsd,
        totalCostsUsd: apiScore.economics.totalCostsUsd,
        marginPct: apiScore.economics.marginPct,
      }
    : scenario.economics;

  const displayCounterparty = apiScore
    ? {
        charterer: apiScore.counterparty.charterer,
        chartererCountry: apiScore.counterparty.chartererCountry,
        sanctionRisk: apiScore.counterparty.sanctionRisk,
        creditRating: apiScore.counterparty.creditRating,
        keyRisk: apiScore.counterparty.keyRisk,
        beneficialControl: apiScore.counterparty.beneficialControlChain.map((n) => ({
          name: n.name,
          jurisdiction: n.jurisdiction,
          type: n.entityType as 'vessel' | 'company' | 'person' | 'state',
          sanctioned: n.sanctioned,
          opacity: n.opacity as 'transparent' | 'partial' | 'opaque',
          notes: n.notes,
        })),
      }
    : scenario.counterparty;

  const compositeLevel =
    displayRisk.composite >= 80
      ? 'critical'
      : displayRisk.composite >= 60
        ? 'high'
        : displayRisk.composite >= 35
          ? 'moderate'
          : 'low';

  const compositeCfg = RISK_CFG[compositeLevel];

  return (
    <div style={{ padding: '28px 28px 64px', maxWidth: 1440, margin: '0 auto' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="w-5 h-5" style={{ color: ACCENT }} />
            <h1 className="text-xl font-semibold text-sky-100">Voyage Risk Twin</h1>
            <Badge variant="outline" className="text-[9px] border-sky-500/30 text-sky-400/70">
              SIGNATURE FEATURE
            </Badge>
            <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400/70">
              DEMO DATA
            </Badge>
          </div>
          <p className="text-xs text-sky-400/50">
            Route · sanctions · dark activity · STS · weather · counterparty · economics — fused in
            one decision surface. Differentiates vs Windward &amp; Kpler: trade + risk + compliance
            in one workflow-ready memo.
          </p>
        </div>
        <button
          onClick={() => void handleExport()}
          disabled={memoLoading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border transition-all disabled:opacity-60"
          style={{
            background: memoExported ? 'rgba(52,211,153,0.10)' : 'rgba(77,143,204,0.08)',
            borderColor: memoExported ? 'rgba(52,211,153,0.30)' : 'rgba(77,143,204,0.25)',
            color: memoExported ? '#34d399' : ACCENT,
          }}
        >
          {memoLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : memoExported ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {memoLoading
            ? 'Generating PDF…'
            : memoExported
              ? 'PDF Downloaded'
              : 'Compliance Memo PDF'}
        </button>
      </div>

      {/* ── Scenario Selector ───────────────────────────────────────────────── */}
      <div
        className="rounded-xl border p-4 mb-6"
        style={{ background: BG_CARD, borderColor: BORDER }}
      >
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider">
            Voyage Scenario Simulator
          </span>
          <span className="text-[9px] text-sky-400/40 ml-auto">
            Select a candidate voyage to model risk and economics
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((scn) => (
            <button
              key={scn.id}
              onClick={() => {
                setScenarioId(scn.id);
                setExpanded(null);
                setShowOwnership(false);
              }}
              className={cn(
                'flex-1 min-w-0 text-left rounded-xl p-3.5 border transition-all',
                scenarioId === scn.id ? 'ring-1 ring-sky-400/30' : 'hover:border-sky-500/20',
              )}
              style={{
                background:
                  scenarioId === scn.id ? 'rgba(77,143,204,0.06)' : 'rgba(255,255,255,0.02)',
                borderColor:
                  scenarioId === scn.id ? 'rgba(77,143,204,0.25)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Ship className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] font-semibold text-sky-100 truncate">
                  {scn.vessel.name}
                </span>
                <span
                  className={cn(
                    'ml-auto text-[9px] px-2 py-0.5 rounded-full border shrink-0 font-medium',
                  )}
                  style={{
                    color:
                      RISK_CFG[
                        scn.risk.composite >= 80
                          ? 'critical'
                          : scn.risk.composite >= 60
                            ? 'high'
                            : scn.risk.composite >= 35
                              ? 'moderate'
                              : 'low'
                      ].color,
                    borderColor:
                      RISK_CFG[
                        scn.risk.composite >= 80
                          ? 'critical'
                          : scn.risk.composite >= 60
                            ? 'high'
                            : scn.risk.composite >= 35
                              ? 'moderate'
                              : 'low'
                      ].border,
                    background:
                      RISK_CFG[
                        scn.risk.composite >= 80
                          ? 'critical'
                          : scn.risk.composite >= 60
                            ? 'high'
                            : scn.risk.composite >= 35
                              ? 'moderate'
                              : 'low'
                      ].bg,
                  }}
                >
                  {scn.risk.composite}/100
                </span>
              </div>
              <p className="text-[9px] text-sky-400/50 truncate">
                {scn.route.origin} → {scn.route.destination}
              </p>
              <p className="text-[9px] text-sky-400/35">
                {scn.route.variant} · {scn.route.distanceNm.toLocaleString()} nm · {scn.vessel.type}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Vessel + Route header ────────────────────────────────────────────── */}
      <div
        className="rounded-xl border p-4 mb-5 flex flex-wrap items-center gap-4"
        style={{ background: BG_CARD, borderColor: BORDER }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg shrink-0" style={{ background: 'rgba(77,143,204,0.08)' }}>
            <Ship className="w-4 h-4 text-sky-400" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-sky-100">{scenario.vessel.name}</div>
            <div className="text-[10px] text-sky-400/50">
              IMO {scenario.vessel.imo} · {scenario.vessel.flag} · {scenario.vessel.type} ·{' '}
              {scenario.vessel.dwt.toLocaleString()} DWT · {scenario.vessel.age}yr
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-sky-400/50 shrink-0">
          <Navigation className="w-3 h-3" />
          <span className="text-sky-200">{scenario.route.origin}</span>
          <span>→</span>
          <span className="text-sky-200">{scenario.route.destination}</span>
          <span className="text-sky-400/30">·</span>
          <span>{scenario.route.variant}</span>
          <span className="text-sky-400/30">·</span>
          <span>{scenario.route.distanceNm.toLocaleString()} nm</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
          {scenario.route.chokepoints.map((cp) => (
            <span
              key={cp}
              className="text-[9px] px-2 py-0.5 rounded-full border border-sky-500/20 text-sky-400/60"
            >
              {cp}
            </span>
          ))}
        </div>
      </div>

      {/* ── SPLIT SCREEN: Risk | Economics ───────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-5 mb-6">
        {/* LEFT: Risk Panel */}
        <div className="col-span-12 lg:col-span-7 space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <CompositeGauge score={displayRisk.composite} />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-sky-100">Risk Intelligence</p>
                {apiLoading && <Loader2 className="w-3 h-3 text-sky-400/40 animate-spin" />}
                {apiScore && !apiLoading && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20">
                    Scoring API
                  </span>
                )}
              </div>
              <p className="text-[10px] text-sky-400/50 max-w-xs">
                Five risk dimensions fused with evidence. Expand each to inspect signals, sources,
                and confidence scores.
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: compositeCfg.color }}
                />
                <span className="text-[10px] font-medium" style={{ color: compositeCfg.color }}>
                  Composite {compositeCfg.label}: {displayRisk.composite}/100
                </span>
              </div>
            </div>
          </div>

          <RiskPanel
            dim={displayRisk.sanctions}
            icon={Shield}
            title="Sanctions Exposure"
            expanded={expanded === 'sanctions'}
            onToggle={() => toggleExpand('sanctions')}
          />
          <RiskPanel
            dim={displayRisk.darkActivity}
            icon={EyeOff}
            title="Dark Activity Probability"
            expanded={expanded === 'darkActivity'}
            onToggle={() => toggleExpand('darkActivity')}
          />
          <RiskPanel
            dim={displayRisk.weather}
            icon={Activity}
            title="Weather Risk"
            expanded={expanded === 'weather'}
            onToggle={() => toggleExpand('weather')}
          />
          <RiskPanel
            dim={displayRisk.sts}
            icon={Radio}
            title="STS Transfer Likelihood"
            expanded={expanded === 'sts'}
            onToggle={() => toggleExpand('sts')}
          />
          <RiskPanel
            dim={displayRisk.counterparty}
            icon={Users}
            title="Counterparty Risk"
            expanded={expanded === 'counterparty'}
            onToggle={() => toggleExpand('counterparty')}
          />

          {/* Counterparty Ownership Snapshot */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ borderColor: BORDER, background: BG_CARD }}
          >
            <button
              onClick={() => setShowOwnership((v) => !v)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
              <div
                className="p-1.5 rounded-lg shrink-0"
                style={{
                  background: `${SANCTION_RISK_CFG[displayCounterparty.sanctionRisk].color}18`,
                }}
              >
                <Building2
                  className="w-3.5 h-3.5"
                  style={{ color: SANCTION_RISK_CFG[displayCounterparty.sanctionRisk].color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-sky-100">
                    Counterparty Ownership Graph
                  </span>
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full border capitalize shrink-0"
                    style={{
                      color: SANCTION_RISK_CFG[displayCounterparty.sanctionRisk].color,
                      borderColor: `${SANCTION_RISK_CFG[displayCounterparty.sanctionRisk].color}40`,
                      background: `${SANCTION_RISK_CFG[displayCounterparty.sanctionRisk].color}12`,
                    }}
                  >
                    {SANCTION_RISK_CFG[displayCounterparty.sanctionRisk].label}
                  </span>
                </div>
                {!showOwnership && (
                  <p className="text-[9px] text-sky-400/40 truncate mt-0.5">
                    {displayCounterparty.charterer} · {displayCounterparty.chartererCountry} ·{' '}
                    {displayCounterparty.creditRating}
                  </p>
                )}
              </div>
              {showOwnership ? (
                <ChevronDown className="w-3 h-3 text-sky-400/30 shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 text-sky-400/30 shrink-0" />
              )}
            </button>
            {showOwnership && (
              <div className="px-4 pb-4 border-t space-y-3" style={{ borderColor: BORDER }}>
                <div className="grid grid-cols-2 gap-3 pt-3">
                  <div>
                    <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-1">
                      Charterer
                    </p>
                    <p className="text-xs font-medium text-sky-100">
                      {displayCounterparty.charterer}
                    </p>
                    <p className="text-[10px] text-sky-400/50">
                      {displayCounterparty.chartererCountry}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-1">
                      Credit Rating
                    </p>
                    <p className="text-xs font-medium text-sky-100">
                      {displayCounterparty.creditRating}
                    </p>
                  </div>
                </div>
                <div
                  className="p-2.5 rounded-lg border"
                  style={{
                    borderColor: `${SANCTION_RISK_CFG[displayCounterparty.sanctionRisk].color}30`,
                    background: `${SANCTION_RISK_CFG[displayCounterparty.sanctionRisk].color}06`,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className="w-3 h-3 mt-0.5 shrink-0"
                      style={{ color: SANCTION_RISK_CFG[displayCounterparty.sanctionRisk].color }}
                    />
                    <p
                      className="text-[10px]"
                      style={{ color: SANCTION_RISK_CFG[displayCounterparty.sanctionRisk].color }}
                    >
                      {displayCounterparty.keyRisk}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-2">
                    Beneficial Control Chain
                  </p>
                  <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    {displayCounterparty.beneficialControl.map((node, i) => (
                      <OwnerNodeRow key={i} node={node} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Economics Panel */}
        <div className="col-span-12 lg:col-span-5">
          <div
            className="rounded-xl border p-4 sticky top-4"
            style={{ background: BG_CARD, borderColor: BORDER }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Fuel className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[11px] font-semibold text-sky-100 uppercase tracking-wider">
                Voyage Economics
              </span>
              <span className="text-[9px] text-sky-400/40 ml-auto">Demo benchmark rates</span>
            </div>
            <EconomicsPanel econ={displayEcon} transitDays={displayEcon.transitDays} />

            {/* Risk-adjusted advisory */}
            <div
              className="mt-4 p-3 rounded-xl border"
              style={{ borderColor: compositeCfg.border, background: compositeCfg.bg }}
            >
              <div className="flex items-start gap-2">
                {displayRisk.composite >= 60 ? (
                  <XCircle
                    className="w-3.5 h-3.5 mt-0.5 shrink-0"
                    style={{ color: compositeCfg.color }}
                  />
                ) : (
                  <CheckCircle2
                    className="w-3.5 h-3.5 mt-0.5 shrink-0"
                    style={{ color: compositeCfg.color }}
                  />
                )}
                <div>
                  <p className="text-[10px] font-semibold" style={{ color: compositeCfg.color }}>
                    {apiScore
                      ? apiScore.risk.recommendation
                      : displayRisk.composite >= 80
                        ? 'HOLD — Compliance block recommended before fixture'
                        : displayRisk.composite >= 60
                          ? 'CAUTION — Escalate to compliance team before committing'
                          : displayRisk.composite >= 35
                            ? 'MONITOR — Proceed with enhanced due diligence'
                            : 'PROCEED — Risk profile within acceptable parameters'}
                  </p>
                  <p className="text-[9px] text-sky-400/50 mt-0.5">
                    Composite risk {displayRisk.composite}/100 · {displayEcon.marginPct.toFixed(1)}%
                    voyage margin
                  </p>
                </div>
              </div>
            </div>

            {/* STS indicator summary when risk is elevated */}
            {displayRisk.sts.level !== 'none' && displayRisk.sts.level !== 'low' && (
              <div
                className="mt-3 p-3 rounded-xl border border-amber-500/20"
                style={{ background: 'rgba(251,191,36,0.04)' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Radio className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-semibold text-amber-300">
                    STS / Shadow-Fleet Indicators
                  </span>
                </div>
                <div className="space-y-1">
                  {displayRisk.sts.evidence.slice(0, 2).map((ev, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <p className="text-[9px] text-amber-200/70">{ev.signal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliance memo CTA */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
              <p className="text-[9px] text-sky-400/40 mb-2">
                {apiScore
                  ? 'PDF memo generated by scoring service — includes live evidence and ownership chain.'
                  : 'Export a structured compliance memo with all evidence, suitable for screening submission.'}
              </p>
              <button
                onClick={() => void handleExport()}
                disabled={memoLoading}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium border transition-all disabled:opacity-60"
                style={{
                  background: memoExported ? 'rgba(52,211,153,0.08)' : 'rgba(77,143,204,0.06)',
                  borderColor: memoExported ? 'rgba(52,211,153,0.25)' : 'rgba(77,143,204,0.20)',
                  color: memoExported ? '#34d399' : ACCENT,
                }}
              >
                {memoLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating PDF…
                  </>
                ) : memoExported ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> PDF Downloaded
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" /> Export Compliance Memo PDF
                  </>
                )}
              </button>
              {apiLoading && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Loader2 className="w-3 h-3 text-sky-400/40 animate-spin" />
                  <span className="text-[9px] text-sky-400/40">Scoring service running…</span>
                </div>
              )}
              {apiScore && !apiLoading && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />
                  <span className="text-[9px] text-emerald-400/60">
                    Scoring service · {apiScore.provenance.attestation}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sanctions List Refresh Notice ────────────────────────────────────── */}
      <div className="rounded-xl border p-4" style={{ background: BG_CARD, borderColor: BORDER }}>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] font-semibold text-sky-300">
              Sanctions Intelligence Sources
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-[9px]">
            {[
              {
                name: 'OFAC SDN',
                region: 'USA',
                entities: '12,847',
                freq: 'Daily',
                status: 'demo',
              },
              {
                name: 'EU Consolidated',
                region: 'EU',
                entities: '8,234',
                freq: 'Daily',
                status: 'demo',
              },
              { name: 'UK OFSI', region: 'UK', entities: '4,521', freq: 'Weekly', status: 'demo' },
              {
                name: 'UN Security Council',
                region: 'Global',
                entities: '2,183',
                freq: 'Monthly',
                status: 'demo',
              },
            ].map((src) => (
              <div
                key={src.name}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-500/10"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-sky-300">{src.name}</span>
                <span className="text-sky-400/40">
                  {src.region} · {src.entities} entities · {src.freq}
                </span>
                <Badge
                  variant="outline"
                  className="text-[8px] border-amber-500/30 text-amber-400/70 ml-1"
                >
                  DEMO
                </Badge>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-sky-400/30 ml-auto">
            Connect live OFAC / Dow Jones / WorldCheck feeds to replace demo data with real-time
            screening.
          </p>
        </div>
      </div>
    </div>
  );
}
