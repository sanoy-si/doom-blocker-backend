class EventBus {
  constructor() {
    this.events = new Map();
    this.debug = false;
  }
  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to call when event is emitted
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    
    this.events.get(eventName).add(callback);
    
    if (this.debug) {
      console.log(`[EventBus] Subscribed to: ${eventName}`);
    }
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(eventName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.events.delete(eventName);
        }
      }
    };
  }

  /**
   * Emit an event
   * @param {string} eventName - Name of the event
   * @param {*} data - Data to pass to subscribers
   */
  emit(eventName, data) {
    if (this.debug) {
      console.log(`[EventBus] Emitting: ${eventName}`, data);
    }
    
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in callback for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event only once
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to call when event is emitted
   */
  once(eventName, callback) {
    const unsubscribe = this.on(eventName, (data) => {
      unsubscribe();
      callback(data);
    });
  }

  /**
   * Remove all listeners for an event
   * @param {string} eventName - Name of the event
   */
  off(eventName) {
    this.events.delete(eventName);
  }

  /**
   * Remove all listeners
   */
  clear() {
    this.events.clear();
  }

  /**
   * Get all registered events
   * @returns {string[]} Array of event names
   */
  getEvents() {
    return Array.from(this.events.keys());
  }

  /**
   * Enable/disable debug logging
   * @param {boolean} enabled
   */
  setDebug(enabled) {
    this.debug = enabled;
  }
}

// Export as ES module
export default EventBus; 