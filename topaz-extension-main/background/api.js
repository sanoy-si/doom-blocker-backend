import { API_ENDPOINTS, CONFIG } from '../shared/constants.js';

class API {
  constructor() {

    // COMMENTED OUT: Auth functionality disabled
    // Storage keys
    // this.STORAGE_KEYS = {
    //   AUTH_STATE: "topaz_auth_state",
    //   USER_DATA: "topaz_user_data",
    // };

    // Current auth state
    // this.authState = {
    //   isAuthenticated: false,
    //   user: null,
    // };

    // VisitorID storage key
    this.VISITOR_ID_KEY = "topaz_visitor_id";
  }

  // COMMENTED OUT: Auth functionality disabled
  // Initialize API and auth system
  // async init() {
  //   await this.loadAuthFromStorage();
  // }

  // COMMENTED OUT: Auth functionality disabled
  // Load auth state from Chrome storage
  // async loadAuthFromStorage() {
  //   try {
  //     const keys = Object.values(this.STORAGE_KEYS);
  //     const result = await chrome.storage.local.get(keys);

  //     this.authState = {
  //       isAuthenticated: result[this.STORAGE_KEYS.AUTH_STATE] || false,
  //       user: result[this.STORAGE_KEYS.USER_DATA] || null,
  //     };
  //   } catch (error) {
  //     console.error("❌ API: Failed to load auth from storage:", error);
  //   }
  // }

  // Save auth state to Chrome storage
  // async saveAuthToStorage() {
  //   try {
  //     const dataToSave = {
  //       [this.STORAGE_KEYS.AUTH_STATE]: this.authState.isAuthenticated,
  //       [this.STORAGE_KEYS.USER_DATA]: this.authState.user,
  //     };

  //     await chrome.storage.local.set(dataToSave);
  //   } catch (error) {
  //     console.error("❌ API: Failed to save auth to storage:", error);
  //   }
  // }

  // COMMENTED OUT: Auth functionality disabled
  // async notifyAuthStateChange() {
  //   try {
  //     chrome.runtime.sendMessage({
  //       type: "AUTH_STATE_CHANGE",
  //       isAuthenticated: this.authState.isAuthenticated,
  //       user: this.authState.user,
  //     });
  //   } catch (error) {
  //     console.error("❌ API: Failed to send auth state change notification:", error);
  //   }
  // }

  // Clear all auth data
  // async clearAuthState() {
  //   try {
  //     const keys = Object.values(this.STORAGE_KEYS);
  //     await chrome.storage.local.remove(keys);

  //     this.authState = {
  //       isAuthenticated: false,
  //       user: null
  //     };

  //     await this.notifyAuthStateChange();
  //   } catch (error) {
  //     console.error("❌ API: Failed to clear auth state:", error);
  //   }
  // }

  // Set auth data after successful login
  // async setAuthData(authData) {
  //   try {
  //     const previousState = { ...this.authState };

  //     this.authState = {
  //       isAuthenticated: true,
  //       user: authData.user || this.authState.user
  //     };

  //     await this.saveAuthToStorage();
  //     await this.notifyAuthStateChange();
  //   } catch (error) {
  //     console.error("❌ API: Failed to set auth data:", error);
  //   }
  // }

  getAuthHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    return headers;
  }

  // COMMENTED OUT: Auth functionality disabled
  // Check authentication status and fetch profile data from server
  // async checkAuthStatus() {
  //   try {
  //     const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/auth-status`, {
  //       method: "GET",
  //       headers: this.getAuthHeaders(),
  //       credentials: "include",
  //     });
  //     if (!response.ok) {
  //       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  //     }
  //     const data = await response.json();
  //     if (data.isAuthenticated) {
  //       if (!this.authState.isAuthenticated) {
  //         await this.setAuthData({
  //           user: data.user,
  //         });
  //       } else {
  //         if (data.user) {
  //           if (JSON.stringify(data.user) !== JSON.stringify(this.authState.user)) {
  //             await this.setAuthData({
  //               user: data.user,
  //             });
  //           }
  //         }
  //       }
  //     } else {
  //       if (this.authState.isAuthenticated) {
  //         await this.clearAuthState();
  //       }
  //     }

  //     return data;
  //   } catch (error) {
  //     return {
  //       isAuthenticated: this.authState.isAuthenticated,
  //       error: error.message,
  //     };
  //   }
  // }

  // Open login page in new tab
  // async login() {
  //   try {
  //     const loginUrl = `${CONFIG.STAGING_WEBSITE}/login`;

  //     chrome.tabs.create({ url: loginUrl });

  //     return { success: true };
  //   } catch (error) {
  //     return { success: false, error: error.message };
  //   }
  // }

  // Make authenticated API request
  async makeAuthenticatedRequest(endpoint, options = {}, website=CONFIG.STAGING_WEBSITE) {
    // COMMENTED OUT: Login functionality disabled
    // if (!this.authState.isAuthenticated) {
    //   await this.clearAuthState();
    //   throw new Error("User not authenticated");
    // }

    const url = `${website}${endpoint}`;
    const defaultOptions = {
      headers: this.getAuthHeaders(),
      credentials: "include",
    };

    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, finalOptions);

      if (response.status === 401) {
        await this.clearAuthState();
        throw new Error("Authentication failed - please log in again");
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  // COMMENTED OUT: Auth functionality disabled
  // async logout() {
  //   try {
  //     const logoutUrl = `${CONFIG.STAGING_WEBSITE}/logout`;
  //     chrome.tabs.create({ url: logoutUrl });
  //   } catch (error) {
  //     console.log("⚠️ API: Failed to open logout tab:", error.message);
  //   }

  //   await this.clearAuthState();

  //   return { success: true };
  // }

  // =============================================================================
  // VISITOR ID METHODS
  // =============================================================================

  /**
   * Generate a random visitor ID
   * @returns {string} Random visitor ID
   */
  generateVisitorId() {
    return 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  /**
   * Get or create visitor ID from storage
   * @returns {Promise<string>} Visitor ID
   */
  async getVisitorId() {
    try {
      const result = await chrome.storage.local.get([this.VISITOR_ID_KEY]);
      
      if (result[this.VISITOR_ID_KEY]) {
        return result[this.VISITOR_ID_KEY];
      }

      // Generate new visitor ID if none exists
      const newVisitorId = this.generateVisitorId();
      await chrome.storage.local.set({ [this.VISITOR_ID_KEY]: newVisitorId });
      return newVisitorId;
    } catch (error) {
      console.error("❌ API: Failed to get/set visitor ID:", error);
      // Return a temporary ID if storage fails
      return this.generateVisitorId();
    }
  }

  // =============================================================================
  // API METHODS
  // =============================================================================

  async fetchDistractingChunks(gridStructure, currentUrl, whitelist = [], blacklist = []) {
    console.log(`🌐 API: Making authenticated request to fetch_distracting_chunks`);
    console.log(`🌐 API: Current URL: ${currentUrl}`);
    console.log(`🌐 API: Whitelist (${whitelist.length} items):`, whitelist);
    console.log(`🌐 API: Blacklist (${blacklist.length} items):`, blacklist);

    try {
      const visitorId = await this.getVisitorId();
      
      const requestBody = {
        gridStructure: gridStructure,
        currentUrl: currentUrl,
        whitelist: whitelist,
        blacklist: blacklist,
        visitorId: visitorId
      };

      console.log(`🌐 API: Request body:`, JSON.stringify(requestBody, null, 2));

      // Use the authenticated request method instead of direct fetch
      const response = await this.makeAuthenticatedRequest('/fetch_distracting_chunks', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }, API_ENDPOINTS.BASE_URL);

      if (!response.ok) {
        console.error(`🌐 API: Request failed - HTTP ${response.status}: ${response.statusText}`);
        
        // Try to get the actual error message from the response body
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (parseError) {
          console.warn('🌐 API: Could not parse error response, using default message');
        }
        
        throw new Error(errorMessage);
      }

      console.log(`🌐 API: Request successful - Status: ${response.status}`);
      const data = await response.json();
      console.log(`🌐 API: Response data received`);

      return { success: true, data };
    } catch (error) {
      console.error(`🌐 API: Request error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // COMMENTED OUT: Auth functionality disabled
  // Get current auth state
  // getAuthState() {
  //   return {
  //     isAuthenticated: this.authState.isAuthenticated,
  //     user: this.authState.user,
  //   };
  // }
}

export default API;
