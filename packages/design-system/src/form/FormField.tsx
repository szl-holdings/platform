import React, { type ReactNode } from "react";
import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, required, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium" style={{ color: color.text.primary }}>
        {label}
        {required && <span style={{ color: color.accent.red, marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: color.accent.red }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: color.text.muted }}>{hint}</p>}
    </div>
  );
}
