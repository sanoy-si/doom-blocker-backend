/**
 * 🚀 CRITICAL FIX: UnifiedEventCoordinator
 * Eliminates conflicts between multiple scroll handlers (ExtensionController vs ViewportManager)
 * Provides single coordinated event system for entire extension
 */
class UnifiedEventCoordinator {
  constructor(resourceManager, stateValidator, debugName = 'EventCoordinator') {
    this.resourceManager = resourceManager;
    this.stateValidator = stateValidator;
    this.debugName = debugName;

    // Event handler registrations
    this.scrollHandlers = new Map(); // handlerId -> {handler, priority, throttleMs, lastCalled}
    this.resizeHandlers = new Map();
    this.visibilityHandlers = new Map();
    this.customEventHandlers = new Map();

    // Performance tracking
    this.performanceMetrics = {
      scrollEvents: 0,
      handlerExecutions: 0,
      throttledEvents: 0,
      averageProcessingTime: 0
    };

    // Throttling state
    this.scrollThrottleTimeout = null;
    this.resizeThrottleTimeout = null;
    this.isProcessingScroll = false;
    this.pendingScrollData = null;

    // Adaptive throttling
    this.baseThrottleMs = 16; // 60fps baseline
    this.currentThrottleMs = this.baseThrottleMs;
    this.performanceWindowSize = 10;
    this.recentProcessingTimes = [];

    // Initialize single event listeners
    this.initializeEventListeners();

    console.log(`🎛️ [${this.debugName}] UnifiedEventCoordinator initialized`);
  }

  /**
   * Initialize single event listeners for the entire extension
   */
  initializeEventListeners() {
    // Single scroll listener for entire extension
    this.resourceManager.addEventListener(
      window,
      'scroll',
      this.handleUnifiedScroll.bind(this),
      { passive: true }
    );

    // Single resize listener
    this.resourceManager.addEventListener(
      window,
      'resize',
      this.handleUnifiedResize.bind(this),
      { passive: true }
    );

    // Single visibility change listener
    this.resourceManager.addEventListener(
      document,
      'visibilitychange',
      this.handleUnifiedVisibilityChange.bind(this)
    );

    console.log(`📡 [${this.debugName}] Unified event listeners initialized`);
  }

  /**
   * Register a scroll handler (replaces individual addEventListener calls)
   */
  registerScrollHandler(handlerId, handler, options = {}) {
    const {
      priority = 50,           // Higher = called first (0-100)
      throttleMs = 100,        // Individual throttling
      immediate = false        // Skip throttling for critical handlers
    } = options;

    this.scrollHandlers.set(handlerId, {
      handler,
      priority,
      throttleMs,
      immediate,
      lastCalled: 0,
      callCount: 0
    });

    // Sort handlers by priority
    this.sortHandlersByPriority('scroll');

    console.log(`📜 [${this.debugName}] Registered scroll handler: ${handlerId} (priority: ${priority})`);

    // Return unregister function
    return () => this.unregisterScrollHandler(handlerId);
  }

  /**
   * Unregister a scroll handler
   */
  unregisterScrollHandler(handlerId) {
    if (this.scrollHandlers.delete(handlerId)) {
      console.log(`📜 [${this.debugName}] Unregistered scroll handler: ${handlerId}`);
    }
  }

  /**
   * Register resize handler
   */
  registerResizeHandler(handlerId, handler, throttleMs = 250) {
    this.resizeHandlers.set(handlerId, {
      handler,
      throttleMs,
      lastCalled: 0
    });

    console.log(`📐 [${this.debugName}] Registered resize handler: ${handlerId}`);

    return () => {
      if (this.resizeHandlers.delete(handlerId)) {
        console.log(`📐 [${this.debugName}] Unregistered resize handler: ${handlerId}`);
      }
    };
  }

  /**
   * Register visibility change handler
   */
  registerVisibilityHandler(handlerId, handler) {
    this.visibilityHandlers.set(handlerId, { handler });

    console.log(`👁️ [${this.debugName}] Registered visibility handler: ${handlerId}`);

    return () => {
      if (this.visibilityHandlers.delete(handlerId)) {
        console.log(`👁️ [${this.debugName}] Unregistered visibility handler: ${handlerId}`);
      }
    };
  }

  /**
   * CRITICAL: Unified scroll event handler
   * Replaces multiple conflicting scroll listeners
   */
  handleUnifiedScroll(event) {
    this.performanceMetrics.scrollEvents++;

    // Capture scroll data
    const scrollData = {
      scrollY: window.scrollY || 0,
      scrollX: window.scrollX || 0,
      timestamp: Date.now(),
      event
    };

    this.pendingScrollData = scrollData;

    // Adaptive throttling based on performance
    this.adjustThrottling();

    // Process immediately if not already processing
    if (!this.isProcessingScroll) {
      if (this.scrollThrottleTimeout) {
        clearTimeout(this.scrollThrottleTimeout);
      }

      this.scrollThrottleTimeout = this.resourceManager.setTimeout(
        () => this.processScrollHandlers(),
        this.currentThrottleMs
      );
    }
  }

  /**
   * Process all registered scroll handlers in priority order
   */
  async processScrollHandlers() {
    if (this.isProcessingScroll || !this.pendingScrollData) {
      return;
    }

    this.isProcessingScroll = true;
    const startTime = Date.now();
    const scrollData = this.pendingScrollData;
    this.pendingScrollData = null;

    try {
      // Get sorted handlers by priority (higher priority first)
      const sortedHandlers = Array.from(this.scrollHandlers.entries())
        .sort(([, a], [, b]) => b.priority - a.priority);

      let handlersExecuted = 0;

      for (const [handlerId, handlerData] of sortedHandlers) {
        const { handler, throttleMs, immediate, lastCalled } = handlerData;
        const now = Date.now();

        // Check individual handler throttling
        if (!immediate && (now - lastCalled) < throttleMs) {
          continue;
        }

        try {
          // Execute handler with scroll data
          await handler(scrollData);
          handlerData.lastCalled = now;
          handlerData.callCount++;
          handlersExecuted++;
        } catch (error) {
          console.error(`❌ [${this.debugName}] Error in scroll handler ${handlerId}:`, error);
        }
      }

      this.performanceMetrics.handlerExecutions += handlersExecuted;

      // Update performance metrics
      const processingTime = Date.now() - startTime;
      this.updatePerformanceMetrics(processingTime);

      if (handlersExecuted > 0) {
        console.log(`⚡ [${this.debugName}] Processed ${handlersExecuted} scroll handlers in ${processingTime}ms`);
      }

    } finally {
      this.isProcessingScroll = false;

      // Process pending scroll if accumulated during processing
      if (this.pendingScrollData) {
        this.scrollThrottleTimeout = this.resourceManager.setTimeout(
          () => this.processScrollHandlers(),
          this.currentThrottleMs
        );
      }
    }
  }

  /**
   * Unified resize handler
   */
  handleUnifiedResize(event) {
    if (this.resizeThrottleTimeout) {
      clearTimeout(this.resizeThrottleTimeout);
    }

    this.resizeThrottleTimeout = this.resourceManager.setTimeout(() => {
      const resizeData = {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        timestamp: Date.now(),
        event
      };

      this.resizeHandlers.forEach((handlerData, handlerId) => {
        const { handler, throttleMs, lastCalled } = handlerData;
        const now = Date.now();

        if ((now - lastCalled) >= throttleMs) {
          try {
            handler(resizeData);
            handlerData.lastCalled = now;
          } catch (error) {
            console.error(`❌ [${this.debugName}] Error in resize handler ${handlerId}:`, error);
          }
        }
      });
    }, 250);
  }

  /**
   * Unified visibility change handler
   */
  handleUnifiedVisibilityChange(event) {
    const visibilityData = {
      isVisible: !document.hidden,
      visibilityState: document.visibilityState,
      timestamp: Date.now(),
      event
    };

    this.visibilityHandlers.forEach((handlerData, handlerId) => {
      try {
        handlerData.handler(visibilityData);
      } catch (error) {
        console.error(`❌ [${this.debugName}] Error in visibility handler ${handlerId}:`, error);
      }
    });

    console.log(`👁️ [${this.debugName}] Processed ${this.visibilityHandlers.size} visibility handlers`);
  }

  /**
   * Adaptive throttling based on performance
   */
  adjustThrottling() {
    if (this.recentProcessingTimes.length === 0) {
      return;
    }

    const avgTime = this.recentProcessingTimes.reduce((a, b) => a + b, 0) / this.recentProcessingTimes.length;

    // Adjust throttling based on average processing time
    if (avgTime > 50) {
      // Slow processing - increase throttling
      this.currentThrottleMs = Math.min(this.currentThrottleMs * 1.5, 500);
    } else if (avgTime < 10) {
      // Fast processing - decrease throttling
      this.currentThrottleMs = Math.max(this.currentThrottleMs * 0.8, this.baseThrottleMs);
    }

    // Round to nearest multiple of 16ms (frame-aligned)
    this.currentThrottleMs = Math.round(this.currentThrottleMs / 16) * 16;
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(processingTime) {
    this.recentProcessingTimes.push(processingTime);

    // Keep only recent measurements
    if (this.recentProcessingTimes.length > this.performanceWindowSize) {
      this.recentProcessingTimes.shift();
    }

    // Update average
    this.performanceMetrics.averageProcessingTime =
      this.recentProcessingTimes.reduce((a, b) => a + b, 0) / this.recentProcessingTimes.length;
  }

  /**
   * Sort handlers by priority
   */
  sortHandlersByPriority(eventType) {
    const handlers = eventType === 'scroll' ? this.scrollHandlers : this.resizeHandlers;
    // Map internally maintains insertion order, so we don't need to re-sort each time
    // Priority sorting happens during processing
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      currentThrottleMs: this.currentThrottleMs,
      activeScrollHandlers: this.scrollHandlers.size,
      activeResizeHandlers: this.resizeHandlers.size,
      activeVisibilityHandlers: this.visibilityHandlers.size,
      recentProcessingTimes: [...this.recentProcessingTimes]
    };
  }

  /**
   * Emergency pause all event processing
   */
  pauseEventProcessing() {
    this.isProcessingScroll = true; // Blocks further processing

    if (this.scrollThrottleTimeout) {
      clearTimeout(this.scrollThrottleTimeout);
      this.scrollThrottleTimeout = null;
    }

    if (this.resizeThrottleTimeout) {
      clearTimeout(this.resizeThrottleTimeout);
      this.resizeThrottleTimeout = null;
    }

    console.warn(`⏸️ [${this.debugName}] Event processing paused`);
  }

  /**
   * Resume event processing
   */
  resumeEventProcessing() {
    this.isProcessingScroll = false;
    console.log(`▶️ [${this.debugName}] Event processing resumed`);

    // Process any pending scroll data
    if (this.pendingScrollData) {
      this.processScrollHandlers();
    }
  }

  /**
   * Get handler registration status
   */
  getHandlerStatus() {
    return {
      scrollHandlers: Array.from(this.scrollHandlers.entries()).map(([id, data]) => ({
        id,
        priority: data.priority,
        throttleMs: data.throttleMs,
        callCount: data.callCount,
        lastCalled: data.lastCalled
      })),
      resizeHandlers: Array.from(this.resizeHandlers.keys()),
      visibilityHandlers: Array.from(this.visibilityHandlers.keys())
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedEventCoordinator;
} else if (typeof window !== 'undefined') {
  window.UnifiedEventCoordinator = UnifiedEventCoordinator;
}// Make UnifiedEventCoordinator available globally for content script
window.UnifiedEventCoordinator = UnifiedEventCoordinator;
