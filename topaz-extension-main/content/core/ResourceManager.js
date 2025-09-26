/**
 * 🚀 CRITICAL FIX: ResourceManager
 * Automatically tracks and cleans up ALL resources to prevent memory leaks
 * Solves: 99 addEventListener vs 0 removeEventListener issue
 */
class ResourceManager {
  constructor(debugName = 'ResourceManager') {
    this.debugName = debugName;
    this.isDestroyed = false;

    // Track all resources for automatic cleanup
    this.eventListeners = new Map(); // key -> {element, event, handler, options}
    this.intervals = new Set();      // Set of interval IDs
    this.timeouts = new Set();       // Set of timeout IDs
    this.observers = new Set();      // Set of MutationObserver/IntersectionObserver instances
    this.customCleanups = new Set(); // Set of custom cleanup functions

    console.log(`🔧 [${this.debugName}] ResourceManager initialized`);
  }

  /**
   * MEMORY LEAK FIX: Tracked addEventListener with automatic cleanup
   * Every call automatically gets corresponding removeEventListener on destroy
   */
  addEventListener(element, event, handler, options = {}) {
    if (this.isDestroyed) {
      console.warn(`❌ [${this.debugName}] Cannot add event listener - ResourceManager destroyed`);
      return;
    }

    // Create unique key for this listener
    const key = `${element.constructor.name}-${event}-${Date.now()}-${Math.random()}`;

    // Store listener details for cleanup
    this.eventListeners.set(key, {
      element,
      event,
      handler,
      options
    });

    // Add the actual event listener
    element.addEventListener(event, handler, options);

    console.log(`🎧 [${this.debugName}] Added tracked event listener: ${element.constructor.name}.${event}`);

    // Return removal function for manual cleanup if needed
    return () => this.removeEventListener(key);
  }

  /**
   * Manual removal of specific event listener
   */
  removeEventListener(key) {
    const listenerData = this.eventListeners.get(key);
    if (listenerData) {
      const { element, event, handler } = listenerData;
      element.removeEventListener(event, handler);
      this.eventListeners.delete(key);
      console.log(`🎧 [${this.debugName}] Removed tracked event listener: ${element.constructor.name}.${event}`);
    }
  }

  /**
   * MEMORY LEAK FIX: Tracked setInterval with automatic cleanup
   */
  setInterval(handler, delay, ...args) {
    if (this.isDestroyed) {
      console.warn(`❌ [${this.debugName}] Cannot set interval - ResourceManager destroyed`);
      return null;
    }

    const id = setInterval(handler, delay, ...args);
    this.intervals.add(id);

    console.log(`⏰ [${this.debugName}] Added tracked interval: ${id} (${delay}ms)`);

    return id;
  }

  /**
   * MEMORY LEAK FIX: Tracked setTimeout with automatic cleanup
   */
  setTimeout(handler, delay, ...args) {
    if (this.isDestroyed) {
      console.warn(`❌ [${this.debugName}] Cannot set timeout - ResourceManager destroyed`);
      return null;
    }

    const id = setTimeout((...timeoutArgs) => {
      // Auto-remove from tracking when timeout completes
      this.timeouts.delete(id);
      handler(...timeoutArgs);
    }, delay, ...args);

    this.timeouts.add(id);

    console.log(`⏱️ [${this.debugName}] Added tracked timeout: ${id} (${delay}ms)`);

    return id;
  }

  /**
   * Manual clearing of interval/timeout
   */
  clearInterval(id) {
    if (id && this.intervals.has(id)) {
      clearInterval(id);
      this.intervals.delete(id);
      console.log(`⏰ [${this.debugName}] Cleared tracked interval: ${id}`);
    }
  }

  clearTimeout(id) {
    if (id && this.timeouts.has(id)) {
      clearTimeout(id);
      this.timeouts.delete(id);
      console.log(`⏱️ [${this.debugName}] Cleared tracked timeout: ${id}`);
    }
  }

  /**
   * MEMORY LEAK FIX: Tracked observers with automatic cleanup
   */
  trackObserver(observer, observerType = 'Observer') {
    if (this.isDestroyed) {
      console.warn(`❌ [${this.debugName}] Cannot track observer - ResourceManager destroyed`);
      return;
    }

    this.observers.add(observer);
    console.log(`👁️ [${this.debugName}] Added tracked ${observerType}`);

    return observer;
  }

  /**
   * Track custom cleanup functions
   */
  addCleanup(cleanupFn, description = 'Custom cleanup') {
    if (this.isDestroyed) {
      console.warn(`❌ [${this.debugName}] Cannot add cleanup - ResourceManager destroyed`);
      return;
    }

    this.customCleanups.add({ fn: cleanupFn, description });
    console.log(`🧹 [${this.debugName}] Added custom cleanup: ${description}`);
  }

  /**
   * Get current resource counts for debugging
   */
  getResourceCounts() {
    return {
      eventListeners: this.eventListeners.size,
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
      observers: this.observers.size,
      customCleanups: this.customCleanups.size,
      isDestroyed: this.isDestroyed
    };
  }

  /**
   * 🚀 CRITICAL: Destroy all tracked resources
   * This solves the memory leak problem by cleaning up EVERYTHING
   */
  destroy() {
    if (this.isDestroyed) {
      console.warn(`❌ [${this.debugName}] Already destroyed`);
      return;
    }

    console.log(`🧹 [${this.debugName}] Starting resource cleanup...`);
    const startTime = Date.now();

    // Clean up event listeners
    let cleanedCount = 0;
    this.eventListeners.forEach((listenerData, key) => {
      const { element, event, handler } = listenerData;
      try {
        element.removeEventListener(event, handler);
        cleanedCount++;
      } catch (error) {
        console.warn(`❌ [${this.debugName}] Failed to remove event listener:`, error);
      }
    });
    this.eventListeners.clear();
    console.log(`🎧 [${this.debugName}] Cleaned up ${cleanedCount} event listeners`);

    // Clean up intervals
    this.intervals.forEach(id => {
      try {
        clearInterval(id);
      } catch (error) {
        console.warn(`❌ [${this.debugName}] Failed to clear interval ${id}:`, error);
      }
    });
    const intervalCount = this.intervals.size;
    this.intervals.clear();
    console.log(`⏰ [${this.debugName}] Cleaned up ${intervalCount} intervals`);

    // Clean up timeouts
    this.timeouts.forEach(id => {
      try {
        clearTimeout(id);
      } catch (error) {
        console.warn(`❌ [${this.debugName}] Failed to clear timeout ${id}:`, error);
      }
    });
    const timeoutCount = this.timeouts.size;
    this.timeouts.clear();
    console.log(`⏱️ [${this.debugName}] Cleaned up ${timeoutCount} timeouts`);

    // Clean up observers
    this.observers.forEach(observer => {
      try {
        if (observer.disconnect) {
          observer.disconnect();
        } else if (observer.unobserve) {
          // Some observers might need different cleanup
          observer.unobserve();
        }
      } catch (error) {
        console.warn(`❌ [${this.debugName}] Failed to disconnect observer:`, error);
      }
    });
    const observerCount = this.observers.size;
    this.observers.clear();
    console.log(`👁️ [${this.debugName}] Cleaned up ${observerCount} observers`);

    // Execute custom cleanups
    this.customCleanups.forEach(({ fn, description }) => {
      try {
        fn();
        console.log(`🧹 [${this.debugName}] Executed cleanup: ${description}`);
      } catch (error) {
        console.warn(`❌ [${this.debugName}] Failed cleanup ${description}:`, error);
      }
    });
    const customCount = this.customCleanups.size;
    this.customCleanups.clear();

    this.isDestroyed = true;

    const totalTime = Date.now() - startTime;
    console.log(`✅ [${this.debugName}] Resource cleanup complete in ${totalTime}ms`);
    console.log(`📊 [${this.debugName}] Cleaned: ${cleanedCount} listeners, ${intervalCount} intervals, ${timeoutCount} timeouts, ${observerCount} observers, ${customCount} custom cleanups`);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResourceManager;
} else if (typeof window !== 'undefined') {
  window.ResourceManager = ResourceManager;
}// Make ResourceManager available globally for content script
window.ResourceManager = ResourceManager;
