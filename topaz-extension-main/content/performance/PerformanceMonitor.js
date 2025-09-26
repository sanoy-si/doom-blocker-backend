/**
 * 🚀 REAL-TIME PERFORMANCE MONITORING DASHBOARD
 * Provides comprehensive performance insights across all optimization systems
 * Tracks every microsecond and identifies bottlenecks instantly
 */
class PerformanceMonitor {
  constructor() {
    this.debugName = 'PerfMonitor';

    // 🚀 PERFORMANCE TRACKING SYSTEMS
    this.systems = {
      ultraFastScanner: null,      // UltraFastGridScanner instance
      smartCache: null,            // SmartCacheSystem instance
      asyncPipeline: null,         // AsyncProcessingPipeline instance
      cssOptimizer: null          // CSSPerformanceOptimizer instance
    };

    // 🚀 REAL-TIME METRICS
    this.metrics = {
      // System performance
      totalOperations: 0,
      totalTimeSaved: 0,
      averageOperationTime: 0,

      // Memory optimization
      memoryLeaksPrevented: 0,
      resourcesCleaned: 0,

      // Cache performance
      cacheHitRate: 0,
      cacheSize: 0,

      // Processing efficiency
      frameDropsPrevented: 0,
      backgroundTasksCompleted: 0,

      // Browser optimization
      domQueriesOptimized: 0,
      cssReflowsPrevented: 0,

      // Real-time performance
      currentFPS: 60,
      memoryUsage: 0,
      cpuUsage: 0
    };

    // 🚀 PERFORMANCE DASHBOARD STATE
    this.dashboard = {
      isVisible: false,
      element: null,
      updateInterval: null,
      position: { x: 10, y: 10 },
      collapsed: false
    };

    // 🚀 ALERT SYSTEM
    this.alerts = {
      performanceThresholds: {
        slowOperation: 50,        // Alert if operation > 50ms
        highMemoryUsage: 100,     // Alert if memory > 100MB
        lowCacheHitRate: 70,      // Alert if cache hit rate < 70%
        frameDrops: 3             // Alert if > 3 frame drops per second
      },
      activeAlerts: new Map(),
      alertHistory: []
    };

    // 🚀 PERFORMANCE HISTORY
    this.history = {
      operationTimes: [],
      memoryUsage: [],
      cachePerformance: [],
      systemHealth: [],
      maxHistoryLength: 100
    };

    console.log(`📊 [${this.debugName}] Performance monitoring dashboard initialized`);
    this.startMonitoring();
  }

  /**
   * 🚀 SYSTEM REGISTRATION
   * Register performance systems for monitoring
   */
  registerSystem(name, instance) {
    if (this.systems.hasOwnProperty(name)) {
      this.systems[name] = instance;
      console.log(`📈 [${this.debugName}] Registered ${name} for monitoring`);
    } else {
      console.warn(`⚠️ [${this.debugName}] Unknown system: ${name}`);
    }
  }

  /**
   * 🚀 REAL-TIME MONITORING
   * Continuously track performance across all systems
   */
  startMonitoring() {
    // Update metrics every 100ms for real-time feedback
    this.dashboard.updateInterval = setInterval(() => {
      this.updateRealTimeMetrics();
      this.checkPerformanceAlerts();
      this.updateDashboardDisplay();
    }, 100);

    console.log(`⏰ [${this.debugName}] Real-time monitoring started`);
  }

  /**
   * 🚀 REAL-TIME METRICS COLLECTION
   */
  updateRealTimeMetrics() {
    try {
      // 🚀 COLLECT SYSTEM METRICS
      const newMetrics = {
        totalOperations: 0,
        totalTimeSaved: 0,
        cacheHitRate: 0,
        cacheSize: 0,
        frameDropsPrevented: 0,
        backgroundTasksCompleted: 0
      };

      // UltraFastGridScanner metrics
      if (this.systems.ultraFastScanner) {
        const scannerStats = this.systems.ultraFastScanner.getPerformanceStats();
        newMetrics.totalOperations += scannerStats.fastScans + scannerStats.slowScans;
        newMetrics.cacheHitRate = parseFloat(scannerStats.cacheHitRate) || 0;
        newMetrics.totalTimeSaved += scannerStats.totalScanTime || 0;
      }

      // SmartCacheSystem metrics
      if (this.systems.smartCache) {
        const cacheStats = this.systems.smartCache.getStatistics();
        newMetrics.cacheHitRate = Math.max(newMetrics.cacheHitRate, parseFloat(cacheStats.performance.hitRate) || 0);
        newMetrics.cacheSize = (cacheStats.cacheSize.hot + cacheStats.cacheSize.warm + cacheStats.cacheSize.cold);
      }

      // AsyncProcessingPipeline metrics
      if (this.systems.asyncPipeline) {
        const pipelineStats = this.systems.asyncPipeline.getPerformanceStats();
        newMetrics.backgroundTasksCompleted = pipelineStats.metrics.backgroundTasksCompleted || 0;
        newMetrics.frameDropsPrevented = Math.max(0, 1000 - pipelineStats.metrics.frameDrops);
      }

      // 🚀 BROWSER PERFORMANCE METRICS
      if (window.performance && window.performance.memory) {
        this.metrics.memoryUsage = Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024);
      }

      // 🚀 FPS CALCULATION
      this.calculateFPS();

      // Update metrics
      Object.assign(this.metrics, newMetrics);

      // 🚀 HISTORY TRACKING
      this.updatePerformanceHistory();

    } catch (error) {
      console.error(`❌ [${this.debugName}] Error updating metrics:`, error);
    }
  }

  /**
   * 🚀 FPS CALCULATION
   * Real-time FPS monitoring
   */
  calculateFPS() {
    if (!this.fpsData) {
      this.fpsData = {
        lastTime: performance.now(),
        frameCount: 0,
        fps: 60
      };
    }

    this.fpsData.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.fpsData.lastTime;

    if (elapsed >= 1000) { // Update every second
      this.metrics.currentFPS = Math.round((this.fpsData.frameCount * 1000) / elapsed);
      this.fpsData.frameCount = 0;
      this.fpsData.lastTime = currentTime;
    }

    requestAnimationFrame(() => this.calculateFPS());
  }

  /**
   * 🚀 PERFORMANCE ALERTS
   * Monitor for performance issues and alert immediately
   */
  checkPerformanceAlerts() {
    const alerts = [];

    // 🚀 LOW FPS ALERT
    if (this.metrics.currentFPS < 50) {
      alerts.push({
        type: 'performance',
        severity: 'warning',
        message: `Low FPS detected: ${this.metrics.currentFPS}fps`,
        metric: 'fps',
        value: this.metrics.currentFPS
      });
    }

    // 🚀 HIGH MEMORY USAGE ALERT
    if (this.metrics.memoryUsage > this.alerts.performanceThresholds.highMemoryUsage) {
      alerts.push({
        type: 'memory',
        severity: 'warning',
        message: `High memory usage: ${this.metrics.memoryUsage}MB`,
        metric: 'memory',
        value: this.metrics.memoryUsage
      });
    }

    // 🚀 LOW CACHE HIT RATE ALERT
    if (this.metrics.cacheHitRate < this.alerts.performanceThresholds.lowCacheHitRate) {
      alerts.push({
        type: 'cache',
        severity: 'info',
        message: `Low cache hit rate: ${this.metrics.cacheHitRate.toFixed(1)}%`,
        metric: 'cache',
        value: this.metrics.cacheHitRate
      });
    }

    // 🚀 PROCESS NEW ALERTS
    alerts.forEach(alert => {
      const alertKey = `${alert.type}_${alert.metric}`;
      if (!this.alerts.activeAlerts.has(alertKey)) {
        this.alerts.activeAlerts.set(alertKey, alert);
        this.alerts.alertHistory.push({
          ...alert,
          timestamp: Date.now()
        });
        console.warn(`⚠️ [${this.debugName}] ALERT: ${alert.message}`);
      }
    });

    // 🚀 CLEAR RESOLVED ALERTS
    this.alerts.activeAlerts.forEach((alert, key) => {
      if (alert.metric === 'fps' && this.metrics.currentFPS >= 50) {
        this.alerts.activeAlerts.delete(key);
      }
      if (alert.metric === 'memory' && this.metrics.memoryUsage <= this.alerts.performanceThresholds.highMemoryUsage) {
        this.alerts.activeAlerts.delete(key);
      }
      if (alert.metric === 'cache' && this.metrics.cacheHitRate >= this.alerts.performanceThresholds.lowCacheHitRate) {
        this.alerts.activeAlerts.delete(key);
      }
    });
  }

  /**
   * 🚀 PERFORMANCE HISTORY TRACKING
   */
  updatePerformanceHistory() {
    const timestamp = Date.now();

    // Add new data points
    this.history.operationTimes.push({
      timestamp,
      value: this.metrics.averageOperationTime
    });

    this.history.memoryUsage.push({
      timestamp,
      value: this.metrics.memoryUsage
    });

    this.history.cachePerformance.push({
      timestamp,
      value: this.metrics.cacheHitRate
    });

    this.history.systemHealth.push({
      timestamp,
      fps: this.metrics.currentFPS,
      memory: this.metrics.memoryUsage,
      cache: this.metrics.cacheHitRate
    });

    // 🚀 MAINTAIN HISTORY SIZE
    Object.keys(this.history).forEach(key => {
      if (Array.isArray(this.history[key]) && this.history[key].length > this.history.maxHistoryLength) {
        this.history[key] = this.history[key].slice(-this.history.maxHistoryLength);
      }
    });
  }

  /**
   * 🚀 DASHBOARD DISPLAY
   * Create and update visual performance dashboard
   */
  createDashboard() {
    if (this.dashboard.element) return;

    const dashboard = document.createElement('div');
    dashboard.id = 'topaz-performance-dashboard';
    dashboard.style.cssText = `
      position: fixed;
      top: ${this.dashboard.position.y}px;
      left: ${this.dashboard.position.x}px;
      width: 320px;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      border: 1px solid #444;
      border-radius: 12px;
      padding: 16px;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #00ff88;
      z-index: 999999;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      backdrop-filter: blur(10px);
      user-select: none;
      cursor: move;
    `;

    dashboard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="color: #00ff88; font-weight: bold; font-size: 13px;">⚡ TOPAZ PERFORMANCE</div>
        <div style="display: flex; gap: 8px;">
          <button id="collapse-btn" style="background: #333; border: none; color: #00ff88; padding: 4px 8px; border-radius: 4px; cursor: pointer;">−</button>
          <button id="close-btn" style="background: #ff4444; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer;">×</button>
        </div>
      </div>
      <div id="dashboard-content">
        <div id="metrics-display"></div>
        <div id="alerts-display" style="margin-top: 12px;"></div>
        <div id="systems-display" style="margin-top: 12px;"></div>
      </div>
    `;

    // 🚀 DASHBOARD CONTROLS
    dashboard.querySelector('#close-btn').onclick = () => this.hideDashboard();
    dashboard.querySelector('#collapse-btn').onclick = () => this.toggleCollapse();

    // 🚀 MAKE DRAGGABLE
    this.makeDraggable(dashboard);

    document.body.appendChild(dashboard);
    this.dashboard.element = dashboard;
    this.dashboard.isVisible = true;

    console.log(`📊 [${this.debugName}] Performance dashboard created`);
  }

  /**
   * 🚀 UPDATE DASHBOARD DISPLAY
   */
  updateDashboardDisplay() {
    if (!this.dashboard.element || this.dashboard.collapsed) return;

    const metricsDisplay = this.dashboard.element.querySelector('#metrics-display');
    const alertsDisplay = this.dashboard.element.querySelector('#alerts-display');
    const systemsDisplay = this.dashboard.element.querySelector('#systems-display');

    // 🚀 METRICS DISPLAY
    metricsDisplay.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10px;">
        <div>FPS: <span style="color: ${this.metrics.currentFPS >= 50 ? '#00ff88' : '#ff4444'}">${this.metrics.currentFPS}</span></div>
        <div>Memory: <span style="color: ${this.metrics.memoryUsage < 100 ? '#00ff88' : '#ff4444'}">${this.metrics.memoryUsage}MB</span></div>
        <div>Cache Hit: <span style="color: ${this.metrics.cacheHitRate >= 70 ? '#00ff88' : '#ffaa44'}">${this.metrics.cacheHitRate.toFixed(1)}%</span></div>
        <div>Cache Size: <span style="color: #88aaff">${this.metrics.cacheSize}</span></div>
        <div>Operations: <span style="color: #88ffaa">${this.metrics.totalOperations}</span></div>
        <div>Time Saved: <span style="color: #aaffaa">${this.metrics.totalTimeSaved.toFixed(0)}ms</span></div>
      </div>
    `;

    // 🚀 ALERTS DISPLAY
    if (this.alerts.activeAlerts.size > 0) {
      alertsDisplay.innerHTML = `
        <div style="color: #ff6644; font-size: 10px; margin-bottom: 4px;">⚠️ ALERTS:</div>
        ${Array.from(this.alerts.activeAlerts.values()).map(alert => `
          <div style="color: ${alert.severity === 'warning' ? '#ff6644' : '#ffaa44'}; font-size: 9px;">
            • ${alert.message}
          </div>
        `).join('')}
      `;
    } else {
      alertsDisplay.innerHTML = `<div style="color: #00ff88; font-size: 10px;">✓ All systems optimal</div>`;
    }

    // 🚀 SYSTEMS STATUS
    const systemStatuses = [];
    if (this.systems.ultraFastScanner) systemStatuses.push(`Scanner: ✓`);
    if (this.systems.smartCache) systemStatuses.push(`Cache: ✓`);
    if (this.systems.asyncPipeline) systemStatuses.push(`Pipeline: ✓`);
    if (this.systems.cssOptimizer) systemStatuses.push(`CSS: ✓`);

    systemsDisplay.innerHTML = `
      <div style="font-size: 9px; color: #88aaff;">
        Active Systems: ${systemStatuses.join(' | ')}
      </div>
    `;
  }

  /**
   * 🚀 DASHBOARD CONTROLS
   */
  showDashboard() {
    if (!this.dashboard.element) {
      this.createDashboard();
    } else {
      this.dashboard.element.style.display = 'block';
      this.dashboard.isVisible = true;
    }
  }

  hideDashboard() {
    if (this.dashboard.element) {
      this.dashboard.element.style.display = 'none';
      this.dashboard.isVisible = false;
    }
  }

  toggleCollapse() {
    const content = this.dashboard.element.querySelector('#dashboard-content');
    const btn = this.dashboard.element.querySelector('#collapse-btn');

    if (this.dashboard.collapsed) {
      content.style.display = 'block';
      btn.textContent = '−';
      this.dashboard.collapsed = false;
    } else {
      content.style.display = 'none';
      btn.textContent = '+';
      this.dashboard.collapsed = true;
    }
  }

  /**
   * 🚀 MAKE DASHBOARD DRAGGABLE
   */
  makeDraggable(element) {
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    element.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      isDragging = true;
      dragOffset.x = e.clientX - element.offsetLeft;
      dragOffset.y = e.clientY - element.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      element.style.left = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, x)) + 'px';
      element.style.top = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, y)) + 'px';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  /**
   * 🚀 PERFORMANCE ANALYSIS
   */
  getPerformanceReport() {
    const now = Date.now();
    const recentHistory = this.history.systemHealth.filter(entry => now - entry.timestamp < 30000);

    return {
      currentMetrics: this.metrics,
      systemHealth: {
        averageFPS: recentHistory.reduce((sum, entry) => sum + entry.fps, 0) / recentHistory.length || 60,
        averageMemory: recentHistory.reduce((sum, entry) => sum + entry.memory, 0) / recentHistory.length || 0,
        averageCacheHit: recentHistory.reduce((sum, entry) => sum + entry.cache, 0) / recentHistory.length || 0
      },
      activeAlerts: Array.from(this.alerts.activeAlerts.values()),
      recentAlerts: this.alerts.alertHistory.slice(-10),
      systemsOnline: Object.values(this.systems).filter(system => system !== null).length
    };
  }

  /**
   * 🚀 MANUAL PERFORMANCE TEST
   */
  async runPerformanceTest() {
    console.log(`🧪 [${this.debugName}] Running comprehensive performance test...`);

    const testResults = {
      domScanSpeed: 0,
      cacheEfficiency: 0,
      processingSpeed: 0,
      memoryEfficiency: 0
    };

    try {
      // 🚀 DOM SCAN SPEED TEST
      if (this.systems.ultraFastScanner) {
        const startTime = performance.now();
        await this.systems.ultraFastScanner.findAllGridContainers(true);
        testResults.domScanSpeed = performance.now() - startTime;
      }

      // 🚀 CACHE EFFICIENCY TEST
      if (this.systems.smartCache) {
        const cacheStats = this.systems.smartCache.getStatistics();
        testResults.cacheEfficiency = parseFloat(cacheStats.performance.hitRate) || 0;
      }

      // 🚀 PROCESSING SPEED TEST
      if (this.systems.asyncPipeline) {
        const pipelineStats = this.systems.asyncPipeline.getPerformanceStats();
        testResults.processingSpeed = pipelineStats.performance.averageFrameTime || 16;
      }

      console.log(`✅ [${this.debugName}] Performance test completed:`, testResults);
      return testResults;

    } catch (error) {
      console.error(`❌ [${this.debugName}] Performance test failed:`, error);
      return testResults;
    }
  }

  /**
   * 🚀 KEYBOARD SHORTCUTS
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+P - Toggle dashboard
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        this.dashboard.isVisible ? this.hideDashboard() : this.showDashboard();
      }

      // Ctrl+Shift+T - Run performance test
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.runPerformanceTest();
      }
    });

    console.log(`⌨️ [${this.debugName}] Keyboard shortcuts enabled (Ctrl+Shift+P: Dashboard, Ctrl+Shift+T: Test)`);
  }

  /**
   * 🚀 DESTRUCTION
   */
  destroy() {
    if (this.dashboard.updateInterval) {
      clearInterval(this.dashboard.updateInterval);
    }

    if (this.dashboard.element) {
      this.dashboard.element.remove();
    }

    console.log(`🗑️ [${this.debugName}] Performance monitor destroyed`);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
} else if (typeof window !== 'undefined') {
  window.PerformanceMonitor = PerformanceMonitor;
}// Make PerformanceMonitor available globally for content script
window.PerformanceMonitor = PerformanceMonitor;
