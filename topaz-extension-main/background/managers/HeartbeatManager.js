import { BACKGROUND_EVENTS as EVENTS, MESSAGE_TYPES, TIMINGS } from '../../shared/constants.js';

/**
 * HeartbeatManager - Manages popup lifecycle detection
 */
class HeartbeatManager {
  constructor(eventBus, stateManager, tabManager) {
    this.eventBus = eventBus;
    this.stateManager = stateManager;
    this.tabManager = tabManager;
    
    // Heartbeat state
    this.isMonitoring = false;
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    this.popupTabId = null;
    
    // Configuration
    this.HEARTBEAT_INTERVAL = TIMINGS.HEARTBEAT_INTERVAL; // from shared constants
    this.HEARTBEAT_TIMEOUT = TIMINGS.HEARTBEAT_TIMEOUT;   // from shared constants
    this.MAX_MISSED_BEATS = 3; // Allow a few missed beats before considering popup closed
    this.missedBeats = 0;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.eventBus.on(EVENTS.POPUP_OPENED, (data) => {
      this.startHeartbeatMonitoring(data.tabId);
    });

    this.eventBus.on(EVENTS.POPUP_CLOSED, () => {
      this.stopHeartbeatMonitoring();
    });
  }

  /**
   * Start heartbeat monitoring for the popup
   */
  startHeartbeatMonitoring(tabId = null) {
    if (this.isMonitoring) {
      this.stopHeartbeatMonitoring();
    }

    this.isMonitoring = true;
    this.popupTabId = tabId;
    this.missedBeats = 0;

    // Start monitoring for heartbeats (popup will send them)
    this.heartbeatTimeout = setTimeout(() => {
      this.handleMissedHeartbeat();
    }, this.HEARTBEAT_TIMEOUT);

    // Emit event
    this.eventBus.emit(EVENTS.HEARTBEAT_MONITORING_STARTED, {
      tabId: this.popupTabId
    });
  }

  /**
   * Stop heartbeat monitoring
   */
  async stopHeartbeatMonitoring() {
    console.log('🔍 [TOPAZ DEBUG] HeartbeatManager stopHeartbeatMonitoring called');
    if (!this.isMonitoring) {
      console.log('🔍 [TOPAZ DEBUG] Not monitoring, returning early');
      return;
    }

    console.log('🔍 [TOPAZ DEBUG] Stopping heartbeat monitoring for tab:', this.popupTabId);

    // Clear intervals and timeouts
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    this.isMonitoring = false;
    const tabId = this.popupTabId;
    this.popupTabId = null;
    this.missedBeats = 0;

    console.log('🔍 [TOPAZ DEBUG] Emitting HEARTBEAT_MONITORING_STOPPED event for tab:', tabId);
    // Emit event
    this.eventBus.emit(EVENTS.HEARTBEAT_MONITORING_STOPPED, {
      tabId
    });
  }

  /**
   * Record heartbeat received from popup
   */
  recordHeartbeat() {
    if (!this.isMonitoring) {
      return;
    }

    // Reset missed beats counter
    this.missedBeats = 0;
    
    // Clear any existing timeout
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }

    // Set timeout for next expected heartbeat
    this.heartbeatTimeout = setTimeout(() => {
      this.handleMissedHeartbeat();
    }, this.HEARTBEAT_TIMEOUT);
  }

  /**
   * Handle missed heartbeat
   */
  handleMissedHeartbeat() {
    this.missedBeats++;
    console.log('🔍 [TOPAZ DEBUG] Missed heartbeat, count:', this.missedBeats, 'max:', this.MAX_MISSED_BEATS);

    if (this.missedBeats >= this.MAX_MISSED_BEATS) {
      // Start timing from missed heartbeat detection
      console.time('⏱️ HEARTBEAT_TO_ENABLE_COMPLETE');
      console.log('⏱️ TIMING START: Missed heartbeat detected, starting timer');
      console.log('🔍 [TOPAZ DEBUG] Max missed beats reached, stopping monitoring');
      
      this.stopHeartbeatMonitoring();
    } else {
      console.log('🔍 [TOPAZ DEBUG] Waiting for next heartbeat, timeout in', this.HEARTBEAT_TIMEOUT, 'ms');
      // Set timeout for next expected heartbeat
      this.heartbeatTimeout = setTimeout(() => {
        this.handleMissedHeartbeat();
      }, this.HEARTBEAT_TIMEOUT);
    }
  }

  /**
   * Get current monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      popupTabId: this.popupTabId,
      missedBeats: this.missedBeats
    };
  }
}

export default HeartbeatManager;