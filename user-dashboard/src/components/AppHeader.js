import React, { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  useColorModes,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilContrast,
  cilEnvelopeOpen,
  cilList,
  cilMenu,
  cilMoon,
  cilSun,
} from '@coreui/icons'

import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'

const AppHeader = () => {
  const headerRef = useRef()
  const { colorMode, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')

  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)

  useEffect(() => {
    document.addEventListener('scroll', () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    })
  }, [])

  return (
    <CHeader 
      position="sticky" 
      className="mb-4 p-0 modern-header" 
      ref={headerRef}
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <CContainer className="px-4" fluid>
        <div className="d-flex align-items-center justify-content-between w-100">
          <div className="d-flex align-items-center">
            <CHeaderToggler
              onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
              className="d-lg-none me-3 modern-toggler"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white'
              }}
            >
              <CIcon icon={cilMenu} size="lg" />
            </CHeaderToggler>
            
            <CHeaderNav className="d-none d-md-flex align-items-center">
              <CNavItem className="me-4">
                <div className="d-flex align-items-center">
                  <div className="brand-icon me-2">
                    <div className="bg-white bg-opacity-20 rounded-circle p-2">
                      <i className="fas fa-filter text-white"></i>
                    </div>
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-white">Topaz</h5>
                    <small className="text-white-50">Content Filter</small>
                  </div>
                </div>
              </CNavItem>
              <CNavItem className="me-3">
                <CNavLink 
                  to="/dashboard" 
                  as={NavLink}
                  className="modern-nav-link"
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: '500',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className="fas fa-tachometer-alt me-2"></i>
                  Dashboard
                </CNavLink>
              </CNavItem>
              <CNavItem className="me-3">
                <CNavLink 
                  to="/manage-keywords" 
                  as={NavLink}
                  className="modern-nav-link"
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: '500',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className="fas fa-key me-2"></i>
                  Keywords
                </CNavLink>
              </CNavItem>
              <CNavItem className="me-3">
                <CNavLink 
                  to="/about" 
                  as={NavLink}
                  className="modern-nav-link"
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: '500',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className="fas fa-info-circle me-2"></i>
                  About
                </CNavLink>
              </CNavItem>
            </CHeaderNav>
          </div>
          
          <CHeaderNav className="d-flex align-items-center">
            <div className="d-flex align-items-center gap-3">
              {/* Subscription Status Indicator */}
              <div className="d-flex align-items-center text-white-50">
                <div className="bg-secondary rounded-circle me-2" style={{ width: '8px', height: '8px' }}></div>
                <small>Free</small>
              </div>
              
              <div className="vr h-100 mx-2 text-white text-opacity-25"></div>
              
              {/* Theme Toggle */}
              <CDropdown variant="nav-item" placement="bottom-end">
                <CDropdownToggle 
                  caret={false}
                  className="modern-theme-toggle"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '8px 12px'
                  }}
                >
                  {colorMode === 'dark' ? (
                    <CIcon icon={cilMoon} size="lg" />
                  ) : colorMode === 'auto' ? (
                    <CIcon icon={cilContrast} size="lg" />
                  ) : (
                    <CIcon icon={cilSun} size="lg" />
                  )}
                </CDropdownToggle>
                <CDropdownMenu className="modern-dropdown">
                  <CDropdownItem
                    active={colorMode === 'light'}
                    className="d-flex align-items-center modern-dropdown-item"
                    as="button"
                    type="button"
                    onClick={() => setColorMode('light')}
                  >
                    <CIcon className="me-2" icon={cilSun} size="lg" /> Light
                  </CDropdownItem>
                  <CDropdownItem
                    active={colorMode === 'dark'}
                    className="d-flex align-items-center modern-dropdown-item"
                    as="button"
                    type="button"
                    onClick={() => setColorMode('dark')}
                  >
                    <CIcon className="me-2" icon={cilMoon} size="lg" /> Dark
                  </CDropdownItem>
                  <CDropdownItem
                    active={colorMode === 'auto'}
                    className="d-flex align-items-center modern-dropdown-item"
                    as="button"
                    type="button"
                    onClick={() => setColorMode('auto')}
                  >
                    <CIcon className="me-2" icon={cilContrast} size="lg" /> Auto
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
              
              <div className="vr h-100 mx-2 text-white text-opacity-25"></div>
              
              <AppHeaderDropdown />
            </div>
          </CHeaderNav>
        </div>
      </CContainer>
    </CHeader>
  )
}

export default AppHeader
