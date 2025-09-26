/**
 * 🚀 MEMORY LEAK FIX: ViewportManager with proper resource cleanup
 * Manages viewport detection, scroll monitoring, and intelligent content filtering
 * Prioritizes visible content and pauses processing when user stops interacting
 */
class ViewportManager {
  constructor(resourceManager = null) {
    this.scrollTimeout = null;
    this.isScrolling = false;
    this.lastScrollTime = 0;
    this.scrollPauseDelay = 500; // Stop processing 500ms after scroll stops
    this.visibilityMargin = 200; // Pixels beyond viewport to consider "near visible"
    this.processingPaused = false;
    this.pendingWork = [];
    this.callbacks = {
      onScrollStart: [],
      onScrollStop: [],
      onVisibilityChange: []
    };

    // 🚀 MEMORY LEAK FIX: Store ResourceManager for proper cleanup
    this.resourceManager = resourceManager;

    // 🚀 MEMORY LEAK FIX: Store bound function references for cleanup
    this.boundHandlers = {
      scroll: null,
      wheel: null,
      touchmove: null,
      visibilitychange: null,
      resize: null
    };

    this.setupScrollDetection();
    this.setupVisibilityDetection();
  }

  /**
   * 🚀 MEMORY LEAK FIX: Setup scroll detection with proper cleanup
   */
  setupScrollDetection() {
    let scrollStartTimeout = null;

    const handleScroll = () => {
      const now = Date.now();
      this.lastScrollTime = now;

      // Detect scroll start
      if (!this.isScrolling) {
        this.isScrolling = true;
        this.processingPaused = false;
        this.notifyCallbacks('onScrollStart');
      }

      // Clear existing timeout
      if (this.scrollTimeout) {
        // Use ResourceManager if available, fallback to regular clearTimeout
        if (this.resourceManager && this.resourceManager.clearTimeout) {
          this.resourceManager.clearTimeout(this.scrollTimeout);
        } else {
          clearTimeout(this.scrollTimeout);
        }
      }

      // Set timeout for scroll stop detection
      if (this.resourceManager && this.resourceManager.setTimeout) {
        this.scrollTimeout = this.resourceManager.setTimeout(() => {
          this.isScrolling = false;
          this.processingPaused = true;
          this.notifyCallbacks('onScrollStop');
          this.processPendingWork();
        }, this.scrollPauseDelay);
      } else {
        this.scrollTimeout = setTimeout(() => {
          this.isScrolling = false;
          this.processingPaused = true;
          this.notifyCallbacks('onScrollStop');
          this.processPendingWork();
        }, this.scrollPauseDelay);
      }
    };

    // 🚀 MEMORY LEAK FIX: Store bound function references
    this.boundHandlers.scroll = handleScroll;
    this.boundHandlers.wheel = handleScroll;
    this.boundHandlers.touchmove = handleScroll;

    // Use ResourceManager if available for tracked event listeners
    if (this.resourceManager && this.resourceManager.addEventListener) {
      console.log('✅ [ViewportManager] Using ResourceManager for scroll event listeners');
      this.resourceManager.addEventListener(window, 'scroll', handleScroll, { passive: true });
      this.resourceManager.addEventListener(document, 'wheel', handleScroll, { passive: true });
      this.resourceManager.addEventListener(document, 'touchmove', handleScroll, { passive: true });
    } else {
      // Fallback to direct event listeners (with memory leak warning)
      console.warn('⚠️ [ViewportManager] No ResourceManager - using direct event listeners (memory leak risk)');
      window.addEventListener('scroll', handleScroll, { passive: true });
      document.addEventListener('wheel', handleScroll, { passive: true });
      document.addEventListener('touchmove', handleScroll, { passive: true });
    }
  }

  /**
   * 🚀 MEMORY LEAK FIX: Setup viewport visibility change detection with proper cleanup
   */
  setupVisibilityDetection() {
    let lastVisibilityCheck = 0;
    const visibilityCheckDelay = 100; // Throttle visibility checks

    const handleVisibilityChange = () => {
      const now = Date.now();
      if (now - lastVisibilityCheck < visibilityCheckDelay) return;
      lastVisibilityCheck = now;

      this.notifyCallbacks('onVisibilityChange');
    };

    // 🚀 MEMORY LEAK FIX: Store bound function references
    this.boundHandlers.visibilitychange = handleVisibilityChange;
    this.boundHandlers.resize = handleVisibilityChange;

    // Use ResourceManager if available for tracked event listeners
    if (this.resourceManager && this.resourceManager.addEventListener) {
      console.log('✅ [ViewportManager] Using ResourceManager for visibility event listeners');
      this.resourceManager.addEventListener(document, 'visibilitychange', handleVisibilityChange);
      this.resourceManager.addEventListener(window, 'resize', handleVisibilityChange, { passive: true });
    } else {
      // Fallback to direct event listeners (with memory leak warning)
      console.warn('⚠️ [ViewportManager] No ResourceManager - using direct event listeners (memory leak risk)');
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('resize', handleVisibilityChange, { passive: true });
    }
  }

  /**
   * Check if an element is currently visible in viewport
   * @param {HTMLElement} element
   * @param {number} margin - Additional margin around viewport
   * @returns {boolean}
   */
  isElementVisible(element, margin = this.visibilityMargin) {
    if (!element || !element.getBoundingClientRect) return false;

    try {
      const rect = element.getBoundingClientRect();
      const viewport = {
        top: -margin,
        left: -margin,
        bottom: (window.innerHeight || document.documentElement.clientHeight) + margin,
        right: (window.innerWidth || document.documentElement.clientWidth) + margin
      };

      return (
        rect.bottom > viewport.top &&
        rect.top < viewport.bottom &&
        rect.right > viewport.left &&
        rect.left < viewport.right &&
        rect.width > 0 &&
        rect.height > 0
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if element is in the critical viewport (no margin)
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  isElementInCriticalViewport(element) {
    return this.isElementVisible(element, 0);
  }

  /**
   * Check if element is near viewport (with margin)
   * @param {HTMLElement} element
   * @returns {boolean}
   */
  isElementNearViewport(element) {
    return this.isElementVisible(element, this.visibilityMargin);
  }

  /**
   * Get visibility priority for an element
   * @param {HTMLElement} element
   * @returns {number} 0 = not visible, 1 = near visible, 2 = visible
   */
  getElementVisibilityPriority(element) {
    if (this.isElementInCriticalViewport(element)) return 2;
    if (this.isElementNearViewport(element)) return 1;
    return 0;
  }

  /**
   * Filter and sort elements by visibility priority
   * @param {Array} elements - Array of elements or objects with element property
   * @returns {Array} Sorted array with visible elements first
   */
  prioritizeByVisibility(elements) {
    if (!Array.isArray(elements)) return [];

    const elementEntries = elements.map(item => {
      const element = item.element || item;
      const priority = this.getElementVisibilityPriority(element);
      return { item, priority, element };
    });

    // Sort by priority (visible first), then by position in DOM
    return elementEntries
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }

        // For same priority, maintain DOM order
        if (a.element && b.element && a.element.compareDocumentPosition) {
          const position = a.element.compareDocumentPosition(b.element);
          if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
          if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        }

        return 0;
      })
      .map(entry => entry.item);
  }

  /**
   * Get only visible elements from a list
   * @param {Array} elements
   * @returns {Array}
   */
  getVisibleElements(elements) {
    if (!Array.isArray(elements)) return [];

    return elements.filter(item => {
      const element = item.element || item;
      return this.isElementVisible(element);
    });
  }

  /**
   * Should processing be paused due to scrolling?
   * @returns {boolean}
   */
  shouldPauseProcessing() {
    return this.processingPaused || document.hidden;
  }

  /**
   * Add work to be processed when scrolling stops
   * @param {Function} workFunction
   */
  addPendingWork(workFunction) {
    if (typeof workFunction === 'function') {
      this.pendingWork.push(workFunction);
    }
  }

  /**
   * Process any pending work that was deferred during scrolling
   */
  async processPendingWork() {
    if (this.pendingWork.length === 0) return;

    console.log(`🔄 Processing ${this.pendingWork.length} deferred tasks after scroll stop`);

    const work = [...this.pendingWork];
    this.pendingWork = [];

    for (const workFunction of work) {
      try {
        if (this.isScrolling) {
          // User started scrolling again, defer remaining work
          this.pendingWork.unshift(...work.slice(work.indexOf(workFunction)));
          break;
        }
        await workFunction();
      } catch (e) {
        console.warn('Error processing deferred work:', e);
      }
    }
  }

  /**
   * Register callback for viewport events
   * @param {string} event - 'onScrollStart', 'onScrollStop', 'onVisibilityChange'
   * @param {Function} callback
   */
  on(event, callback) {
    if (this.callbacks[event] && typeof callback === 'function') {
      this.callbacks[event].push(callback);
    }
  }

  /**
   * Remove callback for viewport events
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index > -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }

  /**
   * Notify all callbacks for an event
   * @param {string} event
   */
  notifyCallbacks(event) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback();
        } catch (e) {
          console.warn(`Error in ${event} callback:`, e);
        }
      });
    }
  }

  /**
   * Get scroll state information
   * @returns {Object}
   */
  getScrollState() {
    return {
      isScrolling: this.isScrolling,
      processingPaused: this.processingPaused,
      lastScrollTime: this.lastScrollTime,
      pendingWorkCount: this.pendingWork.length
    };
  }

  /**
   * Get viewport information
   * @returns {Object}
   */
  getViewportInfo() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight,
      scrollX: window.pageXOffset || document.documentElement.scrollLeft,
      scrollY: window.pageYOffset || document.documentElement.scrollTop
    };
  }

  /**
   * 🚀 MEMORY LEAK FIX: Cleanup and remove ALL event listeners
   */
  destroy() {
    console.log('🧹 [ViewportManager] Starting cleanup...');

    // Clear timeout
    if (this.scrollTimeout) {
      if (this.resourceManager && this.resourceManager.clearTimeout) {
        this.resourceManager.clearTimeout(this.scrollTimeout);
      } else {
        clearTimeout(this.scrollTimeout);
      }
      this.scrollTimeout = null;
    }

    // 🚀 MEMORY LEAK FIX: Remove ALL event listeners using stored references
    if (this.resourceManager && this.resourceManager.addEventListener) {
      // If we used ResourceManager, it will clean up automatically when destroyed
      console.log('✅ [ViewportManager] ResourceManager will handle event listener cleanup');
    } else {
      // Manually remove event listeners that were added directly
      console.log('🧹 [ViewportManager] Manually removing event listeners...');

      if (this.boundHandlers.scroll) {
        window.removeEventListener('scroll', this.boundHandlers.scroll);
        console.log('🧹 [ViewportManager] Removed scroll listener from window');
      }

      if (this.boundHandlers.wheel) {
        document.removeEventListener('wheel', this.boundHandlers.wheel);
        console.log('🧹 [ViewportManager] Removed wheel listener from document');
      }

      if (this.boundHandlers.touchmove) {
        document.removeEventListener('touchmove', this.boundHandlers.touchmove);
        console.log('🧹 [ViewportManager] Removed touchmove listener from document');
      }

      if (this.boundHandlers.visibilitychange) {
        document.removeEventListener('visibilitychange', this.boundHandlers.visibilitychange);
        console.log('🧹 [ViewportManager] Removed visibilitychange listener from document');
      }

      if (this.boundHandlers.resize) {
        window.removeEventListener('resize', this.boundHandlers.resize);
        console.log('🧹 [ViewportManager] Removed resize listener from window');
      }
    }

    // Clear all references
    this.boundHandlers = {
      scroll: null,
      wheel: null,
      touchmove: null,
      visibilitychange: null,
      resize: null
    };

    this.callbacks = { onScrollStart: [], onScrollStop: [], onVisibilityChange: [] };
    this.pendingWork = [];
    this.resourceManager = null;

    console.log('✅ [ViewportManager] Cleanup complete - all event listeners removed');
  }
}