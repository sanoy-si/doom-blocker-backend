
class ExtensionController {
  constructor() {
    console.log("🔍 [TOPAZ DEBUG] ExtensionController constructor starting...");

    this.isDisabled = false;
    this.analysisTimeout = null;
    this.initializationErrors = [];

    try {
      // Initialize core systems with error handling
      this.eventBus = new EventBus();
      console.log("✅ EventBus initialized");

      this.configManager = new ConfigManager(this.eventBus);
      console.log("✅ ConfigManager initialized");

      this.gridManager = new GridManager();
      console.log("✅ GridManager initialized");

      this.domObserver = new DOMObserver(this.eventBus);
      console.log("✅ DOMObserver initialized");

      this.messageHandler = new MessageHandler(this.eventBus);
      console.log("✅ MessageHandler initialized");

      this.notificationManager = new NotificationManager();
      console.log("✅ NotificationManager initialized");

      this.elementEffects = new ElementEffects();
      console.log("✅ ElementEffects initialized");

      this.contentFingerprint = new ContentFingerprint();
      console.log("✅ ContentFingerprint initialized");

      this.elementsAnalyzedInCurrentCycle = new Map(); // Track elements sent for analysis

      // Initialize bulletproof counting system with fallback
      if (typeof TruthfulCounter !== 'undefined') {
        this.truthfulCounter = new TruthfulCounter();
        console.log("✅ TruthfulCounter initialized");
      } else {
        console.warn("⚠️ TruthfulCounter not available, creating fallback");
        this.truthfulCounter = this.createFallbackCounter();
      }
    } catch (error) {
      console.error("❌ [TOPAZ DEBUG] Error during core systems initialization:", error);
      this.initializationErrors.push(error);
      // Continue with fallback initialization
      this.eventBus = this.eventBus || { on: () => {}, emit: () => {}, off: () => {} };
      this.configManager = this.configManager || { getConfig: () => ({}), updateConfig: () => {} };
      this.gridManager = this.gridManager || { findAllGridContainers: () => [], getAllGrids: () => [] };
      this.truthfulCounter = this.truthfulCounter || this.createFallbackCounter();
    }
    // Track preview state and items for toggle preview feature
    this.previewState = { enabled: false, items: [] };
    this.previewProcessing = false; // prevent overlapping preview toggles

    // 🚀 NEW ARCHITECTURE: Initialize leak-free, race-condition-free system
    this.lifecycleManager = null;
    this.architectureInitialized = false;

    // DEPRECATED: Old progressive filtering system (replaced by new architecture)
    // Kept for backward compatibility during transition
    this.progressiveFiltering = {
      isActive: false,
      lastScrollY: window.scrollY || 0,
      scrollDirection: 'none',
      processedViewports: new Set(),
      currentBatch: 0,
      batchSize: 5
    };

    // Initialize session manager for analytics
    this.sessionManager = window.DoomBlockerSessionManager;
    // Initialize logger if available
    try {
      this.logger = window.DoomBlockerLogger ? new window.DoomBlockerLogger('DoomBlocker:Content') : null;
    } catch (_) {
      this.logger = null;
    }

    // Setup event listeners first with error handling
    try {
      this.setupEventListeners();
      console.log("✅ Event listeners setup complete");
    } catch (error) {
      console.error("❌ [TOPAZ DEBUG] Error setting up event listeners:", error);
      this.initializationErrors.push(error);
    }

    try {
      this.messageHandler.setupMessageListener();
      console.log("✅ Message listener setup complete");
    } catch (error) {
      console.error("❌ [TOPAZ DEBUG] Error setting up message listener:", error);
      this.initializationErrors.push(error);
    }

    // 🚀 CRITICAL FIX: Initialize new architecture (replaces problematic old system)
    try {
      this.initializeNewArchitecture();
      console.log("✅ New architecture initialization started");
    } catch (error) {
      console.error("❌ [TOPAZ DEBUG] Error initializing new architecture:", error);
      this.initializationErrors.push(error);
    }

    // Initialize session on first load
    try {
      this.initializeUserSession();
      console.log("✅ User session initialization started");
    } catch (error) {
      console.error("❌ [TOPAZ DEBUG] Error initializing user session:", error);
      this.initializationErrors.push(error);
    }

    console.log(`🔍 [TOPAZ DEBUG] ExtensionController constructor complete. Errors: ${this.initializationErrors.length}`);

    // Add debug method to window for testing
    window.__topazDebug = {
      controller: this,
      checkStatus: () => this.getDebugStatus(),
      testGridDetection: () => this.testGridDetection(),
      getErrors: () => this.initializationErrors
    };

    // FIXED: Removed automatic preview disabling on visibility changes
    // This was causing the preview state to reset when opening the extension popup
    // Now preview state will persist until manually toggled by the user
    try {
      // Only disable preview when navigating away from the page (not when tab becomes hidden)
      window.addEventListener('pagehide', () => {
        if (this.previewState?.enabled) {
          this.handleTogglePreviewHidden(false, null).catch(() => {});
        }
        // Clean up new architecture on page hide
        if (this.lifecycleManager && !this.lifecycleManager.isDestroyed) {
          this.lifecycleManager.destroy().catch(() => {});
        }
      });
    } catch (_) {}
  }

  // 🚀 CRITICAL FIX: Initialize new leak-free, race-condition-free architecture
  async initializeNewArchitecture() {
    try {
      console.log('🚀 [ExtensionController] Initializing new architecture...');

      // Initialize lifecycle manager with proper cleanup and fallback
      if (typeof ExtensionLifecycleManager !== 'undefined') {
        this.lifecycleManager = new ExtensionLifecycleManager({
          debugName: 'ExtensionController-Lifecycle',
          enableHealthMonitoring: true,
          enablePerformanceTracking: true
        });
      } else {
        console.warn("⚠️ ExtensionLifecycleManager not available, creating fallback");
        this.lifecycleManager = this.createFallbackLifecycleManager();
      }

      const result = await this.lifecycleManager.initialize();

      if (result.success) {
        this.architectureInitialized = true;
        console.log(`✅ [ExtensionController] New architecture initialized in ${result.initializationTime}ms`);

        // Make global reference for debugging and external access
        window.__topazController = this;
        window.__topazLifecycle = this.lifecycleManager;

        // Configure legacy component integration
        this.configureLegacyIntegration();

      } else {
        console.error('❌ [ExtensionController] New architecture initialization failed:', result.error);
        console.warn('⚠️ [ExtensionController] Falling back to old system (with known memory leaks)');
        this.setupScrollTracking(); // Fallback to old system
      }

    } catch (error) {
      console.error('❌ [ExtensionController] Critical error during new architecture initialization:', error);
      console.warn('⚠️ [ExtensionController] Falling back to old system (with known memory leaks)');
      this.architectureInitialized = false;
      this.setupScrollTracking(); // Fallback to old system
    }
  }

  // Configure legacy component integration with new architecture
  configureLegacyIntegration() {
    try {
      // Provide legacy components to lifecycle manager
      if (this.lifecycleManager && this.lifecycleManager.progressiveOrchestrator) {
        this.lifecycleManager.progressiveOrchestrator.setComponents(
          this.gridManager,
          this.createLegacyFilterProcessor()
        );
        console.log('🔧 [ExtensionController] Legacy components integrated with new architecture');
      }
    } catch (error) {
      console.error('❌ [ExtensionController] Legacy integration error:', error);
    }
  }

  // Create filter processor that integrates with existing filtering logic
  createLegacyFilterProcessor() {
    return async (item, filterCriteria) => {
      try {
        // Integration point with existing element effects and filtering
        if (item.element && this.elementEffects) {
          // Use existing element effects for actual filtering/hiding
          const result = await this.processElementForFiltering(item.element, filterCriteria);
          return result;
        }
        return { processed: true, method: 'legacy_integration' };
      } catch (error) {
        console.error('❌ [ExtensionController] Legacy filter processor error:', error);
        return { processed: false, error: error.message };
      }
    };
  }

  // Process element using existing filtering logic
  async processElementForFiltering(element, filterCriteria) {
    // This integrates with the existing filtering system
    // Can be enhanced based on specific filtering requirements
    return { processed: true, method: 'element_effects_integration' };
  }

  // Get truthful counts for popup
  handleGetTruthfulCounts(sendResponse) {
    try {
      const counts = this.truthfulCounter.getCounts();
      sendResponse(this.messageHandler.createResponse(true, "Truthful counts retrieved", counts));
    } catch (error) {
      sendResponse(this.messageHandler.createResponse(false, "Failed to get truthful counts", { error: error.message }));
    }
  }

  // Return current preview state to popup
  handleGetPreviewState(sendResponse) {
    try {
      const enabled = !this.isDisabled && !!(this.previewState && this.previewState.enabled);
      let hiddenCount = 0;
      try {
        hiddenCount = (this.elementEffects.getHiddenElements() || []).length;
      } catch (_) {}
      if (sendResponse) {
        sendResponse(this.messageHandler.createResponse(true, 'Preview state', { enabled, hiddenCount }));
      }
    } catch (e) {
      if (sendResponse) {
        sendResponse(this.messageHandler.createResponse(false, e.message));
      }
    }
  }

  // Reduce payload size to speed up API and align with backend cleaning rules
  trimGridForBackend(structure) {
    try {
      const MAX_CHILDREN = 10;
      const MAX_CHILD_TEXT = 50;
      const MAX_GRID_TEXT = 500;

      if (!structure || !Array.isArray(structure.grids)) return structure;

      const trimmed = {
        timestamp: structure.timestamp,
        totalGrids: 0,
        grids: []
      };

      for (const grid of structure.grids) {
        const children = Array.isArray(grid.children) ? grid.children.slice(0, MAX_CHILDREN) : [];
        const trimmedChildren = children.map((child) => ({
          id: child.id,
          text: (child.text || '').slice(0, MAX_CHILD_TEXT)
        }));

        let gridText = grid.gridText || '';
        if (gridText.length > MAX_GRID_TEXT) {
          gridText = gridText.slice(0, MAX_GRID_TEXT);
        }

        trimmed.grids.push({
          id: grid.id,
          totalChildren: trimmedChildren.length,
          gridText,
          children: trimmedChildren
        });
      }

      trimmed.totalGrids = trimmed.grids.length;
      return trimmed;
    } catch (e) {
      // Fallback to original structure on any error
      return structure;
    }
  }

  setupEventListeners() {
    this.eventBus.on(EVENTS.DOM_MUTATED, async (data) => {
      await this.handleDOMMutation(data);
    });

    this.eventBus.on("message:disable", ({ revive, sendResponse }) => {
      this.handleDisable(revive, sendResponse);
    });

    this.eventBus.on("message:enable", ({ config, sendResponse }) => {
      this.handleEnable(config, sendResponse);
    });
    this.eventBus.on(
      "message:hide-grid-children",
      ({ gridInstructions, sendResponse }) => {
        this.handleHideGridChildren(gridInstructions, sendResponse);
      },
    );
    this.eventBus.on("message:stop-observing", ({ sendResponse }) => {
      this.handleStopObserving(sendResponse);
    });
    this.eventBus.on(
      "message:unhide-element",
      ({ elementId, sendResponse }) => {
        this.handleUnhideElement(elementId, sendResponse);
      },
    );

    this.eventBus.on(
      "message:restore-all-elements",
      ({ sendResponse }) => {
        this.handleRestoreAllElements(sendResponse);
      },
    );

    this.eventBus.on("message:get-hidden-elements", ({ sendResponse }) => {
      this.handleGetHiddenElements(sendResponse);
    });

    this.eventBus.on("message:url-changed", ({ url }) => {
      this.handleUrlChanged(url);
    });

    // Preview toggle from popup
    this.eventBus.on('message:toggle-preview-hidden', ({ enable, sendResponse }) => {
      this.handleTogglePreviewHidden(!!enable, sendResponse);
    });
    // Preview state query from popup
    this.eventBus.on('message:get-preview-state', ({ sendResponse }) => {
      this.handleGetPreviewState(sendResponse);
    });

    // Session manager request for Supabase sync
    this.eventBus.on('message:get-session-manager', ({ sendResponse }) => {
      this.handleGetSessionManager(sendResponse);
    });

    // Truthful counts request
    this.eventBus.on('message:get-truthful-counts', ({ sendResponse }) => {
      this.handleGetTruthfulCounts(sendResponse);
    });

    // 🚀 INSTANT FILTERING: Handle instant filter requests from popup
    this.eventBus.on("message:instant-filter", ({ sendResponse }) => {
      this.handleInstantFilter(sendResponse);
    });

    this.eventBus.on("message:error", ({ errorMessage, errorType, sendResponse }) => {
      this.handleError(errorMessage, errorType, sendResponse);
    });

    this.eventBus.on(EVENTS.CONFIG_UPDATED, (config) => {
      this.handleConfigUpdate(config);
    });

    // YouTube feature blocking
    this.eventBus.on('youtube:block-shorts', ({ enabled, sendResponse }) => {
      this.handleYouTubeBlockShorts(enabled, sendResponse);
    });
    this.eventBus.on('youtube:block-home-feed', ({ enabled, sendResponse }) => {
      this.handleYouTubeBlockHomeFeed(enabled, sendResponse);
    });
    this.eventBus.on('youtube:block-comments', ({ enabled, sendResponse }) => {
      this.handleYouTubeBlockComments(enabled, sendResponse);
    });
    this.eventBus.on('youtube:get-settings', ({ sendResponse }) => {
      this.handleYouTubeGetSettings(sendResponse);
    });
    
    // Enhanced DOM mutation handling for YouTube Shorts
    this.eventBus.on(EVENTS.DOM_MUTATED, this.handleDOMChangesForShorts.bind(this));
  }

  handleConfigUpdate(config) {
    if (!config) {
      return;
    }
    if (config.tagsToIgnore) {
      this.gridManager.setTagsToIgnore(config.tagsToIgnore);
      this.domObserver.setTagsToIgnore(config.tagsToIgnore);
    }
    if (config.showBlockCounter !== undefined) {
      this.notificationManager.setEnabled(config.showBlockCounter);
    }
  }

  /**
   * Check if toast notifications are enabled by querying background
   */
  async isToastEnabled() {
    try {
      const response = await this.messageHandler.sendMessageToBackground({
        type: MESSAGE_TYPES.GET_TOAST_ENABLED
      });

      if (response.success) {
        return response.showBlockCounter;
      } else {
        console.warn('Failed to get toast enabled state, defaulting to true:', response.error);
        return true; // Default to enabled if we can't get the setting
      }
    } catch (error) {
      console.error('Error checking toast enabled state:', error);
      return true; // Default to enabled if there's an error
    }
  }
  async enable() {
    try {
      const result = await chrome.storage.local.get(['extensionEnabled']);
      const isExtensionEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;

      if (!isExtensionEnabled) {
        this.isDisabled = true;
        return;
      }
    } catch (error) {
    }
    console.time("[blur timing debug] enable duration");
    this.isDisabled = false;
    
    await this.configManager.setConfigFromUrl(window.location.href);
    
    const shouldSkip = this.configManager.shouldSkipExtraction();
    
    if (!shouldSkip) {
      await this.performInitialExtraction();
    } else {
    }
    
    // Apply stored YouTube settings on enable
    await this.applyStoredYouTubeSettings();
    
    // Set up observer for dynamic YouTube content
    this.setupYouTubeContentObserver();
    
    // Set up URL change monitoring for immediate body attribute updates
    this.setupYouTubeURLMonitoring();
    
    this.eventBus.emit(EVENTS.EXTENSION_ENABLED);
  }

  async disable(revive = true) {
    this.isDisabled = true;
    this.domObserver.stopObserving();
    this.clearAnalysisTimeout();

    // 🚀 PROGRESSIVE FILTERING: Stop any active progressive filtering
    this.stopProgressiveFiltering();

    // Ensure preview-related visuals/state are cleared
    try {
      if (this.elementEffects.clearAllPreviewArtifacts) {
        this.elementEffects.clearAllPreviewArtifacts();
      } else {
        this.elementEffects.removeAllPreviewGlow && this.elementEffects.removeAllPreviewGlow();
        const marked = this.elementEffects.getPreviewMarkedElements ? this.elementEffects.getPreviewMarkedElements() : [];
        this.elementEffects.removePreviewMarker && this.elementEffects.removePreviewMarker(marked);
      }
    } catch (_) {}
    this.previewState = { enabled: false, items: [] };
    this.elementEffects.setSuppressHiding(false);
    if (revive) {
      await this.elementEffects.restoreAllElements();
    }
    this.gridManager.reset();
    this.contentFingerprint.clear();
    this.notificationManager.hide();
    this.eventBus.emit(EVENTS.EXTENSION_DISABLED);
  }

  async performInitialExtraction(forceComprehensive = false) {
    console.log("🔍 [TOPAZ DEBUG] performInitialExtraction() started" + (forceComprehensive ? " (comprehensive mode)" : ""));

    // Clear tracking of analyzed elements for new cycle
    this.elementsAnalyzedInCurrentCycle.clear();

    const analysisRequired = await this.checkAnalysisRequired();
    console.log("🔍 [TOPAZ DEBUG] checkAnalysisRequired result:", analysisRequired);
    if (!analysisRequired && !forceComprehensive) {
      console.log("🔍 [TOPAZ DEBUG] Analysis not required, exiting performInitialExtraction");
      return;
    }
    console.log("🔍 [TOPAZ DEBUG] Analysis required, proceeding with extraction");

    console.log("🔍 [TOPAZ DEBUG] Finding all grid containers" + (forceComprehensive ? " (comprehensive scan)" : ""));
    console.time("[blur timing debug] DOM content loaded to blur completion");
    this.gridManager.findAllGridContainers(forceComprehensive);

    // REMOVED: Initial blurring of all content - now only blur elements about to be removed
    console.log("🔍 [TOPAZ DEBUG] Skipping initial blur - will blur only elements about to be removed");
    console.timeEnd("[blur timing debug] DOM content loaded to blur completion");

    const allGrids = this.gridManager.getAllGrids();
    console.log("🔍 [TOPAZ DEBUG] All grids found:", allGrids.length);
    console.log("🔍 [TOPAZ DEBUG] Grid details:", allGrids.map(g => ({ id: g.id, childrenCount: g.children?.length || 0 })));
    
    const gridStructure = {
      timestamp: new Date().toISOString(),
      totalGrids: 0,
      grids: []
    };

    for (const grid of allGrids) {
      const childrenToAnalyze = [];
      for (const child of grid.children) {
        const filterCriteria = this.getCurrentFilterCriteria();
        const autoDeleteResult = this.contentFingerprint.checkForAutoDelete(child.element, filterCriteria);
        if (autoDeleteResult.shouldDelete) {
          const hidingMethod = this.configManager.getHidingMethod();
          const hiddenCount = this.elementEffects.hideElements([{
            id: child.id,
            element: child.element
          }], hidingMethod);
          if (hiddenCount > 0) {
            // Use truthful counter for auto-delete
            const actuallyBlockedCount = this.truthfulCounter.countBlockedElements(
              [{ id: child.id, element: child.element }], 
              'autoDelete'
            );
            
            if (actuallyBlockedCount > 0) {
              const toastEnabled = await this.isToastEnabled();
              if (toastEnabled) {
                this.notificationManager.incrementBlockedCount(actuallyBlockedCount);
              }
              this.messageHandler.sendMessageToBackground({
                type: MESSAGE_TYPES.CONTENT_BLOCKED,
                blockedCount: actuallyBlockedCount,
                currentUrl: window.location.href,
              });
            }
          }
        } else {
          // Include ALL grid children regardless of fingerprint status for re-analysis
          childrenToAnalyze.push(child);
          // Track that this element was sent for analysis
          const elementState = this.elementEffects.getElementState(child.element);
          this.elementsAnalyzedInCurrentCycle.set(child.id, {
            id: child.id,
            element: child.element,
            wasHidden: elementState.hidden === true
          });
        }
      }

      if (childrenToAnalyze.length > 0) {
        gridStructure.grids.push({
          id: grid.id,
          totalChildren: childrenToAnalyze.length,
          gridText: grid.element.innerText,
          children: childrenToAnalyze.map(child => ({
            id: child.id,
            text: child.text
          }))
        });
      }
    }

    gridStructure.totalGrids = gridStructure.grids.length;
    console.log("🔍 [TOPAZ DEBUG] Final grid structure:", gridStructure.totalGrids, "grids to analyze");
    console.log("🔍 [TOPAZ DEBUG] Grid structure details:", JSON.stringify(gridStructure, null, 2));

    if (gridStructure.totalGrids > 0) {
      // Trim payload to match backend expectations for performance
      const trimmedStructure = this.trimGridForBackend(gridStructure);
      console.log("🔍 [TOPAZ DEBUG] Sending trimmed grid structure for analysis");
      this.sendGridStructureForAnalysis(trimmedStructure);

      for (const gridData of gridStructure.grids) {
        const grid = this.gridManager.getGridById(gridData.id);
        if (grid) {
          const elementsToStore = [];
          for (const childData of gridData.children) {
            const child = grid.children.find(c => c.id === childData.id);
            if (child && child.element) {
              elementsToStore.push(child.element);
            }
          }
      
          if (elementsToStore.length > 0) {
            this.contentFingerprint.storeFingerprints(elementsToStore);
          }
        }
      }
    } else {
      console.log("🔍 [TOPAZ DEBUG] No grids found to analyze");
    }

    console.log("🔍 [TOPAZ DEBUG] Starting DOM observer");
    this.domObserver.startObserving();
    console.log("🔍 [TOPAZ DEBUG] performInitialExtraction completed");
  }

  async handleUrlChanged(url) {
    this.clearAnalysisTimeout();

    // 🚀 PROGRESSIVE FILTERING: Stop and reset on URL change
    this.stopProgressiveFiltering();
    this.progressiveFiltering.processedViewports.clear();

    this.gridManager.reset();
    //this.contentFingerprint.clear();
    await this.configManager.setConfigFromUrl(url);
    // Clear any preview artifacts when URL changes
    try {
      if (this.elementEffects.clearAllPreviewArtifacts) {
        this.elementEffects.clearAllPreviewArtifacts();
      } else {
        this.elementEffects.removeAllPreviewGlow && this.elementEffects.removeAllPreviewGlow();
        const marked = this.elementEffects.getPreviewMarkedElements ? this.elementEffects.getPreviewMarkedElements() : [];
        this.elementEffects.removePreviewMarker && this.elementEffects.removePreviewMarker(marked);
      }
    } catch (_) {}
    this.previewState = { enabled: false, items: [] };
    this.elementEffects.setSuppressHiding(false);
    
    // Update homepage body attribute for CSS targeting
    if (window.location.hostname.includes('youtube.com')) {
      this.updateHomepageBodyAttribute();
    }
    
    // Reapply YouTube settings when URL changes (for navigation within YouTube)
    await this.applyStoredYouTubeSettings();
    
    // Set up observer for dynamic content on YouTube
    this.setupYouTubeContentObserver();
    
    // Set up URL monitoring for immediate homepage detection
    this.setupYouTubeURLMonitoring();
  }

  
  async handleDOMMutation(data) {
    if (this.isDisabled) {
      return;
    }
    if (this.configManager.shouldSkipExtraction()) {
      return;
    }
    
    // Check if analysis is required before doing any work
    console.time("[blur timing debug] checkAnalysisRequired duration (DOM mutation)");
    const analysisRequired = await this.checkAnalysisRequired();
    console.timeEnd("[blur timing debug] checkAnalysisRequired duration (DOM mutation)");
    if (!analysisRequired) {
      return;
    }
    
    const previousGrids = this.gridManager.getAllGrids().map((grid) => ({
      id: grid.id,
      element: grid.element,
      childrenData: new Map(
        grid.children.map((child) => [child.id, child.text]),
      ),
    }));

    // Incremental update: only update grids near added nodes
    const addedNodes = Array.isArray(data?.mutations)
      ? data.mutations.flatMap(m => (m.addedNodes || [])).filter(n => n && n.nodeType === 1)
      : [];

    console.time("[blur timing debug] incremental updateGridsNearNodes duration (DOM mutation)");
    const updatedGrids = this.gridManager.updateGridsNearNodes(addedNodes);
    console.timeEnd("[blur timing debug] incremental updateGridsNearNodes duration (DOM mutation)");

    const currentGrids = this.gridManager.getAllGrids();
    const gridStructure = [];
    for (const grid of updatedGrids) {
      const childrenToAnalyze = [];

      for (const child of grid.children) {
        const filterCriteria = this.getCurrentFilterCriteria();
        const autoDeleteResult = this.contentFingerprint.checkForAutoDelete(child.element, filterCriteria);

        if (autoDeleteResult.shouldDelete) {
          const hidingMethod = this.configManager.getHidingMethod();
          const hiddenCount = this.elementEffects.hideElements([{
            id: child.id,
            element: child.element
          }], hidingMethod);

          if (hiddenCount > 0) {
            const toastEnabled = await this.isToastEnabled();
            if (toastEnabled) {
              this.notificationManager.incrementBlockedCount(hiddenCount);
            }
            this.messageHandler.sendMessageToBackground({
              type: MESSAGE_TYPES.CONTENT_BLOCKED,
              blockedCount: hiddenCount,
              currentUrl: window.location.href,
            });
          }
        } else if (!this.contentFingerprint.checkFingerprintExists(child.element)) {
          childrenToAnalyze.push(child);
        }
      }

      if (childrenToAnalyze.length > 0) {
        // REMOVED: Blurring during DOM mutation - only blur elements about to be removed
        gridStructure.push({
          id: grid.id,
          gridText: grid.element.innerText,
          children: childrenToAnalyze.map((child) => ({
            id: child.id,
            text: child.text,
          })),
        });
      }
    }

    for (const previousGrid of previousGrids) {
      const currentGrid = currentGrids.find((g) => g.id === previousGrid.id);
      if (!currentGrid) continue;

      this.gridManager.updateGridChildren(currentGrid);

      const newChildren = currentGrid.children.filter(
        (child) => !previousGrid.childrenData.has(child.id),
      );

      const changedChildren = currentGrid.children.filter(
        (child) =>
          previousGrid.childrenData.has(child.id) &&
          previousGrid.childrenData.get(child.id) !== child.text,
      );

      const childrenToAnalyze = [];

      for (const child of newChildren) {
        const filterCriteria = this.getCurrentFilterCriteria();
        const autoDeleteResult = this.contentFingerprint.checkForAutoDelete(child.element, filterCriteria);

        if (autoDeleteResult.shouldDelete) {
          const hidingMethod = this.configManager.getHidingMethod();
          const hiddenCount = this.elementEffects.hideElements([{
            id: child.id,
            element: child.element
          }], hidingMethod);

          if (hiddenCount > 0) {
            const toastEnabled = await this.isToastEnabled();
            if (toastEnabled) {
              this.notificationManager.incrementBlockedCount(hiddenCount);
            }
            this.messageHandler.sendMessageToBackground({
              type: MESSAGE_TYPES.CONTENT_BLOCKED,
              blockedCount: hiddenCount,
              currentUrl: window.location.href,
            });
          }
        } else if (!this.contentFingerprint.checkFingerprintExists(child.element)) {
          childrenToAnalyze.push(child);
        }
      }
      for (const child of changedChildren) {
        const filterCriteria = this.getCurrentFilterCriteria();
        const autoDeleteResult = this.contentFingerprint.checkForAutoDelete(child.element, filterCriteria);

        if (autoDeleteResult.shouldDelete) {
          const hidingMethod = this.configManager.getHidingMethod();
          const hiddenCount = this.elementEffects.hideElements([{
            id: child.id,
            element: child.element
          }], hidingMethod);

          if (hiddenCount > 0) {
            const toastEnabled = await this.isToastEnabled();
            if (toastEnabled) {
              this.notificationManager.incrementBlockedCount(hiddenCount);
            }
            this.messageHandler.sendMessageToBackground({
              type: MESSAGE_TYPES.CONTENT_BLOCKED,
              blockedCount: hiddenCount,
              currentUrl: window.location.href,
            });
          }
        } else if (!this.contentFingerprint.checkFingerprintExists(child.element)) {
          childrenToAnalyze.push(child);
        }
      }
      if (childrenToAnalyze.length > 0) {
        // REMOVED: Blurring during DOM mutation - only blur elements about to be removed
        gridStructure.push({
          id: currentGrid.id,
          gridText: currentGrid.element.innerText,
          children: childrenToAnalyze.map((child) => ({
            id: child.id,
            text: child.text,
          })),
        });
      }
    }

    if (gridStructure.length > 0) {
      const analysisData = {
        timestamp: new Date().toISOString(),
        totalGrids: gridStructure.length,
        grids: gridStructure,
      };
      // Trim payload to match backend expectations for performance
      const trimmedAnalysisData = this.trimGridForBackend(analysisData);
      this.sendGridStructureForAnalysis(trimmedAnalysisData);
      for (const grid of gridStructure) {
        const gridObj = this.gridManager.getGridById(grid.id);
        if (gridObj) {
          const elementsToStore = [];
          for (const childData of grid.children) {
            const child = gridObj.children.find(c => c.id === childData.id);
            if (child && child.element) {
              elementsToStore.push(child.element);
            }
          }

          if (elementsToStore.length > 0) {
            this.contentFingerprint.storeFingerprints(elementsToStore);
          }
        }
      }
    }
  }
  
  async checkAnalysisRequired() {
    console.log("🔍 [TOPAZ DEBUG] checkAnalysisRequired() called");
    try {
      console.log("🔍 [TOPAZ DEBUG] Sending CHECK_ANALYSIS_REQUIRED message to background");
      const response = await this.messageHandler
        .sendMessageToBackground({
          type: MESSAGE_TYPES.CHECK_ANALYSIS_REQUIRED,
          gridStructure: null, // Not needed for the check
        });

      console.log("🔍 [TOPAZ DEBUG] Background response for CHECK_ANALYSIS_REQUIRED:", response);
      return response.analysisRequired;
    } catch (error) {
      console.log("🔍 [TOPAZ DEBUG] Error in checkAnalysisRequired, defaulting to true:", error);
      // If check fails, assume analysis is required and continue
      return true;
    }
  }

  async sendGridStructureForAnalysis(gridStructure) {
    console.log("🔍 [TOPAZ DEBUG] sendGridStructureForAnalysis called with:", gridStructure);
    
    if (this.isDisabled || !gridStructure || gridStructure.totalGrids === 0) {
      console.log("🔍 [TOPAZ DEBUG] Skipping analysis - disabled:", this.isDisabled, "no structure:", !gridStructure, "no grids:", gridStructure?.totalGrids);
      return;
    }
    
    console.log("🔍 [TOPAZ DEBUG] Proceeding with analysis, clearing timeout and auto-collapsing");
    this.clearAnalysisTimeout();
    await this.autoCollapseElements();
    // ENABLED: Clear blur effects after analysis timeout
    this.analysisTimeout = setTimeout(() => {
      if (!this.isDisabled) {
        this.elementEffects.clearAllBlurs();
      }
      this.analysisTimeout = null;
    }, TIMINGS.ANALYSIS_TIMEOUT);

    console.log("🔍 [TOPAZ DEBUG] Sending ANALYZE_GRID_STRUCTURE message to background");
    this.messageHandler
      .sendMessageToBackground({
        type: MESSAGE_TYPES.ANALYZE_GRID_STRUCTURE,
        gridStructure: gridStructure,
      })
      .catch((error) => {
        console.log("🔍 [TOPAZ DEBUG] Error sending message to background:", error);
      });

    console.log("🔍 [TOPAZ DEBUG] Emitting ANALYSIS_REQUESTED event");
    this.eventBus.emit(EVENTS.ANALYSIS_REQUESTED, gridStructure);
  }

  async autoCollapseElements() {
    const tagsToCollapse = this.configManager.getTagsToCollapse();
    
    if (!tagsToCollapse || tagsToCollapse.length === 0) {
      return;
    }
    
    console.log('🔧 AUTO-COLLAPSE: Hiding elements matching selectors:', tagsToCollapse);
    
    const hidingMethod = this.configManager.getHidingMethod();
    const hiddenCount = this.elementEffects.hideElementsBySelectors(tagsToCollapse, hidingMethod);
    
    if (hiddenCount > 0) {
      console.log(`✅ AUTO-COLLAPSE: Hidden ${hiddenCount} elements`);
      
      // Update block counter if enabled
      const toastEnabled = await this.isToastEnabled();
      if (toastEnabled) {
        this.notificationManager.incrementBlockedCount(hiddenCount);
      }
      
      // Report to background
      this.messageHandler.sendMessageToBackground({
        type: MESSAGE_TYPES.CONTENT_BLOCKED,
        blockedCount: hiddenCount,
        currentUrl: window.location.href,
      });
    }
  }

  clearAnalysisTimeout() {
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout);
      this.analysisTimeout = null;
    }
  }

  handleDisable(revive = true, sendResponse) {
    this.disable(revive);
    sendResponse(
      this.messageHandler.createResponse(
        true,
        "Extension disabled and all functionality stopped",
      ),
    );
  }

  handleEnable(config, sendResponse) {
    this.enable(config);
    sendResponse(
      this.messageHandler.createResponse(
        true,
        "Extension enabled and functionality restored",
      ),
    );
  }

  async handleHideGridChildren(gridInstructions, sendResponse) {
    // Hide loading indicator as AI analysis is complete
    if (this.notificationManager && typeof this.notificationManager.hideLoading === 'function') {
      this.notificationManager.hideLoading();
    }

    if (this.isDisabled) {
      sendResponse(
        this.messageHandler.createResponse(false, "Extension is disabled", {
          markedCount: 0,
        }),
      );
      return;
    }
    this.clearAnalysisTimeout();

    if (!gridInstructions || !Array.isArray(gridInstructions)) {
      sendResponse(
        this.messageHandler.createResponse(
          true,
          "No grid instructions provided",
          { markedCount: 0 },
        ),
      );
      return;
    }
    // ENABLED: Clear blur effects when disabling
    const clearedCount = this.elementEffects.clearAllBlurs();

    // Add small delay to ensure DOM is stable before filtering
    await new Promise(resolve => setTimeout(resolve, 50));

    const elementsToHide = this.gridManager.getElementsToHide(gridInstructions);
    console.log("🔍 [TOPAZ DEBUG] New elements to hide:", elementsToHide.length);

    // Filter out invalid elements to improve accuracy
    const validElementsToHide = elementsToHide.filter(item => {
      return item.element &&
             document.contains(item.element) &&
             item.element.offsetParent !== null && // Element is visible
             !item.element.classList.contains('topaz-hiding-animation'); // Not already being hidden
    });

    console.log("🔍 [TOPAZ DEBUG] Valid elements after filtering:", validElementsToHide.length);

    // Create a set of element IDs that should be hidden based on new instructions
    const elementsToHideIds = new Set(validElementsToHide.map(el => el.id));
    
    // FIXED: Only unhide elements that were explicitly analyzed in the current cycle
    // and are confirmed to no longer match the filter criteria
    // This prevents the bug where adding multiple blacklist items would cause
    // previously hidden content (especially auto-deleted content) to reappear
    const elementsToUnhide = [];
    for (const [elementId, analyzedElement] of this.elementsAnalyzedInCurrentCycle) {
      // Only unhide if:
      // 1. Element was previously hidden in this cycle
      // 2. Element is NOT in the new hide instructions
      // 3. Element is still in the DOM and visible (not auto-deleted by fingerprinting)
      // 4. Element was NOT hidden by auto-delete (content fingerprinting)
      if (analyzedElement.wasHidden && 
          !elementsToHideIds.has(elementId) &&
          analyzedElement.element &&
          document.contains(analyzedElement.element)) {
        
        // Additional safety check: verify the element is actually hidden by our extension
        const elementState = this.elementEffects.getElementState(analyzedElement.element);
        if (elementState && elementState.hidden === true) {
          // CRITICAL: Don't unhide elements that were auto-deleted by content fingerprinting
          // These should remain hidden even if they're not in the new hide instructions
          const filterCriteria = this.getCurrentFilterCriteria();
          const autoDeleteResult = this.contentFingerprint.checkForAutoDelete(analyzedElement.element, filterCriteria);
          if (!autoDeleteResult.shouldDelete) {
            elementsToUnhide.push(analyzedElement.element);
          } else {
            console.log("🔍 [TOPAZ DEBUG] Skipping unhide for auto-deleted element:", elementId);
          }
        }
      }
    }
    
    console.log("🔍 [TOPAZ DEBUG] Analyzed elements that were hidden but not in new instructions:", elementsToUnhide.length);
    
    // Unhide elements that were analyzed but no longer match the filter criteria
    if (elementsToUnhide.length > 0) {
      const unhiddenCount = await this.elementEffects.restoreElements(elementsToUnhide);
      console.log("🔍 [TOPAZ DEBUG] Unhidden", unhiddenCount, "analyzed elements that no longer match criteria");
    }

    if (validElementsToHide.length > 0) {
      const deletionResults = this.contentFingerprint.markFingerprintsAsDeleted(
        validElementsToHide.map(el => el.element)
      );

      // Apply blur effect before hiding (without jumping animation)
      console.log("🔍 [TOPAZ DEBUG] Blurring elements about to be removed:", validElementsToHide.length);
      this.elementEffects.blurElements(validElementsToHide);

      // Brief pause to show blur effect before smooth fade-out
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const hidingMethod = this.configManager.getHidingMethod();
    const markedCount = this.elementEffects.hideElements(
      validElementsToHide,
      hidingMethod,
    );

    if (markedCount > 0) {
      // Use truthful counter to count only actually blocked elements
      const actuallyBlockedCount = this.truthfulCounter.countBlockedElements(
        validElementsToHide,
        'aiAnalysis'
      );
      
      if (actuallyBlockedCount > 0) {
        const toastEnabled = await this.isToastEnabled();
        if (toastEnabled) {
          console.log(`🎯 Showing toast notification: ${actuallyBlockedCount} items blocked`);
          this.notificationManager.incrementBlockedCount(actuallyBlockedCount);
        }
        this.messageHandler.sendMessageToBackground({
          type: MESSAGE_TYPES.GRID_CHILDREN_BLOCKED,
          count: actuallyBlockedCount,
          url: window.location.href
        });
        this.messageHandler.sendMessageToBackground({
          type: MESSAGE_TYPES.CONTENT_BLOCKED,
          blockedCount: actuallyBlockedCount,
          currentUrl: window.location.href,
        });
        
        // Report actually blocked items to backend
        this.messageHandler.sendMessageToBackground({
          type: 'REPORT_BLOCKED_ITEMS',
          count: actuallyBlockedCount
        });
      }

      // Track blocked items for analytics
      const blockedItemDetails = elementsToHide.map(item => {
        const extractedTitle = this.extractBetterTitle(item.element);
        console.log('📊 [Analytics Debug] Sending blocked item:', {
          id: item.id,
          title: extractedTitle,
          hostname: window.location.hostname
        });
        return {
          id: item.id,
          text: extractedTitle,
          title: extractedTitle, // Add title field for backend compatibility
          type: 'ai-filtered',
          url: window.location.href,
          hostname: window.location.hostname,
          timestamp: Date.now()
        };
      });

      this.trackBlockedItems(markedCount, blockedItemDetails);

      // Immediately send this blocking event to backend
      this.sendBlockedItemsToBackend(blockedItemDetails);
    }
    sendResponse(
      this.messageHandler.createResponse(true, "Grid children hidden", {
        markedCount,
      }),
    );
    this.eventBus.emit(EVENTS.GRID_CHILDREN_HIDDEN, { markedCount });
  }

  handleStopObserving(sendResponse) {
    this.domObserver.stopObserving();
    sendResponse(this.messageHandler.createResponse(true, "Observer stopped"));
  }

  handleUnhideElement(elementId, sendResponse) {
    if (this.isDisabled) {
      sendResponse(
        this.messageHandler.createResponse(false, "Extension is disabled"),
      );
      return;
    }

    if (!elementId) {
      sendResponse(
        this.messageHandler.createResponse(false, "Missing element ID"),
      );
      return;
    }
    const result = this.gridManager.findChildById(elementId);
    let success = false;

    if (result) {
      const unhiddenCount = this.elementEffects.unhideElements([
        {
          id: elementId,
          element: result.child.element,
        },
      ]);
      success = unhiddenCount > 0;
      if (success) {
        result.child.isHidden = false;
      }
    } else {
      const unhiddenCount = this.elementEffects.unhideElements([
        {
          id: elementId,
        },
      ]);
      success = unhiddenCount > 0;
    }
    const message = success ? "Element unhidden" : "Element not found";
    sendResponse(
      this.messageHandler.createResponse(success, message, { elementId }),
    );
  }

  handleGetHiddenElements(sendResponse) {
    const hiddenElements = this.gridManager.getHiddenElements();

    if (!Array.isArray(hiddenElements)) {
      sendResponse(
        this.messageHandler.createResponse(
          false,
          "Invalid hidden elements data",
        ),
      );
      return;
    }

    sendResponse(
      this.messageHandler.createResponse(true, "Hidden elements retrieved", {
        hiddenElements: hiddenElements,
        count: hiddenElements.length,
      }),
    );
  }

  async handleRestoreAllElements(sendResponse) {
    try {
      const restoredCount = await this.elementEffects.restoreAllElements();

      sendResponse(
        this.messageHandler.createResponse(true, "All elements restored", {
          restoredCount: restoredCount,
        }),
      );
    } catch (error) {
      sendResponse(
        this.messageHandler.createResponse(false, `Error restoring elements: ${error.message}`),
      );
    }
  }

  handleError(errorMessage, errorType, sendResponse) {
    // Show error notification using the notification manager
    this.notificationManager.showError(errorMessage, errorType);
    
    if (sendResponse) {
      sendResponse(this.messageHandler.createResponse(true, "Error notification displayed"));
    }
  }

  // 🚀 CRITICAL FIX: New instant filter using leak-free, race-condition-free architecture
  async handleInstantFilter(sendResponse) {
    console.log('🎯 [NEW ARCHITECTURE] Starting instant filtering with leak-free system');

    try {
      if (this.isDisabled) {
        console.log('❌ Extension is disabled, cannot perform instant filtering');
        sendResponse(this.messageHandler.createResponse(false, "Extension is disabled"));
        return;
      }

      // Use new architecture if available, fallback to old system
      if (this.architectureInitialized && this.lifecycleManager) {
        console.log('✅ [NEW ARCHITECTURE] Using leak-free progressive filtering system');

        // Clear fingerprints for fresh analysis
        this.contentFingerprint.clear();

        // Start new architecture progressive filtering
        const result = await this.lifecycleManager.startProgressiveFiltering({
          forceRestart: true,
          processViewportOnly: false,
          scrollDirection: this.getScrollDirection(),
          filterCriteria: this.getCurrentFilterCriteria()
        });

        if (result.success) {
          console.log(`✅ [NEW ARCHITECTURE] Progressive filtering started successfully`);
          sendResponse(this.messageHandler.createResponse(true, "Instant filtering started (new architecture)", {
            architecture: 'new',
            sessionId: result.sessionId,
            viewportProcessed: result.viewportProcessed
          }));
        } else {
          console.warn(`⚠️ [NEW ARCHITECTURE] Progressive filtering failed, fallback to old system:`, result.error);
          await this.fallbackToOldInstantFilter(sendResponse);
        }

      } else {
        console.warn('⚠️ [NEW ARCHITECTURE] Not initialized, using old system with known memory leaks');
        await this.fallbackToOldInstantFilter(sendResponse);
      }

    } catch (error) {
      console.error('❌ [NEW ARCHITECTURE] Critical error in instant filtering:', error);

      // Emergency fallback
      try {
        await this.fallbackToOldInstantFilter(sendResponse);
      } catch (fallbackError) {
        console.error('❌ [FALLBACK] Even fallback failed:', fallbackError);
        sendResponse(this.messageHandler.createResponse(false, `Instant filtering failed: ${error.message}`));
      }
    }
  }

  // Emergency fallback to old system (has memory leaks but works)
  async fallbackToOldInstantFilter(sendResponse) {
    console.log('🚨 [FALLBACK] Using old progressive filtering system (has memory leaks)');

    try {
      // Clear fingerprints for fresh analysis
      this.contentFingerprint.clear();

      // Clear processed viewports for new analysis
      if (this.progressiveFiltering) {
        this.progressiveFiltering.processedViewports.clear();
      }

      // Use old viewport filtering method
      await this.filterViewportContent();

      // Start old progressive filtering if method exists
      if (this.startProgressiveFiltering && typeof this.startProgressiveFiltering === 'function') {
        this.startProgressiveFiltering();
      }

      sendResponse(this.messageHandler.createResponse(true, "Instant filtering started (fallback)", {
        architecture: 'old_fallback',
        warning: 'Using old system with memory leaks'
      }));

    } catch (error) {
      console.error('❌ [FALLBACK] Fallback filtering failed:', error);
      sendResponse(this.messageHandler.createResponse(false, `Fallback filtering failed: ${error.message}`));
    }
  }

  // Get current scroll direction for progressive filtering
  getScrollDirection() {
    if (this.lifecycleManager && this.lifecycleManager.eventCoordinator) {
      // Use new architecture scroll tracking
      return 'none'; // Will be dynamically determined by new system
    }
    // Fallback to old system
    return this.progressiveFiltering ? this.progressiveFiltering.scrollDirection : 'none';
  }

  // Get current filter criteria (can be enhanced based on specific needs)
  getCurrentFilterCriteria() {
    // 🚀 CRITICAL FIX: Return actual filter words, not empty criteria!
    const filterWords = this.configManager.getTagsToIgnore();
    const collapseWords = this.configManager.getTagsToCollapse();

    console.log(`🎯 [FILTER CRITERIA] Getting filter words: ${filterWords.length} ignore, ${collapseWords.length} collapse`);

    return {
      filterWords: filterWords || [],
      collapseWords: collapseWords || [],
      allFilterWords: [...(filterWords || []), ...(collapseWords || [])],
      timestamp: Date.now(),
      source: 'instant_filter'
    };
  }

  // Determine if an element is within (or near) the current viewport
  isInViewport(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // Include a small margin to catch near-viewport items
    const margin = 200;
    const horizontallyVisible = rect.left < vw + margin && rect.right > -margin;
    const verticallyVisible = rect.top < vh + margin && rect.bottom > -margin;
    return horizontallyVisible && verticallyVisible;
  }

  // Quickly analyze only grids and children that are visible to user
  async quickAnalyzeVisible(forceComprehensive = false) {
    try {
      // Build/refresh grid information
      this.gridManager.findAllGridContainers(forceComprehensive);
      const allGrids = this.gridManager.getAllGrids();

      const visibleGrids = allGrids.filter(g => this.isInViewport(g.element));
      if (!visibleGrids.length) {
        console.log('⚡ No visible grids found for quick analysis');
        return;
      }

      const gridStructure = {
        timestamp: new Date().toISOString(),
        totalGrids: 0,
        grids: []
      };

      for (const grid of visibleGrids) {
        const childrenToAnalyze = [];
        for (const child of grid.children) {
          const filterCriteria = this.getCurrentFilterCriteria();
          const autoDeleteResult = this.contentFingerprint.checkForAutoDelete(child.element, filterCriteria);
          if (autoDeleteResult.shouldDelete) {
            const hidingMethod = this.configManager.getHidingMethod();
            const hiddenCount = this.elementEffects.hideElements([{ id: child.id, element: child.element }], hidingMethod);
            if (hiddenCount > 0) {
              const toastEnabled = await this.isToastEnabled();
              if (toastEnabled) {
                this.notificationManager.incrementBlockedCount(hiddenCount);
              }
              this.messageHandler.sendMessageToBackground({
                type: MESSAGE_TYPES.CONTENT_BLOCKED,
                blockedCount: hiddenCount,
                currentUrl: window.location.href,
              });
            }
          } else if (!this.contentFingerprint.checkFingerprintExists(child.element)) {
            childrenToAnalyze.push(child);
          }
        }

        if (childrenToAnalyze.length > 0) {
          gridStructure.grids.push({
            id: grid.id,
            totalChildren: childrenToAnalyze.length,
            gridText: grid.element.innerText,
            children: childrenToAnalyze.map(child => ({ id: child.id, text: child.text }))
          });
        }
      }

      gridStructure.totalGrids = gridStructure.grids.length;
      if (gridStructure.totalGrids > 0) {
        const trimmed = this.trimGridForBackend(gridStructure);
        await this.sendGridStructureForAnalysis(trimmed);
      }
    } catch (e) {
      console.warn('Quick visible analysis failed:', e);
    }
  }

  // Toggle preview: show hidden items with glow, or re-hide them
  async handleTogglePreviewHidden(enable, sendResponse) {
    try {
      console.log('[Preview] Toggle requested. enable =', enable);
      if (this.previewProcessing) {
        console.log('[Preview] Toggle ignored – already processing');
        if (sendResponse) sendResponse(this.messageHandler.createResponse(false, 'Busy'));
        return;
      }
      this.previewProcessing = true;
      if (this.isDisabled) {
        console.log('[Preview] Ignored toggle – extension is disabled');
        // Make sure suppression is off when disabled
        this.elementEffects.setSuppressHiding(false);
        if (sendResponse) sendResponse(this.messageHandler.createResponse(true, 'Extension disabled', { enabled: false }));
        this.previewProcessing = false;
        return;
      }
      if (enable) {
        // Suppress new hiding actions during preview mode
        this.elementEffects.setSuppressHiding(true);
        const hidden = this.elementEffects.getHiddenElements();
        console.log('[Preview] Hidden elements found:', hidden?.length || 0);
        if (!hidden || hidden.length === 0) {
          this.previewState = { enabled: true, items: [] };
          if (sendResponse) sendResponse(this.messageHandler.createResponse(true, 'No hidden items to preview', { enabled: true, count: 0 }));
          this.previewProcessing = false;
          return;
        }

        // Capture current hiding method/state before restore
        const items = hidden.map(({ id, element }) => {
          const st = this.elementEffects.getElementState(element) || {};
          return { id, element, method: st.hidingMethod };
        });

        // Restore elements so they become visible, then add a glow outline
        await this.elementEffects.restoreElements(items.map(i => i.element));
        const els = items.map(i => i.element);
        const glowCount = this.elementEffects.addPreviewGlow(els);
        // Mark elements as previewed so we can recover if our list is lost
        this.elementEffects.addPreviewMarker && this.elementEffects.addPreviewMarker(els);
        console.log('[Preview] Restored and applied glow to elements:', glowCount);

        this.previewState = { enabled: true, items };
        if (sendResponse) sendResponse(this.messageHandler.createResponse(true, 'Preview enabled', { enabled: true, count: items.length }));
      } else {
        let items = this.previewState.items || [];
        console.log('[Preview] Disabling preview. Items to re-hide:', items.length);
        // If our internal list is empty (e.g., DOM mutated), reconstruct from markers
        if (items.length === 0 && this.elementEffects.getPreviewMarkedElements) {
          const marked = this.elementEffects.getPreviewMarkedElements();
          if (Array.isArray(marked) && marked.length > 0) {
            items = marked.map(el => {
              const st = this.elementEffects.getElementState(el) || {};
              return { id: st.elementId, element: el, method: st.hidingMethod };
            });
            console.log('[Preview] Reconstructed items from markers:', items.length);
          }
        }
        if (items.length > 0) {
          // Re-enable hiding BEFORE we attempt to hide elements again
          this.elementEffects.setSuppressHiding(false);
          const elementsOnly = items.map(i => i.element);
          if (this.elementEffects.clearAllPreviewArtifacts) {
            this.elementEffects.clearAllPreviewArtifacts();
          } else {
            const removed = this.elementEffects.removePreviewGlow(elementsOnly);
            console.log('[Preview] Removed glow count:', removed);
            this.elementEffects.removePreviewMarker && this.elementEffects.removePreviewMarker(elementsOnly);
          }
          // Re-hide using original hiding methods; fallback to current config if missing
          const byMethod = new Map();
          for (const it of items) {
            const method = it.method || this.configManager.getHidingMethod();
            if (!byMethod.has(method)) byMethod.set(method, []);
            byMethod.get(method).push({ id: it.id, element: it.element });
          }
          let totalHidden = 0;
          for (const [method, list] of byMethod.entries()) {
            const hid = this.elementEffects.hideElements(list, method);
            console.log(`[Preview] Re-hidden ${hid} items with method:`, method);
            totalHidden += hid;
          }
          // Strong fallback: if nothing was re-hidden (e.g., missing method), force DISPLAY hide
          if (totalHidden === 0) {
            const forced = this.elementEffects.hideElements(items.map(i => ({ id: i.id, element: i.element })), 'display');
            console.log('[Preview] Forced re-hide with DISPLAY, count:', forced);
          }
        }
        this.previewState = { enabled: false, items: [] };
        // Re-run quick visible analysis to apply any new filters instantly
        await this.quickAnalyzeVisible();
        if (sendResponse) sendResponse(this.messageHandler.createResponse(true, 'Preview disabled', { enabled: false }));
      }
    } catch (e) {
      console.error('Preview toggle failed:', e);
      if (sendResponse) sendResponse(this.messageHandler.createResponse(false, `Preview toggle failed: ${e.message}`));
    }
    finally {
      this.previewProcessing = false;
    }
  }

  // Initialize user session for analytics tracking
  async initializeUserSession() {
    try {
      if (this.sessionManager) {
        const sessionId = await this.sessionManager.initializeSession();
        console.log('🆔 User session initialized:', sessionId);

        // Track site visit
        this.sessionManager.trackSiteVisit(window.location.hostname);

        // Handle first-time user flow
        if (this.sessionManager.isFirstTimeUser()) {
          console.log('👋 First-time user detected');
          // Could show onboarding or special notification
        }
      }
    } catch (error) {
      console.warn('Failed to initialize user session:', error);
    }
  }

  // Track blocked items for analytics
  trackBlockedItems(count, items = []) {
    try {
      if (this.sessionManager && count > 0) {
        // Extract relevant item data for analytics
        const itemData = items.map(item => ({
          id: item.id,
          text: item.text ? item.text.substring(0, 100) : '', // Limit text length
          type: item.type || 'content'
        }));

        this.sessionManager.updateBlockedCount(count, itemData);
        console.log(`📊 Tracked ${count} blocked items`);
      }
    } catch (error) {
      console.warn('Failed to track blocked items:', error);
    }
  }

  // Track profile usage for analytics
  trackProfileUsage(profileName) {
    try {
      if (this.sessionManager && profileName) {
        this.sessionManager.trackProfileUsage(profileName);
        console.log(`📋 Tracked profile usage: ${profileName}`);
      }
    } catch (error) {
      console.warn('Failed to track profile usage:', error);
    }
  }

  // Extract better title/description from blocked elements
  extractBetterTitle(element) {
    if (!element) return 'Unknown content';

    try {
      // Try various methods to get meaningful content
      const strategies = [
        // YouTube video titles (most specific first)
        () => element.querySelector('#video-title-link, #video-title yt-formatted-string, #video-title a')?.textContent?.trim(),
        () => element.querySelector('h3.ytd-video-renderer a, h3.ytd-compact-video-renderer a')?.textContent?.trim(),
        () => element.querySelector('a#video-title, a[aria-describedby*="video"]')?.textContent?.trim(),
        () => element.querySelector('span#video-title, .ytd-video-meta-block h3')?.textContent?.trim(),
        () => element.querySelector('[id*="video-title"], [class*="video-title"]')?.textContent?.trim(),

        // YouTube Shorts titles
        () => element.querySelector('#shorts-title, .shorts-video-title')?.textContent?.trim(),
        () => element.querySelector('[aria-label*="Shorts"] h3, [data-testid*="shorts"] h3')?.textContent?.trim(),

        // Other video platforms
        () => element.querySelector('.video-title, .media-title, .content-title')?.textContent?.trim(),
        () => element.querySelector('[data-testid*="video"] h1, [data-testid*="video"] h2, [data-testid*="video"] h3')?.textContent?.trim(),

        // General title selectors
        () => element.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim(),
        () => element.querySelector('[aria-label]')?.getAttribute('aria-label')?.trim(),
        () => element.querySelector('a[title]')?.getAttribute('title')?.trim(),
        () => element.querySelector('img[alt]')?.getAttribute('alt')?.trim(),
        () => element.querySelector('[data-testid*="title"], [data-testid*="heading"]')?.textContent?.trim(),

        // Social media posts
        () => element.querySelector('[data-testid="tweetText"], .tweet-text, .post-content')?.textContent?.trim(),
        () => element.querySelector('[data-testid="User-Name"] ~ div, .post-text, .feed-shared-text')?.textContent?.trim(),

        // Fallback to general content
        () => element.textContent?.trim()
      ];

      for (const strategy of strategies) {
        try {
          const result = strategy();
          if (result && result.length > 3 && result.length < 300) {
            // Clean up the text and remove common noise
            let cleanTitle = result
              .replace(/\s+/g, ' ')
              .replace(/^\s*[-•·]\s*/, '') // Remove leading bullets/dashes
              .replace(/\s*\|\s*YouTube\s*$/, '') // Remove "| YouTube" suffix
              .replace(/\s*-\s*YouTube\s*$/, '') // Remove "- YouTube" suffix
              .replace(/\s*•\s*YouTube\s*$/, '') // Remove "• YouTube" suffix
              .replace(/^Watch\s*:\s*/i, '') // Remove "Watch:" prefix
              .replace(/^Video\s*:\s*/i, '') // Remove "Video:" prefix
              .trim();

            if (cleanTitle.length > 3) {
              // Log successful title extraction for debugging
              if (window.location.hostname.includes('youtube')) {
                console.log('🎬 [Title Debug] Extracted video title:', cleanTitle.substring(0, 50) + '...');
              }
              return cleanTitle.substring(0, 150);
            }
          }
        } catch (e) {
          // Strategy failed, try next
        }
      }

      // Fallback: get first meaningful text
      const text = element.textContent?.trim() || element.innerText?.trim() || '';
      if (text.length > 10) {
        return text.replace(/\s+/g, ' ').substring(0, 100);
      }

      return 'Blocked content';
    } catch (error) {
      console.warn('Error extracting title:', error);
      return 'Blocked content';
    }
  }

  // Send blocked items directly to backend in real-time
  async sendBlockedItemsToBackend(blockedItemDetails) {
    try {
      // Disable duplicate network calls from content to avoid CORS/auth issues.
      // Background already reports counts via API.reportBlockedItems and SupabaseSync.
      return;
    } catch (_) {
      return;
    }
  }

  // Get current background stats
  async getBackgroundStats() {
    try {
      const response = await this.messageHandler.sendMessageToBackground({
        type: 'GET_BLOCK_STATS'
      });

      if (response.success && response.globalBlockStats) {
        return {
          totalBlocked: response.globalBlockStats.totalBlocked || 0,
          blockedCount: response.globalBlockStats.blockedToday || 0
        };
      }
    } catch (error) {
      console.warn('Could not get background stats:', error);
    }

    return { totalBlocked: 0, blockedCount: 0 };
  }

  // Handle session manager request from other scripts
  handleGetSessionManager(sendResponse) {
    try {
      if (sendResponse && this.sessionManager) {
        // Create bound functions to ensure 'this' context is preserved
        const sessionManager = this.sessionManager;

        sendResponse({
          success: true,
          sessionManager: {
            getSessionId: () => {
              try {
                return sessionManager.getSessionId();
              } catch (e) {
                console.warn('Error getting session ID:', e);
                return null;
              }
            },
            getMetrics: () => {
              try {
                return sessionManager.getMetrics();
              } catch (e) {
                console.warn('Error getting metrics:', e);
                return {};
              }
            },
            getSyncQueue: () => {
              try {
                return sessionManager.getSyncQueue();
              } catch (e) {
                console.warn('Error getting sync queue:', e);
                return [];
              }
            },
            getStoredSession: () => {
              try {
                return sessionManager.getStoredSession();
              } catch (e) {
                console.warn('Error getting stored session:', e);
                return {};
              }
            },
            markAsSynced: (timestamps) => {
              try {
                return sessionManager.markAsSynced(timestamps);
              } catch (e) {
                console.warn('Error marking as synced:', e);
                return false;
              }
            }
          }
        });
      } else {
        sendResponse({
          success: false,
          error: 'Session manager not available'
        });
      }
    } catch (error) {
      console.error('Error in handleGetSessionManager:', error);
      if (sendResponse) {
        sendResponse({
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * Handle YouTube Shorts blocking
   */
  handleYouTubeBlockShorts(enabled, sendResponse) {
    try {
      if (window.location.hostname.includes('youtube.com')) {
        this.blockYouTubeShorts(enabled);
        sendResponse(this.messageHandler.createResponse(true, `YouTube Shorts ${enabled ? 'blocked' : 'unblocked'}`));
      } else {
        sendResponse(this.messageHandler.createResponse(false, 'Not on YouTube'));
      }
    } catch (error) {
      sendResponse(this.messageHandler.createResponse(false, `Error blocking YouTube Shorts: ${error.message}`));
    }
  }

  /**
   * Handle YouTube Home Feed blocking
   */
  handleYouTubeBlockHomeFeed(enabled, sendResponse) {
    try {
      if (window.location.hostname.includes('youtube.com')) {
        this.blockYouTubeHomeFeed(enabled);
        sendResponse(this.messageHandler.createResponse(true, `YouTube Home Feed ${enabled ? 'blocked' : 'unblocked'}`));
      } else {
        sendResponse(this.messageHandler.createResponse(false, 'Not on YouTube'));
      }
    } catch (error) {
      sendResponse(this.messageHandler.createResponse(false, `Error blocking YouTube Home Feed: ${error.message}`));
    }
  }

  /**
   * Handle YouTube Comments blocking
   */
  handleYouTubeBlockComments(enabled, sendResponse) {
    try {
      if (window.location.hostname.includes('youtube.com')) {
        this.blockYouTubeComments(enabled);
        sendResponse(this.messageHandler.createResponse(true, `YouTube Comments ${enabled ? 'blocked' : 'unblocked'}`));
      } else {
        sendResponse(this.messageHandler.createResponse(false, 'Not on YouTube'));
      }
    } catch (error) {
      sendResponse(this.messageHandler.createResponse(false, `Error blocking YouTube Comments: ${error.message}`));
    }
  }

  /**
   * Handle getting YouTube settings - FIXED: Get from storage instead of DOM classes
   */
  async handleYouTubeGetSettings(sendResponse) {
    try {
      const storedSettings = await this.getYouTubeSettings();
      sendResponse(this.messageHandler.createResponse(true, 'YouTube settings retrieved', { settings: storedSettings }));
    } catch (error) {
      sendResponse(this.messageHandler.createResponse(false, `Error getting YouTube settings: ${error.message}`));
    }
  }

  /**
   * Block/unblock YouTube Shorts - Enhanced comprehensive blocking
   */
  blockYouTubeShorts(enabled, skipStorage = false) {
    console.log(`🚫 YouTube Shorts blocking ${enabled ? 'enabled' : 'disabled'}`);
    
    // Primary method: Add/remove body class for CSS-based blocking
    if (enabled) {
      document.body.classList.add('topaz-block-shorts');
    } else {
      document.body.classList.remove('topaz-block-shorts');
    }
    
    // Secondary method: JavaScript-based blocking for elements that need it
    // Comprehensive selectors for all Shorts elements
    const shortsSelectors = [
      // Main Shorts containers and players
      '#shorts-player',
      '[data-testid="shorts-player"]',
      'ytd-reel-shelf-renderer',
      'ytd-rich-shelf-renderer[is-shorts]',
      'ytd-shorts-shelf-renderer',
      'ytd-shorts',
      'ytd-shorts-player',
      '#shorts-container',
      '.ytd-shorts',
      '[is="ytd-reel-shelf-renderer"]',
      '[is="ytd-rich-shelf-renderer"][is-shorts]',
      
      // Shorts in video lists and search results
      'ytd-video-renderer:has([href*="/shorts"])',
      'ytd-compact-video-renderer:has([href*="/shorts"])',
      'ytd-rich-item-renderer:has([href*="/shorts"])',
      
      // Mobile Shorts elements
      '.shorts-video-cell',
      '.shorts-lockup',
      '.reel-item-endpoint',
      '[data-context-item-id*="shorts"]',
      '[data-context-item-type="shorts"]',
      
      // Additional Shorts containers
      '.ytd-reel-shelf-renderer',
      '.ytd-rich-shelf-renderer[is-shorts]',
      '[data-target-id*="shorts"]'
    ];

    // Apply JavaScript-based blocking as backup
    shortsSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (enabled) {
            element.classList.add(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
          } else {
            element.classList.remove(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
          }
        });
      } catch (error) {
        // Some selectors with :has() might not work in all browsers, skip silently
        console.debug(`Selector ${selector} failed:`, error);
      }
    });

    // Block Shorts navigation items (sidebar menu)
    const shortsNavSelectors = [
      'ytd-guide-entry-renderer:has(a[href*="/shorts"])',
      'ytd-mini-guide-entry-renderer:has(a[href*="/shorts"])',
      'a[href*="/shorts"][role="tab"]',
      'a[href="/shorts"]',
      'a[href*="youtube.com/shorts"]'
    ];

    shortsNavSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (enabled) {
            element.classList.add(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
          } else {
            element.classList.remove(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
          }
        });
      } catch (error) {
        console.debug(`Nav selector ${selector} failed:`, error);
      }
    });

    // Fallback: Block any link containing "/shorts"
    const allShortsLinks = document.querySelectorAll('a[href*="/shorts"]');
    allShortsLinks.forEach(link => {
      if (enabled) {
        link.classList.add(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
      } else {
        link.classList.remove(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
      }
    });

    // Block elements with Shorts-related text content
    if (enabled) {
      this.blockShortsByTextContent();
    } else {
      // When disabling, remove text-based blocking
      this.unblockShortsByTextContent();
    }

    // Store the setting persistently (only when called from popup)
    if (!skipStorage) {
      this.storeYouTubeSetting('blockShorts', enabled);
    }

    console.log(`🚫 YouTube Shorts blocking complete. Body class: ${document.body.classList.contains('topaz-block-shorts') ? 'ADDED' : 'REMOVED'}. JS-blocked elements: ${document.querySelectorAll('.topaz-youtube-shorts-hidden').length}`);
  }

  /**
   * Block Shorts elements by analyzing text content
   */
  blockShortsByTextContent() {
    // Look for sidebar menu items that contain "Shorts" text
    const guideItems = document.querySelectorAll('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer');
    guideItems.forEach(item => {
      const textContent = item.textContent?.toLowerCase() || '';
      if (textContent.includes('shorts')) {
        item.classList.add(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
      }
    });

    // Look for section headers containing "Shorts"
    const headers = document.querySelectorAll('h2, h3, .ytd-shelf-renderer h2, .ytd-rich-shelf-renderer h2');
    headers.forEach(header => {
      const textContent = header.textContent?.toLowerCase() || '';
      if (textContent.includes('shorts')) {
        // Hide the entire shelf/section
        const shelf = header.closest('ytd-rich-shelf-renderer, ytd-shelf-renderer, ytd-reel-shelf-renderer');
        if (shelf) {
          shelf.classList.add(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
        }
      }
    });
  }

  /**
   * Remove text-based Shorts blocking
   */
  unblockShortsByTextContent() {
    // Remove blocking from sidebar menu items
    const guideItems = document.querySelectorAll('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer');
    guideItems.forEach(item => {
      item.classList.remove(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
    });

    // Remove blocking from shelves that were hidden by text content
    const shelves = document.querySelectorAll('ytd-rich-shelf-renderer, ytd-shelf-renderer, ytd-reel-shelf-renderer');
    shelves.forEach(shelf => {
      shelf.classList.remove(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
    });
  }

  /**
   * Handle DOM mutations specifically for YouTube Shorts blocking
   * This ensures dynamically loaded Shorts content is blocked immediately
   */
  handleDOMChangesForShorts(data) {
    // Only proceed if we're on YouTube
    if (!window.location.hostname.includes('youtube.com')) {
      return;
    }

    // Quick check: if body doesn't have the blocking class, Shorts blocking is disabled
    if (!document.body.classList.contains('topaz-block-shorts')) {
      return;
    }

    // Process added nodes for Shorts content
    const { mutations } = data;
    let foundShortsContent = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes) {
        mutation.addedNodes.forEach(node => {
          // Skip non-element nodes
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          // Check if the added node or its children contain Shorts content
          if (this.containsShortsContent(node)) {
            foundShortsContent = true;
            this.blockShortsInNode(node);
          }
        });
      }
    });

    // If we found new Shorts content, also run a full check to catch any missed elements
    if (foundShortsContent) {
      console.log('🚫 New Shorts content detected, running comprehensive block');
      // Use a small delay to ensure DOM is stable
      setTimeout(() => {
        this.blockYouTubeShorts(true, true); // skipStorage = true
      }, 100);
    }
  }

  /**
   * Check if a DOM node contains Shorts-related content
   */
  containsShortsContent(node) {
    // Check if the node itself matches Shorts selectors
    const shortsSelectors = [
      'ytd-reel-shelf-renderer',
      'ytd-rich-shelf-renderer[is-shorts]',
      'ytd-shorts-shelf-renderer',
      'ytd-shorts',
      'ytd-shorts-player',
      '[data-testid="shorts-player"]',
      '.shorts-video-cell',
      '.shorts-lockup',
      '.reel-item-endpoint'
    ];

    // Check if node matches any Shorts selector
    for (const selector of shortsSelectors) {
      try {
        if (node.matches && node.matches(selector)) {
          return true;
        }
      } catch (error) {
        // Selector might not be supported, continue
      }
    }

    // Check if node contains any Shorts elements
    for (const selector of shortsSelectors) {
      try {
        if (node.querySelector && node.querySelector(selector)) {
          return true;
        }
      } catch (error) {
        // Selector might not be supported, continue
      }
    }

    // Check for links to Shorts
    if (node.querySelector && node.querySelector('a[href*="/shorts"]')) {
      return true;
    }

    // Check for text content containing "Shorts"
    const textContent = node.textContent?.toLowerCase() || '';
    if (textContent.includes('shorts') && 
        (node.tagName === 'YTD-GUIDE-ENTRY-RENDERER' || 
         node.tagName === 'YTD-MINI-GUIDE-ENTRY-RENDERER' ||
         node.querySelector('h2, h3'))) {
      return true;
    }

    return false;
  }

  /**
   * Block Shorts content within a specific DOM node
   */
  blockShortsInNode(node) {
    // Only block if the body has the blocking class (i.e., if Shorts blocking is enabled)
    if (!document.body.classList.contains('topaz-block-shorts')) {
      return;
    }

    // Apply the same blocking logic as the main function, but scoped to this node
    const shortsSelectors = [
      'ytd-reel-shelf-renderer',
      'ytd-rich-shelf-renderer[is-shorts]',
      'ytd-shorts-shelf-renderer',
      'ytd-shorts',
      'ytd-shorts-player',
      '[data-testid="shorts-player"]',
      '.shorts-video-cell',
      '.shorts-lockup',
      '.reel-item-endpoint',
      'a[href*="/shorts"]'
    ];

    // Check if the node itself should be blocked
    for (const selector of shortsSelectors) {
      try {
        if (node.matches && node.matches(selector)) {
          node.classList.add(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
          console.log('🚫 Blocked new Shorts element:', node);
          break;
        }
      } catch (error) {
        // Selector might not be supported, continue
      }
    }

    // Block child elements
    shortsSelectors.forEach(selector => {
      try {
        const elements = node.querySelectorAll ? node.querySelectorAll(selector) : [];
        elements.forEach(element => {
          element.classList.add(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
          console.log('🚫 Blocked new Shorts child element:', element);
        });
      } catch (error) {
        // Selector might not be supported, continue
      }
    });

    // Special handling for guide items with "Shorts" text
    if (node.tagName === 'YTD-GUIDE-ENTRY-RENDERER' || node.tagName === 'YTD-MINI-GUIDE-ENTRY-RENDERER') {
      const textContent = node.textContent?.toLowerCase() || '';
      if (textContent.includes('shorts')) {
        node.classList.add(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
        console.log('🚫 Blocked Shorts navigation item:', node);
      }
    }
  }

  /**
   * Block/unblock YouTube Home Feed - FIXED: Immediate blocking to prevent flashing
   */
  blockYouTubeHomeFeed(enabled, skipStorage = false) {
    // Check if we're on the YouTube homepage
    const currentUrl = window.location.href;
    const currentPath = window.location.pathname;
    const isHomePage = currentPath === '/' || 
                      currentPath === '' ||
                      currentUrl.match(/^https:\/\/(www\.)?youtube\.com\/?(\?.*)?$/i) ||
                      currentUrl.match(/^https:\/\/(www\.)?youtube\.com\/?#?$/i);

    if (enabled) {
      // Add immediate CSS blocking to prevent any flashing
      this.injectHomeFeedBlockingCSS();
      
      if (isHomePage) {
        // On homepage: apply blocking to existing recommendation grids
        const homeFeedSelectors = [
          'ytd-rich-grid-renderer', // Main homepage grid
          'ytd-two-column-browse-results-renderer ytd-rich-grid-renderer', // Homepage specific grid
          '#contents ytd-rich-grid-renderer', // Contents area grid on homepage
          'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer' // Explicit homepage browse
        ];

        homeFeedSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            element.classList.add(CSS_CLASSES.YOUTUBE_HOME_FEED_HIDDEN);
          });
        });
        
        console.log(`🏠 YouTube Home Feed blocked on homepage with immediate CSS`);
      } else {
        console.log(`🔍 YouTube Home Feed CSS blocking active (not on homepage): ${currentPath}`);
      }
    } else {
      // Remove CSS blocking
      this.removeHomeFeedBlockingCSS();
      
      // Remove any existing blocking classes
      document.querySelectorAll(`.${CSS_CLASSES.YOUTUBE_HOME_FEED_HIDDEN}`).forEach(element => {
        element.classList.remove(CSS_CLASSES.YOUTUBE_HOME_FEED_HIDDEN);
      });
      
      console.log(`🏠 YouTube Home Feed unblocked and CSS rules removed`);
    }

    // Store the setting persistently (only when called from popup, not from applyStoredYouTubeSettings)
    if (!skipStorage) {
      this.storeYouTubeSetting('blockHomeFeed', enabled);
    }
  }

  /**
   * Block/unblock YouTube Comments
   */
  blockYouTubeComments(enabled, skipStorage = false) {
    const commentsSelectors = [
      '#comments',
      'ytd-comments',
      '#comment-thread-renderer',
      'ytd-comment-thread-renderer',
      '#comment-section',
      'ytd-comment-section-renderer'
    ];

    commentsSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (enabled) {
          element.classList.add(CSS_CLASSES.YOUTUBE_COMMENTS_HIDDEN);
        } else {
          element.classList.remove(CSS_CLASSES.YOUTUBE_COMMENTS_HIDDEN);
        }
      });
    });

    // Store the setting persistently (only when called from popup)
    if (!skipStorage) {
      this.storeYouTubeSetting('blockComments', enabled);
    }
  }

  /**
   * Store YouTube feature setting persistently
   */
  async storeYouTubeSetting(feature, enabled) {
    try {
      const key = `youtube_${feature}`;
      const data = { [key]: enabled };
      await chrome.storage.local.set(data);
      console.log(`✅ Stored YouTube setting: ${feature} = ${enabled}`);
    } catch (error) {
      console.warn(`⚠️ Failed to store YouTube setting ${feature}:`, error);
    }
  }

  /**
   * Get all YouTube settings from storage
   */
  async getYouTubeSettings() {
    try {
      // Check if extension context is still valid
      if (!chrome.runtime?.id) {
        console.warn('⚠️ Extension context invalidated, skipping YouTube settings');
        return {
          blockShorts: false,
          blockHomeFeed: false,
          blockComments: false
        };
      }

      const result = await chrome.storage.local.get([
        'youtube_blockShorts',
        'youtube_blockHomeFeed',
        'youtube_blockComments'
      ]);

      return {
        blockShorts: result.youtube_blockShorts || false,
        blockHomeFeed: result.youtube_blockHomeFeed || false,
        blockComments: result.youtube_blockComments || false
      };
    } catch (error) {
      if (error.message?.includes('Extension context invalidated')) {
        console.warn('⚠️ Extension context invalidated, stopping content script execution');
        return {
          blockShorts: false,
          blockHomeFeed: false,
          blockComments: false
        };
      }
      console.warn('⚠️ Failed to get YouTube settings:', error);
      return {
        blockShorts: false,
        blockHomeFeed: false,
        blockComments: false
      };
    }
  }

  /**
   * Apply stored YouTube settings on page load
   */
  async applyStoredYouTubeSettings() {
    if (!window.location.hostname.includes('youtube.com')) {
      return;
    }

    try {
      const settings = await this.getYouTubeSettings();
      
      // Apply settings without storing them again (skipStorage = true)
      if (settings.blockShorts) {
        this.blockYouTubeShorts(true, true);
      }
      if (settings.blockHomeFeed) {
        this.blockYouTubeHomeFeed(true, true);
      }
      if (settings.blockComments) {
        this.blockYouTubeComments(true, true);
      }
      
      console.log('✅ Applied stored YouTube settings:', settings);
    } catch (error) {
      console.warn('⚠️ Failed to apply stored YouTube settings:', error);
    }
  }

  /**
   * Inject CSS rules to immediately block home feed content
   */
  injectHomeFeedBlockingCSS() {
    // Remove existing style if present
    this.removeHomeFeedBlockingCSS();
    
    const styleId = 'topaz-home-feed-blocking-css';
    const css = `
      /* TOPAZ: Immediate home feed blocking - only on homepage */
      body[data-topaz-on-homepage="true"] ytd-rich-grid-renderer,
      body[data-topaz-on-homepage="true"] ytd-two-column-browse-results-renderer ytd-rich-grid-renderer,
      body[data-topaz-on-homepage="true"] #contents ytd-rich-grid-renderer,
      body[data-topaz-on-homepage="true"] ytd-browse[page-subtype="home"] ytd-rich-grid-renderer {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      
      /* Prevent any flash during transitions - target all children */
      body[data-topaz-on-homepage="true"] ytd-rich-grid-renderer *,
      body[data-topaz-on-homepage="true"] ytd-rich-grid-renderer ytd-rich-item-renderer,
      body[data-topaz-on-homepage="true"] ytd-rich-grid-renderer ytd-video-renderer {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
      
      /* Block content containers that might appear during navigation */
      body[data-topaz-on-homepage="true"] #primary #contents > ytd-rich-grid-renderer,
      body[data-topaz-on-homepage="true"] #primary #contents ytd-rich-section-renderer ytd-rich-grid-renderer {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        height: 0 !important;
      }
    `;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
    
    // Mark body to indicate we're on homepage for CSS targeting
    this.updateHomepageBodyAttribute();
    
    console.log('🎯 Injected immediate home feed blocking CSS');
  }

  /**
   * Remove home feed blocking CSS rules
   */
  removeHomeFeedBlockingCSS() {
    const styleId = 'topaz-home-feed-blocking-css';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
      console.log('🧹 Removed home feed blocking CSS');
    }
    
    // Remove homepage body attribute
    document.body.removeAttribute('data-topaz-on-homepage');
  }

  /**
   * Update body attribute to indicate if we're on homepage
   */
  updateHomepageBodyAttribute() {
    const currentPath = window.location.pathname;
    const isHomePage = currentPath === '/' || 
                      currentPath === '' ||
                      window.location.href.match(/^https:\/\/(www\.)?youtube\.com\/?(\?.*)?$/i) ||
                      window.location.href.match(/^https:\/\/(www\.)?youtube\.com\/?#?$/i);
    
    if (isHomePage) {
      document.body.setAttribute('data-topaz-on-homepage', 'true');
    } else {
      document.body.removeAttribute('data-topaz-on-homepage');
    }
  }

  /**
   * Set up observer for dynamic YouTube content
   */
  setupYouTubeContentObserver() {
    if (!window.location.hostname.includes('youtube.com')) {
      return;
    }

    // Clean up existing observer
    if (this.youtubeObserver) {
      this.youtubeObserver.disconnect();
    }

    this.youtubeObserver = new MutationObserver(async (mutations) => {
      let shouldReapply = false;
      let shouldUpdateBodyAttribute = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes are YouTube content containers
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              if (element.tagName && (
                element.tagName.toLowerCase().startsWith('ytd-') ||
                element.querySelector && (
                  element.querySelector('ytd-rich-grid-renderer') ||
                  element.querySelector('ytd-reel-shelf-renderer') ||
                  element.querySelector('#comments')
                )
              )) {
                shouldReapply = true;
                shouldUpdateBodyAttribute = true;
                break;
              }
            }
          }
          if (shouldReapply) break;
        }
      }
      
      if (shouldUpdateBodyAttribute) {
        // Update body attribute immediately for CSS targeting
        this.updateHomepageBodyAttribute();
      }
      
      if (shouldReapply) {
        // Debounce reapplication
        clearTimeout(this.youtubeReapplyTimeout);
        this.youtubeReapplyTimeout = setTimeout(async () => {
          await this.applyStoredYouTubeSettings();
        }, 100); // Reduced timeout for faster response
      }
    });

    // Observe the main YouTube content area
    const targetNode = document.querySelector('#page-manager') || document.body;
    this.youtubeObserver.observe(targetNode, {
      childList: true,
      subtree: true
    });
    
    console.log('📺 YouTube content observer set up');
  }

  /**
   * Set up URL monitoring for immediate homepage detection
   */
  setupYouTubeURLMonitoring() {
    if (!window.location.hostname.includes('youtube.com')) {
      return;
    }

    // Store original URL to detect changes
    this.lastYouTubeUrl = window.location.href;
    
    // Monitor URL changes more frequently during transitions
    this.youtubeUrlMonitorInterval = setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== this.lastYouTubeUrl) {
        this.lastYouTubeUrl = currentUrl;
        
        // Immediately update body attribute for CSS targeting
        this.updateHomepageBodyAttribute();
        
        console.log('🔄 URL changed, updated homepage detection:', currentUrl);
      }
    }, 50); // Check every 50ms during navigation
    
    console.log('📺 YouTube URL monitoring set up');
  }

  // 🚀 DEPRECATED: Old scroll tracking (replaced by new architecture)
  // MEMORY LEAK FIX: Old method created untracked event listeners and intervals
  // New method integrates with ResourceManager for proper cleanup
  setupScrollTracking() {
    console.warn('⚠️ [DEPRECATED] Using old setupScrollTracking - this method has memory leaks!');
    console.warn('💡 Consider upgrading to new architecture for leak-free operation');

    // Check if we have new architecture available
    if (this.lifecycleManager && this.lifecycleManager.resourceManager) {
      console.log('🔄 [MEMORY LEAK FIX] Using ResourceManager for scroll tracking');
      this.setupScrollTrackingWithResourceManager();
      return;
    }

    // Fallback to old system (with memory leaks warning)
    console.warn('🚨 [MEMORY LEAK WARNING] No ResourceManager available - using old system with leaks');
    this.setupScrollTrackingLegacy();
  }

  // 🚀 MEMORY LEAK FIX: Resource-managed scroll tracking
  setupScrollTrackingWithResourceManager() {
    const resourceManager = this.lifecycleManager.resourceManager;
    let scrollTimeout;

    const scrollHandler = () => {
      const currentScrollY = window.scrollY || 0;
      const scrollDiff = currentScrollY - this.progressiveFiltering.lastScrollY;

      // Determine scroll direction
      if (Math.abs(scrollDiff) > 5) { // Ignore tiny movements
        this.progressiveFiltering.scrollDirection = scrollDiff > 0 ? 'down' : 'up';
        this.progressiveFiltering.lastScrollY = currentScrollY;

        // If progressive filtering is active, continue in the new direction
        if (this.progressiveFiltering.isActive) {
          if (scrollTimeout) {
            resourceManager.clearTimeout(scrollTimeout);
          }
          scrollTimeout = resourceManager.setTimeout(() => {
            this.continueProgressiveFiltering();
          }, 150); // Debounce scroll events
        }
      }
    };

    // Use ResourceManager for tracked event listener
    resourceManager.addEventListener(window, 'scroll', scrollHandler, { passive: true });

    // Use ResourceManager for tracked interval (prevents runaway intervals)
    resourceManager.setInterval(() => {
      this.checkProgressiveFilteringHealth();
    }, 15000); // Check every 15 seconds (less frequent than old system)

    console.log('✅ [MEMORY LEAK FIX] Progressive filtering scroll tracking enabled with resource management');
  }

  // 🚨 MEMORY LEAK WARNING: Legacy scroll tracking (creates untracked resources)
  setupScrollTrackingLegacy() {
    console.error('🚨 [MEMORY LEAK] Creating untracked event listeners and intervals!');

    let scrollTimeout;

    const scrollHandler = () => {
      const currentScrollY = window.scrollY || 0;
      const scrollDiff = currentScrollY - this.progressiveFiltering.lastScrollY;

      if (Math.abs(scrollDiff) > 5) {
        this.progressiveFiltering.scrollDirection = scrollDiff > 0 ? 'down' : 'up';
        this.progressiveFiltering.lastScrollY = currentScrollY;

        if (this.progressiveFiltering.isActive) {
          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            this.continueProgressiveFiltering();
          }, 150);
        }
      }
    };

    // WARNING: This creates untracked event listener (memory leak)
    window.addEventListener('scroll', scrollHandler, { passive: true });

    // WARNING: This creates untracked interval (memory leak)
    setInterval(() => {
      this.checkProgressiveFilteringHealth();
    }, 15000);

    console.error('❌ [MEMORY LEAK] Legacy scroll tracking enabled with untracked resources');
  }

  // 🚀 PROGRESSIVE FILTERING: Health check (improved to prevent infinite loops)
  checkProgressiveFilteringHealth() {
    if (!this.progressiveFiltering || !this.progressiveFiltering.isActive) {
      return; // Not active, nothing to check
    }

    try {
      // Check if progressive filtering has been stuck for too long
      const maxBatches = 50; // Reduced from 100 to catch issues earlier
      if (this.progressiveFiltering.currentBatch > maxBatches) {
        console.warn(`⚠️ Progressive filtering stuck at batch ${this.progressiveFiltering.currentBatch}, stopping...`);

        // Just stop, don't automatically restart (prevents infinite loops)
        this.stopProgressiveFiltering();

        console.log('🛑 Progressive filtering stopped due to health check - manual restart required');
      }
    } catch (error) {
      console.error('❌ Health check error:', error);
    }
  }

  // 🚀 PROGRESSIVE FILTERING: Filter only visible viewport content first
  async filterViewportContent() {
    console.time('⚡ Viewport Content Filtering');

    try {
      // Find all grids (use optimized method, not comprehensive)
      this.gridManager.findAllGridContainers(false);
      const allGrids = this.gridManager.getAllGrids();

      // Filter to only grids visible in viewport
      const viewportGrids = allGrids.filter(grid => this.isInViewport(grid.element));

      const viewportKey = this.getViewportKey();
      const wasAlreadyProcessed = this.progressiveFiltering.processedViewports.has(viewportKey);

      console.log(`⚡ Found ${viewportGrids.length} grids in viewport out of ${allGrids.length} total`);
      console.log(`📍 Current viewport key: ${viewportKey} (previously processed: ${wasAlreadyProcessed})`);

      if (viewportGrids.length === 0) {
        console.log('⚡ No viewport grids found for immediate filtering');
        return;
      }

      // 🚀 CRITICAL FIX: Process viewport grids even if "processed" before
      // Because we cleared processedViewports when new filters were added
      console.log('⚡ Processing viewport grids with current filter set...');
      await this.processGridBatch(viewportGrids, 'viewport');

      // Mark this viewport area as processed with current filter set
      this.progressiveFiltering.processedViewports.add(viewportKey);

      console.timeEnd('⚡ Viewport Content Filtering');
      console.log(`✅ Viewport filtering complete: processed ${viewportGrids.length} grids (marked viewport ${viewportKey} as processed)`);

    } catch (error) {
      console.error('❌ Viewport filtering failed:', error);
    }
  }

  // 🚀 PROGRESSIVE FILTERING: Start background progressive filtering
  startProgressiveFiltering() {
    if (this.progressiveFiltering.isActive) {
      this.stopProgressiveFiltering();
    }

    this.progressiveFiltering.isActive = true;
    this.progressiveFiltering.currentBatch = 0;

    console.log('🔄 Starting progressive background filtering...');

    // Start processing in next tick to not block viewport filtering
    setTimeout(() => {
      this.continueProgressiveFiltering();
    }, 100);
  }

  // 🚀 PROGRESSIVE FILTERING: Continue filtering in scroll direction
  async continueProgressiveFiltering() {
    if (!this.progressiveFiltering.isActive || this.isDisabled) {
      console.log(`🔄 Progressive filtering skipped: active=${this.progressiveFiltering.isActive}, disabled=${this.isDisabled}`);
      return;
    }

    try {
      console.log(`🔄 Progressive batch ${this.progressiveFiltering.currentBatch + 1} (direction: ${this.progressiveFiltering.scrollDirection})`);

      // Get all grids
      this.gridManager.findAllGridContainers(false);
      const allGrids = this.gridManager.getAllGrids();

      console.log(`📊 Found ${allGrids.length} total grids for progressive processing`);

      // Filter grids based on scroll direction and what we haven't processed
      const targetGrids = this.getNextProgressiveGridBatch(allGrids);

      console.log(`🎯 Selected ${targetGrids.length} grids for this batch (direction: ${this.progressiveFiltering.scrollDirection})`);

      if (targetGrids.length === 0) {
        // 🚀 BUG FIX: Don't stop immediately, try switching to comprehensive mode
        console.log('🔄 No grids in current direction, trying comprehensive scan...');

        // Try to find ANY unprocessed grids
        const comprehensiveTargets = this.getComprehensiveGridBatch(allGrids);

        if (comprehensiveTargets.length === 0) {
          console.log('🏁 Progressive filtering complete - truly no more grids to process');
          this.stopProgressiveFiltering();
          return;
        } else {
          console.log(`🔍 Found ${comprehensiveTargets.length} grids in comprehensive scan`);
          await this.processGridBatch(comprehensiveTargets, `comprehensive-${this.progressiveFiltering.currentBatch}`);
        }
      } else {
        // Process normal directional batch
        await this.processGridBatch(targetGrids, `batch-${this.progressiveFiltering.currentBatch}`);
      }

      this.progressiveFiltering.currentBatch++;

      // 🚀 BUG FIX: Continue more aggressively, don't give up easily
      // Schedule next batch with a small delay to keep UI responsive
      if (this.progressiveFiltering.isActive) {
        setTimeout(() => {
          this.continueProgressiveFiltering();
        }, 200);
      }

    } catch (error) {
      console.error('❌ Progressive filtering batch failed:', error);
      console.log(`🔧 Error details: ${error.message}`);
      console.log(`📊 State: active=${this.progressiveFiltering.isActive}, batch=${this.progressiveFiltering.currentBatch}`);

      // 🚀 BUG FIX: Don't stop on single error, retry with exponential backoff
      if (this.progressiveFiltering.isActive && this.progressiveFiltering.currentBatch < 50) {
        const retryDelay = Math.min(1000 * Math.pow(2, Math.min(this.progressiveFiltering.currentBatch % 5, 4)), 5000);
        console.log(`🔄 Retrying progressive filtering in ${retryDelay}ms...`);
        setTimeout(() => {
          this.continueProgressiveFiltering();
        }, retryDelay);
      } else {
        console.log('🛑 Too many errors or batches, stopping progressive filtering');
        this.stopProgressiveFiltering();
      }
    }
  }

  // 🚀 PROGRESSIVE FILTERING: Get next batch of grids based on scroll direction
  getNextProgressiveGridBatch(allGrids) {
    const viewportHeight = window.innerHeight;
    const currentScrollY = window.scrollY;
    const batchSize = this.progressiveFiltering.batchSize;

    // Filter grids by direction and processing status
    const candidateGrids = allGrids.filter(grid => {
      const rect = grid.element.getBoundingClientRect();
      const elementY = rect.top + currentScrollY;

      // 🚀 CRITICAL FIX: Check if already processed with current filter set
      // Since we clear processedViewports when filters change, this now works correctly
      const elementViewportKey = Math.floor(elementY / viewportHeight);
      if (this.progressiveFiltering.processedViewports.has(elementViewportKey.toString())) {
        return false; // Skip only if processed with current filter set
      }

      // Filter by scroll direction
      if (this.progressiveFiltering.scrollDirection === 'down') {
        return elementY > currentScrollY + viewportHeight; // Below viewport
      } else if (this.progressiveFiltering.scrollDirection === 'up') {
        return elementY < currentScrollY; // Above viewport
      } else {
        return true; // No direction preference, process any
      }
    });

    // Sort by proximity to viewport edge in scroll direction
    candidateGrids.sort((a, b) => {
      const aRect = a.element.getBoundingClientRect();
      const bRect = b.element.getBoundingClientRect();

      if (this.progressiveFiltering.scrollDirection === 'down') {
        return aRect.top - bRect.top; // Closest to bottom first
      } else {
        return bRect.top - aRect.top; // Closest to top first
      }
    });

    // Return batch of grids
    const batch = candidateGrids.slice(0, batchSize);

    // Mark their viewport areas as processed
    batch.forEach(grid => {
      const rect = grid.element.getBoundingClientRect();
      const elementY = rect.top + currentScrollY;
      const viewportKey = Math.floor(elementY / viewportHeight);
      this.progressiveFiltering.processedViewports.add(viewportKey.toString());
    });

    return batch;
  }

  // 🚀 PROGRESSIVE FILTERING: Get any unprocessed grids (fallback when directional fails)
  getComprehensiveGridBatch(allGrids) {
    const viewportHeight = window.innerHeight;
    const batchSize = this.progressiveFiltering.batchSize;

    console.log(`🔍 Comprehensive batch: checking ${allGrids.length} grids for unprocessed content`);

    // Find ANY grids that haven't been processed yet
    const candidateGrids = allGrids.filter(grid => {
      const rect = grid.element.getBoundingClientRect();
      const elementY = rect.top + window.scrollY;
      const elementViewportKey = Math.floor(elementY / viewportHeight);

      const isProcessed = this.progressiveFiltering.processedViewports.has(elementViewportKey.toString());
      return !isProcessed; // Only unprocessed grids
    });

    console.log(`🔍 Found ${candidateGrids.length} unprocessed grids out of ${allGrids.length} total`);

    // Sort by proximity to current viewport
    const currentScrollY = window.scrollY;
    candidateGrids.sort((a, b) => {
      const aRect = a.element.getBoundingClientRect();
      const bRect = b.element.getBoundingClientRect();
      const aDistance = Math.abs((aRect.top + currentScrollY) - currentScrollY);
      const bDistance = Math.abs((bRect.top + currentScrollY) - currentScrollY);
      return aDistance - bDistance; // Closest first
    });

    // Return batch of closest unprocessed grids
    const batch = candidateGrids.slice(0, batchSize);

    // Mark their viewport areas as processed
    batch.forEach(grid => {
      const rect = grid.element.getBoundingClientRect();
      const elementY = rect.top + window.scrollY;
      const viewportKey = Math.floor(elementY / viewportHeight);
      this.progressiveFiltering.processedViewports.add(viewportKey.toString());
    });

    console.log(`🔍 Comprehensive batch selected ${batch.length} closest unprocessed grids`);
    return batch;
  }

  // 🚀 PROGRESSIVE FILTERING: Process a batch of grids
  async processGridBatch(grids, batchName) {
    if (grids.length === 0) return;

    console.time(`🔧 Process Batch: ${batchName}`);

    // 🚀 CRITICAL FIX: Get current filter criteria with actual filter words!
    const filterCriteria = this.getCurrentFilterCriteria();
    console.log(`🎯 [BATCH ${batchName}] Processing with ${filterCriteria.allFilterWords.length} filter words:`, filterCriteria.allFilterWords);

    const gridStructure = {
      timestamp: new Date().toISOString(),
      totalGrids: 0,
      grids: []
    };

    let skippedAlreadyHidden = 0;

    for (const grid of grids) {
      const childrenToAnalyze = [];

      for (const child of grid.children) {
        // 🚀 CRITICAL FIX: Skip content already blocked by other filters
        const elementState = this.elementEffects.getElementState(child.element);
        if (elementState && elementState.hidden === true) {
          skippedAlreadyHidden++;
          continue; // Skip already hidden content - don't reprocess
        }

        // 🚀 CRITICAL FIX: Pass filter criteria to check against current filter words!
        const autoDeleteResult = this.contentFingerprint.checkForAutoDelete(child.element, filterCriteria);

        if (autoDeleteResult.shouldDelete) {
          const hidingMethod = this.configManager.getHidingMethod();
          const hiddenCount = this.elementEffects.hideElements([{
            id: child.id,
            element: child.element
          }], hidingMethod);

          if (hiddenCount > 0) {
            const toastEnabled = await this.isToastEnabled();
            if (toastEnabled) {
              this.notificationManager.incrementBlockedCount(hiddenCount);
            }
            this.messageHandler.sendMessageToBackground({
              type: MESSAGE_TYPES.CONTENT_BLOCKED,
              blockedCount: hiddenCount,
              currentUrl: window.location.href,
            });
          }
        } else if (!this.contentFingerprint.checkFingerprintExists(child.element)) {
          childrenToAnalyze.push(child);
        }
      }

      if (childrenToAnalyze.length > 0) {
        gridStructure.grids.push({
          id: grid.id,
          totalChildren: childrenToAnalyze.length,
          gridText: grid.element.innerText,
          children: childrenToAnalyze.map(child => ({
            id: child.id,
            text: child.text
          }))
        });
      }
    }

    gridStructure.totalGrids = gridStructure.grids.length;

    if (gridStructure.totalGrids > 0) {
      const trimmedStructure = this.trimGridForBackend(gridStructure);
      await this.sendGridStructureForAnalysis(trimmedStructure);

      // Store fingerprints
      for (const gridData of gridStructure.grids) {
        const grid = this.gridManager.getGridById(gridData.id);
        if (grid) {
          const elementsToStore = [];
          for (const childData of gridData.children) {
            const child = grid.children.find(c => c.id === childData.id);
            if (child && child.element) {
              elementsToStore.push(child.element);
            }
          }
          if (elementsToStore.length > 0) {
            this.contentFingerprint.storeFingerprints(elementsToStore);
          }
        }
      }
    }

    console.timeEnd(`🔧 Process Batch: ${batchName}`);
    console.log(`✅ Processed batch "${batchName}": ${gridStructure.totalGrids} grids with analysis data`);
    if (skippedAlreadyHidden > 0) {
      console.log(`⏭️ Skipped ${skippedAlreadyHidden} already hidden elements (performance optimization)`);
    }
  }

  // 🚀 PROGRESSIVE FILTERING: Stop progressive filtering
  stopProgressiveFiltering() {
    if (this.progressiveFiltering.isActive) {
      this.progressiveFiltering.isActive = false;
      console.log('🛑 Progressive filtering stopped');
    }
    // 🚀 BUG FIX: Reset state completely to prevent issues
    this.resetProgressiveFilteringState();
  }

  // 🚀 PROGRESSIVE FILTERING: Reset state to prevent bugs
  resetProgressiveFilteringState() {
    this.progressiveFiltering.currentBatch = 0;
    this.progressiveFiltering.scrollDirection = window.scrollY > this.progressiveFiltering.lastScrollY ? 'down' : 'up';
    this.progressiveFiltering.lastScrollY = window.scrollY || 0;
    console.log('🔧 Progressive filtering state reset');
  }

  // 🚀 PROGRESSIVE FILTERING: Debug state information
  logProgressiveFilteringState() {
    const pf = this.progressiveFiltering;
    console.log(`📊 Progressive Filtering State:
      - Active: ${pf.isActive}
      - Direction: ${pf.scrollDirection}
      - Current Batch: ${pf.currentBatch}
      - Processed Viewports: ${pf.processedViewports.size}
      - Last Scroll Y: ${pf.lastScrollY}
      - Current Scroll Y: ${window.scrollY}
      - Extension Disabled: ${this.isDisabled}`);

    const processedKeys = Array.from(pf.processedViewports);
    console.log(`📍 Processed viewport keys: [${processedKeys.join(', ')}]`);
  }

  // 🚀 PROGRESSIVE FILTERING: Get viewport identifier for tracking
  getViewportKey() {
    const scrollY = window.scrollY || 0;
    const viewportHeight = window.innerHeight || 600;
    return Math.floor(scrollY / viewportHeight).toString();
  }

  /**
   * Create fallback counter when TruthfulCounter is not available
   */
  createFallbackCounter() {
    return {
      countBlockedElements: (elements, source) => {
        console.warn("🔄 [FALLBACK] TruthfulCounter not available, using basic counter");
        return Array.isArray(elements) ? elements.length : 0;
      },
      getCounts: () => ({
        totalBlocked: 0,
        blockedToday: 0,
        countsBySource: { autoDelete: 0, aiAnalysis: 0, manual: 0 },
        blockedElementsCount: 0
      }),
      reset: () => console.warn("🔄 [FALLBACK] TruthfulCounter reset called on fallback"),
      getDebugInfo: () => ({ fallback: true })
    };
  }

  /**
   * Create fallback lifecycle manager when ExtensionLifecycleManager is not available
   */
  createFallbackLifecycleManager() {
    return {
      isDestroyed: false,
      initialize: async () => {
        console.warn("🔄 [FALLBACK] ExtensionLifecycleManager not available, using fallback");
        return { success: false, error: "ExtensionLifecycleManager not available", fallback: true };
      },
      startProgressiveFiltering: async (options) => {
        console.warn("🔄 [FALLBACK] Progressive filtering not available");
        return { success: false, error: "ProgressiveFilteringOrchestrator not available", fallback: true };
      },
      destroy: async () => {
        this.isDestroyed = true;
        console.warn("🔄 [FALLBACK] Lifecycle manager fallback destroyed");
      }
    };
  }

  destroy() {
    this.disable();
    this.configManager.destroy();
    this.gridManager.destroy();
    this.domObserver.destroy();
    this.messageHandler.destroy();
    this.notificationManager.destroy();
    this.elementEffects.destroy();
    this.contentFingerprint.clear();
    this.eventBus.destroy();
    
    // Clean up YouTube observer and CSS
    if (this.youtubeObserver) {
      this.youtubeObserver.disconnect();
      this.youtubeObserver = null;
    }
    if (this.youtubeReapplyTimeout) {
      clearTimeout(this.youtubeReapplyTimeout);
      this.youtubeReapplyTimeout = null;
    }
    if (this.youtubeUrlMonitorInterval) {
      clearInterval(this.youtubeUrlMonitorInterval);
      this.youtubeUrlMonitorInterval = null;
    }
    // Remove any injected CSS
    this.removeHomeFeedBlockingCSS();
  }

  // 🚀 DEBUG METHODS for testing and troubleshooting
  getDebugStatus() {
    return {
      isDisabled: this.isDisabled,
      initializationErrors: this.initializationErrors,
      hasEventBus: !!this.eventBus,
      hasConfigManager: !!this.configManager,
      hasGridManager: !!this.gridManager,
      hasDOMObserver: !!this.domObserver,
      hasMessageHandler: !!this.messageHandler,
      hasNotificationManager: !!this.notificationManager,
      hasElementEffects: !!this.elementEffects,
      hasContentFingerprint: !!this.contentFingerprint,
      hasTruthfulCounter: !!this.truthfulCounter,
      architectureInitialized: this.architectureInitialized,
      lifecycleManagerStatus: this.lifecycleManager ? 'initialized' : 'not_initialized',
      currentUrl: window.location.href,
      hostname: window.location.hostname
    };
  }

  testGridDetection() {
    try {
      console.log('🧪 Testing grid detection...');
      if (!this.gridManager) {
        console.error('❌ No grid manager available');
        return { success: false, error: 'No grid manager' };
      }

      this.gridManager.findAllGridContainers();
      const grids = this.gridManager.getAllGrids();
      console.log(`✅ Found ${grids.length} grids`);

      grids.forEach((grid, index) => {
        console.log(`Grid ${index + 1}:`, {
          element: grid.element.tagName,
          children: grid.children?.length || 0,
          id: grid.id
        });
      });

      return {
        success: true,
        gridsFound: grids.length,
        grids: grids.map(g => ({
          element: g.element.tagName,
          children: g.children?.length || 0,
          id: g.id
        }))
      };
    } catch (error) {
      console.error('❌ Grid detection test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Make ExtensionController available globally for content script
window.ExtensionController = ExtensionController;
