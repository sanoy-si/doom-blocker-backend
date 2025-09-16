class DOMObserver {
  constructor(eventBus, options = {}) {
    this.eventBus = eventBus;
    this.throttleDelay = 200 // Delay in ms (increased for performance)

    this.observer = null;
    this.isObserving = false;
    this.mutationsBuffer = [];
    this.throttleTimeoutId = null; // Replaces idleCallbackId

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
   * Buffers mutations and schedules a single processing call using a timer.
   */
  handleMutations(mutations) {
    this.mutationsBuffer.push(...mutations);
    
    // Schedule processing only if a timer isn't already pending.
    // This is the core of the throttling mechanism.
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
   * Called by setTimeout to process the entire batch of accumulated mutations.
   */
  processMutations() {
    // If observing has been stopped or the buffer is empty, just reset and exit.
    if (!this.isObserving || this.mutationsBuffer.length === 0) {
      this.throttleTimeoutId = null;
      return;
    }

    const clonedMutations = this.cloneMutationData(this.mutationsBuffer);
    this.mutationsBuffer = []; // Clear the buffer for the next cycle.

    // Your event emitting logic remains the same.
    this.eventBus.emit(EVENTS.DOM_MUTATED, {
      mutations: clonedMutations,
      timestamp: Date.now()
    });
    
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
}