import React, { useState } from 'react'
import { CCard, CCardBody, CCardHeader, CButton, CForm, CFormInput, CFormLabel, CRow, CCol, CAvatar, CBadge } from '@coreui/react'
import avatar8 from '../../../assets/images/avatars/8.jpg'

const ProfileSimple = () => {
  const [username, setUsername] = useState('John Doe')
  const [email, setEmail] = useState('john.doe@email.com')
  const [plan, setPlan] = useState('premium')
  const [avatar, setAvatar] = useState(avatar8)
  const [activeTab, setActiveTab] = useState('profile')

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setAvatar(ev.target.result)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <CCard className="shadow-lg border-0" style={{ borderRadius: 24 }}>
            <CCardHeader 
              className="text-center border-0 pb-0" 
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                borderTopLeftRadius: 24, 
                borderTopRightRadius: 24, 
                fontSize: 28, 
                fontWeight: 700 
              }}
            >
              <i className="fas fa-user-circle me-2"></i>
              Profile & Subscription
            </CCardHeader>
            
            <CCardBody className="p-0">
              <div className="border-bottom">
                <div className="nav nav-tabs nav-fill" role="tablist">
                  <button
                    className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                    style={{ 
                      border: 'none',
                      background: activeTab === 'profile' ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                      color: activeTab === 'profile' ? '#667eea' : '#6c757d',
                      fontWeight: '600',
                      padding: '1rem 1.5rem',
                      borderRadius: '0',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="fas fa-user me-2"></i>
                    Profile
                  </button>
                  <button
                    className={`nav-link ${activeTab === 'subscription' ? 'active' : ''}`}
                    onClick={() => setActiveTab('subscription')}
                    style={{ 
                      border: 'none',
                      background: activeTab === 'subscription' ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                      color: activeTab === 'subscription' ? '#667eea' : '#6c757d',
                      fontWeight: '600',
                      padding: '1rem 1.5rem',
                      borderRadius: '0',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="fas fa-crown me-2"></i>
                    Subscription
                  </button>
                </div>
              </div>

              <div className="p-4">
                {activeTab === 'profile' && (
                  <div>
                    <div className="d-flex flex-column align-items-center mb-4">
                      <CAvatar src={avatar} size="xl" className="mb-2 shadow" style={{ border: '4px solid #6C63FF' }} />
                      <label htmlFor="avatar-upload" className="btn btn-outline-primary btn-sm mb-2">
                        <i className="fas fa-camera me-1"></i>
                        Change Picture
                      </label>
                      <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                      <CBadge 
                        color={plan === 'premium' ? 'warning' : 'secondary'} 
                        className="fs-6 px-3 py-2" 
                        style={{ fontWeight: 600, fontSize: 16 }}
                      >
                        <i className="fas fa-crown me-1"></i>
                        {plan === 'premium' ? 'Premium Plan' : 'Free Plan'}
                      </CBadge>
                    </div>

                    <CForm>
                      <CRow>
                        <CCol md={6}>
                          <CFormLabel htmlFor="username">
                            <i className="fas fa-user me-1"></i>
                            Username
                          </CFormLabel>
                          <CFormInput 
                            id="username" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            className="mb-3" 
                            style={{ borderRadius: '12px' }}
                          />
                        </CCol>
                        <CCol md={6}>
                          <CFormLabel htmlFor="email">
                            <i className="fas fa-envelope me-1"></i>
                            Email
                          </CFormLabel>
                          <CFormInput 
                            id="email" 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className="mb-3"
                            style={{ borderRadius: '12px' }}
                          />
                        </CCol>
                      </CRow>

                      <CButton 
                        color="success" 
                        className="w-100" 
                        style={{ 
                          fontWeight: 600, 
                          fontSize: 18,
                          borderRadius: '12px',
                          padding: '12px 24px'
                        }}
                      >
                        <i className="fas fa-save me-2"></i>
                        Save Changes
                      </CButton>
                    </CForm>
                  </div>
                )}

                {activeTab === 'subscription' && (
                  <div className="text-center py-5">
                    <h5>Subscription Management</h5>
                    <p className="text-muted">Subscription features will be displayed here.</p>
                  </div>
                )}
              </div>
            </CCardBody>
          </CCard>
        </div>
      </div>
    </div>
  )
}

export default ProfileSimple
