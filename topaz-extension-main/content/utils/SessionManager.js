// UUID-based User Session Management
// Handles client-side session tracking with localStorage persistence

class SessionManager {
    constructor() {
        this.sessionKey = 'doom_blocker_user_session';
        this.metricsKey = 'doom_blocker_user_metrics';
        this.initialized = false;
    }

    // Generate a UUID v4
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Initialize session on first extension use
    async initializeSession() {
        if (this.initialized) return this.getSessionId();

        let sessionData = this.getStoredSession();

        if (!sessionData || !sessionData.sessionId) {
            // First time user - create new session
            sessionData = {
                sessionId: this.generateUUID(),
                createdAt: Date.now(),
                deviceInfo: this.getDeviceInfo(),
                firstInstall: true,
                version: this.getExtensionVersion()
            };

            // Store in localStorage
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));

            // Also store in chrome.storage for popup access
            try {
                await chrome.storage.local.set({ [this.sessionKey]: sessionData });
            } catch (error) {
                console.warn('Could not save to chrome.storage:', error);
            }

            // Initialize metrics
            this.initializeMetrics();

            console.log('🆔 New user session created:', sessionData.sessionId);
        } else {
            // Existing user
            sessionData.firstInstall = false;
            sessionData.lastActive = Date.now();
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));

            // Also update chrome.storage
            try {
                await chrome.storage.local.set({ [this.sessionKey]: sessionData });
            } catch (error) {
                console.warn('Could not update chrome.storage:', error);
            }

            console.log('🔄 Existing user session restored:', sessionData.sessionId);
        }

        this.initialized = true;
        return sessionData.sessionId;
    }

    // Get stored session from localStorage
    getStoredSession() {
        try {
            const stored = localStorage.getItem(this.sessionKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.warn('Failed to parse stored session:', error);
            return null;
        }
    }

    // Get current session ID
    getSessionId() {
        const session = this.getStoredSession();
        return session ? session.sessionId : null;
    }

    // Check if this is a first-time user
    isFirstTimeUser() {
        const session = this.getStoredSession();
        return !session || session.firstInstall === true;
    }

    // Get device info for analytics
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`
        };
    }

    // Get extension version
    getExtensionVersion() {
        try {
            return chrome.runtime.getManifest().version;
        } catch (error) {
            return '0.0.0';
        }
    }

    // Initialize user metrics
    initializeMetrics() {
        const initialMetrics = {
            sessionId: this.getSessionId(),
            totalBlocked: 0,
            blockedToday: 0,
            lastResetDate: new Date().toDateString(),
            sitesVisited: [],
            profilesUsed: [],
            createdAt: Date.now()
        };

        localStorage.setItem(this.metricsKey, JSON.stringify(initialMetrics));
    }

    // Update blocked items count
    updateBlockedCount(count, items = []) {
        try {
            let metrics = this.getMetrics();
            const today = new Date().toDateString();

            // Reset daily count if new day
            if (metrics.lastResetDate !== today) {
                metrics.blockedToday = 0;
                metrics.lastResetDate = today;
            }

            metrics.totalBlocked += count;
            metrics.blockedToday += count;
            metrics.lastUpdated = Date.now();

            // Track blocked items for analytics
            if (items.length > 0) {
                if (!metrics.blockedItems) metrics.blockedItems = [];
                const blockedData = {
                    timestamp: Date.now(),
                    count,
                    url: window.location.href,
                    items: items.slice(0, 5) // Store first 5 items for analytics
                };
                metrics.blockedItems.push(blockedData);

                // Keep only last 100 entries
                if (metrics.blockedItems.length > 100) {
                    metrics.blockedItems = metrics.blockedItems.slice(-100);
                }
            }

            localStorage.setItem(this.metricsKey, JSON.stringify(metrics));

            // Queue for Supabase sync
            this.queueForSync(metrics);

        } catch (error) {
            console.warn('Failed to update blocked count:', error);
        }
    }

    // Get current metrics
    getMetrics() {
        try {
            const stored = localStorage.getItem(this.metricsKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to parse metrics:', error);
        }

        // Return default metrics
        return {
            sessionId: this.getSessionId(),
            totalBlocked: 0,
            blockedToday: 0,
            lastResetDate: new Date().toDateString(),
            sitesVisited: [],
            profilesUsed: [],
            createdAt: Date.now()
        };
    }

    // Track site visit
    trackSiteVisit(hostname) {
        try {
            let metrics = this.getMetrics();
            if (!metrics.sitesVisited) metrics.sitesVisited = [];

            const today = new Date().toDateString();
            const existingVisit = metrics.sitesVisited.find(v =>
                v.hostname === hostname && v.date === today
            );

            if (existingVisit) {
                existingVisit.count++;
            } else {
                metrics.sitesVisited.push({
                    hostname,
                    date: today,
                    count: 1,
                    timestamp: Date.now()
                });
            }

            // Keep only last 30 days
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            metrics.sitesVisited = metrics.sitesVisited.filter(v =>
                v.timestamp > thirtyDaysAgo
            );

            localStorage.setItem(this.metricsKey, JSON.stringify(metrics));
        } catch (error) {
            console.warn('Failed to track site visit:', error);
        }
    }

    // Track profile usage
    trackProfileUsage(profileName) {
        try {
            let metrics = this.getMetrics();
            if (!metrics.profilesUsed) metrics.profilesUsed = [];

            const today = new Date().toDateString();
            const existingUsage = metrics.profilesUsed.find(p =>
                p.profileName === profileName && p.date === today
            );

            if (existingUsage) {
                existingUsage.count++;
            } else {
                metrics.profilesUsed.push({
                    profileName,
                    date: today,
                    count: 1,
                    timestamp: Date.now()
                });
            }

            localStorage.setItem(this.metricsKey, JSON.stringify(metrics));
        } catch (error) {
            console.warn('Failed to track profile usage:', error);
        }
    }

    // Queue data for Supabase sync
    queueForSync(data) {
        try {
            const syncKey = 'topaz_sync_queue';
            let queue = [];

            const stored = localStorage.getItem(syncKey);
            if (stored) {
                queue = JSON.parse(stored);
            }

            // Add to queue with timestamp
            queue.push({
                sessionId: this.getSessionId(),
                data,
                timestamp: Date.now(),
                synced: false
            });

            // Keep only last 50 items
            if (queue.length > 50) {
                queue = queue.slice(-50);
            }

            localStorage.setItem(syncKey, JSON.stringify(queue));

        } catch (error) {
            console.warn('Failed to queue data for sync:', error);
        }
    }

    // Get queued data for sync
    getSyncQueue() {
        try {
            const syncKey = 'topaz_sync_queue';
            const stored = localStorage.getItem(syncKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('Failed to get sync queue:', error);
            return [];
        }
    }

    // Mark items as synced
    markAsSynced(timestamps) {
        try {
            const syncKey = 'topaz_sync_queue';
            let queue = this.getSyncQueue();

            queue = queue.map(item => {
                if (timestamps.includes(item.timestamp)) {
                    item.synced = true;
                }
                return item;
            });

            // Remove synced items older than 1 hour
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            queue = queue.filter(item =>
                !item.synced || item.timestamp > oneHourAgo
            );

            localStorage.setItem(syncKey, JSON.stringify(queue));
        } catch (error) {
            console.warn('Failed to mark items as synced:', error);
        }
    }

    // Clear all session data (for debugging/reset)
    clearSession() {
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem(this.metricsKey);
        localStorage.removeItem('topaz_sync_queue');
        this.initialized = false;
        console.log('🗑️ Session data cleared');
    }

    // Get session info for debugging
    getSessionInfo() {
        return {
            session: this.getStoredSession(),
            metrics: this.getMetrics(),
            syncQueue: this.getSyncQueue()
        };
    }
}

// Create global instance for content scripts
window.DoomBlockerSessionManager = new SessionManager();