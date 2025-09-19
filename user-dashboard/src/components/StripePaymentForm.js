import React, { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { motion } from 'framer-motion'
import { CCard, CCardBody, CCardHeader, CButton, CAlert, CSpinner } from '@coreui/react'
import stripeService from '../services/stripeService'

const StripePaymentForm = ({ plan, onSuccess, onCancel }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        padding: '12px',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    if (!stripe || !elements) {
      setError('Stripe is not loaded. Please refresh the page.')
      setLoading(false)
      return
    }

    const cardElement = elements.getElement(CardElement)

    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (pmError) {
        setError(pmError.message)
        setLoading(false)
        return
      }

      // For demo purposes, simulate a successful payment
      // In a real app, you would create a payment intent on your backend
      console.log('Payment method created:', paymentMethod.id)
      console.log('Plan:', plan)
      
      // Simulate successful payment
      setSuccess(true)
      setTimeout(() => {
        onSuccess && onSuccess({
          id: 'sub_' + Math.random().toString(36).substr(2, 9),
          status: 'active',
          plan: plan,
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }, 2000)
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.')
    }

    setLoading(false)
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <CCard className="border-0 text-center" style={{
          background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(40, 167, 69, 0.05) 100%)',
          border: '1px solid rgba(40, 167, 69, 0.2)',
          borderRadius: '20px'
        }}>
          <CCardBody className="p-5">
            <div className="mb-4">
              <div 
                className="rounded-circle d-inline-flex align-items-center justify-content-center"
                style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  fontSize: '2rem'
                }}
              >
                <i className="fas fa-check"></i>
              </div>
            </div>
            <h4 className="fw-bold text-success mb-3">Payment Successful!</h4>
            <p className="text-muted mb-4">
              Welcome to {plan.name}! Your subscription is now active and you have access to all premium features.
            </p>
            <CButton 
              color="success" 
              size="lg"
              onClick={() => onSuccess && onSuccess()}
              style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                padding: '12px 32px'
              }}
            >
              Continue to Dashboard
            </CButton>
          </CCardBody>
        </CCard>
      </motion.div>
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
        <CCardHeader className="text-center border-0 pb-0">
          <h4 className="fw-bold mb-2">Complete Your Subscription</h4>
          <p className="text-muted mb-0">
            You're upgrading to <strong>{plan.name}</strong> - ${plan.price}/{plan.period}
          </p>
        </CCardHeader>
        
        <CCardBody className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label fw-semibold mb-3">
                <i className="fas fa-credit-card me-2"></i>
                Payment Information
              </label>
              <div 
                className="p-3 rounded-3"
                style={{
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '12px'
                }}
              >
                <CardElement options={cardElementOptions} />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CAlert color="danger" className="mb-4">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </CAlert>
              </motion.div>
            )}

            <div className="d-flex gap-3">
              <CButton
                type="submit"
                color="primary"
                size="lg"
                disabled={loading || !stripe}
                className="flex-fill"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  padding: '12px 24px'
                }}
              >
                {loading ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-lock me-2"></i>
                    Subscribe for ${plan.price}/{plan.period}
                  </>
                )}
              </CButton>
              
              <CButton
                type="button"
                color="secondary"
                size="lg"
                onClick={onCancel}
                disabled={loading}
                className="flex-fill"
                style={{
                  borderRadius: '12px',
                  fontWeight: '600',
                  padding: '12px 24px'
                }}
              >
                Cancel
              </CButton>
            </div>
          </form>

          <div className="mt-4 text-center">
            <small className="text-muted">
              <i className="fas fa-shield-alt me-1"></i>
              Your payment information is secure and encrypted
            </small>
          </div>
        </CCardBody>
      </CCard>
    </motion.div>
  )
}

export default StripePaymentForm
