import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilSpeedometer, cilNotes, cilDrop, cilStar } from '@coreui/icons'
import { CNavItem } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Manage Keywords',
    to: '/manage-keywords',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'About',
    to: '/about',
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
  },
]

export default _nav
