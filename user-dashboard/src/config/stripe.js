// Stripe configuration
export const STRIPE_CONFIG = {
  // Replace with your actual Stripe publishable key
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdef',
  
  // API endpoints (replace with your actual backend URLs)
  apiEndpoints: {
    createSubscription: '/api/create-subscription',
    cancelSubscription: '/api/cancel-subscription',
    reactivateSubscription: '/api/reactivate-subscription',
    getSubscription: '/api/get-subscription',
    updatePaymentMethod: '/api/update-payment-method'
  },
  
  // Subscription plans configuration
  plans: {
    free: {
      id: 'free',
      name: 'Free',
      price: 0,
      features: ['Block up to 5 keywords', 'Basic analytics', 'Community support']
    },
    premium: {
      id: 'premium',
      name: 'Premium',
      price: 9.99,
      features: ['Unlimited keywords', 'Advanced analytics', 'Priority support', 'All platforms']
    },
    pro: {
      id: 'pro',
      name: 'Pro',
      price: 19.99,
      features: ['Everything in Premium', 'Team collaboration', 'API access', 'Dedicated support']
    }
  }
}

// Helper function to get plan by ID
export const getPlanById = (planId) => {
  return STRIPE_CONFIG.plans[planId] || null
}

// Helper function to format price
export const formatPrice = (price, currency = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(price)
}
