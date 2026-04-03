export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.38 },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
};

export const slideUp = {
  initial: { opacity: 0, y: "10px" },
  animate: { opacity: 1, y: "0px" },
  exit: { opacity: 0, y: "10px" },
  transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
};

export const slideInRight = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
};

export const panelReveal = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
  transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.08,
    },
  },
};

export const staggerContainerFast = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } },
};

export const staggerItemFast = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const staggerItemLeft = {
  initial: { opacity: 0, x: -14 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } },
};

export const scrollReveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
};

export const scrollRevealLeft = {
  initial: { opacity: 0, x: -22 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
};

export const scrollRevealRight = {
  initial: { opacity: 0, x: 22 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
};

export const hoverLift = {
  whileHover: { y: -3, transition: { duration: 0.20, ease: [0.25, 0.46, 0.45, 0.94] } },
  whileTap: { y: 0, scale: 0.99 },
};

export const hoverLiftSlight = {
  whileHover: { y: -2, transition: { duration: 0.20, ease: [0.25, 0.46, 0.45, 0.94] } },
  whileTap: { y: 0 },
};

export const hoverScale = {
  whileHover: { scale: 1.012, transition: { duration: 0.20, ease: [0.25, 0.46, 0.45, 0.94] } },
  whileTap: { scale: 0.988 },
};

export const navReveal = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
};

export const shimmer = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: { duration: 2.4, repeat: Infinity, ease: "linear" },
  },
};

export const pulseSubtle = {
  animate: {
    opacity: [0.65, 1, 0.65],
    transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
  },
};

export const nodePulse = {
  animate: {
    scale: [1, 1.04, 1],
    opacity: [0.8, 1, 0.8],
    transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
  },
};

export const signalPulse = {
  animate: {
    opacity: [0.6, 1, 0.6],
    scale: [0.98, 1.01, 0.98],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
};

export const ambientDrift = {
  animate: {
    y: [0, -6, 0],
    transition: { duration: 8, repeat: Infinity, ease: "easeInOut" },
  },
};

export const sectionReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
};

export const cardReveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

export const parallaxSlow = (scrollY: number) => ({
  y: scrollY * 0.12,
});

export const parallaxMedium = (scrollY: number) => ({
  y: scrollY * 0.24,
});

export const parallaxFast = (scrollY: number) => ({
  y: scrollY * 0.42,
});
