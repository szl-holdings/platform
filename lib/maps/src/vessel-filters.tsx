import * as React from "react";

export interface VesselFilterOption {
  key: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  formatLabel?: (option: string) => string;
}

export interface VesselFiltersProps {
  filterGroups: VesselFilterOption[];
  totalCount: number;
  filteredCount: number;
  accentColor?: string;
  className?: string;
}

export function VesselFilters({
  filterGroups,
  totalCount,
  filteredCount,
  accentColor = "#0ea5e9",
  className,
}: VesselFiltersProps) {
  return (
    <div
      className={`px-4 py-2 border-b border-sky-500/10 flex items-start gap-4 flex-wrap ${className ?? ""}`}
    >
      {filterGroups.map((group) => (
        <div key={group.key} className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-sky-400/40 shrink-0">{group.label}:</span>
          <div className="flex items-center gap-1 flex-wrap">
            {group.options.map((opt) => (
              <button
                key={opt}
                onClick={() => group.onChange(opt)}
                className="text-[10px] px-2 py-1 rounded border transition-all capitalize"
                style={
                  group.value === opt
                    ? {
                        backgroundColor: `${accentColor}18`,
                        borderColor: `${accentColor}50`,
                        color: accentColor,
                      }
                    : {
                        borderColor: "rgba(56,189,248,0.1)",
                        color: "rgba(56,189,248,0.4)",
                      }
                }
              >
                {opt === "all" ? "All" : (group.formatLabel?.(opt) ?? opt.replace(/_/g, " "))}
              </button>
            ))}
          </div>
        </div>
      ))}
      <span className="ml-auto text-[10px] text-sky-400/40 self-center">
        {filteredCount} of {totalCount} shown
      </span>
    </div>
  );
}
