import React from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

// Replace with your actual Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef'

// Debug: Log the key being used (remove in production)
console.log('Stripe Publishable Key:', STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...')

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)

const StripeProvider = ({ children }) => {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  )
}

export default StripeProvider
