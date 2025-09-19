// Real Stripe service that connects to your FastAPI backend
const API_BASE_URL = 'http://localhost:8000'

const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || error.message || 'API request failed')
  }

  return response.json()
}

export const stripeService = {
  // Create a new customer
  createCustomer: async (userId, email, name) => {
    try {
      const response = await apiCall('/api/subscriptions/create-customer', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          email: email,
          name: name
        })
      })
      return response
    } catch (error) {
      throw new Error(`Failed to create customer: ${error.message}`)
    }
  },

  // Create a new subscription
  createSubscription: async (customerId, planId, paymentMethodId) => {
    try {
      const response = await apiCall('/api/subscriptions/create-subscription', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId,
          plan_id: planId,
          payment_method_id: paymentMethodId
        })
      })
      return response
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`)
    }
  },

  // Cancel a subscription
  cancelSubscription: async (subscriptionId) => {
    try {
      const response = await apiCall('/api/subscriptions/cancel-subscription', {
        method: 'POST',
        body: JSON.stringify({
          subscription_id: subscriptionId,
          action: 'cancel'
        })
      })
      return response
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`)
    }
  },

  // Reactivate a subscription
  reactivateSubscription: async (subscriptionId) => {
    try {
      const response = await apiCall('/api/subscriptions/reactivate-subscription', {
        method: 'POST',
        body: JSON.stringify({
          subscription_id: subscriptionId,
          action: 'reactivate'
        })
      })
      return response
    } catch (error) {
      throw new Error(`Failed to reactivate subscription: ${error.message}`)
    }
  },

  // Get subscription details
  getSubscription: async (subscriptionId) => {
    try {
      const response = await apiCall(`/api/subscriptions/subscription/${subscriptionId}`)
      return response
    } catch (error) {
      throw new Error(`Failed to get subscription: ${error.message}`)
    }
  },

  // Get user subscription status
  getUserStatus: async (userId) => {
    try {
      const response = await apiCall(`/api/subscriptions/user-status/${userId}`)
      return response
    } catch (error) {
      throw new Error(`Failed to get user status: ${error.message}`)
    }
  },

  // Get billing information
  getBillingInfo: async (subscriptionId) => {
    try {
      const response = await apiCall(`/api/subscriptions/billing/${subscriptionId}`)
      return response
    } catch (error) {
      throw new Error(`Failed to get billing info: ${error.message}`)
    }
  }
}

// Export the service
export default stripeService
