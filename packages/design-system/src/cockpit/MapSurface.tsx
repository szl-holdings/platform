import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

export interface MapMarker {
  id: string;
  x: number;
  y: number;
  label: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  tooltip?: string;
}

export interface MapSurfaceProps {
  imageUrl?: string;
  markers?: MapMarker[];
  className?: string;
  height?: string | number;
  onMarkerClick?: (marker: MapMarker) => void;
  showGrid?: boolean;
}

const sizeMap = { sm: 8, md: 12, lg: 16 } as const;

export function MapSurface({
  imageUrl,
  markers = [],
  className,
  height = 300,
  onMarkerClick,
  showGrid = true,
}: MapSurfaceProps) {
  return (
    <div
      className={cn("relative rounded-lg overflow-hidden", className)}
      style={{ height, border: `1px solid ${color.border.default}`, background: color.bg.surface }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Map surface"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
      ) : (
        showGrid && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(${color.border.default} 1px, transparent 1px), linear-gradient(90deg, ${color.border.default} 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        )
      )}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, ${color.bg.base}b0 100%)`,
        }}
      />

      {markers.map((marker) => {
        const r = sizeMap[marker.size ?? "md"];
        const fill = marker.color ?? color.accent.blue;

        return (
          <button
            key={marker.id}
            title={marker.tooltip ?? marker.label}
            aria-label={marker.label}
            onClick={() => onMarkerClick?.(marker)}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2",
              "transition-transform duration-150 hover:scale-125 focus:outline-none",
              onMarkerClick ? "cursor-pointer" : "cursor-default pointer-events-none",
            )}
            style={{
              left: `${marker.x * 100}%`,
              top:  `${marker.y * 100}%`,
              width:  r * 2,
              height: r * 2,
              borderColor: fill,
              backgroundColor: fill + "33",
            }}
          >
            {marker.pulse && (
              <span
                className="absolute inset-0 rounded-full animate-ping opacity-60"
                style={{ backgroundColor: fill }}
              />
            )}
            <span className="sr-only">{marker.label}</span>
          </button>
        );
      })}

      {markers.map((marker) => (
        <div
          key={`label-${marker.id}`}
          className="absolute pointer-events-none"
          style={{
            left: `${marker.x * 100}%`,
            top:  `calc(${marker.y * 100}% + ${sizeMap[marker.size ?? "md"] + 6}px)`,
            transform: "translateX(-50%)",
          }}
        >
          <span
            className="block whitespace-nowrap rounded px-1 py-0.5 text-xs font-medium"
            style={{ color: color.text.primary, background: color.bg.base + "cc" }}
          >
            {marker.label}
          </span>
        </div>
      ))}
    </div>
  );
}
