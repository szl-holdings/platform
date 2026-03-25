export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const slideUp = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
  transition: { type: "spring", damping: 25, stiffness: 300 },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const shimmer = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: { duration: 2, repeat: Infinity, ease: "linear" },
  },
};

export const pulseGlow = {
  animate: {
    boxShadow: [
      "0 0 20px hsla(250, 90%, 65%, 0.2)",
      "0 0 40px hsla(250, 90%, 65%, 0.4)",
      "0 0 20px hsla(250, 90%, 65%, 0.2)",
    ],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

export const scrollReveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const hoverLift = {
  whileHover: { y: -4, transition: { duration: 0.2 } },
  whileTap: { y: 0, scale: 0.98 },
};

export const hoverScale = {
  whileHover: { scale: 1.02, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 },
};

export const parallaxSlow = (scrollY: number) => ({
  y: scrollY * 0.2,
});

export const parallaxMedium = (scrollY: number) => ({
  y: scrollY * 0.4,
});

export const parallaxFast = (scrollY: number) => ({
  y: scrollY * 0.6,
});
