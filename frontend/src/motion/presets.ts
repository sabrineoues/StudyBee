export const springSnappy = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.9,
} as const;

export const tapScale = { scale: 0.98 } as const;

export const hoverLift = {
  y: -3,
  scale: 1.02,
} as const;

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
} as const;

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: springSnappy },
} as const;
