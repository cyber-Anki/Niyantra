import { motion } from 'framer-motion'

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: 'easeOut' },
}

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0.02 },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

export function MotionPage({ children, className }) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      {children}
    </motion.div>
  )
}

export function StaggerList({ children, className }) {
  return (
    <motion.div className={className} initial="initial" animate="animate" variants={staggerContainer}>
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className, ...rest }) {
  return (
    <motion.div className={className} variants={staggerItem} {...rest}>
      {children}
    </motion.div>
  )
}

export function HoverCard({ children, className, ...rest }) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(15,23,42,0.08)' }}
      transition={{ duration: 0.18 }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function CountUp({ value, decimals = 0, suffix = '' }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {typeof value === 'number' ? value.toFixed(decimals) : value}
      {suffix}
    </motion.span>
  )
}
