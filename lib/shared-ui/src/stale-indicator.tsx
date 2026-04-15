import { useIsFetching } from "@tanstack/react-query";
import { cn } from "./utils";

interface StaleIndicatorProps {
  className?: string;
  accentColor?: string;
}

export function StaleIndicator({ className, accentColor = "#3b82f6" }: StaleIndicatorProps) {
  const isFetching = useIsFetching();

  if (!isFetching) return null;

  return (
    <div
      className={cn("fixed top-0 left-0 right-0 z-[9999] h-[2px] overflow-hidden pointer-events-none", className)}
      role="progressbar"
      aria-label="Refreshing data"
    >
      <div
        className="h-full w-1/3 animate-stale-slide rounded-full"
        style={{ background: accentColor, opacity: 0.8 }}
      />
      <style>{`
        @keyframes stale-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(400%); }
        }
        .animate-stale-slide {
          animation: stale-slide 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export function StaleIndicatorBar({ accentColor = "#3b82f6" }: { accentColor?: string }) {
  const isFetching = useIsFetching();

  if (!isFetching) return null;

  return (
    <div
      className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none z-50"
      role="progressbar"
      aria-label="Refreshing"
    >
      <div
        className="h-full w-1/3 animate-stale-slide rounded-full"
        style={{ background: accentColor, opacity: 0.7 }}
      />
      <style>{`
        @keyframes stale-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(400%); }
        }
        .animate-stale-slide {
          animation: stale-slide 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
