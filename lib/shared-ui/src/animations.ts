export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.4 },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -18 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

export const slideUp = {
  initial: { opacity: 0, y: "12px" },
  animate: { opacity: 1, y: "0px" },
  exit: { opacity: 0, y: "12px" },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

export const slideInRight = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export const staggerItemFast = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const scrollReveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
};

export const scrollRevealLeft = {
  initial: { opacity: 0, x: -24 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
};

export const scrollRevealRight = {
  initial: { opacity: 0, x: 24 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
};

export const hoverLift = {
  whileHover: { y: -3, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } },
  whileTap: { y: 0, scale: 0.99 },
};

export const hoverScale = {
  whileHover: { scale: 1.015, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } },
  whileTap: { scale: 0.985 },
};

export const shimmer = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: { duration: 2.4, repeat: Infinity, ease: "linear" },
  },
};

export const navReveal = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

// Parallax utilities (preserved from HEAD)
export const parallaxSlow = (scrollY: number) => ({
  y: scrollY * 0.15,
});

export const parallaxMedium = (scrollY: number) => ({
  y: scrollY * 0.3,
});

export const parallaxFast = (scrollY: number) => ({
  y: scrollY * 0.5,
});

export const pulseSubtle = {
  animate: {
    opacity: [0.7, 1, 0.7],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
};
