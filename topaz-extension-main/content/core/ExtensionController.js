
class ExtensionController {
  constructor() {
    this.isDisabled = false;
    this.analysisTimeout = null;
    this.eventBus = new EventBus();
    this.configManager = new ConfigManager(this.eventBus);
    this.gridManager = new GridManager();
    this.domObserver = new DOMObserver(this.eventBus);
    this.messageHandler = new MessageHandler(this.eventBus);
    this.notificationManager = new NotificationManager();
    this.elementEffects = new ElementEffects();
    this.contentFingerprint = new ContentFingerprint();
    this.elementsAnalyzedInCurrentCycle = new Map(); // Track elements sent for analysis
    
    // Initialize bulletproof counting system
    this.truthfulCounter = new TruthfulCounter();
    // Track preview state and items for toggle preview feature
    this.previewState = { enabled: false, items: [] };
    this.previewProcessing = false; // prevent overlapping preview toggles
    // Initialize session manager for analytics
    this.sessionManager = window.DoomBlockerSessionManager;
    // Initialize logger if available
    try {
      this.logger = window.DoomBlockerLogger ? new window.DoomBlockerLogger('DoomBlocker:Content') : null;
    } catch (_) {
      this.logger = null;
    }
    this.setupEventListeners();
    this.messageHandler.setupMessageListener();

    // Initialize session on first load
    this.initializeUserSession();

    // FIXED: Removed automatic preview disabling on visibility changes
    // This was causing the preview state to reset when opening the extension popup
    // Now preview state will persist until manually toggled by the user
    try {
      // Only disable preview when navigating away from the page (not when tab becomes hidden)
      window.addEventListener('pagehide', () => {
        if (this.previewState?.enabled) {
          this.handleTogglePreviewHidden(false, null).catch(() => {});
        }
      });
    } catch (_) {}
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
    this.eventBus.emit(EVENTS.EXTENSION_ENABLED);
  }

  async disable(revive = true) {
    this.isDisabled = true;
    this.domObserver.stopObserving();
    this.clearAnalysisTimeout();
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

  async performInitialExtraction() {
    console.log("🔍 [TOPAZ DEBUG] performInitialExtraction() started");
    
    // Clear tracking of analyzed elements for new cycle
    this.elementsAnalyzedInCurrentCycle.clear();
    
    const analysisRequired = await this.checkAnalysisRequired();
    console.log("🔍 [TOPAZ DEBUG] checkAnalysisRequired result:", analysisRequired);
    if (!analysisRequired) {
      console.log("🔍 [TOPAZ DEBUG] Analysis not required, exiting performInitialExtraction");
      return;
    }
    console.log("🔍 [TOPAZ DEBUG] Analysis required, proceeding with extraction");
    
    console.log("🔍 [TOPAZ DEBUG] Finding all grid containers");
    console.time("[blur timing debug] DOM content loaded to blur completion");
    this.gridManager.findAllGridContainers();

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
        const autoDeleteResult = this.contentFingerprint.checkForAutoDelete(child.element);
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
        const autoDeleteResult = this.contentFingerprint.checkForAutoDelete(child.element);

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
        const autoDeleteResult = this.contentFingerprint.checkForAutoDelete(child.element);

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
        const autoDeleteResult = this.contentFingerprint.checkForAutoDelete(child.element);

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
    
    const elementsToHide = this.gridManager.getElementsToHide(gridInstructions);
    console.log("🔍 [TOPAZ DEBUG] New elements to hide:", elementsToHide.length);
    
    // Create a set of element IDs that should be hidden based on new instructions
    const elementsToHideIds = new Set(elementsToHide.map(el => el.id));
    
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
          const autoDeleteResult = this.contentFingerprint.checkForAutoDelete(analyzedElement.element);
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

    if (elementsToHide.length > 0) {
      const deletionResults = this.contentFingerprint.markFingerprintsAsDeleted(
        elementsToHide.map(el => el.element)
      );
      
      // NEW: Blur elements that are about to be removed for better UX
      console.log("🔍 [TOPAZ DEBUG] Blurring elements about to be removed:", elementsToHide.length);
      this.elementEffects.blurElements(elementsToHide);
      
      // Wait a moment for user to see the blur effect before hiding
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    const hidingMethod = this.configManager.getHidingMethod();
    const markedCount = this.elementEffects.hideElements(
      elementsToHide,
      hidingMethod,
    );

    if (markedCount > 0) {
      // Use truthful counter to count only actually blocked elements
      const actuallyBlockedCount = this.truthfulCounter.countBlockedElements(
        elementsToHide, 
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

  // 🚀 INSTANT FILTERING: Handle instant filter requests from popup
  async handleInstantFilter(sendResponse) {
    console.log('🔄 Instant filtering requested - re-analyzing current page...');
    
    try {
      if (this.isDisabled) {
        console.log('❌ Extension is disabled, cannot perform instant filtering');
        sendResponse(this.messageHandler.createResponse(false, "Extension is disabled"));
        return;
      }

      // Clear any existing analysis timeout
      this.clearAnalysisTimeout();
      
      // Restore all currently hidden elements first
      await this.elementEffects.restoreAllElements();

      // FAST PATH: analyze visible content first to provide instant feedback
      console.log('⚡ Performing quick analysis for visible content...');
      await this.quickAnalyzeVisible();

      // Then run the full extraction to catch everything else
      console.log('🔄 Re-running full content analysis with updated filters...');
      await this.performInitialExtraction();
      
      console.log('✅ Instant filtering completed successfully');
      sendResponse(this.messageHandler.createResponse(true, "Instant filtering completed"));
      
    } catch (error) {
      console.error('❌ Instant filtering failed:', error);
      sendResponse(this.messageHandler.createResponse(false, `Instant filtering failed: ${error.message}`));
    }
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
  async quickAnalyzeVisible() {
    try {
      // Build/refresh grid information
      this.gridManager.findAllGridContainers();
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
          const autoDeleteResult = this.contentFingerprint.checkForAutoDelete(child.element);
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
      if (!this.sessionManager || blockedItemDetails.length === 0) return;

      const sessionId = this.sessionManager.getSessionId();
      if (!sessionId) return;

      console.log('🚀 Sending blocked items directly to backend:', blockedItemDetails);

      // Get current total from background stats
      const backgroundStats = await this.getBackgroundStats();

      // Prepare blocked items data for immediate sending
      const blockedItemsData = {
        session_id: sessionId,
        blocked_items: blockedItemDetails.map(item => ({
          timestamp: new Date(item.timestamp).toISOString(),
          count: 1,
          url: item.url,
          hostname: item.hostname,
          blocked_items: [{
            text: item.text,
            type: item.type,
            id: item.id
          }]
        }))
      };

      // Send blocked items immediately
      const response = await fetch('https://topaz-backend1.onrender.com/api/blocked-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockedItemsData)
      });

      if (response.ok) {
        console.log('✅ Blocked items sent to backend successfully');

        // Also update metrics with current totals
        const metricsData = {
          session_id: sessionId,
          total_blocked: backgroundStats.totalBlocked || 0,
          blocked_today: backgroundStats.blockedCount || 0,
          sites_visited: [],
          profiles_used: [],
          last_updated: new Date().toISOString()
        };

        await fetch('https://topaz-backend1.onrender.com/api/user-metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metricsData)
        });

        console.log('📊 Updated metrics with current totals');
      }

    } catch (error) {
      console.warn('⚠️ Failed to send blocked items to backend:', error);
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
   * Handle getting YouTube settings
   */
  handleYouTubeGetSettings(sendResponse) {
    try {
      const settings = {
        blockShorts: document.body.classList.contains(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN),
        blockHomeFeed: document.body.classList.contains(CSS_CLASSES.YOUTUBE_HOME_FEED_HIDDEN),
        blockComments: document.body.classList.contains(CSS_CLASSES.YOUTUBE_COMMENTS_HIDDEN)
      };
      sendResponse(this.messageHandler.createResponse(true, 'YouTube settings retrieved', { settings }));
    } catch (error) {
      sendResponse(this.messageHandler.createResponse(false, `Error getting YouTube settings: ${error.message}`));
    }
  }

  /**
   * Block/unblock YouTube Shorts
   */
  blockYouTubeShorts(enabled) {
    const shortsSelectors = [
      '#shorts-player',
      '[data-testid="shorts-player"]',
      'ytd-reel-shelf-renderer',
      'ytd-shorts',
      '#shorts-container',
      '[is="ytd-reel-shelf-renderer"]'
    ];

    shortsSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (enabled) {
          element.classList.add(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
        } else {
          element.classList.remove(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
        }
      });
    });

    // Also hide Shorts navigation items
    const shortsNavItems = document.querySelectorAll('a[href*="/shorts"]');
    shortsNavItems.forEach(item => {
      if (enabled) {
        item.classList.add(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
      } else {
        item.classList.remove(CSS_CLASSES.YOUTUBE_SHORTS_HIDDEN);
      }
    });
  }

  /**
   * Block/unblock YouTube Home Feed
   */
  blockYouTubeHomeFeed(enabled) {
    const homeFeedSelectors = [
      '#contents',
      '#primary',
      '#secondary',
      'ytd-rich-grid-renderer',
      'ytd-video-renderer',
      'ytd-grid-video-renderer',
      '#page-manager',
      '#primary-inner'
    ];

    homeFeedSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (enabled) {
          element.classList.add(CSS_CLASSES.YOUTUBE_HOME_FEED_HIDDEN);
        } else {
          element.classList.remove(CSS_CLASSES.YOUTUBE_HOME_FEED_HIDDEN);
        }
      });
    });
  }

  /**
   * Block/unblock YouTube Comments
   */
  blockYouTubeComments(enabled) {
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
  }
}
