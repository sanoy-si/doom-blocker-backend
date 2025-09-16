
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
    this.setupEventListeners();
    this.messageHandler.setupMessageListener();
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
    console.log("🔍 [TOPAZ DEBUG] ExtensionController.enable() called");
    try {
      const result = await chrome.storage.local.get(['extensionEnabled']);
      const isExtensionEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
      console.log("🔍 [TOPAZ DEBUG] Extension enabled check:", { result, isExtensionEnabled });

      if (!isExtensionEnabled) {
        console.log("🔍 [TOPAZ DEBUG] Extension is disabled globally, exiting");
        this.isDisabled = true;
        return;
      }
    } catch (error) {
      console.log("🔍 [TOPAZ DEBUG] Error checking extension enabled state:", error);
    }
    console.time("[blur timing debug] enable duration");
    this.isDisabled = false;
    
    console.log("🔍 [TOPAZ DEBUG] About to call configManager.setConfigFromUrl with:", window.location.href);
    await this.configManager.setConfigFromUrl(window.location.href);
    
    const shouldSkip = this.configManager.shouldSkipExtraction();
    console.log("🔍 [TOPAZ DEBUG] shouldSkipExtraction result:", shouldSkip);
    
    if (!shouldSkip) {
      console.log("🔍 [TOPAZ DEBUG] Proceeding with performInitialExtraction");
      await this.performInitialExtraction();
    } else {
      console.log("🔍 [TOPAZ DEBUG] Skipping extraction due to config");
    }
    this.eventBus.emit(EVENTS.EXTENSION_ENABLED);
  }

  async disable(revive = true) {
    this.isDisabled = true;
    this.domObserver.stopObserving();
    this.clearAnalysisTimeout();
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

    const elementsToBlur = this.gridManager.getElementsToBlur();
    console.log("🔍 [TOPAZ DEBUG] Elements to blur:", elementsToBlur.length);
    console.log("[blur timing debug] About to blur", elementsToBlur.length, "elements");
    // DISABLED: Blur effects are annoying, just hide content instantly
    // const blurredCount = this.elementEffects.blurElements(elementsToBlur);
    console.log("🔍 [TOPAZ DEBUG] Skipping blur effects for better UX");
    console.log("[blur timing debug] Skipped blur effects");
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
        // DISABLED: Blur effects are annoying, just hide content instantly
        // this.elementEffects.blurElements(childrenToAnalyze);

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
        // DISABLED: Blur effects are annoying, just hide content instantly
        // this.elementEffects.blurElements(childrenToAnalyze);
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
    // DISABLED: No more blur effects, so no need to clear them
    // this.analysisTimeout = setTimeout(() => {
    //   if (!this.isDisabled) {
    //     this.elementEffects.clearAllBlurs();
    //   }
    //   this.analysisTimeout = null;
    // }, TIMINGS.ANALYSIS_TIMEOUT);

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
    // DISABLED: No more blur effects
    // const clearedCount = this.elementEffects.clearAllBlurs();
    
    const elementsToHide = this.gridManager.getElementsToHide(gridInstructions);
    console.log("🔍 [TOPAZ DEBUG] New elements to hide:", elementsToHide.length);
    
    // Create a set of element IDs that should be hidden based on new instructions
    const elementsToHideIds = new Set(elementsToHide.map(el => el.id));
    
    // Find elements that were analyzed in this cycle, were previously hidden, 
    // but are NOT in the new hide instructions (should be unhidden)
    const elementsToUnhide = [];
    for (const [elementId, analyzedElement] of this.elementsAnalyzedInCurrentCycle) {
      if (analyzedElement.wasHidden && !elementsToHideIds.has(elementId)) {
        elementsToUnhide.push(analyzedElement.element);
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
    }
    const hidingMethod = this.configManager.getHidingMethod();
    const markedCount = this.elementEffects.hideElements(
      elementsToHide,
      hidingMethod,
    );

    if (markedCount > 0) {
      const toastEnabled = await this.isToastEnabled();
      if (toastEnabled) {
        console.log(`🎯 Showing toast notification: ${markedCount} items blocked`);
        this.notificationManager.incrementBlockedCount(markedCount);
      }
      this.messageHandler.sendMessageToBackground({
        type: MESSAGE_TYPES.GRID_CHILDREN_BLOCKED,
        count: markedCount,
        url: window.location.href
      });
      this.messageHandler.sendMessageToBackground({
        type: MESSAGE_TYPES.CONTENT_BLOCKED,
        blockedCount: markedCount,
        currentUrl: window.location.href,
      });
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
      
      // Re-run the initial extraction with updated settings
      console.log('🔄 Re-running content analysis with updated filters...');
      await this.performInitialExtraction();
      
      console.log('✅ Instant filtering completed successfully');
      sendResponse(this.messageHandler.createResponse(true, "Instant filtering completed"));
      
    } catch (error) {
      console.error('❌ Instant filtering failed:', error);
      sendResponse(this.messageHandler.createResponse(false, `Instant filtering failed: ${error.message}`));
    }
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
