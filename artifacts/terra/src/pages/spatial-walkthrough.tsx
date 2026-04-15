import { useState } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  Box, Ruler, Paintbrush, Sofa, Camera, Layers, Eye, ChevronRight,
  Building2, Maximize2, RotateCcw, ZoomIn, ZoomOut, Move, Grid3X3,
  Sun, Moon, ArrowRight, CheckCircle, DollarSign, Palette
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

interface Room {
  id: string;
  name: string;
  sqft: number;
  ceiling: number;
  condition: "excellent" | "good" | "fair" | "poor";
  features: string[];
  measurements: { label: string; value: string }[];
  renovationOptions: RenovationOption[];
}

interface RenovationOption {
  name: string;
  cost: number;
  valueAdd: number;
  timelineDays: number;
  description: string;
}

interface StagingPreset {
  id: string;
  name: string;
  style: string;
  monthlyRent: number;
  furnishingCost: number;
  items: string[];
}

interface PropertyWalkthrough {
  id: string;
  address: string;
  type: string;
  totalSqft: number;
  bedrooms: number;
  bathrooms: number;
  stories: number;
  rooms: Room[];
  stagingPresets: StagingPreset[];
}

const CONDITION_COLORS = {
  excellent: "#34d399", good: "#60a5fa", fair: "#fbbf24", poor: "#ef4444",
};

const PROPERTY: PropertyWalkthrough = {
  id: "sw-1",
  address: "425 Park Ave, New York, NY 10022",
  type: "Luxury Penthouse",
  totalSqft: 3850,
  bedrooms: 3,
  bathrooms: 3,
  stories: 1,
  rooms: [
    {
      id: "r1", name: "Living Room", sqft: 680, ceiling: 11.5, condition: "excellent",
      features: ["Floor-to-ceiling windows (south exposure)", "White oak herringbone flooring", "Gas fireplace with marble surround", "Custom millwork paneling"],
      measurements: [
        { label: "Width", value: "26' 2\"" }, { label: "Length", value: "26' 0\"" },
        { label: "Window Wall", value: "24' 8\"" }, { label: "Ceiling", value: "11' 6\"" },
      ],
      renovationOptions: [
        { name: "Smart Home Integration", cost: 28000, valueAdd: 45000, timelineDays: 14, description: "Lutron HomeWorks whole-home automation — lighting, shades, climate, AV. Voice + app control." },
        { name: "Window Treatment Upgrade", cost: 18500, valueAdd: 22000, timelineDays: 21, description: "Motorized blackout/sheer dual shades. Solar fabric for UV protection without blocking views." },
      ],
    },
    {
      id: "r2", name: "Primary Bedroom", sqft: 520, ceiling: 10, condition: "excellent",
      features: ["Walk-in closet (120 SF)", "En-suite bathroom", "Blackout motorized shades", "Recessed accent lighting"],
      measurements: [
        { label: "Width", value: "22' 4\"" }, { label: "Length", value: "23' 3\"" },
        { label: "Closet", value: "12' × 10'" }, { label: "Ceiling", value: "10' 0\"" },
      ],
      renovationOptions: [
        { name: "Closet System", cost: 15000, valueAdd: 20000, timelineDays: 7, description: "Italian-made custom closet with LED lighting, island dresser, and jewelry drawers." },
      ],
    },
    {
      id: "r3", name: "Kitchen", sqft: 380, ceiling: 10, condition: "good",
      features: ["Miele appliance package", "Calacatta marble countertops", "Custom Italian cabinetry", "Wine cooler (48 bottles)", "Pot filler"],
      measurements: [
        { label: "Width", value: "16' 8\"" }, { label: "Length", value: "22' 9\"" },
        { label: "Island", value: "8' 6\" × 4' 2\"" }, { label: "Ceiling", value: "10' 0\"" },
      ],
      renovationOptions: [
        { name: "Appliance Upgrade to Gaggenau", cost: 42000, valueAdd: 55000, timelineDays: 14, description: "Full Gaggenau 400 series. Steam oven, induction cooktop, speed microwave, column fridge/freezer." },
        { name: "Backsplash Refresh", cost: 8500, valueAdd: 12000, timelineDays: 5, description: "Book-matched Calacatta slab backsplash replacing existing subway tile." },
      ],
    },
    {
      id: "r4", name: "Primary Bathroom", sqft: 240, ceiling: 10, condition: "fair",
      features: ["Soaking tub", "Frameless glass shower", "Heated floors", "Double vanity"],
      measurements: [
        { label: "Width", value: "12' 0\"" }, { label: "Length", value: "20' 0\"" },
        { label: "Shower", value: "5' × 4'" }, { label: "Tub", value: "6' freestanding" },
      ],
      renovationOptions: [
        { name: "Full Bathroom Renovation", cost: 85000, valueAdd: 120000, timelineDays: 42, description: "Dornbracht fixtures. Heated towel bars. LED mirror. Re-tile in large-format porcelain. New stone counters." },
        { name: "Fixture Upgrade Only", cost: 22000, valueAdd: 30000, timelineDays: 10, description: "Replace fixtures with Waterworks collection. Chrome to brushed nickel transition." },
      ],
    },
    {
      id: "r5", name: "Terrace", sqft: 450, ceiling: 0, condition: "good",
      features: ["360° city views", "IPE wood decking", "Built-in planters", "Gas line for outdoor kitchen", "Drainage system"],
      measurements: [
        { label: "Width", value: "30' 0\"" }, { label: "Depth", value: "15' 0\"" },
        { label: "Railing Height", value: "42\"" }, { label: "Weight Capacity", value: "100 PSF" },
      ],
      renovationOptions: [
        { name: "Outdoor Kitchen Build-out", cost: 65000, valueAdd: 85000, timelineDays: 28, description: "Lynx professional grill, refrigerator, sink, and bar counter. Covered pergola with heaters." },
      ],
    },
  ],
  stagingPresets: [
    {
      id: "sp1", name: "Modern Minimalist", style: "Contemporary",
      monthlyRent: 42000, furnishingCost: 185000,
      items: ["B&B Italia sectional", "Minotti dining set", "Flos lighting collection", "Poliform bedroom suite", "Custom art curation"],
    },
    {
      id: "sp2", name: "Classic Luxury", style: "Transitional",
      monthlyRent: 45000, furnishingCost: 220000,
      items: ["Ralph Lauren Home sofa", "Restoration Hardware dining", "Visual Comfort chandeliers", "Baker bedroom furniture", "Curated antiques"],
    },
    {
      id: "sp3", name: "Tech Executive", style: "Modern Industrial",
      monthlyRent: 40000, furnishingCost: 165000,
      items: ["Herman Miller Eames collection", "CB2 dining ensemble", "Artemide task lighting", "Room & Board bedroom", "Abstract art selection"],
    },
  ],
};

const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toLocaleString()}`;

export default function SpatialWalkthroughPage() {
  const [selectedRoom, setSelectedRoom] = useState(PROPERTY.rooms[0].id);
  const [showRenovation, setShowRenovation] = useState(false);
  const [selectedStaging, setSelectedStaging] = useState<string | null>(null);
  const room = PROPERTY.rooms.find(r => r.id === selectedRoom)!;

  const totalRenovCost = PROPERTY.rooms.reduce((s, r) => s + r.renovationOptions.reduce((rs, o) => rs + o.cost, 0), 0);
  const totalValueAdd = PROPERTY.rooms.reduce((s, r) => s + r.renovationOptions.reduce((rs, o) => rs + o.valueAdd, 0), 0);

  return (
    <div className="min-h-screen" style={{ background: "#0a0c10" }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Spatial Computing</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Interactive Property Walkthrough</h1>
          <p className="mt-1 text-sm text-white/40">{PROPERTY.address} · {PROPERTY.type} · {PROPERTY.totalSqft.toLocaleString()} SF</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {[
            { label: "Total SF", value: `${PROPERTY.totalSqft.toLocaleString()}`, color: "#2d6a4f" },
            { label: "Rooms", value: String(PROPERTY.rooms.length), color: "#60a5fa" },
            { label: "Bed/Bath", value: `${PROPERTY.bedrooms}BD / ${PROPERTY.bathrooms}BA`, color: "#a78bfa" },
            { label: "Renovation Potential", value: fmt(totalValueAdd - totalRenovCost), color: "#34d399" },
            { label: "Staging Options", value: String(PROPERTY.stagingPresets.length), color: "#fbbf24" },
          ].map(m => (
            <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-2">{m.label}</div>
              <div className="text-xl font-semibold text-white">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white mb-3">Rooms</h3>
            {PROPERTY.rooms.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRoom(r.id)}
                className={cn("w-full text-left rounded-xl border p-3 transition",
                  r.id === selectedRoom ? "border-[#2d6a4f]/40 bg-[#2d6a4f]/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{r.name}</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${CONDITION_COLORS[r.condition]}15`, color: CONDITION_COLORS[r.condition] }}>{r.condition}</span>
                </div>
                <div className="text-[10px] text-white/30 mt-0.5">{r.sqft} SF · {r.ceiling > 0 ? `${r.ceiling}' ceiling` : "Open air"} · {r.renovationOptions.length} upgrades</div>
              </button>
            ))}

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-white mb-3">Virtual Staging</h3>
              {PROPERTY.stagingPresets.map(sp => (
                <button
                  key={sp.id}
                  onClick={() => setSelectedStaging(sp.id === selectedStaging ? null : sp.id)}
                  className={cn("w-full text-left rounded-xl border p-3 mb-2 transition",
                    sp.id === selectedStaging ? "border-[#fbbf24]/30 bg-[#fbbf24]/[0.05]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{sp.name}</span>
                    <span className="text-xs text-white/40">{sp.style}</span>
                  </div>
                  <div className="text-[10px] text-white/30 mt-0.5">
                    Furnishing: {fmt(sp.furnishingCost)} · Projected rent: ${sp.monthlyRent.toLocaleString()}/mo
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <m.div key={room.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden mb-4">
                  <div className="aspect-video bg-gradient-to-br from-white/[0.03] to-white/[0.01] flex items-center justify-center relative">
                    <div className="text-center">
                      <Box className="h-12 w-12 mx-auto mb-3" style={{ color: "#2d6a4f30" }} />
                      <p className="text-sm text-white/20">3D Spatial View — {room.name}</p>
                      <p className="text-[10px] text-white/10 mt-1">{room.sqft} SF · {room.measurements.map(m => `${m.label}: ${m.value}`).join(" · ")}</p>
                    </div>
                    <div className="absolute bottom-3 right-3 flex gap-1.5">
                      {([
                        [Maximize2, "Fullscreen"],
                        [RotateCcw, "Reset rotation"],
                        [ZoomIn, "Zoom in"],
                        [ZoomOut, "Zoom out"],
                        [Move, "Pan view"],
                        [Grid3X3, "Toggle grid"],
                      ] as const).map(([Icon, label], i) => (
                        <button key={i} aria-label={label} title={label} className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 border border-white/10 text-white/30 hover:text-white/60 transition">
                          <Icon className="h-3.5 w-3.5" />
                        </button>
                      ))}
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <button className="flex items-center gap-1 rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-[10px] text-white/40"><Sun className="h-3 w-3" /> Day</button>
                      <button className="flex items-center gap-1 rounded-lg bg-black/40 border border-white/10 px-2 py-1 text-[10px] text-white/40"><Moon className="h-3 w-3" /> Night</button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-white/35 mb-3">Measurements & Features</h4>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {room.measurements.map(m => (
                      <div key={m.label} className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2">
                        <Ruler className="h-3 w-3 text-white/20" />
                        <span className="text-[10px] text-white/30">{m.label}</span>
                        <span className="text-xs font-semibold text-white ml-auto">{m.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {room.features.map(f => (
                      <span key={f} className="text-[9px] px-2 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-white/40">{f}</span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-white/35">Renovation Options</h4>
                    <button onClick={() => setShowRenovation(!showRenovation)} className="text-[10px] font-semibold" style={{ color: "#2d6a4f" }}>
                      {showRenovation ? "Hide Details" : "Show Details"}
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {room.renovationOptions.map((opt, i) => (
                      <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{opt.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40">{fmt(opt.cost)}</span>
                            <ArrowRight className="h-3 w-3 text-white/20" />
                            <span className="text-xs font-semibold" style={{ color: "#34d399" }}>+{fmt(opt.valueAdd)}</span>
                          </div>
                        </div>
                        {showRenovation && (
                          <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                            <p className="text-[10px] text-white/35 mt-1">{opt.description}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/25">
                              <span>Timeline: {opt.timelineDays} days</span>
                              <span>ROI: {Math.round(((opt.valueAdd - opt.cost) / opt.cost) * 100)}%</span>
                            </div>
                          </m.div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {selectedStaging && (() => {
                    const staging = PROPERTY.stagingPresets.find(s => s.id === selectedStaging);
                    if (!staging) return null;
                    return (
                      <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-4">
                        <div className="rounded-2xl border border-[#fbbf24]/20 bg-[#fbbf24]/[0.04] p-5">
                          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#fbbf24" }}>Virtual Staging — {staging.name}</h4>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {staging.items.map(item => (
                              <span key={item} className="text-[9px] px-2 py-1 rounded-full border text-white/50" style={{ borderColor: "#fbbf2420", background: "#fbbf2408" }}>{item}</span>
                            ))}
                          </div>
                          <div className="flex gap-4 text-[10px] text-white/30">
                            <span>Furnishing cost: <span className="text-white/50">{fmt(staging.furnishingCost)}</span></span>
                            <span>Projected rent: <span className="text-white/50">${staging.monthlyRent.toLocaleString()}/mo</span></span>
                          </div>
                        </div>
                      </m.div>
                    );
                  })()}
                </AnimatePresence>
              </m.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
