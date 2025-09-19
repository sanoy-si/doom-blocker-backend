
import React from 'react'
import { AppContent, AppFooter, AppSidebar, AppHeader } from '../components/index'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'


const DefaultLayout = () => {
  const location = useLocation();
  return (
    <div>
      {/* Sidebar only on mobile (below lg) */}
      <div className="d-lg-none">
        <AppSidebar />
      </div>
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="body flex-grow-1"
          >
            <AppContent />
          </motion.div>
        </AnimatePresence>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
