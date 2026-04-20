/**
 * AEEP Motion Tokens
 *
 * Minimal motion. All transitions ≤ 200ms. No decorative animations.
 * Prefer opacity and subtle translate over scale/rotate effects.
 * Respects prefers-reduced-motion.
 */

export const motion = {
  duration: {
    instant: "0ms",
    fast: "100ms",
    base: "150ms",
    slow: "200ms",
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    decelerate: "cubic-bezier(0, 0, 0.2, 1)",
    accelerate: "cubic-bezier(0.4, 0, 1, 1)",
    sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
  },
} as const;

/**
 * Standard transition strings for common use cases.
 */
export const transition = {
  fade: `opacity ${motion.duration.base} ${motion.easing.standard}`,
  slideIn: `transform ${motion.duration.slow} ${motion.easing.decelerate}, opacity ${motion.duration.base} ${motion.easing.standard}`,
  expand: `height ${motion.duration.slow} ${motion.easing.standard}`,
  color: `color ${motion.duration.fast} ${motion.easing.standard}, background-color ${motion.duration.fast} ${motion.easing.standard}, border-color ${motion.duration.fast} ${motion.easing.standard}`,
} as const;
