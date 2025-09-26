/**
 * 🚀 CSS PERFORMANCE OPTIMIZER
 * Eliminates CSS-related performance bottlenecks through batched operations,
 * optimized selectors, and smart style injection
 */
class CSSPerformanceOptimizer {
  constructor() {
    this.debugName = 'CSSOptimizer';

    // 🚀 BATCH PROCESSING SYSTEM
    this.batchOperations = {
      pending: {
        hide: new Set(),
        show: new Set(),
        addClass: new Map(),
        removeClass: new Map(),
        setStyle: new Map()
      },
      processing: false,
      rafId: null,
      maxBatchSize: 100,
      batchDelay: 16 // One frame delay for batching
    };

    // 🚀 STYLE SHEET MANAGEMENT
    this.styleSheets = {
      primary: null,          // Main performance stylesheet
      dynamic: null,          // Dynamic rules
      animations: null,       // Animation/transition rules
      emergency: null         // Emergency fallback styles
    };

    // 🚀 PERFORMANCE OPTIMIZATION
    this.optimizations = {
      selectorCache: new Map(),     // Cached optimized selectors
      styleCache: new Map(),        // Cached computed styles
      classNamePool: [],            // Reusable class names
      ruleIndex: new Map(),         // Index of existing CSS rules
      lastInjectionTime: 0
    };

    // 🚀 ELEMENT TRACKING
    this.elements = {
      hidden: new WeakSet(),        // Elements currently hidden
      styled: new WeakMap(),        // Elements with custom styles
      animated: new WeakSet(),      // Elements with animations
      processed: new WeakSet()      // Elements that have been processed
    };

    // Performance metrics
    this.metrics = {
      batchesProcessed: 0,
      elementsHidden: 0,
      elementsShown: 0,
      styleSheetsCreated: 0,
      averageBatchTime: 0,
      totalBatchTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };

    // 🚀 INITIALIZATION
    this.initializeStyleSheets();
    this.setupBatchProcessor();

    console.log(`🎨 [${this.debugName}] CSS Performance Optimizer initialized`);
  }

  /**
   * 🚀 SETUP BATCH PROCESSOR: Initialize batch processing system
   */
  setupBatchProcessor() {
    console.log(`⚡ [${this.debugName}] Setting up ultra-fast batch processor...`);

    // Initialize batch processing state
    this.batchOperations.processing = false;
    this.batchOperations.rafId = null;

    // Create throttled batch processor
    this.scheduleBatchProcessing = this.throttle(() => {
      this.processPendingBatches();
    }, this.batchOperations.batchDelay);

    console.log(`✅ [${this.debugName}] Batch processor ready for ultra-fast operations`);
  }

  /**
   * 🚀 SCHEDULE BATCH PROCESSING: Smart scheduling for optimal performance
   */
  scheduleBatchProcessing() {
    if (this.batchOperations.processing) {
      return; // Already processing
    }

    // Cancel existing RAF if scheduled
    if (this.batchOperations.rafId) {
      cancelAnimationFrame(this.batchOperations.rafId);
    }

    // Schedule for next frame
    this.batchOperations.rafId = requestAnimationFrame(() => {
      this.processPendingBatches();
    });
  }

  /**
   * 🚀 PROCESS PENDING BATCHES: Execute all pending batch operations
   */
  async processPendingBatches() {
    if (this.batchOperations.processing) {
      return;
    }

    this.batchOperations.processing = true;
    const startTime = Date.now();

    try {
      console.log(`⚡ [${this.debugName}] Processing batch operations...`);

      // Process hide operations
      if (this.batchOperations.pending.hide.size > 0) {
        await this.processBatchHideOperations();
      }

      // Process show operations
      if (this.batchOperations.pending.show.size > 0) {
        await this.processBatchShowOperations();
      }

      // Process style operations
      if (this.batchOperations.pending.setStyle.size > 0) {
        await this.processBatchStyleOperations();
      }

      // Update metrics
      const batchTime = Date.now() - startTime;
      this.metrics.batchesProcessed++;
      this.metrics.totalBatchTime += batchTime;
      this.metrics.averageBatchTime = this.metrics.totalBatchTime / this.metrics.batchesProcessed;

      console.log(`✅ [${this.debugName}] Batch processed in ${batchTime}ms`);

    } catch (error) {
      console.error(`❌ [${this.debugName}] Batch processing error:`, error);
    } finally {
      this.batchOperations.processing = false;
      this.batchOperations.rafId = null;
    }
  }

  /**
   * 🚀 PROCESS BATCH HIDE OPERATIONS
   */
  async processBatchHideOperations() {
    const hideOps = Array.from(this.batchOperations.pending.hide);
    this.batchOperations.pending.hide.clear();

    for (const { element, config } of hideOps) {
      try {
        await this.immediateHideElements([element], config);
        this.metrics.elementsHidden++;
      } catch (error) {
        console.warn(`⚠️ [${this.debugName}] Error hiding element:`, error);
      }
    }
  }

  /**
   * 🚀 PROCESS BATCH SHOW OPERATIONS
   */
  async processBatchShowOperations() {
    const showOps = Array.from(this.batchOperations.pending.show);
    this.batchOperations.pending.show.clear();

    for (const { element, config } of showOps) {
      try {
        await this.immediateShowElements([element], config);
        this.metrics.elementsShown++;
      } catch (error) {
        console.warn(`⚠️ [${this.debugName}] Error showing element:`, error);
      }
    }
  }

  /**
   * 🚀 PROCESS BATCH STYLE OPERATIONS
   */
  async processBatchStyleOperations() {
    const styleOps = Array.from(this.batchOperations.pending.setStyle);
    this.batchOperations.pending.setStyle.clear();

    for (const [element, styles] of styleOps) {
      try {
        for (const [property, value] of Object.entries(styles)) {
          element.style[property] = value;
        }
      } catch (error) {
        console.warn(`⚠️ [${this.debugName}] Error applying styles:`, error);
      }
    }
  }

  /**
   * 🚀 THROTTLE UTILITY: Prevent excessive function calls
   */
  throttle(func, delay) {
    let timeoutId = null;
    let lastExecTime = 0;

    return function(...args) {
      const currentTime = Date.now();

      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  /**
   * 🚀 HIGH-LEVEL APIS
   */

  /**
   * Hide elements with maximum performance
   * @param {Array|Element} elements - Elements to hide
   * @param {Object} options - Hiding options
   */
  hideElements(elements, options = {}) {
    const elementsArray = Array.isArray(elements) ? elements : [elements];
    const config = {
      method: options.method || 'class', // 'class', 'style', 'display'
      animate: options.animate || false,
      duration: options.duration || 200,
      batch: options.batch !== false,
      className: options.className || this.getHidingClassName(),
      ...options
    };

    if (config.batch && elementsArray.length > 1) {
      // 🚀 BATCH PROCESSING for multiple elements
      return this.batchHideElements(elementsArray, config);
    } else {
      // 🚀 IMMEDIATE PROCESSING for single elements or non-batch
      return this.immediateHideElements(elementsArray, config);
    }
  }

  /**
   * Show elements with maximum performance
   */
  showElements(elements, options = {}) {
    const elementsArray = Array.isArray(elements) ? elements : [elements];
    const config = {
      method: options.method || 'class',
      animate: options.animate || false,
      duration: options.duration || 200,
      batch: options.batch !== false,
      ...options
    };

    if (config.batch && elementsArray.length > 1) {
      return this.batchShowElements(elementsArray, config);
    } else {
      return this.immediateShowElements(elementsArray, config);
    }
  }

  /**
   * 🚀 BATCH HIDING SYSTEM
   * Groups multiple hide operations for optimal performance
   */
  batchHideElements(elements, config) {
    elements.forEach(element => {
      if (!element || this.elements.hidden.has(element)) return;

      this.batchOperations.pending.hide.add({
        element,
        config,
        timestamp: Date.now()
      });
    });

    this.scheduleBatchProcessing();
    return Promise.resolve({ batched: true, count: elements.length });
  }

  batchShowElements(elements, config) {
    elements.forEach(element => {
      if (!element || !this.elements.hidden.has(element)) return;

      this.batchOperations.pending.show.add({
        element,
        config,
        timestamp: Date.now()
      });
    });

    this.scheduleBatchProcessing();
    return Promise.resolve({ batched: true, count: elements.length });
  }

  /**
   * 🚀 IMMEDIATE PROCESSING
   * For critical operations that can't wait for batching
   */
  immediateHideElements(elements, config) {
    const results = [];

    elements.forEach(element => {
      if (!element || this.elements.hidden.has(element)) {
        results.push({ element, hidden: false, reason: 'already_hidden' });
        return;
      }

      try {
        this.applyHideOperation(element, config);
        this.elements.hidden.add(element);
        this.metrics.elementsHidden++;
        results.push({ element, hidden: true });
      } catch (error) {
        console.error(`❌ [${this.debugName}] Failed to hide element:`, error);
        results.push({ element, hidden: false, error: error.message });
      }
    });

    return { immediate: true, results };
  }

  immediateShowElements(elements, config) {
    const results = [];

    elements.forEach(element => {
      if (!element || !this.elements.hidden.has(element)) {
        results.push({ element, shown: false, reason: 'not_hidden' });
        return;
      }

      try {
        this.applyShowOperation(element, config);
        this.elements.hidden.delete(element);
        this.metrics.elementsShown++;
        results.push({ element, shown: true });
      } catch (error) {
        console.error(`❌ [${this.debugName}] Failed to show element:`, error);
        results.push({ element, shown: false, error: error.message });
      }
    });

    return { immediate: true, results };
  }

  /**
   * 🚀 BATCH PROCESSING SCHEDULER
   */
  scheduleBatchProcessing() {
    if (this.batchOperations.processing || this.batchOperations.rafId) {
      return; // Already scheduled
    }

    this.batchOperations.rafId = requestAnimationFrame(() => {
      this.processBatchOperations();
    });
  }

  async processBatchOperations() {
    if (this.batchOperations.processing) return;

    this.batchOperations.processing = true;
    this.batchOperations.rafId = null;

    const startTime = performance.now();

    try {
      // 🚀 PROCESS HIDE OPERATIONS
      const hideOperations = Array.from(this.batchOperations.pending.hide);
      if (hideOperations.length > 0) {
        await this.processBatchHideOperations(hideOperations);
        this.batchOperations.pending.hide.clear();
      }

      // 🚀 PROCESS SHOW OPERATIONS
      const showOperations = Array.from(this.batchOperations.pending.show);
      if (showOperations.length > 0) {
        await this.processBatchShowOperations(showOperations);
        this.batchOperations.pending.show.clear();
      }

      // 🚀 PROCESS OTHER OPERATIONS
      await this.processOtherBatchOperations();

    } catch (error) {
      console.error(`❌ [${this.debugName}] Batch processing error:`, error);
    } finally {
      this.batchOperations.processing = false;

      const batchTime = performance.now() - startTime;
      this.updateBatchMetrics(batchTime);

      // Schedule next batch if there are pending operations
      if (this.hasPendingOperations()) {
        this.scheduleBatchProcessing();
      }
    }
  }

  /**
   * 🚀 OPTIMIZED BATCH OPERATIONS
   */
  async processBatchHideOperations(operations) {
    if (operations.length === 0) return;

    // 🚀 GROUP BY METHOD for optimal processing
    const methodGroups = this.groupOperationsByMethod(operations);

    for (const [method, ops] of methodGroups) {
      if (method === 'class') {
        await this.batchHideByClass(ops);
      } else if (method === 'style') {
        await this.batchHideByStyle(ops);
      } else if (method === 'display') {
        await this.batchHideByDisplay(ops);
      }
    }

    console.log(`⚡ [${this.debugName}] Batch hidden ${operations.length} elements`);
  }

  async processBatchShowOperations(operations) {
    if (operations.length === 0) return;

    const methodGroups = this.groupOperationsByMethod(operations);

    for (const [method, ops] of methodGroups) {
      if (method === 'class') {
        await this.batchShowByClass(ops);
      } else if (method === 'style') {
        await this.batchShowByStyle(ops);
      } else if (method === 'display') {
        await this.batchShowByDisplay(ops);
      }
    }

    console.log(`⚡ [${this.debugName}] Batch shown ${operations.length} elements`);
  }

  /**
   * 🚀 METHOD-SPECIFIC BATCH PROCESSING
   */
  async batchHideByClass(operations) {
    // 🚀 OPTIMIZED: Single CSS rule injection for all elements
    const className = operations[0].config.className;

    // Ensure CSS rule exists
    await this.ensureHidingRule(className);

    // 🚀 BATCH CLASS ADDITION (most efficient)
    operations.forEach(({ element }) => {
      if (element && !this.elements.hidden.has(element)) {
        element.classList.add(className);
        this.elements.hidden.add(element);
        this.metrics.elementsHidden++;
      }
    });
  }

  async batchHideByStyle(operations) {
    // 🚀 BATCH STYLE CHANGES to minimize reflows
    const styleChanges = new Map();

    operations.forEach(({ element, config }) => {
      if (element && !this.elements.hidden.has(element)) {
        styleChanges.set(element, {
          originalDisplay: element.style.display || '',
          newDisplay: 'none'
        });
      }
    });

    // Apply all style changes in a single reflow
    for (const [element, { newDisplay }] of styleChanges) {
      element.style.display = newDisplay;
      this.elements.hidden.add(element);
      this.metrics.elementsHidden++;
    }
  }

  async batchHideByDisplay(operations) {
    // Similar to style method but specifically for display property
    await this.batchHideByStyle(operations);
  }

  /**
   * 🚀 CSS RULE MANAGEMENT
   */
  async ensureHidingRule(className) {
    const ruleKey = `hide-${className}`;

    if (this.optimizations.ruleIndex.has(ruleKey)) {
      this.optimizations.cacheHits++;
      return; // Rule already exists
    }

    this.optimizations.cacheMisses++;

    // 🚀 INJECT OPTIMIZED CSS RULE
    const cssRule = `.${className} { display: none !important; visibility: hidden !important; }`;

    await this.injectCSSRule(cssRule, this.styleSheets.primary);
    this.optimizations.ruleIndex.set(ruleKey, true);

    console.log(`📝 [${this.debugName}] Injected hiding rule for ${className}`);
  }

  async injectCSSRule(cssRule, styleSheet) {
    try {
      if (!styleSheet) {
        styleSheet = this.styleSheets.primary;
      }

      if (styleSheet.insertRule) {
        styleSheet.insertRule(cssRule, styleSheet.cssRules.length);
      } else if (styleSheet.addRule) {
        // IE fallback
        const parts = cssRule.match(/^([^{]+)\{([^}]+)\}$/);
        if (parts) {
          styleSheet.addRule(parts[1].trim(), parts[2].trim());
        }
      }
    } catch (error) {
      console.warn(`⚠️ [${this.debugName}] Failed to inject CSS rule:`, error);
    }
  }

  /**
   * 🚀 STYLESHEET INITIALIZATION
   */
  initializeStyleSheets() {
    // 🚀 CREATE PERFORMANCE STYLESHEETS
    this.styleSheets.primary = this.createStyleSheet('topaz-performance-primary');
    this.styleSheets.dynamic = this.createStyleSheet('topaz-performance-dynamic');
    this.styleSheets.animations = this.createStyleSheet('topaz-performance-animations');

    // 🚀 INJECT BASE PERFORMANCE RULES
    this.injectBaseRules();

    console.log(`📄 [${this.debugName}] Performance stylesheets initialized`);
  }

  createStyleSheet(id) {
    // Check if stylesheet already exists
    let existingSheet = document.getElementById(id);
    if (existingSheet) {
      return existingSheet.sheet;
    }

    const style = document.createElement('style');
    style.id = id;
    style.type = 'text/css';

    // 🚀 PERFORMANCE OPTIMIZATION: Add to head for faster processing
    document.head.appendChild(style);

    this.metrics.styleSheetsCreated++;
    return style.sheet;
  }

  injectBaseRules() {
    // 🚀 BASE PERFORMANCE RULES
    const baseRules = [
      // Fast hiding classes
      '.topaz-hide { display: none !important; visibility: hidden !important; }',
      '.topaz-fade-out { opacity: 0 !important; pointer-events: none !important; }',
      '.topaz-blur { filter: blur(10px) !important; pointer-events: none !important; }',

      // Performance optimizations
      '.topaz-processing { contain: layout style paint !important; }',
      '.topaz-animate { will-change: opacity, transform !important; }'
    ];

    baseRules.forEach(rule => {
      this.injectCSSRule(rule, this.styleSheets.primary);
    });
  }

  /**
   * 🚀 UTILITY METHODS
   */
  getHidingClassName() {
    // Return optimized hiding class name
    return 'topaz-hide';
  }

  applyHideOperation(element, config) {
    switch (config.method) {
      case 'class':
        element.classList.add(config.className);
        break;
      case 'style':
        element.style.display = 'none';
        break;
      case 'display':
        element.style.display = 'none';
        break;
      default:
        element.classList.add(this.getHidingClassName());
    }

    if (config.animate) {
      this.applyHideAnimation(element, config);
    }
  }

  applyShowOperation(element, config) {
    switch (config.method) {
      case 'class':
        element.classList.remove(config.className);
        break;
      case 'style':
        element.style.display = '';
        break;
      case 'display':
        element.style.display = '';
        break;
      default:
        element.classList.remove(this.getHidingClassName());
    }

    if (config.animate) {
      this.applyShowAnimation(element, config);
    }
  }

  applyHideAnimation(element, config) {
    // 🚀 OPTIMIZED ANIMATIONS
    element.style.transition = `opacity ${config.duration}ms ease-out`;
    element.style.opacity = '0';

    setTimeout(() => {
      element.style.display = 'none';
    }, config.duration);
  }

  applyShowAnimation(element, config) {
    element.style.display = '';
    element.style.opacity = '0';
    element.style.transition = `opacity ${config.duration}ms ease-in`;

    requestAnimationFrame(() => {
      element.style.opacity = '';
    });
  }

  groupOperationsByMethod(operations) {
    const groups = new Map();

    operations.forEach(op => {
      const method = op.config.method || 'class';
      if (!groups.has(method)) {
        groups.set(method, []);
      }
      groups.get(method).push(op);
    });

    return groups;
  }

  hasPendingOperations() {
    return this.batchOperations.pending.hide.size > 0 ||
           this.batchOperations.pending.show.size > 0 ||
           this.batchOperations.pending.addClass.size > 0 ||
           this.batchOperations.pending.removeClass.size > 0;
  }

  processOtherBatchOperations() {
    // Process addClass, removeClass, setStyle operations
    // Implementation similar to hide/show operations
  }

  /**
   * 🚀 PERFORMANCE MONITORING
   */
  updateBatchMetrics(batchTime) {
    this.metrics.batchesProcessed++;
    this.metrics.totalBatchTime += batchTime;
    this.metrics.averageBatchTime = this.metrics.totalBatchTime / this.metrics.batchesProcessed;

    if (batchTime > 16) {
      console.warn(`⚠️ [${this.debugName}] Slow batch processing: ${batchTime.toFixed(2)}ms`);
    }
  }

  getPerformanceStats() {
    const cacheHitRate = this.optimizations.cacheHits /
      (this.optimizations.cacheHits + this.optimizations.cacheMisses) * 100;

    return {
      elements: {
        hidden: this.metrics.elementsHidden,
        shown: this.metrics.elementsShown
      },
      batching: {
        batchesProcessed: this.metrics.batchesProcessed,
        averageBatchTime: this.metrics.averageBatchTime.toFixed(2) + 'ms',
        pendingOperations: this.hasPendingOperations() ? 'Yes' : 'No'
      },
      caching: {
        hitRate: cacheHitRate.toFixed(1) + '%',
        rulesCreated: this.optimizations.ruleIndex.size,
        styleSheetsCreated: this.metrics.styleSheetsCreated
      },
      performance: this.metrics
    };
  }

  /**
   * 🚀 CLEANUP
   */
  destroy() {
    // Cancel any pending batch processing
    if (this.batchOperations.rafId) {
      cancelAnimationFrame(this.batchOperations.rafId);
    }

    // Clear all pending operations
    Object.keys(this.batchOperations.pending).forEach(key => {
      this.batchOperations.pending[key].clear();
    });

    // Remove stylesheets
    ['primary', 'dynamic', 'animations', 'emergency'].forEach(sheetType => {
      const sheetId = `topaz-performance-${sheetType}`;
      const sheet = document.getElementById(sheetId);
      if (sheet) {
        sheet.remove();
      }
    });

    console.log(`🗑️ [${this.debugName}] CSS Performance Optimizer destroyed`);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CSSPerformanceOptimizer;
} else if (typeof window !== 'undefined') {
  window.CSSPerformanceOptimizer = CSSPerformanceOptimizer;
}// Make CSSPerformanceOptimizer available globally for content script
window.CSSPerformanceOptimizer = CSSPerformanceOptimizer;
