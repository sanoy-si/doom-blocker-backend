/**
 * TruthfulCounter - Bulletproof counting system
 * Single source of truth for all blocked element counting
 */
class TruthfulCounter {
  constructor() {
    this.counts = {
      totalBlocked: 0,
      blockedToday: 0,
      lastResetDate: new Date().toDateString()
    };
    
    // Track blocked elements to prevent double counting
    this.blockedElements = new Set();
    
    // Track counts by source for debugging
    this.countsBySource = {
      autoDelete: 0,
      aiAnalysis: 0,
      manual: 0
    };
    
    this.initializeFromStorage();
  }
  
  /**
   * Initialize counts from localStorage
   */
  initializeFromStorage() {
    try {
      const stored = localStorage.getItem('topaz_truthful_counts');
      if (stored) {
        const data = JSON.parse(stored);
        this.counts = { ...this.counts, ...data.counts };
        this.blockedElements = new Set(data.blockedElements || []);
        this.countsBySource = { ...this.countsBySource, ...data.countsBySource };
        
        // Reset daily count if new day
        const today = new Date().toDateString();
        if (this.counts.lastResetDate !== today) {
          this.counts.blockedToday = 0;
          this.counts.lastResetDate = today;
          this.saveToStorage();
        }
      }
    } catch (error) {
      console.warn('Failed to load truthful counts:', error);
    }
  }
  
  /**
   * Save counts to localStorage
   */
  saveToStorage() {
    try {
      const data = {
        counts: this.counts,
        blockedElements: Array.from(this.blockedElements),
        countsBySource: this.countsBySource,
        lastSaved: Date.now()
      };
      localStorage.setItem('topaz_truthful_counts', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save truthful counts:', error);
    }
  }
  
  /**
   * Count actually blocked elements (bulletproof method)
   * @param {Array<{id: string, element: HTMLElement}>} elements - Elements that were actually hidden
   * @param {string} source - Source of blocking ('autoDelete', 'aiAnalysis', 'manual')
   * @returns {number} Number of newly blocked elements
   */
  countBlockedElements(elements, source = 'manual') {
    if (!Array.isArray(elements)) {
      return 0;
    }
    
    let newlyBlocked = 0;
    
    elements.forEach(({ id, element }) => {
      // Skip if element was already counted
      if (this.blockedElements.has(id)) {
        return;
      }
      
      // Verify element is actually hidden
      if (!this.isElementActuallyHidden(element)) {
        console.warn(`Element ${id} was not actually hidden, not counting`);
        return;
      }
      
      // Mark as blocked and count
      this.blockedElements.add(id);
      newlyBlocked++;
      this.countsBySource[source] = (this.countsBySource[source] || 0) + 1;
    });
    
    if (newlyBlocked > 0) {
      this.counts.totalBlocked += newlyBlocked;
      this.counts.blockedToday += newlyBlocked;
      this.saveToStorage();
      
      console.log(`✅ TruthfulCounter: +${newlyBlocked} blocked (${source}), Total: ${this.counts.totalBlocked}, Today: ${this.counts.blockedToday}`);
    }
    
    return newlyBlocked;
  }
  
  /**
   * Verify element is actually hidden
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} True if element is actually hidden
   */
  isElementActuallyHidden(element) {
    if (!element || !document.contains(element)) {
      return false;
    }
    
    // Check various hiding methods
    const isDisplayHidden = element.style.display === 'none';
    const isCollapsed = element.classList.contains('topaz-collapsed-element');
    const isBlurred = element.classList.contains('topaz-element-blurred');
    const hasHiddenState = element.getAttribute('data-topaz-state') === 'hidden';
    
    return isDisplayHidden || isCollapsed || isBlurred || hasHiddenState;
  }
  
  /**
   * Get current counts
   * @returns {Object} Current count data
   */
  getCounts() {
    return {
      totalBlocked: this.counts.totalBlocked,
      blockedToday: this.counts.blockedToday,
      countsBySource: { ...this.countsBySource },
      blockedElementsCount: this.blockedElements.size
    };
  }
  
  /**
   * Reset all counts (for testing/debugging)
   */
  reset() {
    this.counts = {
      totalBlocked: 0,
      blockedToday: 0,
      lastResetDate: new Date().toDateString()
    };
    this.blockedElements.clear();
    this.countsBySource = {
      autoDelete: 0,
      aiAnalysis: 0,
      manual: 0
    };
    this.saveToStorage();
    console.log('🔄 TruthfulCounter: All counts reset');
  }
  
  /**
   * Get debug information
   * @returns {Object} Debug data
   */
  getDebugInfo() {
    return {
      counts: this.counts,
      blockedElements: Array.from(this.blockedElements).slice(-10), // Last 10
      countsBySource: this.countsBySource,
      totalBlockedElements: this.blockedElements.size
    };
  }
}

// Export for use in other modules
window.TruthfulCounter = TruthfulCounter;
