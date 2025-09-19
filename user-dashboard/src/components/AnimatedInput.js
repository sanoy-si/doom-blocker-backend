import React from 'react'
import { motion } from 'framer-motion'
import { CFormInput } from '@coreui/react'

const inputVariants = {
  rest: { boxShadow: '0 1px 4px rgba(0,0,0,0.04)', borderColor: '#ced4da' },
  focus: { boxShadow: '0 0 0 3px rgba(80,80,255,0.13)', borderColor: '#6C63FF' },
}

const AnimatedInput = React.forwardRef(({ onFocus, onBlur, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false)
  return (
    <motion.div
      animate={isFocused ? 'focus' : 'rest'}
      variants={inputVariants}
      style={{ borderRadius: 8 }}
    >
      <CFormInput
        ref={ref}
        {...props}
        onFocus={e => {
          setIsFocused(true)
          onFocus && onFocus(e)
        }}
        onBlur={e => {
          setIsFocused(false)
          onBlur && onBlur(e)
        }}
      />
    </motion.div>
  )
})

export default AnimatedInput
