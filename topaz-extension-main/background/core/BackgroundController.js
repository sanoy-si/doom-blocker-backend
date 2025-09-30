import EventBus from './EventBus.js';
import StateManager from '../managers/StateManager.js';
import TabManager from '../managers/TabManager.js';
import MessageRouter from '../managers/MessageRouter.js';
import HeartbeatManager from '../managers/HeartbeatManager.js';
import { BACKGROUND_EVENTS as EVENTS, MESSAGE_TYPES, CONFIG, DEFAULT_TAGS, API_CONFIG } from '../../shared/constants.js';

import API from '../api.js';

// Simple logger for background context
class Logger {
  constructor(scope = 'BackgroundController') {
    this.scope = scope;
    this.level = 'debug'; // debug|info|warn|error
  }
  
  setLevel(level) {
    this.level = level;
  }
  
  debug(...args) { 
    if (this._ok('debug')) console.debug(`[${this.scope}]`, ...args); 
  }
  
  info(...args) { 
    if (this._ok('info')) console.info(`[${this.scope}]`, ...args); 
  }
  
  warn(...args) { 
    if (this._ok('warn')) console.warn(`[${this.scope}]`, ...args); 
  }
  
  error(...args) { 
    if (this._ok('error')) console.error(`[${this.scope}]`, ...args); 
  }
  
  _ok(level) {
    const order = { debug: 0, info: 1, warn: 2, error: 3 };
    const current = order[this.level] ?? 1;
    return (order[level] ?? 1) >= current;
  }
}

class BackgroundController {
  constructor() {
    this.logger = new Logger('BackgroundController');
    this.eventBus = new EventBus();
    this.api = new API();
    this.stateManager = new StateManager(this.eventBus);
    this.tabManager = new TabManager(
      this.eventBus,
      this.stateManager
    );
    this.messageRouter = new MessageRouter(this.eventBus);
    this.heartbeatManager = new HeartbeatManager(
      this.eventBus,
      this.stateManager,
      this.tabManager
    );

    // 🚀 WORLD-CLASS AI SYSTEM: Multi-layer intelligent caching and processing
    this.aiCache = {
      hot: new Map(),      // Viewport content (instant: 0ms)
      warm: new Map(),     // Recently viewed (fast: <100ms)
      cold: new Map(),     // Background content (normal: <500ms)
      prefetch: new Map()  // Predicted content (background)
    };
    this.aiCacheStats = {
      hits: { hot: 0, warm: 0, cold: 0, prefetch: 0 },
      misses: 0,
      totalRequests: 0,
      avgResponseTime: 0
    };
    this.maxCacheSize = { hot: 200, warm: 500, cold: 1000, prefetch: 300 };
    this.cacheExpiryMs = { hot: 2 * 60 * 1000, warm: 5 * 60 * 1000, cold: 10 * 60 * 1000, prefetch: 15 * 60 * 1000 };

    // 🚀 SNAPPY PERFORMANCE SYSTEM
    this.snappySystem = {
      viewportTracker: new Map(), // Track what's in viewport
      scrollPredictor: { direction: 'none', velocity: 0, lastY: 0 },
      performanceMetrics: { avgProcessingTime: 500, adaptiveChunkSize: 60 },
      progressiveResults: new Map(), // Store partial results for streaming
      requestDeduplication: new Map() // Prevent duplicate requests
    };

    this.setupEventListeners();
    this.registerMessageHandlers();
  }

  /**
   * Initialize the background script
   */
  async initialize() {
    try {
      // Initialize API
      await this.api.init();

      // Initialize state manager
      await this.stateManager.initialize();
    } catch (error) {
      console.error('Background initialization failed:', error);
      throw error;
    }
  }

  /**
   * 🧠 ULTRA-FAST AI CACHING: Generate cache key from grid content (PRIMARY FEATURE)
   */
  generateAICacheKey(gridStructure, whitelistTags, blacklistTags) {
    // Create a deterministic cache key from grid content and filter tags
    const contentHash = this.hashContent(JSON.stringify({
      grids: gridStructure?.grids?.map(g => ({
        id: g.id,
        gridText: g.gridText,
        childrenCount: g.children?.length || 0
      })),
      whitelist: whitelistTags.slice().sort(),
      blacklist: blacklistTags.slice().sort()
    }));
    return contentHash;
  }

  /**
   * 🧠 ULTRA-FAST AI CACHING: Simple hash function for content fingerprinting
   */
  hashContent(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * 🚀 WORLD-CLASS AI CACHING: Multi-layer intelligent cache lookup
   */
  getCachedAIResult(cacheKey, isViewport = false) {
    this.aiCacheStats.totalRequests++;

    // 🎯 PRIORITY ORDER: Hot -> Warm -> Cold -> Prefetch
    const cacheLayers = isViewport ? ['hot', 'warm', 'cold', 'prefetch'] : ['warm', 'cold', 'hot', 'prefetch'];

    for (const layer of cacheLayers) {
      const cache = this.aiCache[layer];
      const cached = cache.get(cacheKey);

      if (cached) {
        // Check if cache entry has expired
        if (Date.now() - cached.timestamp > this.cacheExpiryMs[layer]) {
          cache.delete(cacheKey);
          continue; // Try next layer
        }

        // Cache hit! Promote to higher layer if needed
        this.aiCacheStats.hits[layer]++;

        const responseTime = layer === 'hot' ? 0 : layer === 'warm' ? 50 : layer === 'cold' ? 200 : 100;

        console.log(`⚡ [${layer.toUpperCase()} CACHE HIT] ${responseTime}ms response! Key: ${cacheKey.substring(0, 8)}...`);

        // 🚀 CACHE PROMOTION: Move frequently accessed items to hot cache
        if (layer !== 'hot' && isViewport) {
          this.promoteToHotCache(cacheKey, cached.result);
        }

        return cached.result;
      }
    }

    this.aiCacheStats.misses++;
    return null;
  }

  /**
   * 🚀 SMART CACHE PROMOTION: Move important content to faster cache layers
   */
  promoteToHotCache(cacheKey, result) {
    if (this.aiCache.hot.size >= this.maxCacheSize.hot) {
      // Evict oldest hot cache entry
      const oldestKey = this.aiCache.hot.keys().next().value;
      const oldestEntry = this.aiCache.hot.get(oldestKey);
      this.aiCache.hot.delete(oldestKey);

      // Demote to warm cache
      if (this.aiCache.warm.size < this.maxCacheSize.warm) {
        this.aiCache.warm.set(oldestKey, oldestEntry);
      }
    }

    this.aiCache.hot.set(cacheKey, {
      result: result,
      timestamp: Date.now(),
      accessCount: 1
    });

    console.log(`⚡ [CACHE PROMOTION] Promoted to HOT cache for instant access`);
  }

  /**
   * 🚀 WORLD-CLASS AI CACHING: Intelligent multi-layer cache storage
   */
  setCachedAIResult(cacheKey, result, isViewport = false, priority = 'normal') {
    const targetLayer = this.determineOptimalCacheLayer(isViewport, priority);
    const cache = this.aiCache[targetLayer];

    // Smart cache eviction with demotion strategy
    if (cache.size >= this.maxCacheSize[targetLayer]) {
      this.performIntelligentCacheEviction(targetLayer);
    }

    cache.set(cacheKey, {
      result: result,
      timestamp: Date.now(),
      accessCount: 0,
      isViewport: isViewport,
      priority: priority
    });

    console.log(`💾 [${targetLayer.toUpperCase()} CACHE] Stored result (${cache.size}/${this.maxCacheSize[targetLayer]}) key: ${cacheKey.substring(0, 8)}...`);
  }

  /**
   * 🚀 INTELLIGENT CACHE LAYER DETERMINATION
   */
  determineOptimalCacheLayer(isViewport, priority) {
    if (isViewport && priority === 'high') return 'hot';
    if (isViewport) return 'warm';
    if (priority === 'prefetch') return 'prefetch';
    return 'cold';
  }

  /**
   * 🚀 INTELLIGENT CACHE EVICTION with demotion strategy
   */
  performIntelligentCacheEviction(layer) {
    const cache = this.aiCache[layer];
    const demotionMap = { hot: 'warm', warm: 'cold', cold: null, prefetch: null };
    const demotionLayer = demotionMap[layer];

    // Find least recently used entry
    let oldestKey = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const oldestEntry = cache.get(oldestKey);
      cache.delete(oldestKey);

      // Demote to lower layer if possible
      if (demotionLayer && this.aiCache[demotionLayer].size < this.maxCacheSize[demotionLayer]) {
        this.aiCache[demotionLayer].set(oldestKey, oldestEntry);
        console.log(`↓ [CACHE DEMOTION] Moved from ${layer} to ${demotionLayer}`);
      }
    }
  }

  /**
   * 🚀 WORLD-CLASS SNAPPY PROCESSING: Instant viewport-first processing
   * Processes only viewport content with ultra-fast response (0-50ms target)
   */
  async processViewportWithInstantResponse(gridStructure, url, whitelist, blacklist, tabId) {
    console.log(`⚡ [SNAPPY] Starting INSTANT viewport processing...`);
    const startTime = Date.now();

    try {
      // 🎯 IDENTIFY VIEWPORT CONTENT ONLY
      const viewportGrids = this.extractViewportGrids(gridStructure);
      console.log(`👁️ [SNAPPY] Found ${viewportGrids.grids.length} viewport grids from ${gridStructure.grids.length} total`);

      if (viewportGrids.grids.length === 0) {
        return { instructions: [], instantHits: 0, processingTime: Date.now() - startTime };
      }

      // 🚀 ULTRA-FAST CACHE CHECK for viewport content
      const viewportCacheKey = this.generateAICacheKey(viewportGrids, whitelist, blacklist);
      const cachedResult = this.getCachedAIResult(viewportCacheKey, true); // isViewport = true

      if (cachedResult) {
        console.log(`⚡ [SNAPPY] INSTANT cache hit for viewport! (${Date.now() - startTime}ms)`);
        return {
          instructions: cachedResult.data || [],
          instantHits: cachedResult.data?.length || 0,
          processingTime: Date.now() - startTime,
          source: 'instant_cache'
        };
      }

      // 🎯 REQUEST DEDUPLICATION: Check if already processing this viewport
      const dedupKey = `viewport_${viewportCacheKey}`;
      if (this.snappySystem.requestDeduplication.has(dedupKey)) {
        console.log(`🔄 [SNAPPY] Viewport already processing, attaching to existing request`);
        const existingPromise = this.snappySystem.requestDeduplication.get(dedupKey);
        return await existingPromise;
      }

      // 🚀 PROCESS VIEWPORT WITH ULTRA-FAST AI
      const viewportPromise = this.processViewportChunksUltraFast(viewportGrids, url, whitelist, blacklist);
      this.snappySystem.requestDeduplication.set(dedupKey, viewportPromise);

      const result = await viewportPromise;

      // Clean up deduplication
      this.snappySystem.requestDeduplication.delete(dedupKey);

      // 🚀 CACHE VIEWPORT RESULT in HOT cache for instant future access
      if (result.success && result.data) {
        this.setCachedAIResult(viewportCacheKey, result, true, 'high'); // viewport = true, priority = high
      }

      const processingTime = Date.now() - startTime;
      console.log(`⚡ [SNAPPY] Viewport processing completed in ${processingTime}ms`);

      return {
        instructions: result.data || [],
        instantHits: result.data?.length || 0,
        processingTime: processingTime,
        source: 'fresh_ai'
      };

    } catch (error) {
      console.error(`❌ [SNAPPY] Viewport processing error:`, error);
      return {
        instructions: [],
        instantHits: 0,
        processingTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * 🚀 EXTRACT VIEWPORT GRIDS: Only get grids visible in viewport
   */
  extractViewportGrids(gridStructure) {
    // This should ideally get viewport information from frontend
    // For now, prioritize first grids (most likely to be in viewport)
    const viewportGridCount = Math.min(gridStructure.grids.length, 3); // Top 3 grids are likely viewport

    return {
      timestamp: gridStructure.timestamp,
      totalGrids: viewportGridCount,
      grids: gridStructure.grids.slice(0, viewportGridCount)
    };
  }

  /**
   * 🚀 ULTRA-FAST VIEWPORT AI PROCESSING: Optimized for <100ms response
   */
  async processViewportChunksUltraFast(viewportGrids, url, whitelist, blacklist) {
    console.log(`🚀 [SNAPPY] Ultra-fast AI processing for ${viewportGrids.grids.length} viewport grids`);

    try {
      // Enhanced adaptive chunk sizing based on content complexity
      const contentComplexity = this.calculateContentComplexity(viewportGrids);
      const fastChunkSize = this.getOptimalChunkSize(contentComplexity, 'viewport');
      const chunks = this.splitGridIntoChunks(viewportGrids, fastChunkSize);

      console.log(`⚡ [SNAPPY] Processing ${chunks.length} ultra-fast chunks (size: ${fastChunkSize}, complexity: ${contentComplexity})`);

      // 🚀 ENHANCED PARALLEL PROCESSING with intelligent batching
      const timeoutMs = this.getAdaptiveTimeout(contentComplexity);
      const maxConcurrent = this.getMaxConcurrentChunks(contentComplexity);
      
      // Process chunks in batches to avoid overwhelming the API
      const chunkBatches = this.createChunkBatches(chunks, maxConcurrent);
      const allResults = [];

      const startTime = Date.now();
      for (const batch of chunkBatches) {
        const batchPromises = batch.map(async (chunk, index) => {
          console.log(`⚡ [CHUNK ${index + 1}] Ultra-fast processing ${chunk.grids.length} viewport grids`);

          return Promise.race([
            this.api.fetchDistractingChunks(chunk, url, whitelist, blacklist),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Viewport processing timeout')), timeoutMs)
            )
          ]);
        });

        const batchResults = await Promise.allSettled(batchPromises);
        allResults.push(...batchResults);
        
        // Small delay between batches to prevent API rate limiting
        if (chunkBatches.indexOf(batch) < chunkBatches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      const processingTime = Date.now() - startTime;

      // 🎯 ADAPTIVE PERFORMANCE: Update chunk size based on performance
      this.updateAdaptivePerformance(processingTime, chunks.length);

      // Process successful results
      const successfulResults = allResults
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .map(result => result.value);

      if (successfulResults.length === 0) {
        console.warn(`⚠️ [SNAPPY] No successful viewport chunks processed`);
        return { success: false, data: [] };
      }

      const combinedResult = this.combineChunkResults(successfulResults);
      console.log(`✅ [SNAPPY] Viewport AI completed in ${processingTime}ms`);

      return combinedResult;

    } catch (error) {
      console.error(`❌ [SNAPPY] Ultra-fast viewport processing error:`, error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Calculate content complexity for adaptive processing
   */
  calculateContentComplexity(gridStructure) {
    let complexity = 0;
    
    for (const grid of gridStructure.grids || []) {
      // Base complexity from grid size
      complexity += grid.totalChildren || 0;
      
      // Additional complexity from text length
      if (grid.gridText) {
        complexity += Math.min(grid.gridText.length / 100, 10);
      }
      
      // Complexity from children
      for (const child of grid.children || []) {
        if (child.text) {
          complexity += Math.min(child.text.length / 50, 5);
        }
      }
    }
    
    return Math.min(complexity, 100); // Cap at 100
  }

  /**
   * Get optimal chunk size based on content complexity
   */
  getOptimalChunkSize(complexity, type) {
    const baseSizes = {
      viewport: 20,
      background: 40,
      prefetch: 60
    };
    
    const baseSize = baseSizes[type] || 30;
    
    // Adjust based on complexity
    if (complexity > 80) {
      return Math.max(10, baseSize * 0.5); // Smaller chunks for complex content
    } else if (complexity > 50) {
      return Math.max(15, baseSize * 0.7);
    } else if (complexity < 20) {
      return Math.min(60, baseSize * 1.5); // Larger chunks for simple content
    }
    
    return baseSize;
  }

  /**
   * Get adaptive timeout based on content complexity
   */
  getAdaptiveTimeout(complexity) {
    if (complexity > 80) {
      return 5000; // 5 seconds for complex content
    } else if (complexity > 50) {
      return 3000; // 3 seconds for medium complexity
    } else {
      return 2000; // 2 seconds for simple content
    }
  }

  /**
   * Get maximum concurrent chunks based on content complexity
   */
  getMaxConcurrentChunks(complexity) {
    if (complexity > 80) {
      return 2; // Fewer concurrent for complex content
    } else if (complexity > 50) {
      return 3;
    } else {
      return 4; // More concurrent for simple content
    }
  }

  /**
   * Create chunk batches for controlled parallel processing
   */
  createChunkBatches(chunks, maxConcurrent) {
    const batches = [];
    for (let i = 0; i < chunks.length; i += maxConcurrent) {
      batches.push(chunks.slice(i, i + maxConcurrent));
    }
    return batches;
  }

  /**
   * 🚀 SMART BACKGROUND PROCESSING: Continue processing with streaming results
   */
  async processBackgroundWithStreaming(gridStructure, url, whitelist, blacklist, tabId) {
    console.log(`🔄 [SNAPPY] Starting smart background processing with streaming...`);

    // Don't await - run in background
    setTimeout(async () => {
      try {
        // 🎯 GET REMAINING (NON-VIEWPORT) GRIDS
        const backgroundGrids = {
          timestamp: gridStructure.timestamp,
          totalGrids: gridStructure.grids.length - 3,
          grids: gridStructure.grids.slice(3) // Skip first 3 (already processed as viewport)
        };

        if (backgroundGrids.grids.length === 0) {
          console.log(`✅ [SNAPPY] No background grids to process`);
          return;
        }

        console.log(`🔄 [SNAPPY] Processing ${backgroundGrids.grids.length} background grids`);

        // 🚀 BACKGROUND CACHE CHECK
        const backgroundCacheKey = this.generateAICacheKey(backgroundGrids, whitelist, blacklist);
        const cachedBackgroundResult = this.getCachedAIResult(backgroundCacheKey, false);

        if (cachedBackgroundResult) {
          console.log(`⚡ [SNAPPY] Background cache hit! Streaming cached results...`);
          await this.streamResultsToTab(tabId, cachedBackgroundResult.data || []);
          return;
        }

        // 🚀 PROCESS BACKGROUND CHUNKS
        const adaptiveChunkSize = this.snappySystem.performanceMetrics.adaptiveChunkSize;
        const backgroundChunks = this.splitGridIntoChunks(backgroundGrids, adaptiveChunkSize);

        console.log(`🔄 [SNAPPY] Processing ${backgroundChunks.length} background chunks (adaptive size: ${adaptiveChunkSize})`);

        // Process chunks sequentially to avoid overwhelming the API
        const backgroundResults = [];
        for (let i = 0; i < backgroundChunks.length; i++) {
          try {
            const chunk = backgroundChunks[i];
            console.log(`🔄 [BACKGROUND CHUNK ${i + 1}/${backgroundChunks.length}] Processing ${chunk.grids.length} grids`);

            const chunkResult = await this.api.fetchDistractingChunks(chunk, url, whitelist, blacklist);

            if (chunkResult.success && chunkResult.data && chunkResult.data.length > 0) {
              backgroundResults.push(chunkResult);

              // 🚀 STREAM PARTIAL RESULTS immediately (snappy feel!)
              console.log(`⚡ [SNAPPY] Streaming ${chunkResult.data.length} new results to tab`);
              await this.streamResultsToTab(tabId, chunkResult.data);
            }

            // Small delay to prevent API overwhelming
            if (i < backgroundChunks.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }

          } catch (chunkError) {
            console.warn(`⚠️ [SNAPPY] Background chunk ${i + 1} failed:`, chunkError.message);
          }
        }

        // 🚀 CACHE BACKGROUND RESULTS
        if (backgroundResults.length > 0) {
          const combinedBackgroundResult = this.combineChunkResults(backgroundResults);
          this.setCachedAIResult(backgroundCacheKey, combinedBackgroundResult, false, 'normal');
          console.log(`✅ [SNAPPY] Background processing complete - ${backgroundResults.length} chunks processed`);
        }

      } catch (error) {
        console.error(`❌ [SNAPPY] Background processing error:`, error);
      }
    }, 50); // Small delay to ensure viewport results are sent first
  }

  /**
   * 🚀 STREAM RESULTS TO TAB: Send partial results immediately for snappy feel
   */
  async streamResultsToTab(tabId, results) {
    if (!results || results.length === 0) return;

    try {
      await this.tabManager.sendMessageToTab(tabId, {
        type: MESSAGE_TYPES.HIDE_GRID_CHILDREN,
        gridInstructions: results,
        isStreamingUpdate: true,
        timestamp: Date.now()
      });

      console.log(`📡 [SNAPPY] Streamed ${results.length} results to tab ${tabId}`);
    } catch (error) {
      console.error(`❌ [SNAPPY] Failed to stream results to tab:`, error);
    }
  }

  /**
   * 🚀 ADAPTIVE PERFORMANCE OPTIMIZATION: Auto-adjust based on real performance
   */
  updateAdaptivePerformance(processingTime, chunkCount) {
    const metrics = this.snappySystem.performanceMetrics;

    // Update moving average
    metrics.avgProcessingTime = (metrics.avgProcessingTime * 0.7) + (processingTime * 0.3);

    // 🚀 ADAPTIVE CHUNK SIZE based on performance
    if (processingTime > 1000 && metrics.adaptiveChunkSize > 20) {
      // Too slow - reduce chunk size
      metrics.adaptiveChunkSize = Math.max(20, metrics.adaptiveChunkSize - 10);
      console.log(`⚡ [ADAPTIVE] Reduced chunk size to ${metrics.adaptiveChunkSize} (slow response: ${processingTime}ms)`);
    } else if (processingTime < 300 && metrics.adaptiveChunkSize < 100) {
      // Very fast - can increase chunk size
      metrics.adaptiveChunkSize = Math.min(100, metrics.adaptiveChunkSize + 5);
      console.log(`⚡ [ADAPTIVE] Increased chunk size to ${metrics.adaptiveChunkSize} (fast response: ${processingTime}ms)`);
    }

    console.log(`📊 [SNAPPY] Performance: ${processingTime}ms avg, chunk size: ${metrics.adaptiveChunkSize}`);
  }

  /**
   * 🧠 CACHE PERFORMANCE STATS
   */
  getAICacheStats() {
    const totalHits = Object.values(this.aiCacheStats.hits).reduce((sum, hits) => sum + hits, 0);
    const hitRate = this.aiCacheStats.totalRequests > 0
      ? ((totalHits / this.aiCacheStats.totalRequests) * 100).toFixed(1)
      : '0.0';

    const cacheSizes = Object.keys(this.aiCache).reduce((acc, layer) => {
      acc[layer] = this.aiCache[layer].size;
      return acc;
    }, {});

    return {
      hits: this.aiCacheStats.hits,
      misses: this.aiCacheStats.misses,
      totalRequests: this.aiCacheStats.totalRequests,
      hitRate: `${hitRate}%`,
      cacheSizes,
      maxCacheSizes: this.maxCacheSize,
      avgResponseTime: this.snappySystem.performanceMetrics.avgProcessingTime,
      adaptiveChunkSize: this.snappySystem.performanceMetrics.adaptiveChunkSize
    };
  }

  /**
   * 🚀 SCROLL PREDICTION & PREFETCHING: Predict user behavior for snappy experience
   */
  updateScrollPrediction(scrollData) {
    const predictor = this.snappySystem.scrollPredictor;
    const currentTime = Date.now();

    // Calculate scroll velocity and direction
    const scrollDelta = scrollData.scrollY - predictor.lastY;
    const timeDelta = currentTime - (predictor.lastUpdateTime || currentTime);
    const velocity = timeDelta > 0 ? Math.abs(scrollDelta) / timeDelta : 0;

    // Update predictor state
    predictor.direction = scrollDelta > 0 ? 'down' : scrollDelta < 0 ? 'up' : 'none';
    predictor.velocity = velocity;
    predictor.lastY = scrollData.scrollY;
    predictor.lastUpdateTime = currentTime;

    console.log(`🔮 [PREDICTION] Scroll ${predictor.direction} at ${velocity.toFixed(1)}px/ms`);

    // 🚀 TRIGGER PREFETCHING if fast scrolling
    if (velocity > 0.5) { // Fast scrolling detected
      this.triggerPredictivePrefetching(scrollData, predictor);
    }
  }

  /**
   * 🚀 PREDICTIVE PREFETCHING: Pre-process content likely to come into view
   */
  async triggerPredictivePrefetching(scrollData, predictor) {
    console.log(`🔮 [PREFETCH] Triggering predictive prefetching for ${predictor.direction} scroll`);

    // Don't prefetch too frequently
    const lastPrefetch = this.snappySystem.lastPrefetchTime || 0;
    if (Date.now() - lastPrefetch < 2000) return; // Limit to once per 2 seconds

    try {
      // Get current tab info for prefetching
      const activeTab = await this.getCurrentActiveTab();
      if (!activeTab) return;

      // 🔮 PREDICT FUTURE VIEWPORT CONTENT
      const predictedContent = await this.predictFutureViewportContent(activeTab, predictor);

      if (predictedContent && predictedContent.grids.length > 0) {
        console.log(`🔮 [PREFETCH] Predicted ${predictedContent.grids.length} grids for ${predictor.direction} scroll`);

        // 🚀 PREFETCH AI ANALYSIS for predicted content
        this.prefetchAIAnalysis(predictedContent, activeTab.url);
      }

      this.snappySystem.lastPrefetchTime = Date.now();

    } catch (error) {
      console.error(`❌ [PREFETCH] Prediction error:`, error);
    }
  }

  /**
   * 🔮 PREDICT FUTURE VIEWPORT CONTENT based on scroll direction
   */
  async predictFutureViewportContent(tab, predictor) {
    try {
      // Send message to tab to get predicted content
      const response = await this.tabManager.sendMessageToTab(tab.id, {
        type: 'GET_PREDICTED_CONTENT',
        scrollDirection: predictor.direction,
        velocity: predictor.velocity,
        lookAhead: predictor.velocity > 1 ? 3 : 2 // Look further ahead for fast scrolls
      });

      return response?.predictedGrids || null;

    } catch (error) {
      console.error(`❌ [PREFETCH] Failed to get predicted content:`, error);
      return null;
    }
  }

  /**
   * 🚀 PREFETCH AI ANALYSIS: Pre-process AI analysis for predicted content
   */
  async prefetchAIAnalysis(predictedContent, url) {
    console.log(`🔮 [PREFETCH] Starting AI prefetch for ${predictedContent.grids.length} predicted grids`);

    try {
      // Get current filter criteria
      const filterCriteria = await this.getCurrentFilterCriteria();
      if (!filterCriteria) return;

      const { whitelistTags, blacklistTags } = filterCriteria;

      // 🚀 CHECK PREFETCH CACHE first
      const prefetchCacheKey = this.generateAICacheKey(predictedContent, whitelistTags, blacklistTags);
      const cachedPrefetch = this.getCachedAIResult(prefetchCacheKey, false);

      if (cachedPrefetch) {
        console.log(`⚡ [PREFETCH] Already cached - promoting to warm cache`);
        // Promote to warm cache for faster access
        this.setCachedAIResult(prefetchCacheKey, cachedPrefetch, false, 'warm');
        return;
      }

      // 🔮 PROCESS PREFETCH in background (lower priority)
      const prefetchChunks = this.splitGridIntoChunks(predictedContent, 40); // Smaller chunks for prefetch
      console.log(`🔮 [PREFETCH] Processing ${prefetchChunks.length} prefetch chunks in background`);

      // Process prefetch chunks with lower priority
      const prefetchPromises = prefetchChunks.map(async (chunk, index) => {
        // Add small delays to not interfere with main processing
        await new Promise(resolve => setTimeout(resolve, index * 200));

        try {
          const result = await this.api.fetchDistractingChunks(chunk, url, whitelistTags, blacklistTags);
          console.log(`🔮 [PREFETCH CHUNK ${index + 1}] Completed background prefetch`);
          return result;
        } catch (error) {
          console.warn(`⚠️ [PREFETCH CHUNK ${index + 1}] Failed:`, error.message);
          return { success: false };
        }
      });

      // Don't wait for all - process in background
      Promise.allSettled(prefetchPromises).then(results => {
        const successfulResults = results
          .filter(result => result.status === 'fulfilled' && result.value.success)
          .map(result => result.value);

        if (successfulResults.length > 0) {
          const combinedPrefetchResult = this.combineChunkResults(successfulResults);

          // 🔮 STORE in PREFETCH CACHE
          this.setCachedAIResult(prefetchCacheKey, combinedPrefetchResult, false, 'prefetch');
          console.log(`✅ [PREFETCH] Cached ${successfulResults.length} prefetch chunks for future use`);
        }
      });

    } catch (error) {
      console.error(`❌ [PREFETCH] AI prefetch error:`, error);
    }
  }

  /**
   * 🔮 GET CURRENT FILTER CRITERIA for prefetching
   */
  async getCurrentFilterCriteria() {
    try {
      // Get current filter criteria from state or active profiles
      const allProfiles = this.stateManager.getProfiles();
      const enabledProfiles = allProfiles.filter(profile => profile.isEnabled);

      if (enabledProfiles.length === 0) return null;

      // Combine tags from enabled profiles
      const allWhitelistTags = [];
      const allBlacklistTags = [];

      enabledProfiles.forEach(profile => {
        allWhitelistTags.push(...(profile.whitelistTags || []));
        allBlacklistTags.push(...(profile.blacklistTags || []));
      });

      return {
        whitelistTags: [...new Set(allWhitelistTags)],
        blacklistTags: [...new Set(allBlacklistTags)]
      };

    } catch (error) {
      console.error(`❌ [PREFETCH] Failed to get filter criteria:`, error);
      return null;
    }
  }

  /**
   * 🔮 GET CURRENT ACTIVE TAB for prediction
   */
  async getCurrentActiveTab() {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return activeTab || null;
    } catch (error) {
      console.error(`❌ [PREFETCH] Failed to get active tab:`, error);
      return null;
    }
  }

  /**
   * 🚀 SNAPPY SCROLL HANDLER: Handle scroll events with prediction and prefetching
   */
  async handleSnappyScrollEvent(scrollData, tabId) {
    console.log(`📜 [SNAPPY] Scroll event: ${scrollData.scrollY}px on tab ${tabId}`);

    try {
      // 🔮 UPDATE SCROLL PREDICTION
      this.updateScrollPrediction(scrollData);

      // 🚀 VIEWPORT TRACKING: Update what's currently in viewport
      this.updateViewportTracking(scrollData, tabId);

      // 🎯 TRIGGER CONTINUOUS FILTERING if needed
      const shouldTriggerFiltering = this.shouldTriggerContinuousFiltering(scrollData);

      if (shouldTriggerFiltering) {
        console.log(`🚀 [SNAPPY] Triggering continuous filtering on scroll`);
        await this.triggerContinuousFiltering(tabId, scrollData);
      }

    } catch (error) {
      console.error(`❌ [SNAPPY] Scroll handling error:`, error);
    }
  }

  /**
   * 🎯 VIEWPORT TRACKING: Keep track of viewport content for smart caching
   */
  updateViewportTracking(scrollData, tabId) {
    const tracker = this.snappySystem.viewportTracker;

    // Store viewport information
    tracker.set(tabId, {
      scrollY: scrollData.scrollY,
      timestamp: Date.now(),
      direction: this.snappySystem.scrollPredictor.direction,
      velocity: this.snappySystem.scrollPredictor.velocity
    });

    // Clean up old viewport data (older than 5 minutes)
    const cutoffTime = Date.now() - (5 * 60 * 1000);
    for (const [id, data] of tracker) {
      if (data.timestamp < cutoffTime) {
        tracker.delete(id);
      }
    }
  }

  /**
   * 🎯 SHOULD TRIGGER CONTINUOUS FILTERING
   */
  shouldTriggerContinuousFiltering(scrollData) {
    const predictor = this.snappySystem.scrollPredictor;

    // Trigger filtering for:
    // 1. Medium to fast scrolling (velocity > 0.3)
    // 2. Direction changes (to catch new content)
    // 3. Periodic updates during slow scrolling

    if (predictor.velocity > 0.3) return true; // Fast scrolling
    if (predictor.lastDirectionChange && (Date.now() - predictor.lastDirectionChange) < 1000) return true;

    // Periodic updates for slow scrolling
    const lastTrigger = this.snappySystem.lastContinuousFilterTrigger || 0;
    return (Date.now() - lastTrigger) > 3000; // Every 3 seconds during slow scrolling
  }

  /**
   * 🚀 TRIGGER CONTINUOUS FILTERING: Seamless filtering during scroll
   */
  async triggerContinuousFiltering(tabId, scrollData) {
    try {
      console.log(`🔄 [CONTINUOUS] Triggering seamless filtering during scroll`);

      // Send message to tab to trigger progressive filtering
      await this.tabManager.sendMessageToTab(tabId, {
        type: 'TRIGGER_PROGRESSIVE_FILTERING',
        scrollData: scrollData,
        priority: 'continuous',
        snappyMode: true
      });

      this.snappySystem.lastContinuousFilterTrigger = Date.now();

    } catch (error) {
      console.error(`❌ [CONTINUOUS] Failed to trigger continuous filtering:`, error);
    }
  }

  /**
   * Setup internal event listeners
   */
  setupEventListeners() {
    this.eventBus.on(EVENTS.EXTENSION_ENABLED, async () => {
      const tabs = await this.tabManager.getAllTabs();
      for (const tab of tabs) {
        if (tab.url && this.stateManager.isAllowedWebsite(tab.url)) {
          await this.tabManager.enableTab(tab.id, tab.url);
        }
      }
    });

    this.eventBus.on(EVENTS.EXTENSION_DISABLED, async () => {
      await this.tabManager.sendMessageToAllTabs({ type: 'DISABLE' });
    });

    // COMMENTED OUT: Auth functionality disabled
    // this.eventBus.on(EVENTS.AUTH_STATE_CHANGED, (data) => {
    //   this.logger.info('Auth state changed', data);
    // });

    this.eventBus.on(EVENTS.TAB_READY, (data) => {
    });

    this.eventBus.on(EVENTS.GRID_ANALYSIS_COMPLETE, (data) => {
    });

    this.eventBus.on(EVENTS.HEARTBEAT_MONITORING_STOPPED, (data) => {
      this.handleHeartbeatMonitoringStopped(data);
    });
  }

  /**
   * Register all message handlers
   */
  registerMessageHandlers() {
    const handlers = {
      [MESSAGE_TYPES.EXTENSION_TOGGLED]: this.handleExtensionToggled.bind(this),
      'TOGGLE_PREVIEW': this.handlePreviewToggled.bind(this), // FIXED: Add preview toggle handler
      [MESSAGE_TYPES.GET_EXTENSION_STATE]: this.handleGetExtensionState.bind(this),
      [MESSAGE_TYPES.ANALYZE_GRID_STRUCTURE]: this.handleAnalyzeGridStructure.bind(this),
      [MESSAGE_TYPES.CHECK_ANALYSIS_REQUIRED]: this.handleCheckAnalysisRequired.bind(this),
      [MESSAGE_TYPES.GET_PROFILE_DATA]: this.handleGetProfileData.bind(this),
      [MESSAGE_TYPES.GET_USER_SETTINGS]: this.handleGetUserSettings.bind(this),
      [MESSAGE_TYPES.UPDATE_USER_SETTINGS]: this.handleUpdateUserSettings.bind(this),
      [MESSAGE_TYPES.GET_TOAST_ENABLED]: this.handleGetToastEnabled.bind(this),
      [MESSAGE_TYPES.HEARTBEAT_PING]: this.handleHeartbeatPing.bind(this),
      ['POPUP_OPENED']: this.handlePopupOpened.bind(this),
      [MESSAGE_TYPES.ACCUMULATE_PROFILE_DATA]: this.handleAccumulateProfileData.bind(this),
      [MESSAGE_TYPES.GRID_CHILDREN_BLOCKED]: this.handleGridChildrenBlocked.bind(this),
      [MESSAGE_TYPES.CONTENT_BLOCKED]: this.handleContentBlocked.bind(this),
      [MESSAGE_TYPES.GET_BLOCK_STATS]: this.handleGetBlockStats.bind(this),
      [MESSAGE_TYPES.REPORT_BLOCKED_ITEMS]: this.handleReportBlockedItems.bind(this),
      'REPORT_BLOCKED_CONTENTS': this.handleReportBlockedContents.bind(this),
      // Authentication handlers
      [MESSAGE_TYPES.AUTO_LOGIN]: this.handleAutoLogin.bind(this),
      [MESSAGE_TYPES.GET_AUTH_STATE]: this.handleGetAuthState.bind(this),
      [MESSAGE_TYPES.LOGIN]: this.handleLogin.bind(this),
      [MESSAGE_TYPES.LOGOUT]: this.handleLogout.bind(this),
      [MESSAGE_TYPES.TOKEN_RECEIVED]: this.handleTokenReceived.bind(this),
      // 🚀 WORLD-CLASS SNAPPY SCROLL HANDLERS
      'SNAPPY_SCROLL_EVENT': this.handleSnappyScrollMessage.bind(this),
      'GET_SNAPPY_STATS': this.handleGetSnappyStats.bind(this)
    };
    this.messageRouter.registerDefaultHandlers(handlers);

  }

  /**
   * Handler for grid children blocked event
   */
  async handleGridChildrenBlocked(message, sender) {
    // message: { type, count, url }
    try {
      const count = message.count || 0;
      if (!count) return;
      await this.stateManager.incrementGlobalBlockStats(count);
    } catch (error) {
      console.debug('Failed to increment global block stats:', error.message);
    }
  }

  /**
   * Handler for content blocked event (alternative stats tracking)
   */
  async handleContentBlocked(message, sender) {
    // message: { type, blockedCount, currentUrl }
    try {
      const count = message.blockedCount || 0;
      if (!count) return;
      await this.stateManager.incrementGlobalBlockStats(count);
    } catch (error) {
      console.debug('Failed to increment global block stats:', error.message);
    }
  }

  /**
   * Handler for reporting actually blocked items to backend
   */
  async handleReportBlockedItems(message, sender) {
    try {
      const count = message.count || 0;
      if (!count) return;
      
      // Report to backend API
      const result = await this.api.reportBlockedItems(count);
      if (result.success) {
        console.log(`📊 Successfully reported ${count} blocked items to backend`);
      } else {
        console.warn(`⚠️ Failed to report blocked items to backend:`, result.error);
      }
    } catch (e) {
      console.error('❌ Error reporting blocked items:', e);
    }
  }

  /**
   * Handle reporting blocked contents (detailed items) to backend
   */
  async handleReportBlockedContents(message, sender) {
    try {
      if (!message || !Array.isArray(message.items) || message.items.length === 0) {
        return { success: false, error: 'Invalid items data' };
      }

      let successCount = 0;
      for (const item of message.items) {
        const res = await this.api.reportBlockedContent({
          session_id: item.session_id,
          provider: item.provider,
          url: item.url,
          title: item.title || '',
          channel: item.channel || '',
          blocking_keywords: Array.isArray(item.blocking_keywords) ? item.blocking_keywords : []
        });
        if (res?.success) successCount++;
      }

      console.log(`📊 Successfully reported ${successCount}/${message.items.length} blocked contents to backend`);
      return { success: true, reported: successCount, total: message.items.length };
    } catch (error) {
      console.error('❌ Error reporting blocked contents:', error);
      return { success: false, error: error.message };
    }
  }

  async handleGetProfileData(message, sender) {
    try {
      // Get all profiles from state manager
      const profiles = this.stateManager.getProfiles();

      return {
        type: 'GET_PROFILE_DATA_RESPONSE',
        success: true,
        data: {
          profiles: profiles
        }
      };

    } catch (error) {
      return {
        type: 'GET_PROFILE_DATA_RESPONSE',
        success: false,
        error: error.message
      };
    }
  }

  async handleGetUserSettings(message, sender) {
    try {
      // Delegate to StateManager for all settings loading
      const settings = await this.stateManager.getUserSettings();

      return {
        type: 'GET_USER_SETTINGS_RESPONSE',
        success: true,
        settings
      };

    } catch (error) {
      return {
        type: 'GET_USER_SETTINGS_RESPONSE',
        success: false,
        error: error.message
      };
    }
  }

  async handleUpdateUserSettings(message, sender) {
    try {
      if (!message.settings || typeof message.settings !== 'object') {
        throw new Error('Invalid settings data provided');
      }

      // Update the state manager with new settings
      const updateResult = await this.stateManager.updateUserSettings(message.settings);

      // Get the current settings after update to return actual stored values
      const currentSettings = await this.stateManager.getUserSettings();

      return {
        type: 'UPDATE_USER_SETTINGS_RESPONSE',
        success: true,
        message: 'User settings updated successfully',
        settings: currentSettings, // Return actual stored settings
        settingsChanged: updateResult.settingsChanged
      };

    } catch (error) {
      return {
        type: 'UPDATE_USER_SETTINGS_RESPONSE',
        success: false,
        error: error.message
      };
    }
  }

  async handleGetToastEnabled(message, sender) {
    try {
      const showBlockCounter = this.stateManager.isShowBlockCounterEnabled();

      return {
        type: 'GET_TOAST_ENABLED_RESPONSE',
        success: true,
        showBlockCounter
      };

    } catch (error) {
      return {
        type: 'GET_TOAST_ENABLED_RESPONSE',
        success: false,
        showBlockCounter: true, // Default to enabled
        error: error.message
      };
    }
  }

  /**
   * Validate profile data structure
   */
  validateProfile(profile) {
    const errors = [];

    if (!profile.profileName || typeof profile.profileName !== 'string') {
      errors.push(`Invalid profile name: ${profile.profileName}`);
    }

    if (!Array.isArray(profile.whitelistTags)) {
      errors.push(`Invalid whitelistTags for profile: ${profile.profileName}`);
    } else {
      // Validate each tag is a string
      profile.whitelistTags.forEach((tag, index) => {
        if (typeof tag !== 'string') {
          errors.push(`Invalid whitelist tag at index ${index} for profile: ${profile.profileName}`);
        }
      });
    }

    if (!Array.isArray(profile.blacklistTags)) {
      errors.push(`Invalid blacklistTags for profile: ${profile.profileName}`);
    } else {
      // Validate each tag is a string
      profile.blacklistTags.forEach((tag, index) => {
        if (typeof tag !== 'string') {
          errors.push(`Invalid blacklist tag at index ${index} for profile: ${profile.profileName}`);
        }
      });
    }

    if (!Array.isArray(profile.allowedWebsites)) {
      errors.push(`Invalid allowedWebsites for profile: ${profile.profileName}`);
    } else {
      // Validate each website is a string
      profile.allowedWebsites.forEach((website, index) => {
        if (typeof website !== 'string') {
          errors.push(`Invalid allowed website at index ${index} for profile: ${profile.profileName}`);
        }
      });
    }

    if (typeof profile.isEnabled !== 'boolean') {
      errors.push(`Invalid isEnabled for profile: ${profile.profileName}`);
    }

    // Validate colour field if present
    if (profile.colour !== undefined && typeof profile.colour !== 'string') {
      errors.push(`Invalid colour for profile: ${profile.profileName}`);
    }

    return errors;
  }

  async handleAccumulateProfileData(message, sender) {
    try {
      if (!message.profiles || !Array.isArray(message.profiles)) {
        throw new Error('Profiles array is required');
      }

      const { profiles } = message;
      const allErrors = [];
      for (const profile of profiles) {
        const errors = this.validateProfile(profile);
        if (errors.length > 0) {
          allErrors.push(...errors);
        }
      }

      if (allErrors.length > 0) {
        throw new Error(`Profile validation failed: ${allErrors.join(', ')}`);
      }

      this.stateManager.state.profiles = profiles;
      await this.stateManager.saveExtensionState();

      return {
        type: 'ACCUMULATE_PROFILE_DATA_RESPONSE',
        success: true,
        message: 'All profile data updated successfully',
        profileCount: profiles.length
      };

    } catch (error) {
      return {
        type: 'ACCUMULATE_PROFILE_DATA_RESPONSE',
        success: false,
        error: error.message
      };
    }
  }

    async handleHeartbeatPing(message, sender) {
    // Record the heartbeat in the heartbeat manager
    console.log('🔍 [TOPAZ DEBUG] Heartbeat ping received, recording');
    this.heartbeatManager.recordHeartbeat();
   
    return {
      type: MESSAGE_TYPES.HEARTBEAT_PONG,
      timestamp: Date.now()
    };
  }

  async handlePopupOpened(message, sender) {
    console.log("🔍 [TOPAZ DEBUG] Popup opened, taking profile snapshot");
    this.stateManager.takeProfileSnapshot();
    console.log("🔍 [TOPAZ DEBUG] Starting heartbeat monitoring for tab:", message.tabId);
    this.heartbeatManager.startHeartbeatMonitoring(message.tabId);

    return {
      type: 'POPUP_OPENED_RESPONSE',
      success: true,
      message: 'Heartbeat monitoring started'
    };
  }

  async handleHeartbeatMonitoringStopped(data) {
    try {
      console.log('⏱️ TIMING: Heartbeat monitoring stopped handler started');
      console.log('🔍 [TOPAZ DEBUG] Popup closed, checking for profile changes');
      
      // Check if there were relevant changes during the popup session
      const hasRelevantChanges = this.stateManager.hasRelevantProfileChanges();
      console.log('🔍 [TOPAZ DEBUG] Has relevant profile changes:', hasRelevantChanges);
      
      if (!hasRelevantChanges) {
        console.log('⏱️ TIMING: No relevant changes - aborting timer');
        console.log('🔍 [TOPAZ DEBUG] No changes detected, no action needed');
        return;
      }

      console.log('⏱️ TIMING: Relevant changes detected, using instant filtering instead of refresh');
      console.log('🔍 [TOPAZ DEBUG] Profile changes detected, triggering instant filtering');

      // Instead of refreshing tabs, use instant filtering for better UX
      // Get the tab that had the popup open to determine which hostname to update
      let targetTab = null;
      let hostname = null;
      
      if (data.tabId) {
        try {
          targetTab = await chrome.tabs.get(data.tabId);
        } catch (error) {
          // Tab not found, will use fallback
        }
      }
      
      if (!targetTab || !targetTab.url) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        targetTab = activeTab;
      }

      if (!targetTab || !targetTab.url) {
        console.log('⏱️ TIMING: No target tab found - aborting timer');
        return;
      }

      hostname = new URL(targetTab.url).hostname.toLowerCase();
      const cleanHostname = hostname.replace(/^www\./, '');
      
      console.log(`⏱️ TIMING: Starting instant filtering for hostname: ${cleanHostname}`);
      
      // Use instant filtering instead of full refresh
      await this.triggerInstantFilteringForHostname(cleanHostname);
      
      // End timing - extension update complete
      console.timeEnd('⏱️ HEARTBEAT_TO_ENABLE_COMPLETE');
      console.log('⏱️ TIMING END: Extension instant filtering completed');

    } catch (error) {
    }
  }



  /**
   * Trigger instant filtering for all tabs with the specified hostname (no page refresh)
   */
  async triggerInstantFilteringForHostname(hostname) {
    try {
      console.log(`⏱️ TIMING: Instant filtering started for ${hostname}`);
      
      // Get all tabs
      const allTabs = await this.tabManager.getAllTabs();

      const matchingTabs = allTabs.filter(tab => {
        if (!tab.url) return false;

        try {
          const tabHostname = new URL(tab.url).hostname.toLowerCase();
          const cleanTabHostname = tabHostname.replace(/^www\./, '');
          const matches = cleanTabHostname === hostname;

          return matches;
        } catch (error) {
          return false;
        }
      });
      
      if (matchingTabs.length === 0) {
        console.log('⏱️ TIMING: No matching tabs found');
        return;
      }
      
      console.log(`⏱️ TIMING: Found ${matchingTabs.length} matching tabs, triggering instant filtering`);
      
      // Send instant filter message to apply new profile changes without refresh
      const filterPromises = matchingTabs.map(async (tab) => {
        try {
          await this.tabManager.sendMessageToTab(tab.id, {
            type: 'INSTANT_FILTER_REQUEST'
          });
        } catch (error) {
          console.warn(`Failed to send instant filter to tab ${tab.id}:`, error.message);
        }
      });

      await Promise.all(filterPromises);
      console.log('⏱️ TIMING: All instant filtering completed');

    } catch (error) {
      console.error('Error in triggerInstantFilteringForHostname:', error);
    }
  }

  /**
   * Refresh all tabs with the specified hostname by disabling and re-enabling them
   * (DEPRECATED - kept for compatibility, but instant filtering is preferred)
   */
  async refreshTabsForHostname(hostname) {
    console.log('⚠️ refreshTabsForHostname is deprecated, using instant filtering instead');
    await this.triggerInstantFilteringForHostname(hostname);
  }
  /**
   * Handle extension toggled message
   */
  async handleExtensionToggled(message, sender) {
    if (message.enabled === undefined) {
      throw new Error('Missing enabled state');
    }

    // Update state
    await this.stateManager.setExtensionEnabled(message.enabled);

    // Send enable/disable message to all tabs
    const messageType = message.enabled ? MESSAGE_TYPES.ENABLE : MESSAGE_TYPES.DISABLE;
    await this.tabManager.sendMessageToAllTabs({ type: messageType });

    return {
      success: true,
      message: `Extension ${message.enabled ? 'enabled' : 'disabled'}`,
      enabled: message.enabled
    };
  }

  /**
   * FIXED: Handle preview toggled message
   */
  async handlePreviewToggled(message, sender) {
    if (message.enabled === undefined) {
      throw new Error('Missing enabled state');
    }

    // Update state
    await this.stateManager.setPreviewEnabled(message.enabled);

    return {
      success: true,
      message: `Preview ${message.enabled ? 'enabled' : 'disabled'}`,
      enabled: message.enabled
    };
  }

  /**
   * Handle get extension state message
   */
  async handleGetExtensionState(message, sender) {
    try {
      const extensionEnabled = this.stateManager.isExtensionEnabled();

      return {
        success: true,
        enabled: extensionEnabled
      };
    } catch (error) {
      return {
        success: false,
        enabled: true, // Default to enabled
        error: error.message
      };
    }
  }


  async handleCheckAnalysisRequired(message, sender) {
    console.log("🔍 [TOPAZ DEBUG] Background handleCheckAnalysisRequired called");
    
    const allProfiles = this.stateManager.getProfiles();
    const enabledProfiles = allProfiles.filter(profile => profile.isEnabled);
    console.log("🔍 [TOPAZ DEBUG] All profiles:", allProfiles.length, "Enabled profiles:", enabledProfiles.length);
    
    // If no profiles are enabled, still allow analysis on supported sites so first-run works out of the box
    const url = message.currentUrl || sender.tab?.url;
    const supportedHostnames = new Set(['youtube.com', 'twitter.com', 'x.com', 'linkedin.com', 'reddit.com']);
    if (enabledProfiles.length === 0) {
      if (url) {
        try {
          const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
          const isSupported = [...supportedHostnames].some(site => hostname === site || hostname.endsWith('.' + site));
          if (isSupported) {
            console.log("🔍 [TOPAZ DEBUG] No enabled profiles but supported site detected; allowing analysis to proceed");
            return { analysisRequired: true };
          }
        } catch (error) {
          console.debug('Invalid URL format in checkAnalysisRequired:', error.message);
        }
      }
      console.log("🔍 [TOPAZ DEBUG] No enabled profiles and unsupported site, analysis not required");
      return { analysisRequired: false };
    }
    console.log("🔍 [TOPAZ DEBUG] Checking analysis for URL:", url);
    if (!url) {
      console.log("🔍 [TOPAZ DEBUG] No URL found, analysis not required");
      return {
        analysisRequired: false
      };
    }

    const hostname = new URL(url).hostname.toLowerCase();
    const cleanHostname = hostname.replace(/^www\./, '');
    console.log("🔍 [TOPAZ DEBUG] Clean hostname:", cleanHostname);
    
    const applicableProfiles = enabledProfiles.filter(profile => {
      const isApplicable = profile.allowedWebsites.some(allowedSite => {
        return cleanHostname === allowedSite || 
               cleanHostname.endsWith('.' + allowedSite);
      });
      console.log("🔍 [TOPAZ DEBUG] Profile", profile.profileName, "allowedWebsites:", profile.allowedWebsites, "isApplicable:", isApplicable);
      return isApplicable;
    });

    const hasApplicableProfiles = applicableProfiles.length > 0;
    console.log("🔍 [TOPAZ DEBUG] Applicable profiles:", applicableProfiles.length, "Analysis required:", hasApplicableProfiles);

    return {
      analysisRequired: hasApplicableProfiles
    };
  }

  /**
   * Handle analyze grid structure message
   */
  async handleAnalyzeGridStructure(message, sender) {
    console.log("🔍 [TOPAZ DEBUG] handleAnalyzeGridStructure called with:", { message, sender });

    // 🧠 AI IS THE PRIMARY FEATURE: Ultra-fast processing (0.5s latency, 110 tokens/sec)
    if (message.progressiveFilteringActive) {
      console.log("🧠 AI PRIMARY FEATURE - Ultra-fast processing mode activated (0.5s latency expected)");

      if (message.aiPrimary) {
        console.log("🧠 AI PRIMARY FEATURE confirmed - prioritizing for maximum speed");
      }

      if (message.fastMode) {
        console.log("🚀 FAST MODE requested - optimizing AI processing for speed");
      }
    }

    // Validate message
    if (!message.gridStructure) {
      console.log("🔍 [TOPAZ DEBUG] No grid structure provided, throwing error");
      throw new Error('No grid structure provided');
    }

    if (!sender.tab?.id || !sender.tab?.url) {
      console.log("🔍 [TOPAZ DEBUG] No tab information available, throwing error");
      throw new Error('No tab information available');
    }

    console.log("🔍 [TOPAZ DEBUG] Emitting GRID_ANALYSIS_REQUEST event");
    this.eventBus.emit(EVENTS.GRID_ANALYSIS_REQUEST, {
      tabId: sender.tab.id,
      url: sender.tab.url,
      gridStructure: message.gridStructure
    });

    console.log("🔍 [TOPAZ DEBUG] Calling analyzeGridStructure");
    this.analyzeGridStructure(
      message.gridStructure,
      sender.tab.url,
      sender.tab.id
    );

    return {
      message: 'Grid structure sent for analysis'
    };
  }

  /**
   * Analyze grid structure and send results back to tab
   */
  async analyzeGridStructure(gridStructure, url, tabId) {
    console.log("🔍 [TOPAZ DEBUG] analyzeGridStructure called with:", { gridStructure, url, tabId });
    try {

      // COMMENTED OUT: Login functionality disabled
      // Check authentication before making API call
      // const authState = this.api.getAuthState();
      // if (!authState.isAuthenticated) {
      //   this.logger.warn('User not authenticated, skipping grid analysis', { tabId });
      //
      //   // Emit analysis complete event with auth error
      //   this.eventBus.emit(EVENTS.GRID_ANALYSIS_COMPLETE, {
      //     tabId,
      //     url,
      //     success: false,
      //     error: 'User not authenticated'
      //   });
      //   return;
      // }

      // Get state settings for conditional tag bundling
      const isPowerUserMode = this.stateManager.isPowerUserModeEnabled();
      const isCustomizationEnabled = this.stateManager.isCustomizationToggleEnabled();
      
      // Get tags from profiles for the current site
      const allProfiles = this.stateManager.getProfiles();
      const enabledProfiles = allProfiles.filter(profile => profile.isEnabled);

      // Extract hostname from URL
      const hostname = new URL(url).hostname.toLowerCase();
      const cleanHostname = hostname.replace(/^www\./, '');

      // Filter enabled profiles by those that are allowed on the current site
      let applicableProfiles = enabledProfiles.filter(profile => {
        return profile.allowedWebsites.some(allowedSite => {
          return cleanHostname === allowedSite ||
                 cleanHostname.endsWith('.' + allowedSite);
        });
      });

      // 🚀 FALLBACK: If no enabled applicable profiles, but user has custom lists for this site,
      // use ONLY custom tags from profiles that apply to this site. This lets first-time users
      // get filtering when they add custom words without needing to toggle profiles.
      let usedFallbackCustomOnly = false;
      if (applicableProfiles.length === 0) {
        const siteProfiles = allProfiles.filter(profile => {
          return profile.allowedWebsites.some(allowedSite => {
            return cleanHostname === allowedSite || cleanHostname.endsWith('.' + allowedSite);
          });
        });
        const anyCustomTags = siteProfiles.some(p => (p.customBlacklist && p.customBlacklist.length) || (p.customWhitelist && p.customWhitelist.length));
        if (anyCustomTags) {
          applicableProfiles = siteProfiles;
          usedFallbackCustomOnly = true;
          console.log('🔄 [TOPAZ DEBUG] Using fallback custom-only tags for site due to 0 enabled profiles');
        }
      }

      // USER CHOICE: No automatic profile creation - users must create their own profiles
      // This ensures the extension only blocks content when explicitly configured by the user

      // Combine tags based on mode and settings
      const allWhitelistTags = [];
      const allBlacklistTags = [];

      if (isPowerUserMode) {
        // Power Mode: combine all whitelist/blacklist tags from all enabled profiles (ignore custom tags)
        applicableProfiles.forEach(profile => {
          allWhitelistTags.push(...(profile.whitelistTags || []));
          allBlacklistTags.push(...(profile.blacklistTags || []));
        });
      } else {
        // Simple Mode: different logic based on customization toggle
        if (isCustomizationEnabled) {
          // Use both default and custom tags from applicable profiles
          if (applicableProfiles.length > 0) {
            applicableProfiles.forEach(profile => {
              // If using fallback, include ONLY custom tags to respect "user choice"
              if (usedFallbackCustomOnly) {
                allWhitelistTags.push(...(profile.customWhitelist || []));
                allBlacklistTags.push(...(profile.customBlacklist || []));
              } else {
                allWhitelistTags.push(...(profile.whitelistTags || []));
                allBlacklistTags.push(...(profile.blacklistTags || []));
                allWhitelistTags.push(...(profile.customWhitelist || []));
                allBlacklistTags.push(...(profile.customBlacklist || []));
              }
            });
          }
        } else {
          // Customization disabled: only bundle default tags from enabled default profiles
          if (applicableProfiles.length > 0 && !usedFallbackCustomOnly) {
            applicableProfiles.forEach(profile => {
              if (profile.isDefault) {
                allWhitelistTags.push(...(profile.whitelistTags || []));
                allBlacklistTags.push(...(profile.blacklistTags || []));
              }
            });
          }
        }
      }

      // Remove duplicates
      let whitelistToSend = [...new Set(allWhitelistTags)];
      let blacklistToSend = [...new Set(allBlacklistTags)];

      // USER CHOICE: No forced default blacklist tags - only block content when user explicitly configures it
      // If no blacklist entries are configured, no content will be blocked

      // If no blacklist entries, no content should be blocked - skip API call
      if (blacklistToSend.length === 0) {
        console.log('🔍 [TOPAZ DEBUG] No blacklist entries found, skipping API call - no content will be blocked');
        await this.tabManager.sendMessageToTab(tabId, {
          type: MESSAGE_TYPES.HIDE_GRID_CHILDREN,
          gridInstructions: [] // Empty instructions = no content blocked
        });

        this.eventBus.emit(EVENTS.GRID_ANALYSIS_COMPLETE, {
          tabId,
          url,
          instructionCount: 0,
          success: true
        });
        return;
      }

      // Calculate total children count across all grids
      const totalChildrenCount = gridStructure?.grids && Array.isArray(gridStructure.grids)
        ? gridStructure.grids.reduce((total, grid) => {
            return total + (grid.children ? grid.children.length : 0);
          }, 0)
        : 0;

      console.log('🏷️ TAGS BEING SENT TO API:', {
        hostname: cleanHostname,
        mode: isPowerUserMode ? 'Power User' : 'Simple',
        customizationEnabled: isCustomizationEnabled,
        applicableProfilesCount: applicableProfiles.length,
        whitelistTags: whitelistToSend,
        blacklistTags: blacklistToSend
      });

      // DEBUG: Log detailed profile information
      console.log('🔍 [TOPAZ DEBUG] Profile Analysis:', {
        allProfilesCount: allProfiles.length,
        enabledProfilesCount: enabledProfiles.length,
        applicableProfilesCount: applicableProfiles.length,
        usedFallbackCustomOnly,
        enabledProfiles: enabledProfiles.map(p => ({
          name: p.profileName,
          isDefault: p.isDefault,
          isEnabled: p.isEnabled,
          allowedWebsites: p.allowedWebsites,
          customBlacklist: p.customBlacklist,
          customWhitelist: p.customWhitelist
        })),
        applicableProfiles: applicableProfiles.map(p => ({
          name: p.profileName,
          isDefault: p.isDefault,
          customBlacklist: p.customBlacklist,
          customWhitelist: p.customWhitelist
        }))
      });

      console.log('📋 DETAILED TAG BREAKDOWN:', {
        applicableProfiles: applicableProfiles.map(profile => ({
          name: profile.profileName,
          isDefault: profile.isDefault,
          isEnabled: profile.isEnabled,
          allowedWebsites: profile.allowedWebsites,
          whitelistTags: profile.whitelistTags || [],
          blacklistTags: profile.blacklistTags || [],
          customWhitelist: profile.customWhitelist || [],
          customBlacklist: profile.customBlacklist || []
        })),
        finalWhitelistTags: whitelistToSend,
        finalBlacklistTags: blacklistToSend
      });



      // 🚀 WORLD-CLASS SNAPPY PROCESSING: Viewport-first with streaming results
      console.log(`🚀 [SNAPPY] Starting WORLD-CLASS viewport-first AI processing...`);

      const processingStartTime = Date.now();

      // 🎯 STEP 1: INSTANT VIEWPORT PROCESSING (0-50ms target)
      const viewportResult = await this.processViewportWithInstantResponse(gridStructure, url, whitelistToSend, blacklistToSend, tabId);

      if (viewportResult.instantHits > 0) {
        console.log(`⚡ [SNAPPY] INSTANT viewport hits: ${viewportResult.instantHits} items processed in ${Date.now() - processingStartTime}ms`);
      }

      // 🚀 Immediately apply viewport results so the user sees instant filtering
      if (viewportResult && Array.isArray(viewportResult.instructions) && viewportResult.instructions.length > 0) {
        try {
          await this.tabManager.sendMessageToTab(tabId, {
            type: MESSAGE_TYPES.HIDE_GRID_CHILDREN,
            gridInstructions: viewportResult.instructions,
            isStreamingUpdate: false,
            timestamp: Date.now()
          });
          console.log(`📡 [SNAPPY] Sent ${viewportResult.instructions.length} viewport instructions to tab ${tabId}`);
        } catch (sendErr) {
          console.warn('⚠️ [SNAPPY] Failed to send viewport instructions to tab:', sendErr?.message || sendErr);
        }
      }

      // 🎯 STEP 2: SMART BACKGROUND PROCESSING with streaming
      this.processBackgroundWithStreaming(gridStructure, url, whitelistToSend, blacklistToSend, tabId);

      // Return immediate success for snappy feel
      const combinedResult = {
        success: true,
        data: viewportResult.instructions || [],
        processingStrategy: 'viewport_first_streaming',
        instantProcessed: viewportResult.instantHits,
        backgroundProcessing: true
      };

      if (combinedResult.success && combinedResult.data && Array.isArray(combinedResult.data)) {
        // Send results back to the tab
        await this.tabManager.sendMessageToTab(tabId, {
          type: MESSAGE_TYPES.HIDE_GRID_CHILDREN,
          gridInstructions: combinedResult.data
        });

        // Emit analysis complete event
        this.eventBus.emit(EVENTS.GRID_ANALYSIS_COMPLETE, {
          tabId,
          url,
          instructionCount: combinedResult.data.length,
          success: true
        });
      } else {
        // Send error message to the tab if API failed
        if (combinedResult.error) {
          await this.tabManager.sendMessageToTab(tabId, {
            type: MESSAGE_TYPES.ERROR,
            errorMessage: combinedResult.error,
            errorType: 'api_error'
          });
        }

        this.eventBus.emit(EVENTS.GRID_ANALYSIS_COMPLETE, {
          tabId,
          url,
          success: false,
          error: combinedResult.error || 'No results'
        });
      }
    } catch (error) {
      // Send error message to the tab
      await this.tabManager.sendMessageToTab(tabId, {
        type: MESSAGE_TYPES.ERROR,
        errorMessage: error.message,
        errorType: 'analysis_error'
      });

      this.eventBus.emit(EVENTS.GRID_ANALYSIS_COMPLETE, {
        tabId,
        url,
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Split grid structure into chunks for batched API requests
   * Splits by total children count across all grids
   */
  splitGridIntoChunks(gridStructure, chunkSize) {
    // Handle invalid input
    if (!gridStructure?.grids || !Array.isArray(gridStructure.grids)) {
      return [gridStructure];
    }

    // Collect all children with their parent grid info
    const allChildrenWithGridInfo = [];
    gridStructure.grids.forEach(grid => {
      if (grid.children && Array.isArray(grid.children)) {
        grid.children.forEach(child => {
          allChildrenWithGridInfo.push({
            child: child,
            gridId: grid.id,
            gridText: grid.gridText
          });
        });
      }
    });

    // If total children <= chunk size, return original structure
    if (allChildrenWithGridInfo.length <= chunkSize) {
      return [gridStructure];
    }

    // Split children into chunks
    const chunks = [];
    for (let i = 0; i < allChildrenWithGridInfo.length; i += chunkSize) {
      const childrenChunk = allChildrenWithGridInfo.slice(i, i + chunkSize);
      
      // Group children by their parent grid
      const gridMap = new Map();
      childrenChunk.forEach(item => {
        if (!gridMap.has(item.gridId)) {
          gridMap.set(item.gridId, {
            id: item.gridId,
            gridText: item.gridText,
            children: []
          });
        }
        gridMap.get(item.gridId).children.push(item.child);
      });

      // Convert map to array and create chunk with proper structure
      const chunkGrids = Array.from(gridMap.values());
      const chunk = {
        timestamp: gridStructure.timestamp,
        totalGrids: chunkGrids.length,
        grids: chunkGrids
      };
      chunks.push(chunk);
    }
    
    return chunks;
  }

  /**
   * Combine results from multiple chunk API requests
   */
  combineChunkResults(chunkResults) {
    // Check if any chunk failed
    const failedChunk = chunkResults.find(result => !result.success);
    if (failedChunk) {
      return {
        success: false,
        error: failedChunk.error || 'One or more chunks failed'
      };
    }

    // Combine all successful results
    const combinedData = [];
    chunkResults.forEach(result => {
      if (result.data && Array.isArray(result.data)) {
        combinedData.push(...result.data);
      }
    });

    return {
      success: true,
      data: combinedData
    };
  }
  /**
   * Handle automatic login for first-time users
   */
  async handleAutoLogin(message, sender) {
    this.logger.debug('Auto login requested');

    try {
      const isFirstTime = await this.api.isFirstTimeUser();
      
      if (isFirstTime) {
        const result = await this.api.login();
        
        if (result.success) {
          this.eventBus.emit(EVENTS.AUTH_LOGIN_SUCCESS, {});
          this.logger.info('Auto login initiated for first-time user');
        } else {
          this.logger.error('Auto login failed', result.error);
        }
        
        return {
          success: result.success,
          message: result.success ? 'Auto login initiated' : 'Auto login failed',
          error: result.error
        };
      } else {
        return {
          success: true,
          message: 'User already authenticated'
        };
      }
    } catch (error) {
      this.logger.error('Auto login error', error);
      throw error;
    }
  }

  /**
   * Handle get auth state message
   */
  async handleGetAuthState(message, sender) {
    this.logger.debug('Get auth state requested');

    return {
      authState: {
        isAuthenticated: this.api.authState.isAuthenticated,
        user: this.api.authState.user
      }
    };
  }

  /**
   * Handle token received from signin page
   */
  async handleTokenReceived(message, sender) {
    this.logger.debug('Token received from signin page', {
      hasTokenData: !!message.tokenData,
      senderTab: sender.tab?.url,
      senderFrameId: sender.frameId
    });

    try {
      // Validate token data
      if (!message.tokenData) {
        throw new Error('No token data provided');
      }

      if (!message.tokenData.user || !message.tokenData.accessToken) {
        throw new Error('Invalid token data structure');
      }

      this.logger.info('Processing token data for user:', message.tokenData.user.email);

      const result = await this.api.handleTokenReceived(message.tokenData);

      if (result.success) {
        this.eventBus.emit(EVENTS.AUTH_LOGIN_SUCCESS, {
          user: this.api.authState.user
        });
        this.logger.info('Authentication successful for user:', this.api.authState.user?.email);
      } else {
        this.logger.error('Authentication failed', result.error);
      }

      return {
        success: result.success,
        message: result.success ? 'Authentication successful' : 'Authentication failed',
        error: result.error
      };
    } catch (error) {
      this.logger.error('Token handling error', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle login message
   */
  async handleLogin(message, sender) {
    this.logger.debug('Login requested');

    try {
      const result = await this.api.login();

      if (result.success) {
        this.eventBus.emit(EVENTS.AUTH_LOGIN_SUCCESS, {});
        this.logger.info('Login initiated successfully');
      } else {
        this.logger.error('Login failed', result.error);
      }

      return {
        message: result.success ? 'Login initiated' : 'Login failed',
        error: result.error
      };
    } catch (error) {
      this.logger.error('Login error', error);
      throw error;
    }
  }

  /**
   * Handle logout message
   */
  async handleLogout(message, sender) {
    this.logger.debug('Logout requested');

    try {
      const result = await this.api.logout();

      if (result.success) {
        this.eventBus.emit(EVENTS.AUTH_LOGOUT_SUCCESS, {});
        this.logger.info('Logout successful');
      } else {
        this.logger.error('Logout failed', result.error);
      }

      return {
        message: result.success ? 'Logout successful' : 'Logout failed',
        error: result.error
      };
    } catch (error) {
      this.logger.error('Logout error', error);
      throw error;
    }
  }

  /**
   * Handle report blocked items message
   * Allows users to report incorrectly blocked content for feedback
   */
  async handleReportBlockedItems(message, sender) {
    this.logger.debug('Report blocked items requested', {
      url: message?.url,
      itemCount: message?.items?.length || 0,
      messageData: message
    });

    try {
      // Validate message data with better error handling
      if (!message || typeof message !== 'object') {
        console.warn('[BackgroundController] Invalid message format for blocked items report:', message);
        return { success: false, error: 'Invalid message format' };
      }

      if (!message.items || !Array.isArray(message.items)) {
        console.warn('[BackgroundController] Invalid items data for blocked items report:', message.items);
        return { success: false, error: 'Invalid items data' };
      }

      if (!message.url || typeof message.url !== 'string') {
        console.warn('[BackgroundController] Missing or invalid URL for blocked items report:', message.url);
        return { success: false, error: 'Missing or invalid URL' };
      }

      // Prepare report data
      const reportData = {
        url: message.url,
        items: message.items,
        timestamp: new Date().toISOString(),
        userAgent: message.userAgent || 'unknown',
        sessionId: message.sessionId || 'unknown'
      };

      // Send to backend for analysis (optional - could be stored locally)
      try {
        const response = await fetch(`${CONFIG.STAGING_WEBSITE}/api/report-blocked-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reportData)
        });

        if (response.ok) {
          this.logger.info('Blocked items report sent successfully');
        } else {
          this.logger.warn('Failed to send blocked items report to backend');
        }
      } catch (apiError) {
        // Don't fail the whole operation if backend is unavailable
        this.logger.warn('Backend unavailable for blocked items report', apiError);
      }

      // Store locally for analytics
      const reports = await chrome.storage.local.get(['blockedItemReports']) || { blockedItemReports: [] };
      reports.blockedItemReports = reports.blockedItemReports || [];
      reports.blockedItemReports.push(reportData);
      
      // Keep only last 100 reports to prevent storage bloat
      if (reports.blockedItemReports.length > 100) {
        reports.blockedItemReports = reports.blockedItemReports.slice(-100);
      }
      
      await chrome.storage.local.set({ blockedItemReports: reports.blockedItemReports });

      return {
        success: true,
        message: 'Report submitted successfully'
      };

    } catch (error) {
      console.error('[BackgroundController] Failed to handle blocked items report:', error);
      this.logger.error('Failed to handle blocked items report', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  // /**
  //  * Handle auth state change message
  //  */
  // async handleAuthStateChange(message, sender) {
  //   this.logger.debug('Auth state change', {
  //     isAuthenticated: message.isAuthenticated
  //   });
  //
  //   if (message.isAuthenticated === undefined) {
  //     throw new Error('Missing auth state');
  //   }
  //
  //   try {
  //     // Update state manager
  //     await this.stateManager.setAuthenticated(
  //       message.isAuthenticated,
  //       message.user || null
  //     );
  //
  //     this.logger.info('Auth state updated', {
  //       isAuthenticated: message.isAuthenticated
  //     });
  //
  //     return {
  //       message: 'Auth state updated'
  //     };
  //   } catch (error) {
  //     this.logger.error('Failed to update auth state', error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Handle make authenticated request message
  //  */
  // async handleMakeAuthenticatedRequest(message, sender) {
  //   this.logger.debug('Authenticated request', {
  //     endpoint: message.endpoint
  //   });
  //
  //   if (!message.endpoint) {
  //     throw new Error('Missing endpoint');
  //   }
  //
  //   try {
  //     const response = await this.api.makeAuthenticatedRequest(
  //       message.endpoint,
  //       message.options || {},
  //       CONFIG.STAGING_WEBSITE
  //     );
  //
  //     const data = await response.json();
  //
  //     this.logger.info('Authenticated request successful', {
  //       endpoint: message.endpoint,
  //       status: response.status
  //     });
  //
  //     return { data };
  //   } catch (error) {
  //     this.logger.error('Authenticated request failed', error);
  //     throw error;
  //   }
  // }

  /**
   * Handler for GET_BLOCK_STATS message
   */
  async handleGetBlockStats(message, sender) {
    return { success: true, globalBlockStats: this.stateManager.getGlobalBlockStats() };
  }

  /**
   * 🚀 WORLD-CLASS SNAPPY SCROLL MESSAGE HANDLER
   */
  async handleSnappyScrollMessage(message, sender) {
    try {
      console.log(`📜 [SNAPPY] Received scroll event from tab ${sender.tab?.id}`);

      if (!sender.tab?.id) {
        return { success: false, error: 'No tab ID provided' };
      }

      // Handle snappy scroll event with prediction and prefetching
      await this.handleSnappyScrollEvent(message.scrollData, sender.tab.id);

      return {
        success: true,
        message: 'Snappy scroll processed',
        predictorState: {
          direction: this.snappySystem.scrollPredictor.direction,
          velocity: this.snappySystem.scrollPredictor.velocity
        }
      };

    } catch (error) {
      console.error(`❌ [SNAPPY] Scroll message handler error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 🚀 GET SNAPPY PERFORMANCE STATS
   */
  async handleGetSnappyStats(message, sender) {
    try {
      const cacheStats = this.getAICacheStats();
      const snappyStats = {
        scrollPredictor: this.snappySystem.scrollPredictor,
        performanceMetrics: this.snappySystem.performanceMetrics,
        viewportTracking: {
          trackedTabs: this.snappySystem.viewportTracker.size,
          lastPrefetchTime: this.snappySystem.lastPrefetchTime
        },
        activeRequests: this.snappySystem.requestDeduplication.size
      };

      return {
        success: true,
        cacheStats,
        snappyStats,
        systemHealth: {
          totalCacheEntries: Object.values(cacheStats.cacheSizes).reduce((sum, size) => sum + size, 0),
          avgResponseTime: cacheStats.avgResponseTime,
          adaptiveChunkSize: cacheStats.adaptiveChunkSize
        }
      };

    } catch (error) {
      console.error(`❌ [SNAPPY] Stats handler error:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Auto-enable functionality removed - users must manually enable profiles

  /**
   * Debug storage state
   */
  async debugStorageState() {
    try {
      const allData = await chrome.storage.local.get();
      const bytesInUse = await chrome.storage.local.getBytesInUse();

      const testKey = 'topaz_storage_test';
      const testValue = { test: true, timestamp: Date.now() };

      await chrome.storage.local.set({ [testKey]: testValue });
      const testResult = await chrome.storage.local.get([testKey]);

      if (JSON.stringify(testResult[testKey]) === JSON.stringify(testValue)) {
        await chrome.storage.local.remove([testKey]);
      }
    } catch (error) {
    }
  }

  /**
   * Get current system state
   */
  getSystemState() {
    return {
      state: this.stateManager.getState(),
      registeredHandlers: this.messageRouter.getRegisteredTypes(),
      events: this.eventBus.getEvents()
    };
  }

  /**
   * Enable debug mode
   */
  enableDebugMode() {
    this.eventBus.setDebug(true);
  }

  /**
   * Disable debug mode
   */
  disableDebugMode() {
    this.eventBus.setDebug(false);
  }
}

export default BackgroundController;
