import { useState } from 'react'
// import KeywordManager from 'src/components/KeywordManager'
import { logo } from 'src/assets/brand/logo'
import React from 'react'
import classNames from 'classnames'

import {
  CAvatar,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cibCcAmex,
  cibCcApplePay,
  cibCcMastercard,
  cibCcPaypal,
  cibCcStripe,
  cibCcVisa,
  cibGoogle,
  cibYoutube,
  cibLinkedin,
  cibTwitter,
  cibReddit,
  cifBr,
  cifEs,
  cifFr,
  cifIn,
  cifPl,
  cifUs,
  cilCloudDownload,
  cilPeople,
  cilUser,
  cilUserFemale,
} from '@coreui/icons'

import avatar1 from 'src/assets/images/avatars/1.jpg'
import avatar2 from 'src/assets/images/avatars/2.jpg'
import avatar3 from 'src/assets/images/avatars/3.jpg'
import avatar4 from 'src/assets/images/avatars/4.jpg'
import avatar5 from 'src/assets/images/avatars/5.jpg'
import avatar6 from 'src/assets/images/avatars/6.jpg'

import WidgetsBrand from '../widgets/WidgetsBrand'
import WidgetsDropdown from '../widgets/WidgetsDropdown'

import MainChart from './MainChart'

const Dashboard = () => {
  const [platforms, setPlatforms] = useState({
    youtube: true,
    linkedin: true,
    x: true,
    reddit: true,
  })

  const [period, setPeriod] = useState('Month')

  const handleToggle = (platform) => {
    setPlatforms((prev) => ({ ...prev, [platform]: !prev[platform] }))
  }

  // Example data for each period
  const blockedDataByPeriod = {
    Day: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      youtube: [2, 3, 4, 5, 6, 8, 12],
      x: [1, 2, 3, 4, 5, 6, 8],
      linkedin: [0, 1, 2, 2, 3, 4, 5],
      reddit: [1, 1, 2, 2, 3, 3, 4],
    },
    Month: {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      youtube: [20, 30, 40, 50, 60, 80, 120],
      x: [10, 18, 25, 35, 50, 60, 78],
      linkedin: [5, 10, 15, 20, 25, 35, 45],
      reddit: [3, 5, 8, 12, 15, 18, 22],
    },
    Year: {
      labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025'],
      youtube: [100, 200, 300, 400, 500, 600, 700],
      x: [50, 100, 150, 200, 250, 300, 350],
      linkedin: [20, 40, 60, 80, 100, 120, 140],
      reddit: [10, 20, 30, 40, 60, 80, 100],
    },
  }

  const progressGroupExample1 = [
    { title: 'Monday', value1: 34, value2: 78 },
    { title: 'Tuesday', value1: 56, value2: 94 },
    { title: 'Wednesday', value1: 12, value2: 67 },
    { title: 'Thursday', value1: 43, value2: 91 },
    { title: 'Friday', value1: 22, value2: 73 },
    { title: 'Saturday', value1: 53, value2: 82 },
    { title: 'Sunday', value1: 9, value2: 69 },
  ]

  const progressGroupExample2 = [
    { title: 'Male', icon: cilUser, value: 53 },
    { title: 'Female', icon: cilUserFemale, value: 43 },
  ]

  const progressGroupExample3 = [
  {
    title: 'YouTube',
    icon: cibYoutube,
    blocked: 120,
    keywords: ['spoiler', 'politics', 'prank'],
  },
  {
    title: 'LinkedIn',
    icon: cibLinkedin,
    blocked: 45,
    keywords: ['job offer', 'promotion', 'hiring'],
  },
  {
    title: 'X',
    icon: cibTwitter,
    blocked: 78,
    keywords: ['giveaway', 'crypto', 'NSFW'],
  },
  ]

  const tableExample = [
    {
      avatar: { src: avatar1, status: 'success' },
      user: {
        name: 'Yiorgos Avraamu',
        new: true,
        registered: 'Jan 1, 2023',
      },
      country: { name: 'USA', flag: cifUs },
      usage: {
        value: 50,
        period: 'Jun 11, 2023 - Jul 10, 2023',
        color: 'success',
      },
      payment: { name: 'Mastercard', icon: cibCcMastercard },
      activity: '10 sec ago',
    },
    {
      avatar: { src: avatar2, status: 'danger' },
      user: {
        name: 'Avram Tarasios',
        new: false,
        registered: 'Jan 1, 2023',
      },
      country: { name: 'Brazil', flag: cifBr },
      usage: {
        value: 22,
        period: 'Jun 11, 2023 - Jul 10, 2023',
        color: 'info',
      },
      payment: { name: 'Visa', icon: cibCcVisa },
      activity: '5 minutes ago',
    },
    {
      avatar: { src: avatar3, status: 'warning' },
      user: { name: 'Quintin Ed', new: true, registered: 'Jan 1, 2023' },
      country: { name: 'India', flag: cifIn },
      usage: {
        value: 74,
        period: 'Jun 11, 2023 - Jul 10, 2023',
        color: 'warning',
      },
      payment: { name: 'Stripe', icon: cibCcStripe },
      activity: '1 hour ago',
    },
    {
      avatar: { src: avatar4, status: 'secondary' },
      user: { name: 'Enéas Kwadwo', new: true, registered: 'Jan 1, 2023' },
      country: { name: 'France', flag: cifFr },
      usage: {
        value: 98,
        period: 'Jun 11, 2023 - Jul 10, 2023',
        color: 'danger',
      },
      payment: { name: 'PayPal', icon: cibCcPaypal },
      activity: 'Last month',
    },
    {
      avatar: { src: avatar5, status: 'success' },
      user: {
        name: 'Agapetus Tadeáš',
        new: true,
        registered: 'Jan 1, 2023',
      },
      country: { name: 'Spain', flag: cifEs },
      usage: {
        value: 22,
        period: 'Jun 11, 2023 - Jul 10, 2023',
        color: 'primary',
      },
      payment: { name: 'Google Wallet', icon: cibCcApplePay },
      activity: 'Last week',
    },
    {
      avatar: { src: avatar6, status: 'danger' },
      user: {
        name: 'Friderik Dávid',
        new: true,
        registered: 'Jan 1, 2023',
      },
      country: { name: 'Poland', flag: cifPl },
      usage: {
        value: 43,
        period: 'Jun 11, 2023 - Jul 10, 2023',
        color: 'success',
      },
      payment: { name: 'Amex', icon: cibCcAmex },
      activity: 'Last week',
    },
  ]

  return (
    <div className="fade-in-up">
      {/* Hero Section */}
      <div className="mb-5">
        <div className="glass p-5 rounded-4 text-white position-relative overflow-hidden">
          <div className="position-absolute top-0 end-0 w-100 h-100" style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            zIndex: -1
          }}></div>
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center mb-3">
                <div className="me-4">
                  <div className="bg-white bg-opacity-20 rounded-3 p-3 d-inline-block">
                    <img src={logo} alt="Topaz Logo" style={{ height: 48, filter: 'brightness(0) invert(1)' }} />
                  </div>
                </div>
                <div>
                  <h1 className="display-4 fw-bold mb-2" style={{ 
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    Topaz
                  </h1>
                  <div className="badge bg-white bg-opacity-20 text-white px-3 py-2 rounded-pill">
                    <i className="fas fa-star me-1"></i> v1.0
                  </div>
                </div>
              </div>
              <p className="lead mb-4 text-white-50" style={{ fontSize: '1.25rem', lineHeight: '1.6' }}>
                Take control of your digital feed. Block distractions, boost focus, and reclaim your time.
                <br />
                <span className="fw-semibold">Instantly filter YouTube, LinkedIn, X, and Reddit with custom keywords.</span>
              </p>
              <div className="d-flex flex-wrap gap-3">
                <div className="d-flex align-items-center text-white-50">
                  <i className="fas fa-shield-alt me-2"></i>
                  <span>Privacy First</span>
                </div>
                <div className="d-flex align-items-center text-white-50">
                  <i className="fas fa-bolt me-2"></i>
                  <span>Instant Filtering</span>
                </div>
                <div className="d-flex align-items-center text-white-50">
                  <i className="fas fa-cog me-2"></i>
                  <span>Customizable</span>
                </div>
              </div>
            </div>
            <div className="col-lg-4 d-none d-lg-block">
              <div className="text-center">
                <div className="position-relative d-inline-block">
                  <div className="bg-white bg-opacity-10 rounded-circle p-4" style={{ width: '120px', height: '120px' }}>
                    <i className="fas fa-filter text-white" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle" style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    animation: 'pulse 2s infinite'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Filtering Card */}
      <CCard className="mb-5">
        <CCardHeader className="bg-transparent border-0 pb-0">
          <h5 className="card-title mb-0 d-flex align-items-center">
            <i className="fas fa-sliders-h me-2 text-primary"></i>
            Platform Filtering
          </h5>
          <p className="text-muted small mb-0">Toggle platforms to enable/disable filtering</p>
        </CCardHeader>
        <CCardBody className="pt-3">
          <div className="row g-3">
            <div className="col-12 col-md-6 col-lg-3">
              <div 
                className={`platform-toggle-card p-3 rounded-3 cursor-pointer transition-all ${platforms.youtube ? 'active' : ''}`}
                onClick={() => handleToggle('youtube')}
                style={{
                  background: platforms.youtube ? 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)' : 'rgba(255, 255, 255, 0.1)',
                  border: platforms.youtube ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
                  color: platforms.youtube ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <CIcon icon={cibYoutube} size="xl" className="me-3" />
                    <div>
                      <div className="fw-bold">YouTube</div>
                      <small className="opacity-75">Video Platform</small>
                    </div>
                  </div>
                  <div className={`toggle-indicator ${platforms.youtube ? 'active' : ''}`}>
                    <i className={`fas fa-${platforms.youtube ? 'check-circle' : 'circle'}`}></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div 
                className={`platform-toggle-card p-3 rounded-3 cursor-pointer transition-all ${platforms.linkedin ? 'active' : ''}`}
                onClick={() => handleToggle('linkedin')}
                style={{
                  background: platforms.linkedin ? 'linear-gradient(135deg, #0077B5 0%, #005885 100%)' : 'rgba(255, 255, 255, 0.1)',
                  border: platforms.linkedin ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
                  color: platforms.linkedin ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <CIcon icon={cibLinkedin} size="xl" className="me-3" />
                    <div>
                      <div className="fw-bold">LinkedIn</div>
                      <small className="opacity-75">Professional</small>
                    </div>
                  </div>
                  <div className={`toggle-indicator ${platforms.linkedin ? 'active' : ''}`}>
                    <i className={`fas fa-${platforms.linkedin ? 'check-circle' : 'circle'}`}></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div 
                className={`platform-toggle-card p-3 rounded-3 cursor-pointer transition-all ${platforms.x ? 'active' : ''}`}
                onClick={() => handleToggle('x')}
                style={{
                  background: platforms.x ? 'linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%)' : 'rgba(255, 255, 255, 0.1)',
                  border: platforms.x ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
                  color: platforms.x ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <CIcon icon={cibTwitter} size="xl" className="me-3" />
                    <div>
                      <div className="fw-bold">X (Twitter)</div>
                      <small className="opacity-75">Social Media</small>
                    </div>
                  </div>
                  <div className={`toggle-indicator ${platforms.x ? 'active' : ''}`}>
                    <i className={`fas fa-${platforms.x ? 'check-circle' : 'circle'}`}></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <div 
                className={`platform-toggle-card p-3 rounded-3 cursor-pointer transition-all ${platforms.reddit ? 'active' : ''}`}
                onClick={() => handleToggle('reddit')}
                style={{
                  background: platforms.reddit ? 'linear-gradient(135deg, #FF5700 0%, #e04d00 100%)' : 'rgba(255, 255, 255, 0.1)',
                  border: platforms.reddit ? 'none' : '2px solid rgba(255, 255, 255, 0.2)',
                  color: platforms.reddit ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <CIcon icon={cibReddit} size="xl" className="me-3" />
                    <div>
                      <div className="fw-bold">Reddit</div>
                      <small className="opacity-75">Community</small>
                    </div>
                  </div>
                  <div className={`toggle-indicator ${platforms.reddit ? 'active' : ''}`}>
                    <i className={`fas fa-${platforms.reddit ? 'check-circle' : 'circle'}`}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CCardBody>
      </CCard>

      {/* Analytics Overview */}
      <WidgetsDropdown className="mb-5" />
      
      {/* Chart Section */}
      <CCard className="mb-5">
        <CCardHeader className="bg-transparent border-0 pb-0">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center">
            <div>
              <h4 className="card-title mb-2 d-flex align-items-center">
                <i className="fas fa-chart-line me-2 text-primary"></i>
                Blocking Analytics
              </h4>
              <p className="text-muted mb-0">
                {period === 'Day' && 'Daily blocking trends across all platforms'}
                {period === 'Month' && 'Monthly blocking patterns and insights'}
                {period === 'Year' && 'Yearly overview of content filtering effectiveness'}
              </p>
            </div>
            <div className="mt-3 mt-md-0">
              <div className="btn-group" role="group">
                {['Day', 'Month', 'Year'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`btn ${period === value ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setPeriod(value)}
                    style={{
                      borderRadius: period === value ? '12px' : '0',
                      fontWeight: '600',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CCardHeader>
        <CCardBody className="pt-4">
          <div className="position-relative">
            <MainChart
              blockedData={{
                youtube: blockedDataByPeriod[period].youtube,
                x: blockedDataByPeriod[period].x,
                linkedin: blockedDataByPeriod[period].linkedin,
                reddit: blockedDataByPeriod[period].reddit,
                labels: blockedDataByPeriod[period].labels,
              }}
            />
          </div>
        </CCardBody>
      </CCard>
      {/* Platform Statistics */}
      <div className="mb-5">
        <h4 className="mb-4 fw-bold d-flex align-items-center">
          <i className="fas fa-chart-pie me-2 text-primary"></i>
          Platform Statistics
        </h4>
        <CRow className="g-4">
          <CCol xs={12} sm={6} lg={3}>
            <CCard className="h-100 border-0 position-relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.1) 0%, rgba(255, 0, 0, 0.05) 100%)',
              border: '1px solid rgba(255, 0, 0, 0.2)'
            }}>
              <div className="position-absolute top-0 end-0 w-100 h-100" style={{
                background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.05) 0%, transparent 100%)',
                zIndex: 0
              }}></div>
              <CCardBody className="text-center position-relative" style={{ zIndex: 1 }}>
                <div className="mb-3">
                  <div className="bg-danger bg-opacity-10 rounded-circle p-3 d-inline-block">
                    <CIcon icon={cibYoutube} size="xxl" style={{ color: '#FF0000' }} />
                  </div>
                </div>
                <h5 className="fw-bold mb-2" style={{ color: '#FF0000' }}>YouTube</h5>
                <div className="display-6 fw-bold mb-1" style={{ color: '#FF0000' }}>
                  {blockedDataByPeriod[period].youtube.reduce((a, b) => a + b, 0)}
                </div>
                <small className="text-muted">videos blocked</small>
                <div className="mt-3">
                  <div className="progress" style={{ height: '4px' }}>
                    <div 
                      className="progress-bar bg-danger" 
                      style={{ 
                        width: `${(blockedDataByPeriod[period].youtube.reduce((a, b) => a + b, 0) / 1000) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol xs={12} sm={6} lg={3}>
            <CCard className="h-100 border-0 position-relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(29, 161, 242, 0.1) 0%, rgba(29, 161, 242, 0.05) 100%)',
              border: '1px solid rgba(29, 161, 242, 0.2)'
            }}>
              <div className="position-absolute top-0 end-0 w-100 h-100" style={{
                background: 'linear-gradient(135deg, rgba(29, 161, 242, 0.05) 0%, transparent 100%)',
                zIndex: 0
              }}></div>
              <CCardBody className="text-center position-relative" style={{ zIndex: 1 }}>
                <div className="mb-3">
                  <div className="bg-info bg-opacity-10 rounded-circle p-3 d-inline-block">
                    <CIcon icon={cibTwitter} size="xxl" style={{ color: '#1DA1F2' }} />
                  </div>
                </div>
                <h5 className="fw-bold mb-2" style={{ color: '#1DA1F2' }}>X (Twitter)</h5>
                <div className="display-6 fw-bold mb-1" style={{ color: '#1DA1F2' }}>
                  {blockedDataByPeriod[period].x.reduce((a, b) => a + b, 0)}
                </div>
                <small className="text-muted">posts blocked</small>
                <div className="mt-3">
                  <div className="progress" style={{ height: '4px' }}>
                    <div 
                      className="progress-bar bg-info" 
                      style={{ 
                        width: `${(blockedDataByPeriod[period].x.reduce((a, b) => a + b, 0) / 1000) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol xs={12} sm={6} lg={3}>
            <CCard className="h-100 border-0 position-relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(255, 87, 0, 0.1) 0%, rgba(255, 87, 0, 0.05) 100%)',
              border: '1px solid rgba(255, 87, 0, 0.2)'
            }}>
              <div className="position-absolute top-0 end-0 w-100 h-100" style={{
                background: 'linear-gradient(135deg, rgba(255, 87, 0, 0.05) 0%, transparent 100%)',
                zIndex: 0
              }}></div>
              <CCardBody className="text-center position-relative" style={{ zIndex: 1 }}>
                <div className="mb-3">
                  <div className="bg-warning bg-opacity-10 rounded-circle p-3 d-inline-block">
                    <CIcon icon={cibReddit} size="xxl" style={{ color: '#FF5700' }} />
                  </div>
                </div>
                <h5 className="fw-bold mb-2" style={{ color: '#FF5700' }}>Reddit</h5>
                <div className="display-6 fw-bold mb-1" style={{ color: '#FF5700' }}>
                  {blockedDataByPeriod[period].reddit.reduce((a, b) => a + b, 0)}
                </div>
                <small className="text-muted">posts blocked</small>
                <div className="mt-3">
                  <div className="progress" style={{ height: '4px' }}>
                    <div 
                      className="progress-bar bg-warning" 
                      style={{ 
                        width: `${(blockedDataByPeriod[period].reddit.reduce((a, b) => a + b, 0) / 1000) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol xs={12} sm={6} lg={3}>
            <CCard className="h-100 border-0 position-relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(0, 119, 181, 0.1) 0%, rgba(0, 119, 181, 0.05) 100%)',
              border: '1px solid rgba(0, 119, 181, 0.2)'
            }}>
              <div className="position-absolute top-0 end-0 w-100 h-100" style={{
                background: 'linear-gradient(135deg, rgba(0, 119, 181, 0.05) 0%, transparent 100%)',
                zIndex: 0
              }}></div>
              <CCardBody className="text-center position-relative" style={{ zIndex: 1 }}>
                <div className="mb-3">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block">
                    <CIcon icon={cibLinkedin} size="xxl" style={{ color: '#0077B5' }} />
                  </div>
                </div>
                <h5 className="fw-bold mb-2" style={{ color: '#0077B5' }}>LinkedIn</h5>
                <div className="display-6 fw-bold mb-1" style={{ color: '#0077B5' }}>
                  {blockedDataByPeriod[period].linkedin.reduce((a, b) => a + b, 0)}
                </div>
                <small className="text-muted">posts blocked</small>
                <div className="mt-3">
                  <div className="progress" style={{ height: '4px' }}>
                    <div 
                      className="progress-bar bg-primary" 
                      style={{ 
                        width: `${(blockedDataByPeriod[period].linkedin.reduce((a, b) => a + b, 0) / 1000) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </div>
      {/* Recent Activity */}
      <div className="mb-5">
        <h4 className="mb-4 fw-bold d-flex align-items-center">
          <i className="fas fa-history me-2 text-primary"></i>
          Recent Activity
        </h4>
        <CCard>
          <CCardHeader className="bg-transparent border-0 pb-0">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Recently Blocked Content</h6>
              <button className="btn btn-sm btn-outline-primary">
                <i className="fas fa-refresh me-1"></i> Refresh
              </button>
            </div>
          </CCardHeader>
          <CCardBody className="pt-3">
            <div className="table-responsive">
              <CTable hover responsive align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col" className="border-0">
                      <i className="fas fa-video me-2"></i>Content
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="border-0">
                      <i className="fas fa-globe me-2"></i>Platform
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="border-0">
                      <i className="fas fa-clock me-2"></i>Blocked Time
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="border-0">
                      <i className="fas fa-tag me-2"></i>Keyword
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="border-0">
                      <i className="fas fa-cog me-2"></i>Action
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow className="border-0">
                    <CTableDataCell className="border-0">
                      <div className="d-flex align-items-center">
                        <div className="bg-danger bg-opacity-10 rounded-circle p-2 me-3">
                          <i className="fas fa-play text-danger"></i>
                        </div>
                        <div>
                          <div className="fw-semibold">"How to Win at Life"</div>
                          <small className="text-muted">Motivational content</small>
                        </div>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <div className="d-flex align-items-center">
                        <CIcon icon={cibYoutube} className="me-2" style={{color:'#FF0000'}} />
                        <span className="fw-medium">YouTube</span>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <div className="text-muted">
                        <i className="fas fa-clock me-1"></i>
                        2 hours ago
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill">
                        spoiler
                      </span>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <button className="btn btn-sm btn-outline-secondary">
                        <i className="fas fa-eye"></i>
                      </button>
                    </CTableDataCell>
                  </CTableRow>
                  <CTableRow className="border-0">
                    <CTableDataCell className="border-0">
                      <div className="d-flex align-items-center">
                        <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3">
                          <i className="fas fa-comment text-info"></i>
                        </div>
                        <div>
                          <div className="fw-semibold">"Top 10 Crypto Scams"</div>
                          <small className="text-muted">Financial advice</small>
                        </div>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <div className="d-flex align-items-center">
                        <CIcon icon={cibTwitter} className="me-2" style={{color:'#1DA1F2'}} />
                        <span className="fw-medium">X</span>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <div className="text-muted">
                        <i className="fas fa-clock me-1"></i>
                        3 hours ago
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2 rounded-pill">
                        crypto
                      </span>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <button className="btn btn-sm btn-outline-secondary">
                        <i className="fas fa-eye"></i>
                      </button>
                    </CTableDataCell>
                  </CTableRow>
                  <CTableRow className="border-0">
                    <CTableDataCell className="border-0">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                          <i className="fas fa-briefcase text-primary"></i>
                        </div>
                        <div>
                          <div className="fw-semibold">"How to Get Hired Fast"</div>
                          <small className="text-muted">Career advice</small>
                        </div>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <div className="d-flex align-items-center">
                        <CIcon icon={cibLinkedin} className="me-2" style={{color:'#0077B5'}} />
                        <span className="fw-medium">LinkedIn</span>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <div className="text-muted">
                        <i className="fas fa-clock me-1"></i>
                        5 hours ago
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                        hiring
                      </span>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <button className="btn btn-sm btn-outline-secondary">
                        <i className="fas fa-eye"></i>
                      </button>
                    </CTableDataCell>
                  </CTableRow>
                  <CTableRow className="border-0">
                    <CTableDataCell className="border-0">
                      <div className="d-flex align-items-center">
                        <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                          <i className="fas fa-users text-warning"></i>
                        </div>
                        <div>
                          <div className="fw-semibold">"Reddit Pranks Compilation"</div>
                          <small className="text-muted">Entertainment</small>
                        </div>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <div className="d-flex align-items-center">
                        <CIcon icon={cibReddit} className="me-2" style={{color:'#FF5700'}} />
                        <span className="fw-medium">Reddit</span>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <div className="text-muted">
                        <i className="fas fa-clock me-1"></i>
                        1 day ago
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <span className="badge bg-info bg-opacity-10 text-info px-3 py-2 rounded-pill">
                        prank
                      </span>
                    </CTableDataCell>
                    <CTableDataCell className="border-0">
                      <button className="btn btn-sm btn-outline-secondary">
                        <i className="fas fa-eye"></i>
                      </button>
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>
          </CCardBody>
        </CCard>
      </div>
    </div>
  )
}

export default Dashboard
