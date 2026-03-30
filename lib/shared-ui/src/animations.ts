export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
  transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] },
};

export const slideUp = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

export const slideInRight = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
};

export const shimmer = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
  },
};

export const scrollReveal = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

export const hoverLift = {
  whileHover: { y: -2, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } },
  whileTap: { y: 0, scale: 0.99, transition: { duration: 0.1 } },
};

export const hoverScale = {
  whileHover: { scale: 1.01, transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] } },
  whileTap: { scale: 0.99, transition: { duration: 0.1 } },
};

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
