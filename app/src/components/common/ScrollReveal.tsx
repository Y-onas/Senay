import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  /** Stagger index for sequential reveals. */
  delay?: number
  className?: string
  y?: number
}

/** Reusable fade-up-on-scroll wrapper used across sections and cards. */
export default function ScrollReveal({
  children,
  delay = 0,
  className,
  y = 30,
}: ScrollRevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
