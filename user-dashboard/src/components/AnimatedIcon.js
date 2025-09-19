import { motion } from 'framer-motion'

export const gradientBg = {
  background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
}

export const iconVariants = {
  initial: { scale: 1, rotate: 0 },
  animate: { scale: 1.12, rotate: 8, transition: { yoyo: Infinity, duration: 1.8, ease: 'easeInOut' } },
  hover: { scale: 1.18, rotate: 0, transition: { duration: 0.3 } },
}

export const AnimatedIcon = ({ children, ...props }) => (
  <motion.div
    variants={iconVariants}
    initial="initial"
    animate="animate"
    whileHover="hover"
    style={{ display: 'inline-block' }}
    {...props}
  >
    {children}
  </motion.div>
)
