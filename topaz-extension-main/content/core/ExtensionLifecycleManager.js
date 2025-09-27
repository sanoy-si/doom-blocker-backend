/**
 * 🚀 SIMPLIFIED ExtensionLifecycleManager
 * Works with existing architecture instead of requiring new classes
 */
class ExtensionLifecycleManager {
  constructor(options = {}) {
    this.options = {
      debugName: 'ExtensionLifecycle',
      enableHealthMonitoring: true,
      enablePerformanceTracking: true,
      maxInitializationTime: 10000,
      ...options
    };

    this.debugName = this.options.debugName;
    this.isInitialized = false;
    this.isDestroyed = false;
    this.initializationStartTime = null;

    // Use existing components instead of non-existent ones
    this.eventBus = null;
    this.configManager = null;
    this.gridManager = null;
    this.domObserver = null;
    this.messageHandler = null;
    this.notificationManager = null;
    this.elementEffects = null;
    this.resourceManager = null;
    this.stateValidator = null;
    this.eventCoordinator = null;
    this.viewportQueue = null;
    this.progressiveOrchestrator = null;

    // Simple resource tracking
    this.trackedResources = new Set();
    this.eventListeners = new Map();

    console.log(`🏗️ [${this.debugName}] ExtensionLifecycleManager created`);
  }

  /**
   * Proxy to orchestrator: start progressive filtering
   */
  async startProgressiveFiltering(options = {}) {
    try {
      // If destroyed (e.g., pagehide), try to re-initialize lazily
      if (this.isDestroyed) {
        console.warn(`⚠️ [${this.debugName}] Lifecycle was destroyed, re-initializing before startProgressiveFiltering`);
        const initResult = await this.initialize();
        if (!initResult.success) {
          throw new Error(initResult.error || 'Re-initialization failed');
        }
      }

      if (!this.progressiveOrchestrator) {
        throw new Error('ProgressiveFilteringOrchestrator not available');
      }

      return await this.progressiveOrchestrator.startProgressiveFiltering(options);
    } catch (error) {
      console.error(`❌ [${this.debugName}] startProgressiveFiltering error:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🚀 SIMPLIFIED INITIALIZATION: Works with existing architecture
   */
  async initialize() {
    if (this.isInitialized || this.isDestroyed) {
      console.warn(`❌ [${this.debugName}] Cannot initialize - already ${this.isInitialized ? 'initialized' : 'destroyed'}`);
      return { success: false, reason: 'Invalid state' };
    }

    this.initializationStartTime = Date.now();
    console.log(`🚀 [${this.debugName}] Starting simplified extension initialization...`);

    try {
      // Step 1: Initialize existing components
      await this.initializeExistingComponents();
      this.markStepComplete('existing_components');

      // Step 2: Setup event listeners with cleanup tracking
      await this.setupEventListeners();
      this.markStepComplete('event_listeners');

      // Step 3: Initialize health monitoring
      if (this.options.enableHealthMonitoring) {
        await this.initializeHealthMonitoring();
        this.markStepComplete('health_monitoring');
      }

      const initializationTime = Date.now() - this.initializationStartTime;
      this.isInitialized = true;

      console.log(`✅ [${this.debugName}] Simplified extension initialization complete in ${initializationTime}ms`);

      // Make global reference for debugging
      if (typeof window !== 'undefined') {
        window.__topazLifecycleManager = this;
      }

      return {
        success: true,
        initializationTime,
        completedSteps: Array.from(this.completedSteps || [])
      };

    } catch (error) {
      console.error(`❌ [${this.debugName}] Initialization failed:`, error);

      // Clean up partial initialization
      await this.destroy();

      return {
        success: false,
        error: error.message,
        completedSteps: Array.from(this.completedSteps || [])
      };
    }
  }

  /**
   * Initialize existing components
   */
  async initializeExistingComponents() {
    console.log(`🔧 [${this.debugName}] Initializing existing components...`);

    try {
      // Get existing components from global scope
      if (typeof window !== 'undefined') {
        // EventBus
        if (window.EventBus) {
          this.eventBus = new window.EventBus();
          console.log(`✅ [${this.debugName}] EventBus initialized`);
        }

        // GridManager
        if (window.GridManager) {
          this.gridManager = new window.GridManager();
          console.log(`✅ [${this.debugName}] GridManager initialized`);
        }

        // ConfigManager
        if (window.ConfigManager && this.eventBus) {
          this.configManager = new window.ConfigManager(this.eventBus);
          console.log(`✅ [${this.debugName}] ConfigManager initialized`);
        }

        // DOMObserver
        if (window.DOMObserver && this.eventBus) {
          this.domObserver = new window.DOMObserver(this.eventBus);
          console.log(`✅ [${this.debugName}] DOMObserver initialized`);
        }

        // MessageHandler
        if (window.MessageHandler && this.eventBus) {
          this.messageHandler = new window.MessageHandler(this.eventBus);
          console.log(`✅ [${this.debugName}] MessageHandler initialized`);
        }

        // NotificationManager
        if (window.NotificationManager) {
          this.notificationManager = new window.NotificationManager();
          console.log(`✅ [${this.debugName}] NotificationManager initialized`);
        }

        // ElementEffects
        if (window.ElementEffects) {
          this.elementEffects = new window.ElementEffects();
          console.log(`✅ [${this.debugName}] ElementEffects initialized`);
        }

        // ResourceManager (for leak-free tracking)
        if (window.ResourceManager) {
          this.resourceManager = new window.ResourceManager(`${this.debugName}-Resources`);
          console.log(`✅ [${this.debugName}] ResourceManager initialized`);
        }

        // StateValidator
        if (window.StateValidator) {
          this.stateValidator = new window.StateValidator(`${this.debugName}-State`);
          console.log(`✅ [${this.debugName}] StateValidator initialized`);
        }

        // UnifiedEventCoordinator
        if (window.UnifiedEventCoordinator) {
          this.eventCoordinator = new window.UnifiedEventCoordinator(this.resourceManager, `${this.debugName}-Events`);
          console.log(`✅ [${this.debugName}] UnifiedEventCoordinator initialized`);
        }

        // ViewportPriorityQueue
        if (window.ViewportPriorityQueue) {
          this.viewportQueue = new window.ViewportPriorityQueue(this.resourceManager, `${this.debugName}-ViewportQueue`);
          console.log(`✅ [${this.debugName}] ViewportPriorityQueue initialized`);
        }

        // ProgressiveFilteringOrchestrator
        if (window.ProgressiveFilteringOrchestrator && this.resourceManager && this.stateValidator && this.eventCoordinator && this.viewportQueue) {
          this.progressiveOrchestrator = new window.ProgressiveFilteringOrchestrator(
            this.resourceManager,
            this.stateValidator,
            this.eventCoordinator,
            this.viewportQueue,
            `${this.debugName}-FilterOrchestrator`
          );
          console.log(`✅ [${this.debugName}] ProgressiveFilteringOrchestrator initialized`);
        }
      }

      console.log(`✅ [${this.debugName}] Existing components initialized`);

    } catch (error) {
      console.warn(`⚠️ [${this.debugName}] Component initialization had errors (continuing):`, error);
      // Don't fail initialization due to component issues
    }
  }

  /**
   * Setup event listeners with proper cleanup tracking
   */
  async setupEventListeners() {
    console.log(`📡 [${this.debugName}] Setting up event listeners with cleanup tracking...`);

    // Track page unload cleanup
    const beforeUnloadHandler = () => {
      console.log(`🧹 [${this.debugName}] Page unload - performing cleanup`);
      this.destroy().catch(error => {
        console.error(`❌ [${this.debugName}] Cleanup error:`, error);
      });
    };

    const pageHideHandler = () => {
      console.log(`🧹 [${this.debugName}] Page hidden - performing cleanup`);
      this.destroy().catch(error => {
        console.error(`❌ [${this.debugName}] Cleanup error:`, error);
      });
    };

    // Add event listeners and track them
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', beforeUnloadHandler);
      window.addEventListener('pagehide', pageHideHandler);
      
      // Track for cleanup
      this.trackEvent(window, 'beforeunload', beforeUnloadHandler);
      this.trackEvent(window, 'pagehide', pageHideHandler);
    }

    console.log(`✅ [${this.debugName}] Event listeners configured with cleanup tracking`);
  }

  /**
   * Track event listener for cleanup
   */
  trackEvent(element, event, handler) {
    const key = `${element.constructor.name}-${event}`;
    this.eventListeners.set(key, { element, event, handler });
  }

  /**
   * Initialize simple health monitoring
   */
  async initializeHealthMonitoring() {
    console.log(`🏥 [${this.debugName}] Initializing simple health monitoring...`);

    // Simple health check every 30 seconds
    const healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);

    // Track interval for cleanup
    this.trackedResources.add(healthCheckInterval);

    console.log(`✅ [${this.debugName}] Health monitoring initialized`);
  }

  /**
   * Perform simple health check
   */
  performHealthCheck() {
    if (this.isDestroyed) return;

    try {
      // Check if components are still functional
      const components = [
        this.eventBus,
        this.configManager,
        this.gridManager,
        this.domObserver,
        this.messageHandler,
        this.notificationManager,
        this.elementEffects
      ];

      const activeComponents = components.filter(c => c !== null).length;
      
      if (activeComponents < components.length) {
        console.warn(`⚠️ [${this.debugName}] Some components are missing: ${activeComponents}/${components.length}`);
      }

      console.log(`💚 [${this.debugName}] Health check passed (${activeComponents}/${components.length} components active)`);

    } catch (error) {
      console.error(`❌ [${this.debugName}] Health check error:`, error);
    }
  }

  /**
   * Mark initialization step as complete
   */
  markStepComplete(step) {
    if (!this.completedSteps) {
      this.completedSteps = new Set();
    }
    this.completedSteps.add(step);
    console.log(`✅ [${this.debugName}] Completed step: ${step}`);
  }

  /**
   * Get comprehensive status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isDestroyed: this.isDestroyed,
      completedSteps: Array.from(this.completedSteps || []),
      initializationTime: this.initializationStartTime ? Date.now() - this.initializationStartTime : 0,
      components: {
        eventBus: !!this.eventBus,
        configManager: !!this.configManager,
        gridManager: !!this.gridManager,
        domObserver: !!this.domObserver,
        messageHandler: !!this.messageHandler,
        notificationManager: !!this.notificationManager,
        elementEffects: !!this.elementEffects
      },
      trackedResources: this.trackedResources.size,
      eventListeners: this.eventListeners.size
    };
  }

  /**
   * 🧹 CRITICAL: Destroy all resources (prevents memory leaks)
   */
  async destroy() {
    if (this.isDestroyed) {
      console.warn(`❌ [${this.debugName}] Already destroyed`);
      return;
    }

    console.log(`🧹 [${this.debugName}] Starting destruction process...`);
    const destroyStartTime = Date.now();

    try {
      // Clear all tracked intervals/timeouts
      for (const resource of this.trackedResources) {
        try {
          clearInterval(resource);
          clearTimeout(resource);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      this.trackedResources.clear();

      // Remove all tracked event listeners
      for (const [key, { element, event, handler }] of this.eventListeners) {
        try {
          element.removeEventListener(event, handler);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      this.eventListeners.clear();

      // Clear component references
      this.eventBus = null;
      this.configManager = null;
      this.gridManager = null;
      this.domObserver = null;
      this.messageHandler = null;
      this.notificationManager = null;
      this.elementEffects = null;
      // Dispose orchestrator-related resources
      try {
        if (this.resourceManager && typeof this.resourceManager.destroy === 'function') {
          this.resourceManager.destroy();
        }
      } catch (error) {
        console.debug('Failed to dispose resource manager:', error.message);
      }
      this.progressiveOrchestrator = null;
      this.viewportQueue = null;
      this.eventCoordinator = null;
      this.stateValidator = null;
      this.resourceManager = null;

      this.isDestroyed = true;

      const destroyTime = Date.now() - destroyStartTime;
      console.log(`✅ [${this.debugName}] Destruction complete in ${destroyTime}ms`);

    } catch (error) {
      console.error(`❌ [${this.debugName}] Destruction error:`, error);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExtensionLifecycleManager;
} else if (typeof window !== 'undefined') {
  window.ExtensionLifecycleManager = ExtensionLifecycleManager;
}
