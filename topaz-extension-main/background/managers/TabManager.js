import { BACKGROUND_EVENTS as EVENTS, MESSAGE_TYPES, CONFIG } from '../../shared/constants.js';

/**
 * TabManager - Manages tab operations and content script communication
 */
class TabManager {
  constructor(eventBus, stateManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    // Prevent concurrent enable/inject cycles per tab
    this.enableInFlight = new Set();
    this.setupEventListeners();
  }

  setupEventListeners() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab);
    });

    chrome.tabs.onCreated.addListener((tab) => {
      if (tab.url && this.stateManager.isAllowedWebsite(tab.url)) {
        this.enableTab(tab.id, tab.url);
      }
    });

  }

  async handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.url) {
      try {
        await this.sendMessageToTab(tabId, {
          type: MESSAGE_TYPES.URL_CHANGED,
          url: changeInfo.url
        });
      } catch (error) {
      }
    }
  }

  handleTabRemoved(tabId) {
    this.stateManager.removeTab(tabId);
    this.eventBus.emit(EVENTS.TAB_REMOVED, { tabId });
  }

  handleTabActivated(activeInfo) {
    this.eventBus.emit(EVENTS.TAB_ACTIVATED, activeInfo);
  }

  async enableTab(
    tabId,
    url = null,
    maxRetries = CONFIG.TAB_ENABLE_MAX_RETRIES,
    delay = CONFIG.TAB_ENABLE_RETRY_DELAY,
    attempt = 1
  ) {
    if (!this.stateManager.isExtensionEnabled()) {
      return;
    }

    if (this.enableInFlight.has(tabId)) {
      return; // single-flight guard
    }
    this.enableInFlight.add(tabId);
    try {
      await this.sendMessageToTab(tabId, {
        type: MESSAGE_TYPES.ENABLE,
        url: url // Send URL so content script can load its own config
      });
      
      this.eventBus.emit(EVENTS.TAB_READY, { tabId, url });
    } catch (error) {
      const isContentScriptNotReady = error.message?.includes('Receiving end does not exist');
      
      if (isContentScriptNotReady && attempt < maxRetries) {
        // Try to inject the full content script stack before retrying
        try {
          const files = [
            'content/utils/constants.js',
            'content/utils/TruthfulCounter.js',
            'content/utils/SessionManager.js',
            'content/core/EventBus.js',
            'content/core/ConfigManager.js',
            'content/grid/GridDetector.js',
            'content/grid/GridManager.js',
            'content/grid/ContentFingerprint.js',
            'content/ui/ElementEffects.js',
            'content/ui/NotificationManager.js',
            'content/observers/DOMObserver.js',
            'content/messaging/MessageHandler.js',
            'content/core/ResourceManager.js',
            'content/core/ExtensionLifecycleManager.js',
            'content/core/ExtensionController.js',
            'content/index.js'
          ];
          await chrome.scripting.executeScript({ target: { tabId }, files });
        } catch (e) {
          // ignore; we'll retry either way
        }
        setTimeout(() => {
          this.enableTab(tabId, url, maxRetries, delay, attempt + 1);
        }, delay);
      }
    } finally {
      this.enableInFlight.delete(tabId);
    }
  }

  /**
   * Send message to a specific tab
   */
  async sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  async sendMessageToAllTabs(message) {
    const tabs = await this.getAllTabs();
    const promises = tabs.map(tab => 
      this.sendMessageToTab(tab.id, message).catch(error => {
        return null;
      })
    );
    
    const results = await Promise.allSettled(promises);
    return results;
  }

  /**
   * Get all tabs
   */
  async getAllTabs() {
    return new Promise((resolve) => {
      chrome.tabs.query({}, (tabs) => {
        resolve(tabs);
      });
    });
  }

  /**
   * Get active tab in current window
   */
  async getActiveTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0] || null);
      });
    });
  }

  /**
   * Create a new tab
   */
  async createTab(url, options = {}) {
    return new Promise((resolve) => {
      chrome.tabs.create({ url, ...options }, (tab) => {
        resolve(tab);
      });
    });
  }

  /**
   * Update a tab
   */
  async updateTab(tabId, updateProperties) {
    return new Promise((resolve, reject) => {
      chrome.tabs.update(tabId, updateProperties, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(tab);
        }
      });
    });
  }

  /**
   * Get tab by ID
   */
  async getTab(tabId) {
    return new Promise((resolve, reject) => {
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(tab);
        }
      });
    });
  }

  /**
   * Query tabs
   */
  async queryTabs(queryInfo) {
    return new Promise((resolve) => {
      chrome.tabs.query(queryInfo, (tabs) => {
        resolve(tabs);
      });
    });
  }
}

export default TabManager; 