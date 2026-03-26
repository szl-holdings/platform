import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface GaugeProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

function useAnimatedCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(parseFloat((eased * target).toFixed(1)));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return count;
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
  const arcLength = circumference * 0.75;
  const offset = circumference * 0.25 * 0.5;
  
  const percentage = Math.min(value / max, 1);
  const strokeDashoffset = arcLength - (percentage * arcLength);
  const animatedValue = useAnimatedCounter(value);

  const getColor = () => {
    if (value >= 80) return color;
    if (value >= 60) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const gaugeColor = getColor();

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
            <stop offset="0%" stopColor={gaugeColor} stopOpacity="1" />
            <stop offset="100%" stopColor={gaugeColor} stopOpacity="0.5" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
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

        {Array.from({ length: 30 }).map((_, i) => {
          const angle = (i / 30) * 270 - 135;
          const rad = (angle * Math.PI) / 180;
          const innerR = radius - strokeWidth / 2 - 6;
          const outerR = radius - strokeWidth / 2 - 2;
          const x1 = size / 2 + innerR * Math.cos(rad);
          const y1 = size / 2 + innerR * Math.sin(rad);
          const x2 = size / 2 + outerR * Math.cos(rad);
          const y2 = size / 2 + outerR * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={i % 5 === 0 ? 2 : 1}
            />
          );
        })}
        
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
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pb-4">
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          className="text-5xl font-display font-bold text-white tracking-tighter"
        >
          {animatedValue.toFixed(1)}
        </motion.span>
        {label && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-sm font-medium text-muted-foreground uppercase tracking-widest mt-1"
          >
            {label}
          </motion.span>
        )}
      </div>
    </div>
  );
}
