import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CAvatar } from '@coreui/react'
import avatar8 from './../../assets/images/avatars/8.jpg'

const AppHeaderDropdown = () => {
  const navigate = useNavigate()
  return (
    <button
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      onClick={() => navigate('/profile')}
      aria-label="Profile"
    >
      <CAvatar src={avatar8} size="md" />
    </button>
  )
}

export default AppHeaderDropdown
