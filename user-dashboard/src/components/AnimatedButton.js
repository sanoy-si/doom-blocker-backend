import React from 'react'
import { motion } from 'framer-motion'
import { CButton } from '@coreui/react'

const buttonVariants = {
  rest: { scale: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  hover: { scale: 1.045, boxShadow: '0 4px 16px rgba(80,80,255,0.10)' },
  tap: { scale: 0.97, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
}

const AnimatedButton = React.forwardRef(({ children, ...props }, ref) => (
  <motion.div
    variants={buttonVariants}
    initial="rest"
    whileHover="hover"
    whileTap="tap"
    style={{ display: 'inline-block', borderRadius: 8 }}
  >
    <CButton ref={ref} {...props}>
      {children}
    </CButton>
  </motion.div>
))

export default AnimatedButton
