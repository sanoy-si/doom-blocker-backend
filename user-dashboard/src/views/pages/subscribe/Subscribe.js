import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CContainer, CRow, CCol, CCard, CCardBody, CButton } from '@coreui/react'
import StripeProvider from '../../../components/StripeProvider'
import StripePaymentForm from '../../../components/StripePaymentForm'

const Subscribe = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showPayment, setShowPayment] = useState(false)

  const plans = {
    premium: {
      id: 'premium',
      name: 'Premium',
      price: 9.99,
      period: 'month',
      description: 'Perfect for power users',
      features: [
        'Unlimited keywords',
        'Advanced analytics & reports',
        'Priority support',
        'All platforms (YouTube, X, LinkedIn, Reddit)',
        'Real-time notifications',
        'Export data',
        'Custom filtering rules'
      ]
    }
  }

  useEffect(() => {
    const planId = searchParams.get('plan')
    console.log('Subscribe component - planId from URL:', planId)
    console.log('Available plans:', Object.keys(plans))
    console.log('Current URL:', window.location.href)
    if (planId && plans[planId]) {
      console.log('Setting selected plan:', plans[planId])
      setSelectedPlan(plans[planId])
      setShowPayment(true)
    } else {
      console.log('No valid plan found, showing error message')
      // Don't redirect immediately, let the user see the error
    }
  }, [searchParams])

  const handlePaymentSuccess = (subscription) => {
    console.log('Subscription successful:', subscription)
    // Redirect to dashboard or success page
    navigate('/dashboard?subscription=success')
  }

  const handlePaymentCancel = () => {
    setShowPayment(false)
    navigate('/upgrade')
  }

  if (showPayment && selectedPlan) {
    return (
      <CContainer className="py-5">
        <CRow className="justify-content-center">
          <CCol xs={12} md={8} lg={6}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-4">
                <h2 className="display-6 fw-bold mb-3 gradient-text">
                  Complete Your Subscription
                </h2>
                <p className="text-muted">
                  You're just one step away from unlocking all premium features
                </p>
              </div>

              <StripeProvider>
                <StripePaymentForm
                  plan={selectedPlan}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </StripeProvider>
            </motion.div>
          </CCol>
        </CRow>
      </CContainer>
    )
  }

  return (
    <CContainer className="py-5">
      <CRow className="justify-content-center">
        <CCol xs={12} md={8} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <CCard className="border-0 text-center" style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <CCardBody className="p-5">
                <div className="mb-4">
                  <div 
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: '80px',
                      height: '80px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontSize: '2rem'
                    }}
                  >
                    <i className="fas fa-credit-card"></i>
                  </div>
                </div>
                <h4 className="fw-bold mb-3">Invalid Subscription Plan</h4>
                <p className="text-muted mb-4">
                  The subscription plan you're trying to access is not valid. 
                  Please select a plan from our pricing page.
                </p>
                <CButton 
                  color="primary"
                  size="lg"
                  onClick={() => navigate('/upgrade')}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '600',
                    padding: '12px 32px'
                  }}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  Back to Pricing
                </CButton>
              </CCardBody>
            </CCard>
          </motion.div>
        </CCol>
      </CRow>
    </CContainer>
  )
}

export default Subscribe
