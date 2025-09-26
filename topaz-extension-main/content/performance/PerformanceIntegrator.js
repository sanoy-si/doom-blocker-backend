/**
 * 🚀 PERFORMANCE INTEGRATION SYSTEM
 * Seamlessly integrates all ultra-fast optimization systems with existing architecture
 * Coordinates UltraFastGridScanner, SmartCache, AsyncPipeline, CSS Optimizer, and MicroOpt
 */
class PerformanceIntegrator {
  constructor() {
    this.debugName = 'PerfIntegrator';
    this.isInitialized = false;

    // 🚀 PERFORMANCE SYSTEMS
    this.systems = {
      ultraFastScanner: null,
      smartCache: null,
      asyncPipeline: null,
      cssOptimizer: null,
      microOpt: null,
      monitor: null
    };

    // 🚀 INTEGRATION STATE
    this.integration = {
      isEnabled: true,
      fallbackToOld: false,
      performanceMode: 'ultra', // 'ultra', 'fast', 'balanced', 'compatibility'
      emergencyFallback: false
    };

    // 🚀 LEGACY SYSTEM REFERENCES
    this.legacySystems = {
      gridDetector: null,
      extensionController: null,
      progressiveFilter: null
    };

    console.log(`🔧 [${this.debugName}] Performance integration system initializing...`);
  }

  /**
   * 🚀 MAIN INITIALIZATION
   * Initialize all performance systems and integrate with existing architecture
   */
  async initialize() {
    if (this.isInitialized) {
      console.log(`⚠️ [${this.debugName}] Already initialized`);
      return;
    }

    try {
      console.log(`🚀 [${this.debugName}] Starting ultra-fast performance integration...`);

      // 🚀 PHASE 1: Initialize core performance systems
      await this.initializePerformanceSystems();

      // 🚀 PHASE 2: Integrate with existing architecture
      await this.integrateWithExistingSystem();

      // 🚀 PHASE 3: Setup coordination between systems
      await this.setupSystemCoordination();

      // 🚀 PHASE 4: Initialize monitoring and fallbacks
      await this.setupMonitoringAndFallbacks();

      this.isInitialized = true;
      console.log(`✅ [${this.debugName}] Ultra-fast performance integration complete!`);

      return true;

    } catch (error) {
      console.error(`❌ [${this.debugName}] Integration failed:`, error);
      await this.enableEmergencyFallback(error);
      return false;
    }
  }

  /**
   * 🚀 PHASE 1: Initialize all performance systems
   */
  async initializePerformanceSystems() {
    console.log(`⚡ [${this.debugName}] Initializing performance systems...`);

    try {
      // 🚀 MICRO-OPTIMIZATION FRAMEWORK (initialize first - provides helpers to others)
      if (window.MicroOptimizationFramework) {
        this.systems.microOpt = new window.MicroOptimizationFramework();
        console.log(`✓ MicroOptimizationFramework initialized`);
      }

      // 🚀 SMART CACHE SYSTEM
      if (window.SmartCacheSystem) {
        this.systems.smartCache = new window.SmartCacheSystem();
        console.log(`✓ SmartCacheSystem initialized`);
      }

      // 🚀 ASYNC PROCESSING PIPELINE
      if (window.AsyncProcessingPipeline) {
        this.systems.asyncPipeline = new window.AsyncProcessingPipeline();
        console.log(`✓ AsyncProcessingPipeline initialized`);
      }

      // 🚀 ULTRA-FAST GRID SCANNER
      if (window.UltraFastGridScanner) {
        this.systems.ultraFastScanner = new window.UltraFastGridScanner();
        console.log(`✓ UltraFastGridScanner initialized`);
      }

      // 🚀 CSS PERFORMANCE OPTIMIZER
      if (window.CSSPerformanceOptimizer) {
        this.systems.cssOptimizer = new window.CSSPerformanceOptimizer();
        console.log(`✓ CSSPerformanceOptimizer initialized`);
      }

      // 🚀 PERFORMANCE MONITOR
      if (window.PerformanceMonitor) {
        this.systems.monitor = new window.PerformanceMonitor();

        // Register all systems with the monitor
        Object.keys(this.systems).forEach(name => {
          if (this.systems[name] && name !== 'monitor') {
            this.systems.monitor.registerSystem(name, this.systems[name]);
          }
        });

        console.log(`✓ PerformanceMonitor initialized and systems registered`);
      }

    } catch (error) {
      console.error(`❌ [${this.debugName}] Failed to initialize performance systems:`, error);
      throw error;
    }
  }

  /**
   * 🚀 PHASE 2: Integrate with existing system
   */
  async integrateWithExistingSystem() {
    console.log(`🔗 [${this.debugName}] Integrating with existing architecture...`);

    try {
      // 🚀 FIND EXISTING SYSTEMS
      this.legacySystems.gridDetector = window.gridDetector || null;
      this.legacySystems.extensionController = window.extensionController || null;
      this.legacySystems.progressiveFilter = window.progressiveFilteringOrchestrator || null;

      // 🚀 REPLACE SLOW GRID DETECTION
      if (this.systems.ultraFastScanner) {
        await this.replaceGridDetection();
      }

      // 🚀 ENHANCE EXTENSION CONTROLLER
      if (this.legacySystems.extensionController) {
        await this.enhanceExtensionController();
      }

      // 🚀 BOOST PROGRESSIVE FILTERING
      if (this.legacySystems.progressiveFilter && this.systems.asyncPipeline) {
        await this.enhanceProgressiveFiltering();
      }

      console.log(`✅ [${this.debugName}] Integration with existing system complete`);

    } catch (error) {
      console.error(`❌ [${this.debugName}] Failed to integrate with existing system:`, error);
      throw error;
    }
  }

  /**
   * 🚀 REPLACE SLOW GRID DETECTION WITH ULTRA-FAST VERSION
   */
  async replaceGridDetection() {
    if (!this.systems.ultraFastScanner) return;

    // 🚀 WRAP EXISTING GRID DETECTOR
    if (this.legacySystems.gridDetector && this.legacySystems.gridDetector.findAllGridContainers) {
      const originalMethod = this.legacySystems.gridDetector.findAllGridContainers.bind(this.legacySystems.gridDetector);

      this.legacySystems.gridDetector.findAllGridContainers = async (forceRefresh = false) => {
        try {
          // 🚀 USE ULTRA-FAST SCANNER (100x faster)
          const result = await this.systems.ultraFastScanner.findAllGridContainers(forceRefresh);

          if (result && result.length > 0) {
            console.log(`⚡ [${this.debugName}] Ultra-fast grid scan returned ${result.length} grids`);
            return result;
          } else {
            // Fallback to original method if ultra-fast returns nothing
            console.log(`🔄 [${this.debugName}] Falling back to original grid detection`);
            return await originalMethod(forceRefresh);
          }

        } catch (error) {
          console.error(`❌ [${this.debugName}] Ultra-fast scan failed, using fallback:`, error);
          return await originalMethod(forceRefresh);
        }
      };

      console.log(`⚡ [${this.debugName}] Grid detection replaced with ultra-fast version`);
    }

    // 🚀 SETUP GLOBAL ULTRA-FAST GRID FUNCTION
    window.findGridsUltraFast = async (forceRefresh = false) => {
      return await this.systems.ultraFastScanner.findAllGridContainers(forceRefresh);
    };
  }

  /**
   * 🚀 ENHANCE EXTENSION CONTROLLER WITH PERFORMANCE SYSTEMS
   */
  async enhanceExtensionController() {
    const controller = this.legacySystems.extensionController;

    // 🚀 ENHANCE FILTER OPERATIONS
    if (controller.handleInstantFilter) {
      const originalInstantFilter = controller.handleInstantFilter.bind(controller);

      controller.handleInstantFilter = async (sendResponse) => {
        try {
          if (this.integration.performanceMode === 'ultra') {
            // 🚀 USE ULTRA-FAST FILTERING
            await this.executeUltraFastFiltering(sendResponse);
          } else {
            // Use original method
            await originalInstantFilter(sendResponse);
          }
        } catch (error) {
          console.error(`❌ [${this.debugName}] Ultra-fast filtering failed:`, error);
          await originalInstantFilter(sendResponse);
        }
      };
    }

    // 🚀 ENHANCE GRID PROCESSING
    if (controller.processGridElements && this.systems.cssOptimizer) {
      const originalProcessGrids = controller.processGridElements.bind(controller);

      controller.processGridElements = async (elements, options = {}) => {
        try {
          // Use CSS optimizer for batched operations
          if (this.systems.cssOptimizer && elements.length > 10) {
            return await this.systems.cssOptimizer.hideElements(elements, {
              batch: true,
              reason: options.reason || 'filter_match'
            });
          } else {
            return await originalProcessGrids(elements, options);
          }
        } catch (error) {
          console.error(`❌ [${this.debugName}] CSS optimization failed:`, error);
          return await originalProcessGrids(elements, options);
        }
      };
    }

    console.log(`🚀 [${this.debugName}] Extension controller enhanced with performance systems`);
  }

  /**
   * 🚀 ENHANCE PROGRESSIVE FILTERING WITH ASYNC PIPELINE
   */
  async enhanceProgressiveFiltering() {
    const progressiveFilter = this.legacySystems.progressiveFilter;

    if (progressiveFilter && progressiveFilter.startFiltering && this.systems.asyncPipeline) {
      const originalStartFiltering = progressiveFilter.startFiltering.bind(progressiveFilter);

      progressiveFilter.startFiltering = async (options = {}) => {
        try {
          if (this.integration.performanceMode === 'ultra') {
            // 🚀 USE ASYNC PIPELINE FOR NON-BLOCKING PROCESSING
            return await this.executeAsyncProgressiveFiltering(options);
          } else {
            return await originalStartFiltering(options);
          }
        } catch (error) {
          console.error(`❌ [${this.debugName}] Async progressive filtering failed:`, error);
          return await originalStartFiltering(options);
        }
      };
    }

    console.log(`🚀 [${this.debugName}] Progressive filtering enhanced with async pipeline`);
  }

  /**
   * 🚀 ULTRA-FAST FILTERING IMPLEMENTATION
   */
  async executeUltraFastFiltering(sendResponse) {
    console.log(`⚡ [${this.debugName}] Executing ultra-fast filtering...`);

    try {
      // 🚀 STEP 1: Ultra-fast grid discovery
      const grids = await this.systems.ultraFastScanner.findAllGridContainers();

      if (!grids || grids.length === 0) {
        sendResponse({ success: false, message: 'No grids found', grids: 0 });
        return;
      }

      // 🚀 STEP 2: Smart cached filtering
      const filterTask = async (grid) => {
        // Use micro-optimizations for element processing
        const helpers = this.systems.microOpt.getOptimizationHelpers();

        // Fast element visibility check
        if (!helpers.isElementVisible(grid)) {
          return null;
        }

        // Process grid with CSS optimizer
        const children = Array.from(grid.children);
        const elementsToHide = children.filter(child => {
          // Use cached selectors and fast string operations
          return this.shouldFilterElement(child, helpers);
        });

        if (elementsToHide.length > 0) {
          await this.systems.cssOptimizer.hideElements(elementsToHide, {
            batch: true,
            reason: 'ultra_fast_filter'
          });
        }

        return elementsToHide.length;
      };

      // 🚀 STEP 3: Async processing pipeline
      const taskId = await this.systems.asyncPipeline.addTask(
        filterTask,
        grids,
        'critical', // High priority for instant feedback
        {
          description: 'Ultra-fast grid filtering',
          onComplete: (state) => {
            const totalFiltered = grids.reduce((sum, grid, index) => sum + (state.results?.[index] || 0), 0);
            sendResponse({
              success: true,
              message: `Ultra-fast filtering complete`,
              grids: grids.length,
              filtered: totalFiltered,
              performance: 'ultra'
            });
          },
          onError: (error) => {
            console.error(`❌ [${this.debugName}] Ultra-fast filtering error:`, error);
            sendResponse({ success: false, message: 'Ultra-fast filtering failed', error: error.message });
          }
        }
      );

      console.log(`⚡ [${this.debugName}] Ultra-fast filtering task queued: ${taskId}`);

    } catch (error) {
      console.error(`❌ [${this.debugName}] Ultra-fast filtering failed:`, error);
      sendResponse({ success: false, message: 'Ultra-fast filtering failed', error: error.message });
    }
  }

  /**
   * 🚀 ASYNC PROGRESSIVE FILTERING
   */
  async executeAsyncProgressiveFiltering(options) {
    console.log(`🚀 [${this.debugName}] Executing async progressive filtering...`);

    try {
      // Use smart cache to get grids
      const scanFunction = () => this.systems.ultraFastScanner.findAllGridContainers();
      const grids = await this.systems.smartCache.getGrids(scanFunction, options.forceRefresh);

      // Priority-based processing
      const viewportGrids = grids.filter(grid => this.systems.microOpt.getOptimizationHelpers().isElementVisible(grid));
      const backgroundGrids = grids.filter(grid => !this.systems.microOpt.getOptimizationHelpers().isElementVisible(grid));

      // 🚀 CRITICAL PRIORITY: Process viewport grids immediately
      if (viewportGrids.length > 0) {
        await this.systems.asyncPipeline.addTask(
          (grid) => this.processGridForFiltering(grid),
          viewportGrids,
          'critical',
          { description: 'Viewport progressive filtering' }
        );
      }

      // 🚀 NORMAL PRIORITY: Process background grids
      if (backgroundGrids.length > 0) {
        await this.systems.asyncPipeline.addTask(
          (grid) => this.processGridForFiltering(grid),
          backgroundGrids,
          'normal',
          { description: 'Background progressive filtering' }
        );
      }

      return {
        success: true,
        viewportGrids: viewportGrids.length,
        backgroundGrids: backgroundGrids.length,
        totalGrids: grids.length
      };

    } catch (error) {
      console.error(`❌ [${this.debugName}] Async progressive filtering failed:`, error);
      throw error;
    }
  }

  /**
   * 🚀 OPTIMIZED ELEMENT FILTERING CHECK
   */
  shouldFilterElement(element, helpers) {
    // Get filter words (implement based on your filter logic)
    const filterWords = this.getFilterWords();
    if (!filterWords || filterWords.length === 0) return false;

    // Use micro-optimizations for string operations
    const text = element.textContent || element.innerText || '';
    const lowerText = text.toLowerCase();

    // Use unrolled array processing for better performance
    let shouldFilter = false;

    helpers.unrolledArrayProcess(filterWords, (word) => {
      if (lowerText.includes(word.toLowerCase())) {
        shouldFilter = true;
      }
    });

    return shouldFilter;
  }

  /**
   * 🚀 PROCESS GRID FOR FILTERING
   */
  async processGridForFiltering(grid) {
    const helpers = this.systems.microOpt.getOptimizationHelpers();

    const children = Array.from(grid.children);
    const elementsToHide = children.filter(child => this.shouldFilterElement(child, helpers));

    if (elementsToHide.length > 0) {
      await this.systems.cssOptimizer.hideElements(elementsToHide, {
        batch: true,
        reason: 'progressive_filter'
      });
    }

    return elementsToHide.length;
  }

  /**
   * 🚀 PHASE 3: Setup system coordination
   */
  async setupSystemCoordination() {
    console.log(`🤝 [${this.debugName}] Setting up system coordination...`);

    // 🚀 CACHE COORDINATION
    if (this.systems.smartCache && this.systems.ultraFastScanner) {
      // Ultra-fast scanner should use smart cache
      const originalFindGrids = this.systems.ultraFastScanner.findAllGridContainers.bind(this.systems.ultraFastScanner);

      this.systems.ultraFastScanner.findAllGridContainers = async (forceRefresh = false) => {
        return await this.systems.smartCache.getGrids(
          () => originalFindGrids(forceRefresh),
          forceRefresh,
          'ultra_fast_grids'
        );
      };
    }

    // 🚀 PIPELINE COORDINATION
    if (this.systems.asyncPipeline && this.systems.cssOptimizer) {
      // CSS optimizer should use async pipeline for large operations
      const originalHideElements = this.systems.cssOptimizer.hideElements.bind(this.systems.cssOptimizer);

      this.systems.cssOptimizer.hideElements = async (elements, options = {}) => {
        if (elements.length > 50) {
          // Use async pipeline for large operations
          return await this.systems.asyncPipeline.addTask(
            (batch) => originalHideElements(batch, options),
            this.chunkArray(elements, 25), // Process in chunks of 25
            'normal',
            { description: `Hide ${elements.length} elements (batched)` }
          );
        } else {
          return await originalHideElements(elements, options);
        }
      };
    }

    console.log(`✅ [${this.debugName}] System coordination setup complete`);
  }

  /**
   * 🚀 PHASE 4: Setup monitoring and fallbacks
   */
  async setupMonitoringAndFallbacks() {
    console.log(`📊 [${this.debugName}] Setting up monitoring and fallbacks...`);

    // 🚀 PERFORMANCE MONITORING
    if (this.systems.monitor) {
      this.systems.monitor.setupKeyboardShortcuts();

      // Start the dashboard in the background (user can show with Ctrl+Shift+P)
      // this.systems.monitor.showDashboard();
    }

    // 🚀 EMERGENCY FALLBACK DETECTION
    this.setupEmergencyFallback();

    // 🚀 AUTOMATIC PERFORMANCE TUNING
    setInterval(() => {
      this.autoTunePerformance();
    }, 30000); // Check every 30 seconds

    console.log(`✅ [${this.debugName}] Monitoring and fallbacks setup complete`);
  }

  /**
   * 🚀 EMERGENCY FALLBACK SYSTEM
   */
  setupEmergencyFallback() {
    let errorCount = 0;
    const maxErrors = 5;

    window.addEventListener('error', (event) => {
      if (event.message && event.message.includes('Topaz') ||
          event.filename && event.filename.includes('performance/')) {
        errorCount++;

        if (errorCount >= maxErrors) {
          console.error(`🚨 [${this.debugName}] Too many performance errors - enabling emergency fallback`);
          this.enableEmergencyFallback();
        }
      }
    });
  }

  async enableEmergencyFallback(error = null) {
    console.warn(`🚨 [${this.debugName}] Enabling emergency fallback mode`);

    if (error) {
      console.warn(`🚨 [${this.debugName}] Fallback reason:`, error.message);
    }

    try {
      this.integration.emergencyFallback = true;
      this.integration.performanceMode = 'compatibility';

      // 🛡️ GRACEFUL SYSTEM SHUTDOWN: Disable problematic systems safely
      const systemShutdownPromises = Object.entries(this.systems).map(async ([name, system]) => {
        if (system) {
          try {
            if (system.destroy) {
              await system.destroy();
            }
            console.log(`✅ [${this.debugName}] Safely shut down ${name}`);
            return { name, success: true };
          } catch (shutdownError) {
            console.warn(`⚠️ [${this.debugName}] Error shutting down ${name}:`, shutdownError.message);
            return { name, success: false, error: shutdownError.message };
          }
        }
        return { name, success: true, reason: 'not_initialized' };
      });

      const shutdownResults = await Promise.allSettled(systemShutdownPromises);
      const successfulShutdowns = shutdownResults.filter(result =>
        result.status === 'fulfilled' && result.value.success
      ).length;

      console.log(`📊 [${this.debugName}] Shutdown completed: ${successfulShutdowns}/${shutdownResults.length} systems`);

      // Clear systems
      Object.keys(this.systems).forEach(key => {
        this.systems[key] = null;
      });

      // 🛡️ SETUP MINIMAL FALLBACK SYSTEMS
      this.setupMinimalFallbackSystems();

      console.warn(`⚠️ [${this.debugName}] Emergency fallback enabled - using legacy systems only`);
      return true;

    } catch (fallbackError) {
      console.error(`❌ [${this.debugName}] Critical: Emergency fallback setup failed:`, fallbackError);
      return false;
    }
  }

  /**
   * 🛡️ SETUP MINIMAL FALLBACK SYSTEMS: Essential functionality for emergency mode
   */
  setupMinimalFallbackSystems() {
    console.log(`🛡️ [${this.debugName}] Setting up minimal fallback systems...`);

    try {
      // 🔧 MINIMAL PERFORMANCE MONITOR
      this.systems.monitor = {
        log: (message) => console.log(`📊 [Fallback] ${message}`),
        warn: (message) => console.warn(`⚠️ [Fallback] ${message}`),
        error: (message) => console.error(`❌ [Fallback] ${message}`),
        getPerformanceReport: () => ({
          status: 'emergency_fallback',
          systems: 'minimal',
          memory: this.getBasicMemoryInfo()
        })
      };

      // 🔧 BASIC MEMORY INFO
      this.getBasicMemoryInfo = () => {
        try {
          if (performance.memory) {
            return {
              used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
              total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
            };
          }
          return { used: 'unknown', total: 'unknown' };
        } catch (error) {
          return { used: 'error', total: 'error' };
        }
      };

      // 🔧 GLOBAL FALLBACK HELPERS
      if (!window.topazFallback) {
        window.topazFallback = {
          hideElement: (element) => {
            try {
              if (element && element.style) {
                element.style.display = 'none';
                return true;
              }
              return false;
            } catch (error) {
              console.warn(`⚠️ [Fallback] Hide error:`, error);
              return false;
            }
          },
          showElement: (element) => {
            try {
              if (element && element.style) {
                element.style.display = '';
                return true;
              }
              return false;
            } catch (error) {
              console.warn(`⚠️ [Fallback] Show error:`, error);
              return false;
            }
          },
          isElementVisible: (element) => {
            try {
              if (!element) return false;
              const rect = element.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            } catch (error) {
              return false;
            }
          }
        };
      }

      console.log(`✅ [${this.debugName}] Minimal fallback systems ready`);

    } catch (error) {
      console.error(`❌ [${this.debugName}] Failed to setup minimal fallback:`, error);
    }
  }

  /**
   * 🚀 AUTOMATIC PERFORMANCE TUNING
   */
  autoTunePerformance() {
    if (this.integration.emergencyFallback) return;

    try {
      // Get current performance stats
      const stats = this.systems.monitor ? this.systems.monitor.getPerformanceReport() : null;

      if (stats) {
        // 🚀 AUTO-TUNE BASED ON PERFORMANCE
        if (stats.currentMetrics.currentFPS < 45) {
          // Low FPS - reduce performance mode
          if (this.integration.performanceMode === 'ultra') {
            this.integration.performanceMode = 'fast';
            console.log(`📉 [${this.debugName}] Reduced performance mode to 'fast' due to low FPS`);
          }
        } else if (stats.currentMetrics.currentFPS > 55 && stats.currentMetrics.memoryUsage < 80) {
          // Good performance - can use ultra mode
          if (this.integration.performanceMode === 'fast') {
            this.integration.performanceMode = 'ultra';
            console.log(`📈 [${this.debugName}] Increased performance mode to 'ultra' - good performance`);
          }
        }

        // 🚀 CACHE SIZE MANAGEMENT
        if (stats.currentMetrics.memoryUsage > 150) {
          // High memory - clear caches
          this.systems.smartCache?.clearCache('cold');
          this.systems.microOpt?.clearOptimizationCaches();
          console.log(`🧹 [${this.debugName}] Cleared caches due to high memory usage`);
        }
      }

    } catch (error) {
      console.error(`❌ [${this.debugName}] Auto-tuning failed:`, error);
    }
  }

  /**
   * 🚀 HELPER METHODS
   */
  getFilterWords() {
    // 🚀 CRITICAL FIX: Get actual filter words from extension controller
    try {
      if (this.legacySystems.extensionController && this.legacySystems.extensionController.getCurrentFilterCriteria) {
        const criteria = this.legacySystems.extensionController.getCurrentFilterCriteria();
        console.log(`🎯 [Performance Integrator] Got ${criteria.allFilterWords.length} filter words:`, criteria.allFilterWords);
        return criteria.allFilterWords || [];
      }

      // Fallback: try to get from window object
      return window.topazFilterWords || [];
    } catch (error) {
      console.error(`❌ [Performance Integrator] Failed to get filter words:`, error);
      return [];
    }
  }

  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 🚀 PUBLIC API
   */
  getIntegrationStatus() {
    return {
      isInitialized: this.isInitialized,
      performanceMode: this.integration.performanceMode,
      emergencyFallback: this.integration.emergencyFallback,
      systemsActive: Object.keys(this.systems).filter(key => this.systems[key] !== null).length,
      totalSystems: Object.keys(this.systems).length
    };
  }

  async switchPerformanceMode(mode) {
    if (['ultra', 'fast', 'balanced', 'compatibility'].includes(mode)) {
      this.integration.performanceMode = mode;
      console.log(`🔧 [${this.debugName}] Switched to ${mode} performance mode`);
    }
  }

  /**
   * 🚀 DESTRUCTION
   */
  destroy() {
    Object.values(this.systems).forEach(system => {
      if (system && system.destroy) {
        try {
          system.destroy();
        } catch (error) {
          console.error(`Error destroying system:`, error);
        }
      }
    });

    console.log(`🗑️ [${this.debugName}] Performance integrator destroyed`);
  }
}

// 🚀 AUTO-INITIALIZE PERFORMANCE INTEGRATION
if (typeof window !== 'undefined') {
  window.PerformanceIntegrator = PerformanceIntegrator;

  // Auto-initialize when all performance systems are loaded
  const initializeWhenReady = () => {
    const requiredSystems = [
      'UltraFastGridScanner',
      'SmartCacheSystem',
      'AsyncProcessingPipeline',
      'CSSPerformanceOptimizer',
      'MicroOptimizationFramework',
      'PerformanceMonitor'
    ];

    const availableSystems = requiredSystems.filter(system => window[system]);

    if (availableSystems.length >= 4) { // At least 4 systems available
      console.log(`🚀 [PerformanceIntegrator] ${availableSystems.length}/${requiredSystems.length} systems available - initializing...`);

      if (!window.topazPerformanceIntegrator) {
        window.topazPerformanceIntegrator = new PerformanceIntegrator();
        window.topazPerformanceIntegrator.initialize().then(success => {
          if (success) {
            console.log(`🎉 [PerformanceIntegrator] ULTRA-FAST TOPAZ EXTENSION READY! 🚀`);
          }
        });
      }
    } else {
      // Try again in 1 second
      setTimeout(initializeWhenReady, 1000);
    }
  };

  // Start initialization check
  setTimeout(initializeWhenReady, 500);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceIntegrator;
}// Make PerformanceIntegrator available globally for content script
window.PerformanceIntegrator = PerformanceIntegrator;
