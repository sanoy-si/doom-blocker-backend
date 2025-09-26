/**
 * 🚀 CRITICAL FIX: ViewportPriorityQueue
 * Ensures instant <200ms responses by processing viewport content first
 * Implements smart priority system and predictive processing
 */
class ViewportPriorityQueue {
  constructor(debugName = 'ViewportQueue') {
    this.debugName = debugName;

    // Priority queues (higher number = higher priority)
    this.queues = new Map([
      [1000, []], // Critical viewport content (visible now)
      [900, []],  // High priority viewport (partially visible)
      [800, []],  // Predicted content (scroll direction)
      [700, []],  // Near viewport (just outside)
      [600, []],  // High importance background
      [500, []],  // Normal background
      [400, []],  // Low priority background
      [300, []],  // Cleanup/maintenance
      [200, []],  // Very low priority
      [100, []]   // Background housekeeping
    ]);

    // Processing state
    this.isProcessing = false;
    this.processingStartTime = null;
    this.processedItems = new Set();
    this.processingSession = null;

    // Performance tracking
    this.metrics = {
      itemsProcessed: 0,
      viewportItemsProcessed: 0,
      averageProcessingTime: 0,
      instantResponses: 0, // Sub-200ms responses
      totalProcessingTime: 0,
      queueWaitTimes: new Map()
    };

    // Viewport detection
    this.viewportMargin = 100; // Extra margin for "near viewport"
    this.predictiveMargin = 300; // Margin for predictive processing

    // Scroll prediction
    this.lastScrollY = window.scrollY || 0;
    this.scrollDirection = 'none';
    this.scrollVelocity = 0;
    this.lastScrollTime = Date.now();

    // Item processing configuration
    this.maxItemsPerBatch = 3; // Keep batches small for responsiveness
    this.maxProcessingTimeMs = 50; // Stop processing after 50ms to maintain 60fps
    this.instantResponseTarget = 200; // Target <200ms for viewport items

    console.log(`⚡ [${this.debugName}] ViewportPriorityQueue initialized`);
  }

  /**
   * Add item to appropriate priority queue based on viewport visibility
   */
  addItem(item, options = {}) {
    const {
      element = null,
      processor = null,
      metadata = {},
      forceImmediate = false,
      customPriority = null
    } = options;

    if (!processor || typeof processor !== 'function') {
      console.error(`❌ [${this.debugName}] Invalid processor for item`);
      return false;
    }

    // Calculate priority based on viewport visibility
    let priority = customPriority || this.calculatePriority(element, metadata, forceImmediate);

    // Create queue item
    const queueItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      element,
      processor,
      metadata,
      priority,
      addedTime: Date.now(),
      processed: false,
      processingTime: null,
      error: null
    };

    // Add to appropriate priority queue
    const queue = this.queues.get(priority);
    if (queue) {
      queue.push(queueItem);
    } else {
      // Find closest priority level
      const availablePriorities = Array.from(this.queues.keys()).sort((a, b) => b - a);
      const closestPriority = availablePriorities.find(p => p <= priority) || availablePriorities[availablePriorities.length - 1];
      this.queues.get(closestPriority).push(queueItem);
      priority = closestPriority;
    }

    console.log(`📥 [${this.debugName}] Added item ${queueItem.id} to priority ${priority} queue`);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return queueItem.id;
  }

  /**
   * Calculate priority based on viewport visibility and other factors
   */
  calculatePriority(element, metadata = {}, forceImmediate = false) {
    if (forceImmediate) {
      return 1000; // Critical priority
    }

    if (!element) {
      return metadata.priority || 500; // Default background priority
    }

    // Check viewport visibility
    const viewportStatus = this.getViewportStatus(element);

    switch (viewportStatus) {
      case 'visible':
        return 1000; // Critical - visible now

      case 'partially-visible':
        return 900; // High - partially visible

      case 'near-viewport':
        return 700; // Medium-high - just outside viewport

      case 'predicted':
        return 800; // High - in predicted scroll path

      case 'background':
      default:
        // Background priority based on metadata
        if (metadata.important) return 600;
        if (metadata.user_generated) return 550;
        return 500; // Normal background
    }
  }

  /**
   * Determine element's viewport status
   */
  getViewportStatus(element) {
    try {
      if (!element.getBoundingClientRect) {
        return 'background';
      }

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

      // Check if visible in viewport
      if (rect.bottom >= 0 &&
          rect.top <= viewportHeight &&
          rect.right >= 0 &&
          rect.left <= viewportWidth) {

        // Check if fully or partially visible
        const visibleArea = this.calculateVisibleArea(rect, viewportWidth, viewportHeight);
        if (visibleArea > 0.5) {
          return 'visible';
        } else {
          return 'partially-visible';
        }
      }

      // Check if near viewport
      if (rect.bottom >= -this.viewportMargin &&
          rect.top <= viewportHeight + this.viewportMargin &&
          rect.right >= -this.viewportMargin &&
          rect.left <= viewportWidth + this.viewportMargin) {
        return 'near-viewport';
      }

      // Check if in predicted scroll path
      if (this.isInPredictedPath(rect, viewportHeight)) {
        return 'predicted';
      }

      return 'background';

    } catch (error) {
      console.warn(`❌ [${this.debugName}] Error calculating viewport status:`, error);
      return 'background';
    }
  }

  /**
   * Calculate visible area ratio
   */
  calculateVisibleArea(rect, viewportWidth, viewportHeight) {
    const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
    const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);

    if (visibleWidth <= 0 || visibleHeight <= 0) return 0;

    const elementArea = rect.width * rect.height;
    if (elementArea <= 0) return 0;

    const visibleArea = visibleWidth * visibleHeight;
    return visibleArea / elementArea;
  }

  /**
   * Check if element is in predicted scroll path
   */
  isInPredictedPath(rect, viewportHeight) {
    if (this.scrollDirection === 'none') return false;

    if (this.scrollDirection === 'down') {
      // Element is below current viewport within predictive margin
      return rect.top > viewportHeight && rect.top <= viewportHeight + this.predictiveMargin;
    } else if (this.scrollDirection === 'up') {
      // Element is above current viewport within predictive margin
      return rect.bottom < 0 && rect.bottom >= -this.predictiveMargin;
    }

    return false;
  }

  /**
   * Update scroll direction for predictive processing
   */
  updateScrollDirection(scrollY) {
    const now = Date.now();
    const timeDiff = now - this.lastScrollTime;

    if (timeDiff > 0) {
      const scrollDiff = scrollY - this.lastScrollY;
      this.scrollVelocity = scrollDiff / timeDiff;

      if (Math.abs(scrollDiff) > 5) { // Minimum scroll threshold
        this.scrollDirection = scrollDiff > 0 ? 'down' : 'up';
      } else if (timeDiff > 150) { // No significant scroll for 150ms
        this.scrollDirection = 'none';
      }
    }

    this.lastScrollY = scrollY;
    this.lastScrollTime = now;
  }

  /**
   * Start processing queue items
   */
  async startProcessing() {
    if (this.isProcessing) {
      return; // Already processing
    }

    this.isProcessing = true;
    this.processingStartTime = Date.now();
    this.processingSession = `session_${this.processingStartTime}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`⚡ [${this.debugName}] Starting processing session: ${this.processingSession}`);

    try {
      await this.processQueue();
    } finally {
      this.isProcessing = false;

      const totalTime = Date.now() - this.processingStartTime;
      console.log(`✅ [${this.debugName}] Processing session complete in ${totalTime}ms`);

      // Schedule next processing cycle if items remain
      if (this.hasItems()) {
        setTimeout(() => this.startProcessing(), 10); // Small delay to prevent blocking
      }
    }
  }

  /**
   * Process items from priority queues
   */
  async processQueue() {
    const startTime = Date.now();
    let processedCount = 0;
    let viewportItemsCount = 0;

    // Get priorities in descending order (highest first)
    const priorities = Array.from(this.queues.keys()).sort((a, b) => b - a);

    for (const priority of priorities) {
      const queue = this.queues.get(priority);
      if (queue.length === 0) continue;

      // Process items in this priority level
      const batchSize = priority >= 900 ? 1 : this.maxItemsPerBatch; // Viewport items get individual attention

      for (let i = 0; i < Math.min(batchSize, queue.length); i++) {
        // Check time budget
        if (Date.now() - startTime > this.maxProcessingTimeMs) {
          console.log(`⏰ [${this.debugName}] Time budget exceeded, pausing processing`);
          return;
        }

        const item = queue.shift();
        if (!item || item.processed) continue;

        try {
          const itemStartTime = Date.now();

          // Process the item
          await item.processor(item);

          const processingTime = Date.now() - itemStartTime;
          item.processingTime = processingTime;
          item.processed = true;

          this.processedItems.add(item.id);
          processedCount++;

          // Track viewport processing
          if (priority >= 900) {
            viewportItemsCount++;
            if (processingTime < this.instantResponseTarget) {
              this.metrics.instantResponses++;
            }
          }

          // Update metrics
          this.updateMetrics(item, processingTime);

          console.log(`✅ [${this.debugName}] Processed item ${item.id} in ${processingTime}ms (priority: ${priority})`);

        } catch (error) {
          item.error = error;
          console.error(`❌ [${this.debugName}] Error processing item ${item.id}:`, error);
        }
      }

      // Yield control after processing each priority level for viewport priorities
      if (priority >= 900 && processedCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Update session metrics
    this.metrics.itemsProcessed += processedCount;
    this.metrics.viewportItemsProcessed += viewportItemsCount;
    this.metrics.totalProcessingTime += Date.now() - startTime;

    if (processedCount > 0) {
      console.log(`📊 [${this.debugName}] Batch complete: ${processedCount} items (${viewportItemsCount} viewport)`);
    }
  }

  /**
   * Update processing metrics
   */
  updateMetrics(item, processingTime) {
    const waitTime = item.addedTime ? Date.now() - item.addedTime : 0;

    if (!this.metrics.queueWaitTimes.has(item.priority)) {
      this.metrics.queueWaitTimes.set(item.priority, []);
    }

    const waitTimes = this.metrics.queueWaitTimes.get(item.priority);
    waitTimes.push(waitTime);

    // Keep only recent wait times
    if (waitTimes.length > 50) {
      waitTimes.shift();
    }

    // Update average processing time
    const totalItems = this.metrics.itemsProcessed + 1;
    this.metrics.averageProcessingTime =
      (this.metrics.averageProcessingTime * (totalItems - 1) + processingTime) / totalItems;
  }

  /**
   * Check if there are items to process
   */
  hasItems() {
    return Array.from(this.queues.values()).some(queue => queue.length > 0);
  }

  /**
   * Get queue status for debugging
   */
  getQueueStatus() {
    const status = {};
    this.queues.forEach((queue, priority) => {
      status[priority] = queue.length;
    });

    return {
      queueLengths: status,
      totalItems: Array.from(this.queues.values()).reduce((sum, queue) => sum + queue.length, 0),
      isProcessing: this.isProcessing,
      processedItems: this.processedItems.size,
      metrics: this.metrics,
      scrollDirection: this.scrollDirection,
      scrollVelocity: this.scrollVelocity
    };
  }

  /**
   * Clear all queues (emergency stop)
   */
  clearAll() {
    this.queues.forEach(queue => queue.length = 0);
    this.processedItems.clear();
    this.isProcessing = false;

    console.log(`🧹 [${this.debugName}] All queues cleared`);
  }

  /**
   * Reprioritize existing items based on current viewport
   */
  reprioritize() {
    const allItems = [];

    // Collect all unprocessed items
    this.queues.forEach(queue => {
      allItems.push(...queue.filter(item => !item.processed));
      queue.length = 0; // Clear queue
    });

    // Re-add with new priorities
    let reprioritized = 0;
    for (const item of allItems) {
      const newPriority = this.calculatePriority(item.element, item.metadata);
      if (newPriority !== item.priority) {
        item.priority = newPriority;
        reprioritized++;
      }

      const queue = this.queues.get(newPriority);
      if (queue) {
        queue.push(item);
      }
    }

    if (reprioritized > 0) {
      console.log(`🔄 [${this.debugName}] Reprioritized ${reprioritized} items`);
    }

    return reprioritized;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ViewportPriorityQueue;
} else if (typeof window !== 'undefined') {
  window.ViewportPriorityQueue = ViewportPriorityQueue;
}// Make ViewportPriorityQueue available globally for content script
window.ViewportPriorityQueue = ViewportPriorityQueue;
