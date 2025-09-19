
import { motion } from 'framer-motion'
import { AnimatedIcon } from 'src/components/AnimatedIcon'

const About = () => {
  return (
    <motion.div
      className="d-flex flex-column align-items-center justify-content-center"
      style={{ minHeight: '70vh', background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', borderRadius: 24, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)', padding: '3rem 1rem' }}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      <AnimatedIcon style={{ fontSize: 72, color: '#6C63FF', marginBottom: 24 }}>
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#6C63FF" fillOpacity="0.15"/>
          <path d="M12 6.5C13.933 6.5 15.5 8.067 15.5 10C15.5 11.933 13.933 13.5 12 13.5C10.067 13.5 8.5 11.933 8.5 10C8.5 8.067 10.067 6.5 12 6.5ZM12 15C15.3137 15 18 16.1193 18 17.5V18.5C18 18.7761 17.7761 19 17.5 19H6.5C6.22386 19 6 18.7761 6 18.5V17.5C6 16.1193 8.68629 15 12 15Z" fill="#6C63FF"/>
        </svg>
      </AnimatedIcon>
      <h1 className="fw-bold mb-3" style={{ color: '#3a3a3a', fontSize: 40 }}>Welcome to Topaz</h1>
      <p className="lead mb-4" style={{ color: '#444', maxWidth: 600, fontSize: 22 }}>
        Topaz empowers you to take control of your digital world.<br />
        Block distractions, reclaim your time, and focus on what truly matters.<br />
        <span style={{ color: '#6C63FF', fontWeight: 600 }}>Beautifully simple. Incredibly effective.</span>
      </p>
      <div style={{ fontSize: 18, color: '#888', fontStyle: 'italic' }}>
        "The best way to predict the future is to create it."
      </div>
    </motion.div>
  )
}

export default About
