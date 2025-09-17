// Simple Sign-In Flow
class SignInFlow {
  constructor() {
    this.isInitialized = false;
  }

  // Initialize sign-in flow
  async init() {
    if (this.isInitialized) return;
    
    console.log('🚀 Initializing sign-in flow...');
    
    // Check if user is already signed in
    const isSignedIn = await this.checkSignInStatus();
    
    if (isSignedIn) {
      console.log('✅ User already signed in');
      this.showMainPage();
    } else {
      console.log('👋 Showing sign-in page');
      this.showSignInPage();
    }
    
    this.isInitialized = true;
  }

  // Check if user is signed in
  async checkSignInStatus() {
    try {
      const result = await chrome.storage.local.get(['userToken', 'userInfo']);
      return !!(result.userToken && result.userInfo);
    } catch (error) {
      console.error('Failed to check sign-in status:', error);
      return false;
    }
  }

  // Show sign-in page
  showSignInPage() {
    const welcomePage = document.getElementById('welcomePage');
    const mainPage = document.getElementById('mainPage');
    
    if (welcomePage) welcomePage.classList.remove('hidden');
    if (mainPage) mainPage.classList.add('hidden');
  }

  // Show main page
  showMainPage() {
    const welcomePage = document.getElementById('welcomePage');
    const mainPage = document.getElementById('mainPage');
    
    if (welcomePage) welcomePage.classList.add('hidden');
    if (mainPage) mainPage.classList.remove('hidden');
  }

  // Handle Google sign-in
  async handleGoogleSignIn() {
    try {
      console.log('🔐 Starting Google sign-in...');
      
      // Show loading
      const button = document.getElementById('googleSignInButton');
      if (button) {
        button.disabled = true;
        button.innerHTML = '<div class="loading-spinner"></div><span>Signing in...</span>';
      }
      
      // Step 1: Google Authentication
      const googleResult = await window.googleAuth.signIn();
      if (!googleResult.success) {
        throw new Error(googleResult.error);
      }
      
      console.log('✅ Google auth successful');
      
      // Step 2: Save to Supabase
      const supabaseResult = await window.supabaseAuth.saveUser(googleResult.userInfo);
      if (!supabaseResult.success) {
        throw new Error(`Supabase error: ${supabaseResult.error}`);
      }
      
      console.log('✅ User saved to Supabase');
      
      // Step 3: Store locally
      await chrome.storage.local.set({
        userToken: googleResult.token,
        userInfo: JSON.stringify(googleResult.userInfo),
        supabaseUser: JSON.stringify(supabaseResult.data)
      });
      
      console.log('✅ Sign-in complete!');
      
      // Show main page
      this.showMainPage();
      
      // Show success message
      this.showNotification('Welcome! You are now signed in.', 'success');
      
    } catch (error) {
      console.error('❌ Sign-in failed:', error);
      
      // Reset button
      const button = document.getElementById('googleSignInButton');
      if (button) {
        button.disabled = false;
        button.innerHTML = '<span>Sign in with Google</span>';
      }
      
      this.showNotification('Sign-in failed. Please try again.', 'error');
    }
  }

  // Show notification
  showNotification(message, type = 'info') {
    // Simple notification - you can enhance this later
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
  }
}

// Create global instance
window.signInFlow = new SignInFlow();
