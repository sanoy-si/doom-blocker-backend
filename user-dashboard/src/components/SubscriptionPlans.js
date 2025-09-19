import React, { useState } from 'react'
import { CCard, CCardBody, CCardHeader, CButton, CBadge, CRow, CCol } from '@coreui/react'
import { useNavigate } from 'react-router-dom'

const SubscriptionPlans = () => {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState('premium')

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Block up to 5 keywords',
        'Basic analytics dashboard',
        'Community support',
        'YouTube & X filtering',
        'Basic keyword management'
      ],
      limitations: [
        'Limited to 5 keywords',
        'Basic analytics only',
        'No priority support'
      ],
      popular: false,
      cta: 'Current Plan',
      disabled: true,
      color: 'secondary',
      icon: 'fas fa-star'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 9.99,
      period: 'month',
      description: 'Most popular for power users',
      features: [
        'Unlimited keywords',
        'Advanced analytics & reports',
        'Priority support',
        'All platforms (YouTube, X, LinkedIn, Reddit)',
        'Advanced keyword management',
        'Real-time notifications',
        'Export data',
        'Custom filtering rules'
      ],
      limitations: [],
      popular: true,
      cta: 'Upgrade Now',
      disabled: false,
      color: 'primary',
      icon: 'fas fa-crown'
    }
  ]

  const handleSelectPlan = (planId) => {
    console.log('Button clicked! Plan ID:', planId)
    if (planId === 'free') {
      console.log('Free plan selected, not navigating')
      return
    }
    const url = `/subscribe?plan=${planId}`
    console.log('Navigating to:', url)
    setSelectedPlan(planId)
    navigate(url)
  }

  return (
    <div className="fade-in-up">
      <div className="text-center mb-5">
        <h2 className="display-5 fw-bold mb-3 gradient-text">
          Choose Your Plan
        </h2>
        <p className="lead text-muted">
          Select the perfect plan for your content filtering needs
        </p>
      </div>

      <CRow className="g-4 justify-content-center">
        {plans.map((plan, index) => (
          <CCol xs={12} md={6} lg={5} key={plan.id}>
            <div className="h-100">
              <CCard 
                className={`h-100 border-0 position-relative ${
                  plan.popular ? 'popular-plan' : ''
                }`}
                style={{
                  background: plan.popular 
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: plan.popular 
                    ? '2px solid rgba(102, 126, 234, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  boxShadow: plan.popular 
                    ? '0 20px 40px rgba(102, 126, 234, 0.2)'
                    : '0 8px 32px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease'
                }}
              >
                {plan.popular && (
                  <div 
                    className="position-absolute top-0 start-50 translate-middle-x"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '8px 24px',
                      borderRadius: '0 0 12px 12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      zIndex: 1
                    }}
                  >
                    Most Popular
                  </div>
                )}
                
                <CCardHeader 
                  className="text-center border-0 pb-0"
                  style={{ paddingTop: plan.popular ? '3rem' : '1.5rem' }}
                >
                  <h4 className="fw-bold mb-2" style={{ 
                    color: plan.popular ? '#667eea' : '#333',
                    fontSize: '1.75rem'
                  }}>
                    {plan.name}
                  </h4>
                  <p className="text-muted mb-3">{plan.description}</p>
                  <div className="mb-3">
                    <span 
                      className="display-4 fw-bold"
                      style={{ color: plan.popular ? '#667eea' : '#333' }}
                    >
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted fs-5">/{plan.period}</span>
                    )}
                  </div>
                </CCardHeader>

                <CCardBody className="pt-0">
                  <ul 
                    className="list-unstyled mb-4"
                    style={{ minHeight: '200px' }}
                  >
                    {plan.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="d-flex align-items-center mb-2"
                      >
                        <i 
                          className="fas fa-check-circle me-2"
                          style={{ 
                            color: plan.popular ? '#667eea' : '#28a745',
                            fontSize: '16px'
                          }}
                        ></i>
                        <span style={{ fontSize: '15px' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="text-center" style={{ padding: '10px 0' }}>
                    <button
                      type="button"
                      className={`btn btn-${plan.color} btn-lg w-100`}
                      disabled={plan.disabled}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Button clicked directly!')
                        handleSelectPlan(plan.id)
                      }}
                      onMouseDown={() => console.log('Mouse down on button for plan:', plan.id)}
                      style={{
                        background: plan.popular 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : undefined,
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '16px',
                        padding: '12px 24px',
                        boxShadow: plan.popular 
                          ? '0 8px 25px rgba(102, 126, 234, 0.4)'
                          : '0 4px 15px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        zIndex: 10,
                        cursor: plan.disabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {plan.cta}
                    </button>
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="mt-3">
                      <small className="text-muted">
                        <strong>Limitations:</strong> {plan.limitations.join(', ')}
                      </small>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            </div>
          </CCol>
        ))}
      </CRow>

      <div className="text-center mt-5">
        <p className="text-muted">
          <i className="fas fa-shield-alt me-2"></i>
          All plans include 30-day money-back guarantee
        </p>
        <p className="text-muted">
          <i className="fas fa-lock me-2"></i>
          Secure payment processing by Stripe
        </p>
        <div className="mt-3">
          <a href="/#/subscribe?plan=premium" className="btn btn-outline-primary">
            Test Direct Link to Subscribe
          </a>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPlans
