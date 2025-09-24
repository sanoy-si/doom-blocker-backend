/**
 * API Key Initialization Script
 * This script should be run during extension installation/setup
 */

// Generate or retrieve API key for backend communication
async function initializeApiKey() {
  try {
    // Check if API key already exists
    const result = await chrome.storage.local.get(['apiKey']);
    
    if (result.apiKey) {
      console.log('✅ API key already configured');
      return result.apiKey;
    }

    // In production, this should be obtained from your backend during user registration
    // For development, use a default key that matches your backend configuration
    const apiKey = process.env.NODE_ENV === 'production' 
      ? await requestApiKeyFromBackend()
      : 'your-development-api-key';

    // Store the API key securely
    await chrome.storage.local.set({ apiKey });
    console.log('✅ API key initialized and stored');
    
    return apiKey;
  } catch (error) {
    console.error('❌ Failed to initialize API key:', error);
    throw error;
  }
}

// Request API key from backend (production only)
async function requestApiKeyFromBackend() {
  // This would typically involve:
  // 1. User authentication
  // 2. Backend API call to generate/retrieve user-specific API key
  // 3. Secure storage of the key
  
  // Placeholder implementation
  throw new Error('API key request not implemented - contact support');
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeApiKey };
} else if (typeof globalThis !== 'undefined') {
  globalThis.initializeApiKey = initializeApiKey;
}
