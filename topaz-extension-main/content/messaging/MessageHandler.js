/**
 * Handles Chrome extension messaging
 */
class MessageHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.messageListenerSetup = false;
    
    // Bind methods
    this.handleMessage = this.handleMessage.bind(this);
  }

  setupMessageListener() {
    if (this.messageListenerSetup) {
      return;
    }

    chrome.runtime.onMessage.addListener(this.handleMessage);
    this.messageListenerSetup = true;
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case MESSAGE_TYPES.DISABLE:
        this.handleDisable(message, sendResponse);
        break;
      case MESSAGE_TYPES.ENABLE:
        this.handleEnable(message, sendResponse);
        break;
      case MESSAGE_TYPES.ERROR:
        this.handleError(message, sendResponse);
        break;
      case MESSAGE_TYPES.HIDE_GRID_CHILDREN:
        this.handleHideGridChildren(message, sendResponse);
        break;
      case MESSAGE_TYPES.STOP_OBSERVING:
        this.handleStopObserving(message, sendResponse);
        break;
      case MESSAGE_TYPES.UNHIDE_ELEMENT:
        this.handleUnhideElement(message, sendResponse);
        break;
      case MESSAGE_TYPES.RESTORE_ALL_ELEMENTS:
        this.handleRestoreAllElements(message, sendResponse);
        break;
        
      case MESSAGE_TYPES.GET_HIDDEN_ELEMENTS:
        this.handleGetHiddenElements(message, sendResponse);
        break;
        
      case MESSAGE_TYPES.URL_CHANGED:
        this.handleUrlChanged(message, sendResponse);
        break;
        
      // 🚀 INSTANT FILTERING: Handle instant filter requests
      case 'INSTANT_FILTER_REQUEST':
        this.handleInstantFilter(message, sendResponse);
        break;
        
      default:
        sendResponse(this.createResponse(false, `Unknown message type: ${message.type}`));
    }

    // Keep channel open for async responses
    return true;
  }

  /**
   * Handle DISABLE message
   */
  handleDisable(message, sendResponse) {
    const revive = message.revive !== undefined ? message.revive : true; // Default to true
    this.eventBus.emit('message:disable', { revive, sendResponse });
  }

  /**
   * Handle ENABLE message
   */
  handleEnable(message, sendResponse) {
    this.eventBus.emit('message:enable', { 
      config: message.config, 
      sendResponse 
    });
  }

  /**
   * Handle ERROR message
   */
  handleError(message, sendResponse) {
    this.eventBus.emit('message:error', { 
      errorMessage: message.errorMessage,
      errorType: message.errorType || 'general',
      sendResponse 
    });
    sendResponse(this.createResponse(true, 'Error message received'));
  }

  /**
   * Handle HIDE_GRID_CHILDREN message
   */
  handleHideGridChildren(message, sendResponse) {
    this.eventBus.emit('message:hide-grid-children', { 
      gridInstructions: message.gridInstructions, 
      sendResponse 
    });
  }

  handleStopObserving(message, sendResponse) {
    this.eventBus.emit('message:stop-observing', { sendResponse });
  }

  handleUnhideElement(message, sendResponse) {
    this.eventBus.emit('message:unhide-element', { 
      elementId: message.elementId, 
      sendResponse 
    });
  }

  /**
   * Handle RESTORE_ALL_ELEMENTS message
   */
  handleRestoreAllElements(message, sendResponse) {
    this.eventBus.emit('message:restore-all-elements', { sendResponse });
  }

  /**
   * Handle GET_HIDDEN_ELEMENTS message
   */
  handleGetHiddenElements(message, sendResponse) {
    this.eventBus.emit('message:get-hidden-elements', { sendResponse });
  }

  handleUrlChanged(message, sendResponse) {
    this.eventBus.emit('message:url-changed', { 
      url: message.url, 
      sendResponse 
    });
  }

  // 🚀 INSTANT FILTERING: Handle instant filter requests
  handleInstantFilter(message, sendResponse) {
    console.log('📨 Received instant filter request:', message);
    this.eventBus.emit('message:instant-filter', { 
      sendResponse 
    });
  }

  sendMessageToBackground(message) {
    console.log("🔍 [TOPAZ DEBUG] MessageHandler.sendMessageToBackground called with:", message);
    return new Promise((resolve, reject) => {
      if (!chrome.runtime || !chrome.runtime.sendMessage) {
        console.log("🔍 [TOPAZ DEBUG] Chrome runtime not available");
        reject(new Error('Chrome runtime not available'));
        return;
      }

      console.log("🔍 [TOPAZ DEBUG] Sending message to background script:", message);
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.log("🔍 [TOPAZ DEBUG] Chrome runtime error:", chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log("🔍 [TOPAZ DEBUG] Background response received:", response);
          resolve(response);
        }
      });

      // Emit message sent event
      this.eventBus.emit(EVENTS.MESSAGE_SENT, { message });
    });
  }

  createResponse(success, message = '', extraData = {}) {
    return {
      success: success,
      message: message,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...extraData
    };
  }

  /**
   * Remove message listener
   */
  removeMessageListener() {
    if (this.messageListenerSetup) {
      chrome.runtime.onMessage.removeListener(this.handleMessage);
      this.messageListenerSetup = false;
    }
  }

  /**
   * Destroy message handler
   */
  destroy() {
    this.removeMessageListener();
    this.eventBus = null;
  }
} 