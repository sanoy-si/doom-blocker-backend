/**
 * 🚀 CRITICAL FIX: StateValidator
 * Prevents race conditions and state conflicts in progressive filtering
 * Solves: Multiple systems setting isActive simultaneously, health check restart conflicts
 */
class StateValidator {
  constructor(debugName = 'StateValidator') {
    this.debugName = debugName;

    // Session management
    this.activeSessions = new Map(); // sessionId -> { type, startTime, details }
    this.sessionCounter = 0;

    // Resource locking
    this.locks = new Map(); // resourceName -> { owner, timestamp }
    this.lockTimeout = 30000; // 30 second max lock duration

    // State tracking
    this.states = new Map(); // stateName -> { value, lastChanged, owner }

    // Operation tracking
    this.operations = new Map(); // operationId -> { status, progress, startTime }

    console.log(`🔒 [${this.debugName}] StateValidator initialized`);
  }

  /**
   * Create a unique session ID for operations
   */
  createSession(type = 'general', details = {}) {
    this.sessionCounter++;
    const sessionId = `${type}_${Date.now()}_${this.sessionCounter}_${Math.random().toString(36).substr(2, 9)}`;

    this.activeSessions.set(sessionId, {
      type,
      startTime: Date.now(),
      details,
      status: 'created'
    });

    console.log(`🎫 [${this.debugName}] Created session: ${sessionId} (type: ${type})`);
    return sessionId;
  }

  /**
   * Check if an operation can start (prevents conflicts)
   */
  canStartOperation(sessionId, operationType, allowedConcurrent = 1) {
    if (!this.activeSessions.has(sessionId)) {
      console.warn(`❌ [${this.debugName}] Invalid session ID: ${sessionId}`);
      return false;
    }

    // Count active operations of this type
    const activeCount = Array.from(this.activeSessions.values())
      .filter(session =>
        session.type === operationType &&
        session.status === 'running'
      ).length;

    if (activeCount >= allowedConcurrent) {
      console.log(`🚫 [${this.debugName}] Cannot start ${operationType} - ${activeCount}/${allowedConcurrent} already running`);
      return false;
    }

    // Check for conflicting operations
    const conflicts = this.getConflictingOperations(operationType);
    for (const conflictType of conflicts) {
      const conflictCount = Array.from(this.activeSessions.values())
        .filter(session =>
          session.type === conflictType &&
          session.status === 'running'
        ).length;

      if (conflictCount > 0) {
        console.log(`🚫 [${this.debugName}] Cannot start ${operationType} - ${conflictCount} conflicting ${conflictType} operations running`);
        return false;
      }
    }

    console.log(`✅ [${this.debugName}] Can start operation: ${operationType} (session: ${sessionId})`);
    return true;
  }

  /**
   * Start an operation (marks session as running)
   */
  startOperation(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`❌ [${this.debugName}] Cannot start operation - invalid session: ${sessionId}`);
      return false;
    }

    session.status = 'running';
    session.runningStartTime = Date.now();

    console.log(`▶️ [${this.debugName}] Started operation: ${session.type} (session: ${sessionId})`);
    return true;
  }

  /**
   * End a session/operation
   */
  endSession(sessionId, status = 'completed') {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`❌ [${this.debugName}] Cannot end session - not found: ${sessionId}`);
      return false;
    }

    const duration = Date.now() - session.startTime;
    console.log(`🏁 [${this.debugName}] Ended session: ${sessionId} (${session.type}) - ${status} in ${duration}ms`);

    this.activeSessions.delete(sessionId);
    return true;
  }

  /**
   * Acquire a lock on a resource
   */
  acquireLock(resourceName, owner, timeout = this.lockTimeout) {
    // Clean up expired locks first
    this.cleanExpiredLocks();

    const existingLock = this.locks.get(resourceName);
    if (existingLock) {
      console.log(`🔒 [${this.debugName}] Lock on ${resourceName} already held by ${existingLock.owner}`);
      return false;
    }

    this.locks.set(resourceName, {
      owner,
      timestamp: Date.now(),
      timeout
    });

    console.log(`🔐 [${this.debugName}] Acquired lock on ${resourceName} for ${owner}`);
    return true;
  }

  /**
   * Release a lock on a resource
   */
  releaseLock(resourceName, owner) {
    const lock = this.locks.get(resourceName);
    if (!lock) {
      console.warn(`❌ [${this.debugName}] No lock found for ${resourceName}`);
      return false;
    }

    if (lock.owner !== owner) {
      console.warn(`❌ [${this.debugName}] Cannot release lock on ${resourceName} - owned by ${lock.owner}, not ${owner}`);
      return false;
    }

    this.locks.delete(resourceName);
    console.log(`🔓 [${this.debugName}] Released lock on ${resourceName} by ${owner}`);
    return true;
  }

  /**
   * Set state atomically
   */
  setState(stateName, value, owner, force = false) {
    const existingState = this.states.get(stateName);

    if (existingState && existingState.owner !== owner && !force) {
      console.log(`🚫 [${this.debugName}] Cannot set ${stateName} - owned by ${existingState.owner}, not ${owner}`);
      return false;
    }

    this.states.set(stateName, {
      value,
      lastChanged: Date.now(),
      owner,
      previousValue: existingState?.value
    });

    console.log(`🔄 [${this.debugName}] Set state ${stateName} = ${value} by ${owner}`);
    return true;
  }

  /**
   * Get state value
   */
  getState(stateName) {
    const state = this.states.get(stateName);
    return state ? state.value : undefined;
  }

  /**
   * Get state owner
   */
  getStateOwner(stateName) {
    const state = this.states.get(stateName);
    return state ? state.owner : null;
  }

  /**
   * Define conflicting operation types
   */
  getConflictingOperations(operationType) {
    const conflicts = {
      'progressive_filtering': ['dom_analysis', 'content_extraction'],
      'dom_analysis': ['progressive_filtering'],
      'content_extraction': ['progressive_filtering'],
      'health_check': [] // Health checks don't conflict with others, but check states
    };

    return conflicts[operationType] || [];
  }

  /**
   * Clean up expired locks
   */
  cleanExpiredLocks() {
    const now = Date.now();
    const expiredLocks = [];

    this.locks.forEach((lock, resourceName) => {
      if (now - lock.timestamp > lock.timeout) {
        expiredLocks.push(resourceName);
      }
    });

    expiredLocks.forEach(resourceName => {
      const lock = this.locks.get(resourceName);
      console.log(`⏰ [${this.debugName}] Expired lock cleaned up: ${resourceName} (was owned by ${lock.owner})`);
      this.locks.delete(resourceName);
    });
  }

  /**
   * Clean up old sessions (prevent memory leaks)
   */
  cleanupOldSessions(maxAge = 300000) { // 5 minutes default
    const now = Date.now();
    const oldSessions = [];

    this.activeSessions.forEach((session, sessionId) => {
      if (now - session.startTime > maxAge) {
        oldSessions.push(sessionId);
      }
    });

    oldSessions.forEach(sessionId => {
      const session = this.activeSessions.get(sessionId);
      console.log(`🧹 [${this.debugName}] Cleaned up old session: ${sessionId} (${session.type})`);
      this.activeSessions.delete(sessionId);
    });

    return oldSessions.length;
  }

  /**
   * Get current state summary for debugging
   */
  getStateSummary() {
    this.cleanExpiredLocks();
    this.cleanupOldSessions();

    return {
      activeSessions: Array.from(this.activeSessions.entries()).map(([id, session]) => ({
        id,
        type: session.type,
        status: session.status,
        duration: Date.now() - session.startTime
      })),
      activeLocks: Array.from(this.locks.entries()).map(([resource, lock]) => ({
        resource,
        owner: lock.owner,
        duration: Date.now() - lock.timestamp
      })),
      states: Array.from(this.states.entries()).map(([name, state]) => ({
        name,
        value: state.value,
        owner: state.owner,
        age: Date.now() - state.lastChanged
      }))
    };
  }

  /**
   * Emergency cleanup - force release all locks and end all sessions
   */
  emergencyReset(reason = 'Emergency reset') {
    console.warn(`🚨 [${this.debugName}] Emergency reset: ${reason}`);

    const sessionCount = this.activeSessions.size;
    const lockCount = this.locks.size;

    this.activeSessions.clear();
    this.locks.clear();
    this.states.clear();

    console.log(`🧹 [${this.debugName}] Emergency reset complete - cleared ${sessionCount} sessions, ${lockCount} locks`);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateValidator;
} else if (typeof window !== 'undefined') {
  window.StateValidator = StateValidator;
}// Make StateValidator available globally for content script
window.StateValidator = StateValidator;
