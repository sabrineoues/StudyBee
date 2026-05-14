import type { PropsWithChildren } from "react";
import { motion } from "framer-motion";

export type RevealProps = PropsWithChildren<{
  className?: string;
  delay?: number;
  id?: string;
}>;

export function Reveal({ children, className, delay = 0, id }: RevealProps) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
