import * as React from "react";

export interface VesselDetailData {
  id: number | string;
  name: string;
  imo?: string;
  flag?: string;
  type?: string;
  status: string;
  lat: number;
  lon: number;
  currentSpeed?: number;
  heading?: number;
  lastPort?: string;
  nextPort?: string;
  routeProgress?: number;
  etaDelta?: number;
  tce?: number;
  utilization?: number;
  ciiRating?: string;
  readinessScore?: number;
  alertCount?: number;
  exceptions?: { id: string | number; title: string; description: string; status: string }[];
}

export interface VesselDetailDrawerProps {
  vessel: VesselDetailData;
  onClose: () => void;
  statusColor?: string;
  statusLabel?: string;
  onViewDetail?: (vessel: VesselDetailData) => void;
  accentColor?: string;
}

export function VesselDetailDrawer({
  vessel,
  onClose,
  statusColor = "#22c55e",
  statusLabel = vessel.status,
  onViewDetail,
  accentColor = "#0ea5e9",
}: VesselDetailDrawerProps) {
  const activeExceptions =
    vessel.exceptions?.filter((e) => e.status === "active") ?? [];

  return (
    <div className="w-[340px] h-full bg-[#060e1a]/98 backdrop-blur-xl border-l border-sky-500/10 flex flex-col overflow-hidden shrink-0 z-20">
      <div className="p-4 border-b border-sky-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            <span className="text-lg" style={{ color: accentColor }}>⚓</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-sky-50">{vessel.name}</h3>
            <p className="text-[10px] text-sky-400/50 font-mono">
              {vessel.imo ? `IMO ${vessel.imo}` : ""}
              {vessel.imo && vessel.flag ? " · " : ""}
              {vessel.flag ?? ""}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-sky-500/10 text-sky-400/50 hover:text-sky-300 transition-colors"
          aria-label="Close vessel detail"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border font-medium"
            style={{
              color: statusColor,
              borderColor: `${statusColor}30`,
              backgroundColor: `${statusColor}10`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: statusColor }}
            />
            {statusLabel}
          </span>
          {vessel.type && (
            <span className="text-[10px] text-sky-400/40 font-mono">{vessel.type}</span>
          )}
          {activeExceptions.length > 0 && (
            <span className="text-[9px] font-semibold px-2 py-0.5 rounded border text-red-400 border-red-500/20 bg-red-500/10">
              {activeExceptions.length} exception{activeExceptions.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { label: "Latitude", value: `${vessel.lat.toFixed(4)}°` },
              { label: "Longitude", value: `${vessel.lon.toFixed(4)}°` },
              vessel.currentSpeed !== undefined
                ? { label: "Speed", value: `${vessel.currentSpeed} kn` }
                : null,
              vessel.heading !== undefined
                ? { label: "Heading", value: `${vessel.heading}°` }
                : null,
            ] as ({ label: string; value: string } | null)[]
          )
            .filter((item): item is { label: string; value: string } => item !== null)
            .map((item) => (
              <div key={item.label} className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{item.label}</p>
                <p className="text-xs font-mono text-sky-100 mt-0.5">{item.value}</p>
              </div>
            ))}
        </div>

        {(vessel.lastPort || vessel.nextPort) && (
          <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10 space-y-2">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Route Progress</p>
            <div className="flex items-center gap-2 text-xs text-sky-400/60">
              <span>📍</span>
              <span className="truncate">{vessel.lastPort}</span>
              <span>›</span>
              <span className="truncate">{vessel.nextPort}</span>
            </div>
            {vessel.routeProgress !== undefined && (
              <>
                <div className="relative h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ width: `${vessel.routeProgress}%`, backgroundColor: accentColor }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-sky-400/40">{vessel.routeProgress}% complete</span>
                  {vessel.etaDelta !== undefined && (
                    <span
                      className="font-mono"
                      style={{
                        color:
                          vessel.etaDelta < 0
                            ? "#34d399"
                            : vessel.etaDelta > 0
                            ? "#fb923c"
                            : "rgba(56,189,248,0.5)",
                      }}
                    >
                      {vessel.etaDelta < 0
                        ? `${Math.abs(vessel.etaDelta)}h ahead`
                        : vessel.etaDelta > 0
                        ? `${vessel.etaDelta}h delayed`
                        : "On schedule"}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {(vessel.tce !== undefined ||
          vessel.utilization !== undefined ||
          vessel.ciiRating ||
          vessel.readinessScore !== undefined) && (
          <div className="grid grid-cols-2 gap-2">
            {vessel.tce !== undefined && (
              <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">TCE</p>
                <p className="text-xs font-mono text-sky-100 mt-0.5">
                  {vessel.tce > 0 ? `$${vessel.tce.toLocaleString()}/d` : "—"}
                </p>
              </div>
            )}
            {vessel.utilization !== undefined && (
              <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Utilization</p>
                <p className="text-xs font-mono text-sky-100 mt-0.5">
                  {vessel.utilization > 0 ? `${vessel.utilization}%` : "Unavailable"}
                </p>
              </div>
            )}
            {vessel.ciiRating && (
              <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">CII Rating</p>
                <p
                  className="text-xs font-mono font-bold mt-0.5"
                  style={{
                    color:
                      vessel.ciiRating === "A"
                        ? "#34d399"
                        : vessel.ciiRating === "B"
                        ? accentColor
                        : "#fbbf24",
                  }}
                >
                  {vessel.ciiRating}
                </p>
              </div>
            )}
            {vessel.readinessScore !== undefined && (
              <div className="bg-sky-500/5 rounded-lg p-2.5 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Readiness</p>
                <p
                  className="text-xs font-mono font-bold mt-0.5"
                  style={{
                    color:
                      vessel.readinessScore >= 80
                        ? "#34d399"
                        : vessel.readinessScore >= 60
                        ? "#fbbf24"
                        : "#f87171",
                  }}
                >
                  {vessel.readinessScore}/100
                </p>
              </div>
            )}
          </div>
        )}

        {activeExceptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Active Exceptions</p>
            {activeExceptions.map((exc) => (
              <div key={exc.id} className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5">
                <p className="text-[10px] font-medium text-red-300">{exc.title}</p>
                <p className="text-[9px] text-sky-400/50 mt-0.5">
                  {exc.description.slice(0, 80)}...
                </p>
              </div>
            ))}
          </div>
        )}

        {onViewDetail && (
          <button
            onClick={() => onViewDetail(vessel)}
            className="w-full text-xs border border-sky-500/20 hover:border-sky-500/40 rounded-lg py-2 transition-all"
            style={{ color: accentColor }}
          >
            View Full Detail ›
          </button>
        )}
      </div>
    </div>
  );
}
