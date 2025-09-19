import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CCard, CCardBody, CCardHeader, CButton, CBadge, CAlert, CSpinner } from '@coreui/react'
import { Link, useNavigate } from 'react-router-dom'
import stripeService from '../services/stripeService'

const SubscriptionManagement = () => {
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true)
        // For demo purposes, we'll simulate a free user (no subscription)
        // In a real app, you would fetch the user's actual subscription
        setSubscription(null) // Set to null to show free plan
      } catch (err) {
        setError('Failed to load subscription information')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  const handleCancelSubscription = async () => {
    try {
      setLoading(true)
      const response = await stripeService.cancelSubscription(subscription.id)
      setSubscription(prev => ({
        ...prev,
        cancelAtPeriodEnd: true
      }))
    } catch (err) {
      setError('Failed to cancel subscription. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReactivateSubscription = async () => {
    try {
      setLoading(true)
      const response = await stripeService.reactivateSubscription(subscription.id)
      setSubscription(prev => ({
        ...prev,
        cancelAtPeriodEnd: false
      }))
    } catch (err) {
      setError('Failed to reactivate subscription. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success'
      case 'canceled': return 'danger'
      case 'past_due': return 'warning'
      case 'incomplete': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active'
      case 'canceled': return 'Canceled'
      case 'past_due': return 'Past Due'
      case 'incomplete': return 'Incomplete'
      default: return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner size="lg" />
        <p className="mt-3 text-muted">Loading subscription information...</p>
      </div>
    )
  }

  if (error) {
    return (
      <CAlert color="danger">
        <i className="fas fa-exclamation-triangle me-2"></i>
        {error}
      </CAlert>
    )
  }

  if (!subscription) {
    return (
      <CCard className="border-0 text-center" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <CCardBody className="p-5">
          <div className="mb-4">
            <div 
              className="rounded-circle d-inline-flex align-items-center justify-content-center"
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                color: 'white',
                fontSize: '2rem'
              }}
            >
              <i className="fas fa-user-slash"></i>
            </div>
          </div>
          <h4 className="fw-bold mb-3">No Active Subscription</h4>
          <p className="text-muted mb-4">
            You don't have an active subscription. Upgrade to unlock premium features.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Upgrade Now button clicked!')
              console.log('Navigating to /upgrade...')
              navigate('/upgrade')
            }}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              padding: '12px 32px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '16px'
            }}
          >
            <i className="fas fa-arrow-up me-2"></i>
            Upgrade Now
          </button>
        </CCardBody>
      </CCard>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <CCard className="border-0" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <CCardHeader className="border-0 pb-0">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="fw-bold mb-0">
              <i className="fas fa-crown me-2 text-warning"></i>
              Subscription Details
            </h5>
            <CBadge 
              color={getStatusColor(subscription.status)}
              className="px-3 py-2"
              style={{ fontWeight: '600' }}
            >
              {getStatusText(subscription.status)}
            </CBadge>
          </div>
        </CCardHeader>

        <CCardBody className="pt-3">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-semibold text-muted">Plan</label>
                <div className="fs-5 fw-bold text-capitalize">
                  {subscription.plan}
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-semibold text-muted">Price</label>
                <div className="fs-5 fw-bold">
                  ${subscription.price}/{subscription.currency === 'usd' ? 'month' : subscription.currency}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-semibold text-muted">Current Period</label>
                <div className="fs-6">
                  {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label fw-semibold text-muted">Next Billing</label>
                <div className="fs-6">
                  {subscription.cancelAtPeriodEnd ? 'Will not renew' : formatDate(subscription.currentPeriodEnd)}
                </div>
              </div>
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <CAlert color="warning" className="mt-4">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Your subscription will be canceled at the end of the current billing period.
            </CAlert>
          )}

          <div className="d-flex gap-3 mt-4">
            {subscription.cancelAtPeriodEnd ? (
              <CButton
                color="success"
                onClick={handleReactivateSubscription}
                disabled={loading}
                style={{
                  borderRadius: '12px',
                  fontWeight: '600',
                  padding: '10px 24px'
                }}
              >
                {loading ? <CSpinner size="sm" className="me-2" /> : <i className="fas fa-play me-2"></i>}
                Reactivate Subscription
              </CButton>
            ) : (
              <CButton
                color="danger"
                variant="outline"
                onClick={handleCancelSubscription}
                disabled={loading}
                style={{
                  borderRadius: '12px',
                  fontWeight: '600',
                  padding: '10px 24px'
                }}
              >
                {loading ? <CSpinner size="sm" className="me-2" /> : <i className="fas fa-times me-2"></i>}
                Cancel Subscription
              </CButton>
            )}

            <CButton
              color="primary"
              variant="outline"
              href="/upgrade"
              style={{
                borderRadius: '12px',
                fontWeight: '600',
                padding: '10px 24px'
              }}
            >
              <i className="fas fa-arrow-up me-2"></i>
              Change Plan
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    </motion.div>
  )
}

export default SubscriptionManagement
