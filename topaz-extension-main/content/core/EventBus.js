/**
 * EventBus provides a decoupled communication mechanism between modules
 * using the publish-subscribe pattern
 */
class EventBus {
  constructor() {
    this.events = new Map();
    this.oneTimeEvents = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event only once
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  once(event, callback) {
    const wrappedCallback = (...args) => {
      callback(...args);
      this.off(event, wrappedCallback);
    };
    
    this.on(event, wrappedCallback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.events.has(event)) {
      return;
    }
    
    this.events.get(event).delete(callback);
    
    if (this.events.get(event).size === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to callbacks
   */
  emit(event, ...args) {
    
    if (!this.events.has(event)) {
      return;
    }
    
    const callbacks = this.events.get(event);
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        // Error handling removed
      }
    });
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get listener count for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).size : 0;
  }

  /**
   * Destroy the event bus
   */
  destroy() {
    this.events.clear();
    this.oneTimeEvents.clear();
  }
}

// Event names used across the extension
const EVENTS = {
  // Configuration events
  CONFIG_UPDATED: 'config:updated',
  CONFIG_RESET: 'config:reset',
  
  // Grid events
  GRIDS_DETECTED: 'grids:detected',
  GRIDS_UPDATED: 'grids:updated',
  GRID_CHILDREN_HIDDEN: 'grids:children-hidden',
  
  // DOM events
  DOM_MUTATED: 'dom:mutated',
  DOM_READY: 'dom:ready',
  
  // Navigation events
  NAVIGATION_START: 'navigation:start',
  NAVIGATION_COMPLETE: 'navigation:complete',
  
  // Extension state events
  EXTENSION_ENABLED: 'extension:enabled',
  EXTENSION_DISABLED: 'extension:disabled',
  
  // Analysis events
  ANALYSIS_REQUESTED: 'analysis:requested',
  ANALYSIS_COMPLETE: 'analysis:complete',
  
  // UI events
  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_UPDATE: 'notification:update',
  NOTIFICATION_HIDE: 'notification:hide',
  
  // Message events
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_SENT: 'message:sent'
}; 