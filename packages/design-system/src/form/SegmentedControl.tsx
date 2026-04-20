import React from "react";
import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn("flex items-center rounded-md p-0.5", className)}
      style={{ background: color.bg.overlay, border: `1px solid ${color.border.subtle}` }}
      role="group"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            onClick={() => !option.disabled && onChange(option.value)}
            className="rounded px-3 text-xs font-medium transition-colors"
            style={{
              height: "28px",
              background: isActive ? color.bg.active : "transparent",
              color: isActive
                ? color.text.primary
                : option.disabled
                  ? color.border.default
                  : color.text.secondary,
              border: "none",
              cursor: option.disabled ? "not-allowed" : "pointer",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
