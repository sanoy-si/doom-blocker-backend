import { MESSAGE_TYPES, BACKGROUND_EVENTS as EVENTS, DEBUG } from '../../shared/constants.js';

class MessageRouter {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.handlers = new Map();
    
    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async responses
    });
  }
  
  registerHandler(messageType, handler) {
    if (this.handlers.has(messageType)) {
    }
    
    this.handlers.set(messageType, handler);
  }

  /**
   * Unregister a message handler
   */
  unregisterHandler(messageType) {
    if (this.handlers.delete(messageType)) {
    }
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(message, sender, sendResponse) {
    if (DEBUG) {
      console.log(' [MESSAGE_ROUTER] handleMessage called');
      console.log(' [MESSAGE_ROUTER] Raw message:', JSON.stringify(message, null, 2));
      console.log(' [MESSAGE_ROUTER] Sender:', {
        tab: sender.tab ? {
          id: sender.tab.id,
          url: sender.tab.url,
          title: sender.tab.title
        } : 'No tab info',
        frameId: sender.frameId,
        origin: sender.origin
      });
    }

    const messageType = message.type;
    if (!messageType) {
      console.error(' [MESSAGE_ROUTER] Message without type received');
      sendResponse({
        success: false,
        error: 'Message type is required'
      });
      return;
    }

    // Emit message received event
    this.eventBus.emit(EVENTS.MESSAGE_RECEIVED, {
      message,
      sender,
      messageType
    });

    // Find and execute handler
    const handler = this.handlers.get(messageType);
    
    if (!handler) {
      console.error(' [MESSAGE_ROUTER] No handler found for:', messageType);
      sendResponse({
        success: false,
        error: `Unknown message type: ${messageType}`
      });
      return;
    }

    if (DEBUG) console.log(' [MESSAGE_ROUTER] Handler found for:', messageType);

    try {
      if (DEBUG) console.log(' [MESSAGE_ROUTER] Executing handler for:', messageType);
      
      // Execute handler
      const result = await handler(message, sender);
      
      if (DEBUG) console.log(' [MESSAGE_ROUTER] Handler result:', JSON.stringify(result, null, 2));
      
      // Send response
      const response = {
        success: true,
        ...result
      };
      
      if (DEBUG) console.log(' [MESSAGE_ROUTER] Sending response:', JSON.stringify(response, null, 2));
      sendResponse(response);
    } catch (error) {
      if (DEBUG) {
        console.error(' [MESSAGE_ROUTER] Error handling message:', messageType, error);
        console.error(' [MESSAGE_ROUTER] Error stack:', error.stack);
      }
      
      const errorResponse = {
        success: false,
        error: error.message || 'Internal error'
      };
      
      if (DEBUG) console.log(' [MESSAGE_ROUTER] Sending error response:', JSON.stringify(errorResponse, null, 2));
      sendResponse(errorResponse);
    }
  }

  /**
   * Send a message to a specific tab
   */
  async sendToTab(tabId, message) {
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

  /**
   * Send a message to all tabs
   */
  async sendToAllTabs(message) {
    const tabs = await this.getAllTabs();
    const promises = tabs.map(tab => 
      this.sendToTab(tab.id, message).catch(error => {
        return null;
      })
    );
    
    return Promise.allSettled(promises);
  }

  /**
   * Send a message to the active tab
   */
  async sendToActiveTab(message) {
    const tabs = await this.getActiveTabs();
    if (tabs.length === 0) {
      throw new Error('No active tab found');
    }
    
    return this.sendToTab(tabs[0].id, message);
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
   * Get active tabs
   */
  async getActiveTabs() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs);
      });
    });
  }

  /**
   * Register all default handlers
   */
  registerDefaultHandlers(handlers) {
    Object.entries(handlers).forEach(([messageType, handler]) => {
      this.registerHandler(messageType, handler);
    });
  }

  /**
   * Get registered handler types
   */
  getRegisteredTypes() {
    return Array.from(this.handlers.keys());
  }
}

export default MessageRouter; 