import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'

import { AppSidebarNav } from './AppSidebarNav'

import { logo } from 'src/assets/brand/logo'
import { sygnet } from 'src/assets/brand/sygnet'

// sidebar nav config
import navigation from '../_nav'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)

  return (
    <CSidebar
      className="border-end modern-sidebar"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <CSidebarHeader className="border-bottom modern-sidebar-header" style={{
        background: 'rgba(255, 255, 255, 0.1)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <CSidebarBrand to="/" className="modern-brand">
          <div className="d-flex align-items-center">
            <div className="brand-icon me-3">
              <CIcon customClassName="sidebar-brand-full" icon={logo} height={32} style={{
                filter: 'brightness(0) invert(1)'
              }} />
              <CIcon customClassName="sidebar-brand-narrow" icon={sygnet} height={32} style={{
                filter: 'brightness(0) invert(1)'
              }} />
            </div>
            <div className="brand-text">
              <h5 className="mb-0 fw-bold text-white">Topaz</h5>
              <small className="text-white-50">Content Filter</small>
            </div>
          </div>
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none modern-close-btn"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px'
          }}
        />
      </CSidebarHeader>
      <div className="sidebar-content">
        <AppSidebarNav items={navigation} />
      </div>
      <CSidebarFooter className="border-top d-none d-lg-flex modern-sidebar-footer" style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
          className="modern-toggler"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white'
          }}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
