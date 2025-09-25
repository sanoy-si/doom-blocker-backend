import { API_ENDPOINTS, CONFIG } from '../shared/constants.js';

class API {
  constructor() {
    // Storage keys
    this.STORAGE_KEYS = {
      AUTH_STATE: "topaz_auth_state",
      USER_DATA: "topaz_user_data",
      ACCESS_TOKEN: "topaz_access_token",
      REFRESH_TOKEN: "topaz_refresh_token"
    };

    // Current auth state
    this.authState = {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null
    };

    // VisitorID storage key
    this.VISITOR_ID_KEY = "topaz_visitor_id";
  }

  // Initialize API and auth system
  async init() {
    await this.loadAuthFromStorage();
    await this.ensureApiKeyExists();
  }

  // Ensure API key exists in storage
  async ensureApiKeyExists() {
    try {
      const result = await chrome.storage.local.get(['apiKey']);
      if (!result.apiKey) {
        // Set the default API key that matches the backend
        const defaultApiKey = "doom-blocker-extension-api-key-2024";
        await chrome.storage.local.set({ apiKey: defaultApiKey });
        console.log("✅ API: Default API key set");
      } else {
        console.log("✅ API: API key already exists in storage");
      }
    } catch (error) {
      console.error("❌ API: Failed to ensure API key exists:", error);
    }
  }

  // Load auth state from Chrome storage
  async loadAuthFromStorage() {
    try {
      const keys = Object.values(this.STORAGE_KEYS);
      const result = await chrome.storage.local.get(keys);

      this.authState = {
        isAuthenticated: result[this.STORAGE_KEYS.AUTH_STATE] || false,
        user: result[this.STORAGE_KEYS.USER_DATA] || null,
        accessToken: result[this.STORAGE_KEYS.ACCESS_TOKEN] || null,
        refreshToken: result[this.STORAGE_KEYS.REFRESH_TOKEN] || null
      };
    } catch (error) {
      console.error("❌ API: Failed to load auth from storage:", error);
    }
  }

  // Save auth state to Chrome storage
  async saveAuthToStorage() {
    try {
      const dataToSave = {
        [this.STORAGE_KEYS.AUTH_STATE]: this.authState.isAuthenticated,
        [this.STORAGE_KEYS.USER_DATA]: this.authState.user,
        [this.STORAGE_KEYS.ACCESS_TOKEN]: this.authState.accessToken,
        [this.STORAGE_KEYS.REFRESH_TOKEN]: this.authState.refreshToken
      };

      await chrome.storage.local.set(dataToSave);
    } catch (error) {
      console.error("❌ API: Failed to save auth to storage:", error);
    }
  }

  // Set authentication data
  async setAuthData(authData) {
    this.authState = {
      isAuthenticated: true,
      user: authData.user,
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken
    };
    await this.saveAuthToStorage();
  }

  // Open login page in new tab with extension ID
  async login() {
    try {
      const extensionId = chrome.runtime.id;
      const loginUrl = `${CONFIG.SIGNIN_WEBSITE}/?extension_id=${extensionId}&extension=true`;
      console.log("🔐 API: Opening login URL:", loginUrl);
      chrome.tabs.create({ url: loginUrl });
      return { success: true, message: 'Login page opened with extension ID' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Handle token received from signin page
  async handleTokenReceived(tokenData) {
    try {
      console.log("🔐 API: handleTokenReceived called with:", {
        hasUser: !!tokenData.user,
        hasAccessToken: !!tokenData.accessToken,
        hasRefreshToken: !!tokenData.refreshToken,
        userEmail: tokenData.user?.email
      });

      await this.setAuthData({
        user: tokenData.user,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken
      });
      
      console.log("✅ Authentication successful:", tokenData.user.email);
      console.log("✅ Auth state updated:", {
        isAuthenticated: this.authState.isAuthenticated,
        userEmail: this.authState.user?.email
      });
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to handle token:", error);
      return { success: false, error: error.message };
    }
  }

  // Check if user is first time (no auth state)
  async isFirstTimeUser() {
    const result = await chrome.storage.local.get(Object.values(this.STORAGE_KEYS));
    return !result[this.STORAGE_KEYS.AUTH_STATE];
  }

  // Clear authentication state
  async clearAuthState() {
    this.authState = {
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null
    };
    await chrome.storage.local.remove(Object.values(this.STORAGE_KEYS));
  }

  // Logout
  async logout() {
    try {
      await this.clearAuthState();
      console.log("✅ Logout successful");
      return { success: true };
    } catch (error) {
      console.error("❌ Logout failed:", error);
      return { success: false, error: error.message };
    }
  }

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

  async getAuthHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    // Get API key from storage
    const result = await chrome.storage.local.get(['apiKey']);
    const apiKey = result.apiKey;

    if (!apiKey) {
      throw new Error("No API key found. Extension may not be properly initialized.");
    }

    headers["Authorization"] = `Bearer ${apiKey}`;

    if (this.authState.accessToken) {
      headers["X-User-Token"] = this.authState.accessToken;
    }

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
    const url = `${website}${endpoint}`;
    console.log(`🌐 API: Making request to URL: ${url}`);
    const defaultOptions = {
      headers: await this.getAuthHeaders(),
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
  // INPUT SANITIZATION METHODS
  // =============================================================================

  sanitizeText(text, maxLength = 1000) {
    if (typeof text !== 'string') {
      return '';
    }
    
    return text
      .replace(/[<>\"'&]/g, '') // Remove basic XSS characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .substring(0, maxLength)
      .trim();
  }

  sanitizeUrl(url) {
    if (typeof url !== 'string') {
      return '';
    }

    try {
      const parsedUrl = new URL(url);
      
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        console.warn('🔒 Invalid URL protocol blocked:', parsedUrl.protocol);
        return '';
      }

      return parsedUrl.href;
    } catch (error) {
      console.warn('🔒 Invalid URL format blocked:', url);
      return '';
    }
  }

  sanitizeArray(arr, maxItems = 100, maxItemLength = 100) {
    if (!Array.isArray(arr)) {
      return [];
    }

    return arr
      .slice(0, maxItems)
      .map(item => this.sanitizeText(item, maxItemLength))
      .filter(item => item.length > 0);
  }

  sanitizeGridStructure(gridStructure) {
    if (!gridStructure || typeof gridStructure !== 'object') {
      throw new Error('Invalid grid structure');
    }

    if (!Array.isArray(gridStructure.grids)) {
      throw new Error('Grid structure must contain grids array');
    }

    if (gridStructure.grids.length > 50) {
      throw new Error('Too many grids (max 50)');
    }

    // Create sanitized copy
    const sanitized = {
      ...gridStructure,
      grids: gridStructure.grids.map(grid => {
        const sanitizedGrid = {
          ...grid,
          id: this.sanitizeText(grid.id, 50)
        };

        if (grid.children && Array.isArray(grid.children)) {
          sanitizedGrid.children = grid.children
            .slice(0, 200) // Limit children
            .map(child => ({
              ...child,
              id: this.sanitizeText(child.id, 50),
              text: this.sanitizeText(child.text || '', 500)
            }));
        }

        return sanitizedGrid;
      })
    };

    return sanitized;
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
      
      // Sanitize input data before sending to API
      const requestBody = {
        gridStructure: this.sanitizeGridStructure(gridStructure),
        currentUrl: this.sanitizeUrl(currentUrl),
        whitelist: this.sanitizeArray(whitelist),
        blacklist: this.sanitizeArray(blacklist),
        visitorId: this.sanitizeText(visitorId)
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
        
        // Provide user-friendly error messages
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please check your API key.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        } else if (response.status === 502) {
          errorMessage = 'AI service temporarily unavailable. Using fallback analysis.';
        }
        
        throw new Error(errorMessage);
      }

      console.log(`🌐 API: Request successful - Status: ${response.status}`);
      const data = await response.json();
      console.log(`🌐 API: Response data received`);

      return { success: true, data };
    } catch (error) {
      console.error(`🌐 API: Request error: ${error.message}`);
      
      // Return structured error information for better handling
      return { 
        success: false, 
        error: error.message,
        shouldRetry: !error.message.includes('Authentication') && !error.message.includes('Rate limit'),
        isTemporary: error.message.includes('temporarily unavailable')
      };
    }
  }

  async reportBlockedItems(count) {
    console.log(`🌐 API: Reporting ${count} actually blocked items`);
    
    try {
      const response = await this.makeAuthenticatedRequest('/api/report-blocked-items', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count }),
      }, API_ENDPOINTS.BASE_URL);

      if (!response.ok) {
        console.error(`🌐 API: Report blocked items failed - HTTP ${response.status}: ${response.statusText}`);
        return { success: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      console.log(`🌐 API: Blocked items reported successfully`);
      return { success: true, data };
    } catch (error) {
      console.error(`🌐 API: Report blocked items error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // COMMENTED OUT: Auth functionality disabled
  // Get current auth state
  getAuthState() {
    return {
      isAuthenticated: this.authState.isAuthenticated,
      user: this.authState.user,
      accessToken: this.authState.accessToken,
      refreshToken: this.authState.refreshToken
    };
  }
}

export default API;
