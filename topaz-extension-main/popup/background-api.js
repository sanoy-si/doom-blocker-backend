// Simple Background Communication
// Replaces the complex MessageManager + EventBus architecture

// Message types (simplified from shared constants)
const MESSAGE_TYPES = {
  GET_USER_SETTINGS: 'GET_USER_SETTINGS',
  UPDATE_USER_SETTINGS: 'UPDATE_USER_SETTINGS',
  EXTENSION_TOGGLED: 'EXTENSION_TOGGLED',
  GET_EXTENSION_STATE: 'GET_EXTENSION_STATE',
  ACCUMULATE_PROFILE_DATA: 'ACCUMULATE_PROFILE_DATA',
  HEARTBEAT_PING: 'HEARTBEAT_PING',
  HEARTBEAT_PONG: 'HEARTBEAT_PONG',
  UNHIDE_ELEMENT: 'UNHIDE_ELEMENT',
  RESTORE_ALL_ELEMENTS: 'RESTORE_ALL_ELEMENTS',
  GET_BLOCK_STATS: 'GET_BLOCK_STATS'
};

// Simple message sending with timeout and retry
async function sendMessage(messageData, timeout = 5000, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Message timeout'));
        }, timeout);
        
        chrome.runtime.sendMessage(messageData, (response) => {
          clearTimeout(timer);
          
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    }
  }
  
  throw lastError;
}

// API functions for specific operations
const backgroundAPI = {
  
  // Load user settings from background
  async loadUserSettings() {
    try {
      const response = await sendMessage({
        type: MESSAGE_TYPES.GET_USER_SETTINGS
      });
      
      if (response?.success && response.settings) {
        return {
          success: true,
          settings: response.settings
        };
      }
      
      return { success: false, error: 'Failed to load settings' };
    } catch (error) {
      console.error('Failed to load user settings:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Save user settings to background
  async saveUserSettings(settings) {
    try {
      const response = await sendMessage({
        type: MESSAGE_TYPES.UPDATE_USER_SETTINGS,
        settings
      });
      
      return {
        success: response?.success || false,
        error: response?.error
      };
    } catch (error) {
      console.error('Failed to save user settings:', error);
      return { success: false, error: error.message };
    }
  },
  // Toggle extension enabled/disabled
  async toggleExtension(enabled) {
    try {
      const response = await sendMessage({
        type: MESSAGE_TYPES.EXTENSION_TOGGLED,
        enabled
      });
      
      return {
        success: response?.success || false,
        enabled: response?.enabled || false,
        error: response?.error
      };
    } catch (error) {
      console.error('Failed to toggle extension:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get current extension state
  async getExtensionState() {
    try {
      const response = await sendMessage({
        type: MESSAGE_TYPES.GET_EXTENSION_STATE
      });
      
      return {
        success: response?.success || false,
        enabled: response?.enabled || false,
        error: response?.error
      };
    } catch (error) {
      console.error('Failed to get extension state:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Save profile data to background
  async saveProfiles(profiles) {
    console.log('💾 Saving profiles to background:', profiles);
    
    try {
      const message = {
        type: MESSAGE_TYPES.ACCUMULATE_PROFILE_DATA,
        profiles: profiles // Send profiles directly, not in data.profileConfigs
      };
      
      console.log('📤 Sending message to background:', message);
      const response = await sendMessage(message);
      console.log('📥 Background response:', response);
      
      // 🚀 INSTANT FILTERING: Trigger immediate re-analysis of current page
      if (response?.success) {
        console.log('🔄 Triggering instant filtering on current page...');
        await this.triggerInstantFiltering();
      }
      
      return {
        success: response?.success || false,
        error: response?.error
      };
    } catch (error) {
      console.error('❌ Failed to save profiles:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Send heartbeat ping to background
  async sendHeartbeat() {
    try {
      const response = await sendMessage({
        type: MESSAGE_TYPES.HEARTBEAT_PING
      });
      
      return { 
        success: response?.type === MESSAGE_TYPES.HEARTBEAT_PONG,
        timestamp: response?.timestamp
      };
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
      return { success: false, error: error.message };
    }
  },

  // Notify background that popup is opened
  async notifyPopupOpened() {
    try {
      console.log('📞 Sending popup opened notification through API...');
      
      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await sendMessage({
        type: 'POPUP_OPENED',
        tabId: tab?.id,
        url: tab?.url
      });
      
      console.log('✅ Popup opened notification sent:', response);
      return {
        success: response?.success || false,
        message: response?.message
      };
    } catch (error) {
      console.error('❌ Failed to notify popup opened:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Unhide specific element
  async unhideElement(elementData) {
    try {
      const response = await sendMessage({
        type: MESSAGE_TYPES.UNHIDE_ELEMENT,
        ...elementData
      });
      
      return {
        success: response?.success || false,
        error: response?.error
      };
    } catch (error) {
      console.error('Failed to unhide element:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Restore all hidden elements
  async restoreAllElements() {
    try {
      const response = await sendMessage({
        type: MESSAGE_TYPES.RESTORE_ALL_ELEMENTS
      });
      
      return {
        success: response?.success || false,
        error: response?.error
      };
    } catch (error) {
      console.error('Failed to restore all elements:', error);
      return { success: false, error: error.message };
    }
  },

  // 🚀 INSTANT FILTERING: Trigger immediate filtering on current page
  async triggerInstantFiltering() {
    try {
      console.log('🔄 Requesting instant filtering...');
      
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        console.log('❌ No active tab found for instant filtering');
        return { success: false, error: 'No active tab' };
      }

      // Send message to content script to re-analyze current page
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'INSTANT_FILTER_REQUEST',
        timestamp: Date.now()
      });

      console.log('✅ Instant filtering triggered:', response);
      return { success: true, response };
    } catch (error) {
      console.error('❌ Failed to trigger instant filtering:', error);
      return { success: false, error: error.message };
    }
  },

  // Fetch global block stats from background
  async getBlockStats() {
    try {
      const response = await sendMessage({
        type: MESSAGE_TYPES.GET_BLOCK_STATS
      });
      if (response?.success && response.globalBlockStats) {
        return { success: true, globalBlockStats: response.globalBlockStats };
      }
      return { success: false, error: 'Failed to fetch global block stats' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Export for use in other files
window.backgroundAPI = backgroundAPI; 