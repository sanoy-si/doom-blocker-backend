/**
 * 🚀 ASYNC PROCESSING PIPELINE
 * Eliminates UI blocking by breaking expensive operations into non-blocking chunks
 * Maintains 60fps while processing large amounts of content
 */
class AsyncProcessingPipeline {
  constructor(resourceManager = null) {
    this.debugName = 'AsyncPipeline';
    this.resourceManager = resourceManager;

    // 🚀 PIPELINE CONFIGURATION
    this.config = {
      maxFrameTime: 16,           // Max 16ms per frame for 60fps
      maxChunkSize: 20,           // Process max 20 items per chunk
      highPriorityTime: 8,        // High priority gets 8ms per frame
      normalPriorityTime: 5,      // Normal priority gets 5ms per frame
      lowPriorityTime: 3,         // Low priority gets 3ms per frame
      idleTimeout: 100,           // Idle callback timeout
      yieldDelay: 0               // Delay between chunks (0 = immediate)
    };

    // 🚀 PRIORITY QUEUES
    this.queues = {
      critical: [],               // Viewport content (immediate)
      high: [],                   // Near viewport content
      normal: [],                 // Background content
      low: [],                    // Cleanup, analytics
      idle: []                    // When browser is completely idle
    };

    // 🚀 PROCESSING STATE
    this.state = {
      isProcessing: false,
      currentPriority: null,
      currentTask: null,
      processedCount: 0,
      totalQueued: 0,
      frameStartTime: 0,
      averageTaskTime: 5          // Rolling average task execution time
    };

    // 🚀 PERFORMANCE TRACKING
    this.metrics = {
      tasksProcessed: 0,
      totalProcessingTime: 0,
      frameDrops: 0,              // Times we exceeded 16ms
      averageFrameTime: 0,
      backgroundTasksCompleted: 0,
      criticalTasksCompleted: 0,
      queueWaitTimes: new Map()
    };

    // 🚀 SCHEDULER STATE
    this.scheduler = {
      rafId: null,
      idleId: null,
      timeoutId: null,
      isIdle: false,
      lastFrameTime: 0
    };

    console.log(`⚡ [${this.debugName}] Async processing pipeline initialized`);
    this.startScheduler();
  }

  /**
   * 🚀 MAIN API: Add task to processing queue
   * @param {Function} processor - Function to process items
   * @param {Array} items - Items to process
   * @param {string} priority - 'critical', 'high', 'normal', 'low', 'idle'
   * @param {Object} options - Processing options
   */
  async addTask(processor, items, priority = 'normal', options = {}) {
    const task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      processor,
      items: Array.isArray(items) ? items : [items],
      priority,
      options: {
        chunkSize: options.chunkSize || this.config.maxChunkSize,
        description: options.description || 'Processing task',
        onProgress: options.onProgress || null,
        onComplete: options.onComplete || null,
        onError: options.onError || null,
        timeout: options.timeout || 30000,
        ...options
      },
      state: {
        created: Date.now(),
        started: null,
        completed: null,
        processedItems: 0,
        totalItems: Array.isArray(items) ? items.length : 1,
        currentChunk: 0,
        errors: []
      }
    };

    // Add to appropriate priority queue
    if (!this.queues[priority]) {
      console.warn(`⚠️ [${this.debugName}] Invalid priority ${priority}, using 'normal'`);
      priority = 'normal';
    }

    this.queues[priority].push(task);
    this.state.totalQueued++;

    console.log(`📥 [${this.debugName}] Added ${task.options.description} (${task.state.totalItems} items) to ${priority} queue`);

    // Start processing if not already running
    if (!this.state.isProcessing) {
      this.startProcessing();
    }

    return task.id;
  }

  /**
   * 🚀 SMART SCHEDULER
   * Uses requestAnimationFrame + requestIdleCallback for optimal performance
   */
  startScheduler() {
    // 🚀 PRIMARY SCHEDULER: Process during animation frames
    const processFrame = (timestamp) => {
      this.scheduler.lastFrameTime = timestamp;
      this.state.frameStartTime = performance.now();

      if (this.hasTasksToProcess()) {
        this.processNextChunk();
      }

      // Schedule next frame
      if (this.resourceManager && this.resourceManager.requestAnimationFrame) {
        this.scheduler.rafId = this.resourceManager.requestAnimationFrame(processFrame);
      } else {
        this.scheduler.rafId = requestAnimationFrame(processFrame);
      }
    };

    // 🚀 IDLE SCHEDULER: Process low priority tasks when browser is idle
    if (window.requestIdleCallback) {
      const processIdle = (deadline) => {
        this.scheduler.isIdle = true;

        while (deadline.timeRemaining() > 0 && this.queues.idle.length > 0) {
          this.processTaskChunk(this.queues.idle.shift(), 'idle');
        }

        this.scheduler.isIdle = false;

        // Schedule next idle period
        this.scheduler.idleId = requestIdleCallback(processIdle, {
          timeout: this.config.idleTimeout
        });
      };

      this.scheduler.idleId = requestIdleCallback(processIdle, {
        timeout: this.config.idleTimeout
      });
    }

    // Start the frame scheduler
    this.scheduler.rafId = requestAnimationFrame(processFrame);
    console.log(`⏰ [${this.debugName}] Scheduler started`);
  }

  /**
   * 🚀 MAIN PROCESSING LOOP
   * Processes tasks in priority order while maintaining frame rate
   */
  processNextChunk() {
    const frameStartTime = performance.now();

    // 🚀 PRIORITY ORDER: Critical -> High -> Normal -> Low
    const priorityOrder = ['critical', 'high', 'normal', 'low'];

    for (const priority of priorityOrder) {
      const queue = this.queues[priority];
      if (queue.length === 0) continue;

      // 🚀 TIME BUDGET: Allocate time based on priority
      const timeAllocation = this.getTimeAllocation(priority);
      const availableTime = timeAllocation - (performance.now() - frameStartTime);

      if (availableTime <= 0) {
        // No time left in this frame
        break;
      }

      // Process tasks in this priority level
      while (queue.length > 0 && (performance.now() - frameStartTime) < timeAllocation) {
        const task = queue.shift();
        this.processTaskChunk(task, priority);

        // If task isn't complete, put it back in queue
        if (!this.isTaskComplete(task)) {
          queue.unshift(task);
          break; // Process more in next frame
        }
      }

      // Check if we've used our frame time budget
      const frameTime = performance.now() - frameStartTime;
      if (frameTime >= this.config.maxFrameTime) {
        if (frameTime > this.config.maxFrameTime + 2) {
          this.metrics.frameDrops++;
          console.warn(`⚠️ [${this.debugName}] Frame drop: ${frameTime.toFixed(2)}ms (target: ${this.config.maxFrameTime}ms)`);
        }
        break;
      }
    }

    // Update frame time metrics
    const totalFrameTime = performance.now() - frameStartTime;
    this.updateFrameMetrics(totalFrameTime);
  }

  /**
   * 🚀 CHUNK PROCESSOR
   * Processes a single chunk of a task
   */
  async processTaskChunk(task, priority) {
    const chunkStartTime = performance.now();

    try {
      // Mark task as started if this is the first chunk
      if (!task.state.started) {
        task.state.started = Date.now();
        this.state.currentTask = task;
        console.log(`▶️ [${this.debugName}] Started ${task.options.description} (${priority} priority)`);
      }

      // Determine chunk size based on remaining frame time and task complexity
      const remainingFrameTime = this.config.maxFrameTime - (chunkStartTime - this.state.frameStartTime);
      const adaptiveChunkSize = this.calculateAdaptiveChunkSize(task, remainingFrameTime);

      // Get items for this chunk
      const startIndex = task.state.processedItems;
      const endIndex = Math.min(startIndex + adaptiveChunkSize, task.state.totalItems);
      const chunkItems = task.items.slice(startIndex, endIndex);

      if (chunkItems.length === 0) {
        // Task is complete
        this.completeTask(task);
        return;
      }

      // 🚀 PROCESS CHUNK
      const results = [];
      for (let i = 0; i < chunkItems.length; i++) {
        const item = chunkItems[i];

        try {
          const result = await task.processor(item, {
            index: startIndex + i,
            total: task.state.totalItems,
            isLastInChunk: i === chunkItems.length - 1,
            priority
          });
          results.push(result);

        } catch (error) {
          task.state.errors.push({
            item,
            index: startIndex + i,
            error: error.message,
            timestamp: Date.now()
          });

          if (task.options.onError) {
            task.options.onError(error, item, startIndex + i);
          }
        }

        // Check for frame time budget
        const elapsed = performance.now() - chunkStartTime;
        if (elapsed > this.getTimeAllocation(priority)) {
          // We've used our time budget - save progress and continue next frame
          task.state.processedItems = startIndex + i + 1;
          task.state.currentChunk++;
          return;
        }
      }

      // Update task progress
      task.state.processedItems = endIndex;
      task.state.currentChunk++;

      // Call progress callback if provided
      if (task.options.onProgress) {
        const progress = (task.state.processedItems / task.state.totalItems) * 100;
        task.options.onProgress(progress, results, task.state.processedItems, task.state.totalItems);
      }

      // Check if task is complete
      if (task.state.processedItems >= task.state.totalItems) {
        this.completeTask(task);
      }

      const chunkTime = performance.now() - chunkStartTime;
      this.updateTaskMetrics(task, chunkTime, chunkItems.length);

    } catch (error) {
      console.error(`❌ [${this.debugName}] Error processing chunk:`, error);
      task.state.errors.push({
        error: error.message,
        timestamp: Date.now(),
        chunk: task.state.currentChunk
      });
    }
  }

  /**
   * 🚀 ADAPTIVE CHUNK SIZE CALCULATION
   * Dynamically adjusts chunk size based on performance
   */
  calculateAdaptiveChunkSize(task, remainingFrameTime) {
    // Base chunk size from task options
    let chunkSize = task.options.chunkSize;

    // Adjust based on average task processing time
    if (this.state.averageTaskTime > 0) {
      const estimatedItems = Math.floor(remainingFrameTime / this.state.averageTaskTime);
      chunkSize = Math.min(chunkSize, Math.max(1, estimatedItems));
    }

    // Adjust based on task complexity (if we have historical data)
    if (task.state.currentChunk > 0) {
      // We have some data about this task's performance
      const avgTimePerItem = this.getTotalTaskTime(task) / task.state.processedItems;
      if (avgTimePerItem > 0) {
        const estimatedItems = Math.floor(remainingFrameTime / avgTimePerItem);
        chunkSize = Math.min(chunkSize, Math.max(1, estimatedItems));
      }
    }

    return Math.min(chunkSize, task.state.totalItems - task.state.processedItems);
  }

  /**
   * 🚀 TASK COMPLETION
   */
  completeTask(task) {
    task.state.completed = Date.now();
    const totalTime = task.state.completed - task.state.started;

    console.log(`✅ [${this.debugName}] Completed ${task.options.description} in ${totalTime}ms (${task.state.processedItems}/${task.state.totalItems} items, ${task.state.errors.length} errors)`);

    // Call completion callback
    if (task.options.onComplete) {
      task.options.onComplete(task.state);
    }

    // Update metrics
    this.metrics.tasksProcessed++;
    this.metrics.totalProcessingTime += totalTime;

    if (task.priority === 'critical') {
      this.metrics.criticalTasksCompleted++;
    } else if (task.priority === 'low' || task.priority === 'idle') {
      this.metrics.backgroundTasksCompleted++;
    }

    // Clean up current task reference
    if (this.state.currentTask === task) {
      this.state.currentTask = null;
    }
  }

  /**
   * 🚀 TIME ALLOCATION SYSTEM
   */
  getTimeAllocation(priority) {
    switch (priority) {
      case 'critical': return this.config.highPriorityTime;
      case 'high': return this.config.highPriorityTime;
      case 'normal': return this.config.normalPriorityTime;
      case 'low': return this.config.lowPriorityTime;
      case 'idle': return 50; // More time during idle
      default: return this.config.normalPriorityTime;
    }
  }

  /**
   * 🚀 UTILITY METHODS
   */
  hasTasksToProcess() {
    return Object.values(this.queues).some(queue => queue.length > 0);
  }

  isTaskComplete(task) {
    return task.state.processedItems >= task.state.totalItems;
  }

  getTotalTaskTime(task) {
    return task.state.started ? (Date.now() - task.state.started) : 0;
  }

  /**
   * 🚀 METRICS UPDATES
   */
  updateTaskMetrics(task, chunkTime, itemsProcessed) {
    // Update average task time (rolling average)
    const itemTime = chunkTime / itemsProcessed;
    this.state.averageTaskTime = (this.state.averageTaskTime * 0.9) + (itemTime * 0.1);
  }

  updateFrameMetrics(frameTime) {
    this.metrics.averageFrameTime = (this.metrics.averageFrameTime * 0.95) + (frameTime * 0.05);
  }

  /**
   * 🚀 PIPELINE CONTROL
   */
  startProcessing() {
    this.state.isProcessing = true;
    console.log(`▶️ [${this.debugName}] Started processing pipeline`);
  }

  pauseProcessing() {
    this.state.isProcessing = false;
    console.log(`⏸️ [${this.debugName}] Paused processing pipeline`);
  }

  resumeProcessing() {
    this.state.isProcessing = true;
    console.log(`▶️ [${this.debugName}] Resumed processing pipeline`);
  }

  /**
   * 🚀 PERFORMANCE STATISTICS
   */
  getPerformanceStats() {
    const totalQueued = Object.values(this.queues).reduce((sum, queue) => sum + queue.length, 0);

    return {
      processing: {
        isActive: this.state.isProcessing,
        currentTask: this.state.currentTask?.options.description || 'None',
        queuedTasks: totalQueued
      },
      performance: {
        averageFrameTime: this.metrics.averageFrameTime.toFixed(2) + 'ms',
        frameDrops: this.metrics.frameDrops,
        tasksProcessed: this.metrics.tasksProcessed,
        averageTaskTime: this.state.averageTaskTime.toFixed(2) + 'ms'
      },
      queues: {
        critical: this.queues.critical.length,
        high: this.queues.high.length,
        normal: this.queues.normal.length,
        low: this.queues.low.length,
        idle: this.queues.idle.length
      },
      metrics: this.metrics
    };
  }

  /**
   * 🚀 EMERGENCY CONTROLS
   */
  clearAllQueues() {
    Object.keys(this.queues).forEach(priority => {
      this.queues[priority] = [];
    });
    console.log(`🧹 [${this.debugName}] Cleared all processing queues`);
  }

  /**
   * 🚀 DESTRUCTION
   */
  destroy() {
    this.pauseProcessing();

    // Cancel schedulers
    if (this.scheduler.rafId) {
      cancelAnimationFrame(this.scheduler.rafId);
    }
    if (this.scheduler.idleId && window.cancelIdleCallback) {
      cancelIdleCallback(this.scheduler.idleId);
    }
    if (this.scheduler.timeoutId) {
      clearTimeout(this.scheduler.timeoutId);
    }

    this.clearAllQueues();

    console.log(`🗑️ [${this.debugName}] Async processing pipeline destroyed`);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AsyncProcessingPipeline;
} else if (typeof window !== 'undefined') {
  window.AsyncProcessingPipeline = AsyncProcessingPipeline;
}// Make AsyncProcessingPipeline available globally for content script
window.AsyncProcessingPipeline = AsyncProcessingPipeline;
