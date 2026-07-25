export const easeOut = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.32, ease: easeOut },
};

export const popIn = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.28, ease: easeOut },
};

export const dealCard = {
  initial: { opacity: 0, y: -18, rotate: -6 },
  animate: { opacity: 1, y: 0, rotate: 0 },
  transition: { type: "spring" as const, stiffness: 420, damping: 28 },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};
