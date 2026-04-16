import { useState, useEffect } from "react";

export interface LiveClockProps {
  className?: string;
  style?: React.CSSProperties;
  format?: "utc" | "local" | "iso";
}

export function LiveClock({ className, style, format = "utc" }: LiveClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const display =
    format === "iso"
      ? time.toISOString().slice(11, 19)
      : format === "local"
        ? time.toLocaleTimeString()
        : `UTC ${time.toISOString().slice(11, 19)}`;

  return (
    <span className={className} style={style}>
      {display}
    </span>
  );
}
