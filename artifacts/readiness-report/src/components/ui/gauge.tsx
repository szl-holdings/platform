import React from 'react';
import { motion } from 'framer-motion';

interface GaugeProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function Gauge({ 
  value, 
  max = 100, 
  size = 200, 
  strokeWidth = 16, 
  color = "hsl(var(--primary))",
  label
}: GaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Use 75% of the circle for the gauge (leaves a gap at the bottom)
  const arcLength = circumference * 0.75;
  const offset = circumference * 0.25 * 0.5; // Offset to start at the bottom left
  
  const percentage = Math.min(value / max, 1);
  const strokeDashoffset = arcLength - (percentage * arcLength);

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id={`gradient-${value}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/5"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={-offset}
          strokeLinecap="round"
        />
        
        {/* Progress Fill */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gradient-${value})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ strokeDashoffset: arcLength - offset }}
          animate={{ strokeDashoffset: strokeDashoffset - offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      
      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pb-4">
        <motion.span 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-5xl font-display font-bold text-white tracking-tighter"
        >
          {value.toFixed(1)}
        </motion.span>
        {label && (
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
