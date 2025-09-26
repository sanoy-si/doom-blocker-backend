class DOMObserver {
  constructor(eventBus, options = {}) {
    this.eventBus = eventBus;
    // 🚀 PERFORMANCE FIX: Increase throttle delay for better performance after scrolling
    this.throttleDelay = 500 // Delay in ms (increased from 200ms for performance)

    this.observer = null;
    this.isObserving = false;
    this.mutationsBuffer = [];
    this.throttleTimeoutId = null; // Replaces idleCallbackId

    // Add smart batching - only process mutations that add significant content
    this.lastMutationTime = 0;
    this.mutationCountThreshold = 10; // Only process if we have significant mutations

    this.handleMutations = this.handleMutations.bind(this);
    this.processMutations = this.processMutations.bind(this);
  }

  startObserving() {
    if (this.isObserving) return true;
    if (!document.body) {
      console.error("DOMObserver Error: startObserving() was called before document.body exists.");
      return false;
    }

    try {
      this.observer = new MutationObserver(this.handleMutations);
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: false
      });
      this.isObserving = true;
      console.log(`[DOMObserver] Observation started with a ${this.throttleDelay}ms throttle.`);
      return true;
    } catch (error) {
      console.error("DOMObserver failed to start:", error);
      return false;
    }
  }

  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Important: Cancel any pending timeout to prevent it from running after stop.
    if (this.throttleTimeoutId) {
      clearTimeout(this.throttleTimeoutId);
      this.throttleTimeoutId = null;
    }
    
    this.mutationsBuffer = []; // Clear the buffer on stop.
    this.isObserving = false;
  }

  /**
   * 🚀 PERFORMANCE FIX: Buffers mutations and schedules processing with smart batching.
   */
  handleMutations(mutations) {
    // Filter out mutations that don't add meaningful content
    const significantMutations = mutations.filter(mutation => {
      if (mutation.type !== 'childList') return false;

      // Only process mutations that add element nodes (not text nodes)
      const hasSignificantAddedNodes = Array.from(mutation.addedNodes).some(node =>
        node.nodeType === 1 && // Element node
        node.children && node.children.length > 0 // Has children (likely content)
      );

      return hasSignificantAddedNodes;
    });

    if (significantMutations.length === 0) {
      return; // Skip processing trivial mutations
    }

    this.mutationsBuffer.push(...significantMutations);

    // Smart batching: wait for more mutations if we're getting them rapidly
    const now = Date.now();
    const timeSinceLastMutation = now - this.lastMutationTime;
    this.lastMutationTime = now;

    // If mutations are coming rapidly (< 100ms apart), wait for more
    if (timeSinceLastMutation < 100 && this.mutationsBuffer.length < this.mutationCountThreshold) {
      if (this.throttleTimeoutId) {
        clearTimeout(this.throttleTimeoutId);
      }
      this.throttleTimeoutId = setTimeout(this.processMutations, this.throttleDelay);
      return;
    }

    // Schedule processing only if a timer isn't already pending.
    if (!this.throttleTimeoutId) {
      this.throttleTimeoutId = setTimeout(this.processMutations, this.throttleDelay);
    }
  }

  cloneMutationData(mutations) {
    // This function remains identical.
    return mutations.map(mutation => ({
      type: mutation.type,
      target: mutation.target,
      addedNodes: Array.from(mutation.addedNodes),
      removedNodes: Array.from(mutation.removedNodes),
      previousSibling: mutation.previousSibling,
      nextSibling: mutation.nextSibling,
      attributeName: mutation.attributeName,
      attributeNamespace: mutation.attributeNamespace,
      oldValue: mutation.oldValue
    }));
  }

  /**
   * 🚀 PERFORMANCE FIX: Process batched mutations efficiently.
   */
  processMutations() {
    // If observing has been stopped or the buffer is empty, just reset and exit.
    if (!this.isObserving || this.mutationsBuffer.length === 0) {
      this.throttleTimeoutId = null;
      return;
    }

    const mutationCount = this.mutationsBuffer.length;
    console.time(`🔧 DOMObserver.processMutations (${mutationCount} mutations)`);

    const clonedMutations = this.cloneMutationData(this.mutationsBuffer);
    this.mutationsBuffer = []; // Clear the buffer for the next cycle.

    // Calculate total added nodes for performance logging
    const totalAddedNodes = clonedMutations.reduce((total, mutation) =>
      total + (mutation.addedNodes ? mutation.addedNodes.length : 0), 0
    );

    console.log(`⚡ Processing ${mutationCount} significant mutations with ${totalAddedNodes} added nodes`);

    // Emit the optimized mutation data
    this.eventBus.emit(EVENTS.DOM_MUTATED, {
      mutations: clonedMutations,
      timestamp: Date.now()
    });

    console.timeEnd(`🔧 DOMObserver.processMutations (${mutationCount} mutations)`);

    // CRITICAL: Reset the timeout ID so the next mutation can schedule a new call.
    this.throttleTimeoutId = null;
  }

  isCurrentlyObserving() {
    return this.isObserving;
  }

  pause() {
    if (this.observer && this.isObserving) {
      this.observer.disconnect();
    }
  }

  resume() {
    if (this.observer && this.isObserving && document.body) {
      // Re-attaches the observer with the same configuration.
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: false
      });
    }
  }

  destroy() {
    this.stopObserving();
    this.eventBus = null;
  }
}// Make DOMObserver available globally for content script
window.DOMObserver = DOMObserver;
