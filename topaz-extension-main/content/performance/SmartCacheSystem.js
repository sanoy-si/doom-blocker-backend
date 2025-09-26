/**
 * 🚀 SMART CACHE SYSTEM
 * Eliminates redundant DOM scanning by providing intelligent caching
 * across all extension components
 */
class SmartCacheSystem {
  constructor() {
    this.debugName = 'SmartCache';

    // 🚀 MULTI-LEVEL CACHING SYSTEM
    this.cache = {
      // Level 1: Hot cache (most recent, fastest access)
      hot: {
        grids: new Map(),
        elements: new Map(),
        selectors: new Map(),
        lastUpdate: 0,
        hitCount: 0
      },

      // Level 2: Warm cache (recent, fast access)
      warm: {
        grids: new Map(),
        elements: new Map(),
        lastUpdate: 0,
        hitCount: 0
      },

      // Level 3: Cold cache (older, slower access but still cached)
      cold: {
        grids: new Map(),
        lastUpdate: 0,
        hitCount: 0
      }
    };

    // 🚀 INTELLIGENT INVALIDATION SYSTEM
    this.invalidation = {
      domObserver: null,
      lastDOMSignature: this.getDOMSignature(),
      changedElements: new Set(),
      invalidationReasons: [],
      autoInvalidateAfter: 30000, // 30 seconds max age
      smartInvalidation: true
    };

    // 🚀 PERFORMANCE OPTIMIZATION
    this.performance = {
      maxHotCacheSize: 100,
      maxWarmCacheSize: 50,
      maxColdCacheSize: 25,
      cleanupInterval: 60000,    // Cleanup every minute
      compressionThreshold: 200  // Compress when over 200 items
    };

    // Performance tracking
    this.metrics = {
      hotHits: 0,
      warmHits: 0,
      coldHits: 0,
      misses: 0,
      invalidations: 0,
      compressions: 0,
      totalSavedTime: 0
    };

    // 🚀 INITIALIZATION
    this.setupDOMObserver();
    this.startCleanupScheduler();

    console.log(`🧠 [${this.debugName}] Smart cache system initialized`);
  }

  /**
   * 🚀 MAIN API: Get cached grids or trigger scan
   */
  async getGrids(scanFunction, forceRefresh = false, cacheKey = 'default') {
    const startTime = performance.now();

    try {
      // 🚀 FORCE REFRESH: Skip cache completely
      if (forceRefresh) {
        console.log(`🔄 [${this.debugName}] Force refresh requested for ${cacheKey}`);
        return await this.executeAndCache(scanFunction, cacheKey, startTime);
      }

      // 🚀 CACHE LOOKUP: Check hot -> warm -> cold
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        const cacheTime = performance.now() - startTime;
        this.metrics.totalSavedTime += cacheTime;
        console.log(`⚡ [${this.debugName}] Cache ${cachedResult.level} hit for ${cacheKey} in ${cacheTime.toFixed(2)}ms`);
        return cachedResult.data;
      }

      // 🚀 CACHE MISS: Execute function and cache result
      this.metrics.misses++;
      console.log(`🔍 [${this.debugName}] Cache miss for ${cacheKey} - executing scan`);
      return await this.executeAndCache(scanFunction, cacheKey, startTime);

    } catch (error) {
      console.error(`❌ [${this.debugName}] Error in getGrids:`, error);
      throw error;
    }
  }

  /**
   * 🚀 INTELLIGENT CACHE LOOKUP
   * Searches hot -> warm -> cold with smart promotion
   */
  getCachedResult(cacheKey) {
    const now = Date.now();

    // 🚀 HOT CACHE CHECK (fastest)
    if (this.cache.hot.grids.has(cacheKey)) {
      const entry = this.cache.hot.grids.get(cacheKey);
      if (this.isEntryValid(entry, now)) {
        this.cache.hot.hitCount++;
        this.metrics.hotHits++;
        return { data: entry.data, level: 'hot' };
      }
    }

    // 🚀 WARM CACHE CHECK (fast)
    if (this.cache.warm.grids.has(cacheKey)) {
      const entry = this.cache.warm.grids.get(cacheKey);
      if (this.isEntryValid(entry, now)) {
        this.cache.warm.hitCount++;
        this.metrics.warmHits++;

        // 🚀 PROMOTE TO HOT: Recently accessed warm items go to hot
        this.promoteToHot(cacheKey, entry);
        return { data: entry.data, level: 'warm->hot' };
      }
    }

    // 🚀 COLD CACHE CHECK (slower but still cached)
    if (this.cache.cold.grids.has(cacheKey)) {
      const entry = this.cache.cold.grids.get(cacheKey);
      if (this.isEntryValid(entry, now)) {
        this.cache.cold.hitCount++;
        this.metrics.coldHits++;

        // 🚀 PROMOTE TO WARM: Cold hits get promoted
        this.promoteToWarm(cacheKey, entry);
        return { data: entry.data, level: 'cold->warm' };
      }
    }

    return null; // Cache miss
  }

  /**
   * 🚀 EXECUTE AND CACHE
   * Runs the expensive function and caches the result intelligently
   */
  async executeAndCache(scanFunction, cacheKey, startTime) {
    try {
      // Execute the expensive function
      const result = await scanFunction();
      const executionTime = performance.now() - startTime;

      // 🚀 CACHE THE RESULT in hot cache
      const entry = {
        data: result,
        timestamp: Date.now(),
        domSignature: this.getDOMSignature(),
        executionTime,
        accessCount: 1,
        size: Array.isArray(result) ? result.length : 1
      };

      this.cache.hot.grids.set(cacheKey, entry);
      this.cache.hot.lastUpdate = Date.now();

      console.log(`💾 [${this.debugName}] Cached ${cacheKey} in hot cache (${executionTime.toFixed(2)}ms, ${entry.size} items)`);

      // 🚀 CACHE SIZE MANAGEMENT
      this.manageCacheSize();

      return result;

    } catch (error) {
      console.error(`❌ [${this.debugName}] Failed to execute and cache:`, error);
      throw error;
    }
  }

  /**
   * 🚀 INTELLIGENT ENTRY VALIDATION
   * Smart checks for cache entry validity
   */
  isEntryValid(entry, now) {
    if (!entry || !entry.data) {
      return false;
    }

    // 🚀 AGE CHECK
    const age = now - entry.timestamp;
    if (age > this.invalidation.autoInvalidateAfter) {
      return false;
    }

    // 🚀 SMART DOM CHANGE DETECTION
    if (this.invalidation.smartInvalidation) {
      const currentSignature = this.getDOMSignature();
      if (currentSignature !== entry.domSignature) {
        // DOM changed - entry might be stale
        return false;
      }
    }

    // 🚀 ELEMENT EXISTENCE CHECK (for grid entries)
    if (Array.isArray(entry.data)) {
      // Check if some sampled elements still exist
      const sampleSize = Math.min(3, entry.data.length);
      const samples = entry.data.slice(0, sampleSize);

      for (const element of samples) {
        if (element && typeof element.contains !== 'undefined' && !document.contains(element)) {
          return false; // Element no longer in DOM
        }
      }
    }

    return true;
  }

  /**
   * 🚀 CACHE PROMOTION SYSTEM
   */
  promoteToHot(cacheKey, entry) {
    // Remove from current location and add to hot
    this.cache.warm.grids.delete(cacheKey);
    this.cache.cold.grids.delete(cacheKey);

    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.cache.hot.grids.set(cacheKey, entry);

    console.log(`📈 [${this.debugName}] Promoted ${cacheKey} to hot cache`);
  }

  promoteToWarm(cacheKey, entry) {
    // Remove from cold and add to warm
    this.cache.cold.grids.delete(cacheKey);

    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.cache.warm.grids.set(cacheKey, entry);

    console.log(`📈 [${this.debugName}] Promoted ${cacheKey} to warm cache`);
  }

  /**
   * 🚀 CACHE SIZE MANAGEMENT
   * Automatically manages cache size and promotes/demotes entries
   */
  manageCacheSize() {
    // 🚀 HOT CACHE SIZE MANAGEMENT
    if (this.cache.hot.grids.size > this.performance.maxHotCacheSize) {
      // Move least recently used entries to warm cache
      const entries = Array.from(this.cache.hot.grids.entries());

      // Sort by access count and timestamp
      entries.sort((a, b) => {
        const aEntry = a[1];
        const bEntry = b[1];
        return (aEntry.accessCount + aEntry.timestamp/1000000) - (bEntry.accessCount + bEntry.timestamp/1000000);
      });

      // Move bottom 25% to warm cache
      const moveCount = Math.floor(entries.length * 0.25);
      for (let i = 0; i < moveCount; i++) {
        const [key, entry] = entries[i];
        this.cache.hot.grids.delete(key);
        this.cache.warm.grids.set(key, entry);
      }

      console.log(`🔄 [${this.debugName}] Moved ${moveCount} entries from hot to warm cache`);
    }

    // 🚀 WARM CACHE SIZE MANAGEMENT
    if (this.cache.warm.grids.size > this.performance.maxWarmCacheSize) {
      const entries = Array.from(this.cache.warm.grids.entries());

      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const moveCount = Math.floor(entries.length * 0.5);
      for (let i = 0; i < moveCount; i++) {
        const [key, entry] = entries[i];
        this.cache.warm.grids.delete(key);
        this.cache.cold.grids.set(key, entry);
      }

      console.log(`🔄 [${this.debugName}] Moved ${moveCount} entries from warm to cold cache`);
    }

    // 🚀 COLD CACHE SIZE MANAGEMENT
    if (this.cache.cold.grids.size > this.performance.maxColdCacheSize) {
      const entries = Array.from(this.cache.cold.grids.entries());

      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest entries
      const removeCount = entries.length - this.performance.maxColdCacheSize;
      for (let i = 0; i < removeCount; i++) {
        this.cache.cold.grids.delete(entries[i][0]);
      }

      console.log(`🗑️ [${this.debugName}] Removed ${removeCount} old entries from cold cache`);
    }
  }

  /**
   * 🚀 DOM CHANGE DETECTION
   */
  getDOMSignature() {
    // Fast signature of current DOM state
    try {
      return `${document.body.childElementCount}-${document.querySelectorAll('*').length}-${window.location.pathname}`;
    } catch (error) {
      return `fallback-${Date.now()}`;
    }
  }

  /**
   * 🚀 DOM OBSERVER SETUP
   * Automatically invalidate cache when DOM changes significantly
   */
  setupDOMObserver() {
    if (!window.MutationObserver) {
      console.warn(`⚠️ [${this.debugName}] MutationObserver not supported - using fallback invalidation`);
      return;
    }

    this.invalidation.domObserver = new MutationObserver((mutations) => {
      let significantChange = false;

      for (const mutation of mutations) {
        // Check for significant changes (added/removed elements)
        if (mutation.type === 'childList' &&
            (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
          significantChange = true;
          break;
        }
      }

      if (significantChange) {
        this.invalidateStaleEntries('DOM mutation detected');
      }
    });

    // Observe with optimized settings
    this.invalidation.domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    console.log(`👁️ [${this.debugName}] DOM observer initialized for smart invalidation`);
  }

  /**
   * 🚀 SMART INVALIDATION
   */
  invalidateStaleEntries(reason = 'Manual invalidation') {
    const currentSignature = this.getDOMSignature();
    let invalidatedCount = 0;

    // Invalidate entries with old DOM signatures
    [this.cache.hot, this.cache.warm, this.cache.cold].forEach(cache => {
      const toRemove = [];

      cache.grids.forEach((entry, key) => {
        if (entry.domSignature !== currentSignature) {
          toRemove.push(key);
        }
      });

      toRemove.forEach(key => {
        cache.grids.delete(key);
        invalidatedCount++;
      });
    });

    if (invalidatedCount > 0) {
      this.metrics.invalidations++;
      this.invalidation.invalidationReasons.push({
        reason,
        count: invalidatedCount,
        timestamp: Date.now()
      });

      console.log(`🔄 [${this.debugName}] Invalidated ${invalidatedCount} stale entries: ${reason}`);
    }
  }

  /**
   * 🚀 CLEANUP SCHEDULER
   */
  startCleanupScheduler() {
    setInterval(() => {
      this.performCleanup();
    }, this.performance.cleanupInterval);
  }

  performCleanup() {
    const startTime = performance.now();

    // Clean old invalidation reasons
    const oldReasons = this.invalidation.invalidationReasons.filter(
      r => Date.now() - r.timestamp > 300000 // 5 minutes old
    );
    this.invalidation.invalidationReasons = this.invalidation.invalidationReasons.filter(
      r => Date.now() - r.timestamp <= 300000
    );

    // Update last DOM signature
    this.invalidation.lastDOMSignature = this.getDOMSignature();

    const cleanupTime = performance.now() - startTime;
    console.log(`🧹 [${this.debugName}] Cleanup completed in ${cleanupTime.toFixed(2)}ms`);
  }

  /**
   * 🚀 CACHE STATISTICS
   */
  getStatistics() {
    const totalHits = this.metrics.hotHits + this.metrics.warmHits + this.metrics.coldHits;
    const totalRequests = totalHits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests * 100) : 0;

    return {
      performance: {
        hitRate: hitRate.toFixed(1) + '%',
        totalHits,
        totalRequests,
        averageTimeSaved: totalHits > 0 ? (this.metrics.totalSavedTime / totalHits).toFixed(2) + 'ms' : '0ms'
      },
      breakdown: {
        hotHits: this.metrics.hotHits,
        warmHits: this.metrics.warmHits,
        coldHits: this.metrics.coldHits,
        misses: this.metrics.misses
      },
      cacheSize: {
        hot: this.cache.hot.grids.size,
        warm: this.cache.warm.grids.size,
        cold: this.cache.cold.grids.size
      },
      invalidations: this.metrics.invalidations,
      recentInvalidationReasons: this.invalidation.invalidationReasons.slice(-5)
    };
  }

  /**
   * 🚀 MANUAL CACHE CONTROL
   */
  clearCache(level = 'all') {
    if (level === 'all' || level === 'hot') {
      this.cache.hot.grids.clear();
    }
    if (level === 'all' || level === 'warm') {
      this.cache.warm.grids.clear();
    }
    if (level === 'all' || level === 'cold') {
      this.cache.cold.grids.clear();
    }

    console.log(`🧹 [${this.debugName}] Cleared ${level} cache`);
  }

  /**
   * 🚀 DESTRUCTION
   */
  destroy() {
    if (this.invalidation.domObserver) {
      this.invalidation.domObserver.disconnect();
    }
    this.clearCache('all');
    console.log(`🗑️ [${this.debugName}] Smart cache system destroyed`);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartCacheSystem;
} else if (typeof window !== 'undefined') {
  window.SmartCacheSystem = SmartCacheSystem;
}// Make SmartCacheSystem available globally for content script
window.SmartCacheSystem = SmartCacheSystem;
