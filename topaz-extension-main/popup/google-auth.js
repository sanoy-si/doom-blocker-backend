// Google Authentication Helper
class GoogleAuth {
  constructor() {
    this.clientId = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  }

  // Sign in with Google
  async signIn() {
    try {
      console.log('🔐 Starting Google sign-in...');
      
      // Try Chrome Identity API first
      const token = await this.getChromeIdentityToken();
      console.log('✅ Google OAuth token received:', token);
      
      // Get user info from Google
      const userInfo = await this.getGoogleUserInfo(token);
      console.log('👤 Google user info:', userInfo);
      
      return { success: true, userInfo, token };
      
    } catch (error) {
      console.error('❌ Google sign-in failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Get token using Chrome Identity API
  async getChromeIdentityToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (token) {
          resolve(token);
        } else {
          reject(new Error('No token received'));
        }
      });
    });
  }

  // Get user info from Google API
  async getGoogleUserInfo(token) {
    const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
    if (!response.ok) {
      throw new Error('Failed to get user info from Google');
    }
    return await response.json();
  }

  // Sign out
  async signOut() {
    try {
      const tokenResult = await chrome.storage.local.get(['userToken']);
      if (tokenResult.userToken) {
        await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${tokenResult.userToken}`);
      }
      await chrome.storage.local.remove(['userToken', 'userInfo']);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create global instance
window.googleAuth = new GoogleAuth();
