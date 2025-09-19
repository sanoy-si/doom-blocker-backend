import React from 'react'
import { CFooter } from '@coreui/react'
import { AnimatedIcon } from './AnimatedIcon'

const AppFooter = () => {
  return (
    <CFooter
      className="px-4 d-flex flex-column flex-md-row align-items-center justify-content-between"
      style={{
        background: 'linear-gradient(90deg, #43cea2 0%, #185a9d 100%)',
        borderTop: 'none',
        minHeight: 120,
        fontWeight: 500,
        fontSize: 18,
        boxShadow: '0 -2px 16px 0 rgba(31, 38, 135, 0.12)',
      }}
    >
      <div className="d-flex align-items-center gap-3">
        <AnimatedIcon>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#43cea2" fillOpacity="0.18"/>
            <path d="M12 6.5C13.933 6.5 15.5 8.067 15.5 10C15.5 11.933 13.933 13.5 12 13.5C10.067 13.5 8.5 11.933 8.5 10C8.5 8.067 10.067 6.5 12 6.5ZM12 15C15.3137 15 18 16.1193 18 17.5V18.5C18 18.7761 17.7761 19 17.5 19H6.5C6.22386 19 6 18.7761 6 18.5V17.5C6 16.1193 8.68629 15 12 15Z" fill="#fff"/>
          </svg>
        </AnimatedIcon>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 24, letterSpacing: 1 }}>Topaz</span>
        <span className="ms-3" style={{ color: '#e0e0e0', fontWeight: 400, fontSize: 17 }}>&copy; {new Date().getFullYear()} Topaz Team.</span>
      </div>
      <div className="d-flex align-items-center gap-4 mt-4 mt-md-0">
        <a href="https://github.com/" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <AnimatedIcon>
            <svg width="28" height="28" fill="#fff" viewBox="0 0 24 24"><path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.43 7.86 10.96.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.45 24 17.12 24 12.02 24 5.74 18.77.5 12 .5z"/></svg>
          </AnimatedIcon>
        </a>
        <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
          <AnimatedIcon>
            <svg width="28" height="28" fill="#fff" viewBox="0 0 24 24"><path d="M24 4.56c-.89.39-1.85.65-2.86.77a4.93 4.93 0 0 0 2.16-2.72c-.95.56-2 .97-3.13 1.19A4.92 4.92 0 0 0 16.62 3c-2.72 0-4.93 2.21-4.93 4.93 0 .39.04.77.12 1.13C7.69 8.86 4.07 7.13 1.64 4.15c-.43.74-.68 1.6-.68 2.52 0 1.74.89 3.28 2.25 4.18-.83-.03-1.61-.25-2.29-.63v.06c0 2.43 1.73 4.46 4.03 4.92-.42.12-.87.18-1.33.18-.32 0-.63-.03-.93-.09.63 1.97 2.45 3.4 4.6 3.44A9.87 9.87 0 0 1 0 21.54a13.94 13.94 0 0 0 7.56 2.22c9.05 0 14-7.5 14-14 0-.21 0-.42-.02-.63A9.93 9.93 0 0 0 24 4.56z"/></svg>
          </AnimatedIcon>
        </a>
        <a href="mailto:hello@topaz.com" aria-label="Email">
          <AnimatedIcon>
            <svg width="28" height="28" fill="#fff" viewBox="0 0 24 24"><path d="M12 13.065l-8-6.065V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7l-8 6.065zM20 6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v.217l8 6.066 8-6.066V6z"/></svg>
          </AnimatedIcon>
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
