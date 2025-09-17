// Supabase Configuration
// Replace these with your actual Supabase project details

const SUPABASE_CONFIG = {
  // Your Supabase project URL
  url: 'https://YOUR_SUPABASE_PROJECT.supabase.co',
  
  // Your Supabase anon/public key
  anonKey: 'YOUR_SUPABASE_ANON_KEY'
};

// Supabase API endpoints
const SUPABASE_ENDPOINTS = {
  auth: {
    signUp: '/auth/v1/signup',
    signIn: '/auth/v1/token?grant_type=password',
    signOut: '/auth/v1/logout',
    getUser: '/auth/v1/user',
    refreshToken: '/auth/v1/token?grant_type=refresh_token'
  },
  api: {
    base: '/rest/v1/',
    users: '/rest/v1/users',
    premium: '/rest/v1/user_premium'
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPABASE_CONFIG, SUPABASE_ENDPOINTS };
} else {
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
  window.SUPABASE_ENDPOINTS = SUPABASE_ENDPOINTS;
}
