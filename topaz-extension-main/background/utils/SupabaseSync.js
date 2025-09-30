// Supabase Synchronization Module
// Handles async sync of user data to Supabase backend

class SupabaseSync {
    constructor() {
        this.backendUrl = 'https://doom-blocker-backend.onrender.com';
        this.syncInProgress = false;
        this.syncInterval = null;
        this.retryAttempts = 3;
        this.retryDelay = 2000; // 2 seconds
    }

    // Initialize sync system
    async initialize() {
        console.log('🔄 Initializing Supabase sync...');

        // Start periodic sync every 30 seconds
        this.syncInterval = setInterval(() => {
            this.syncPendingData();
        }, 30000);

        // Sync immediately on initialization
        setTimeout(() => this.syncPendingData(), 1000);
    }

    // Sync user session to Supabase
    async syncUserSession(sessionData) {
        try {
            const payload = {
                session_id: sessionData.sessionId,
                device_info: sessionData.deviceInfo,
                created_at: new Date(sessionData.createdAt).toISOString(),
                extension_version: sessionData.version,
                first_install: sessionData.firstInstall || false
            };

            const response = await this.makeRequest('/api/user-session', 'POST', payload);

            if (response.success) {
                console.log('✅ User session synced to Supabase');
                return true;
            } else {
                console.warn('⚠️ Failed to sync user session:', response.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Error syncing user session:', error);
            return false;
        }
    }

    // Sync blocked items data
    async syncBlockedItems(sessionId, blockedData) {
        try {
            const payload = {
                session_id: sessionId,
                blocked_items: blockedData.map(item => ({
                    timestamp: new Date(item.timestamp).toISOString(),
                    count: item.count,
                    url: item.url,
                    hostname: this.extractHostname(item.url),
                    items: item.items || []
                }))
            };

            const response = await this.makeRequest('/api/blocked-items', 'POST', payload);

            if (response.success) {
                console.log(`✅ Synced ${blockedData.length} blocked items to Supabase`);
                return true;
            } else {
                console.warn('⚠️ Failed to sync blocked items:', response.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Error syncing blocked items:', error);
            return false;
        }
    }

    // Sync user metrics
    async syncUserMetrics(sessionId, metrics) {
        try {
            const payload = {
                session_id: sessionId,
                total_blocked: metrics.totalBlocked || 0,
                blocked_today: metrics.blockedToday || 0,
                sites_visited: metrics.sitesVisited || [],
                profiles_used: metrics.profilesUsed || [],
                last_updated: new Date().toISOString()
            };

            const response = await this.makeRequest('/api/user-metrics', 'POST', payload);

            if (response.success) {
                console.log('✅ User metrics synced to Supabase');
                return true;
            } else {
                console.warn('⚠️ Failed to sync user metrics:', response.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Error syncing user metrics:', error);
            return false;
        }
    }

    // Sync all pending data from the queue
    async syncPendingData() {
        if (this.syncInProgress) {
            console.log('🔄 Sync already in progress, skipping...');
            return;
        }

        this.syncInProgress = true;

        try {
            // Get session manager from content script
            const sessionManager = await this.getSessionManager();
            if (!sessionManager) {
                console.log('📱 Session manager not available, skipping sync');
                return;
            }

            let syncQueue = [];
            try {
                // Check if sessionManager has getSyncQueue method
                if (typeof sessionManager.getSyncQueue === 'function') {
                    syncQueue = sessionManager.getSyncQueue() || [];
                } else {
                    // Fallback: try to get sync queue from sessionManager data
                    syncQueue = sessionManager.syncQueue || sessionManager.queue || [];
                }
            } catch (error) {
                console.warn('Could not get sync queue:', error);
                return;
            }

            const unsynced = syncQueue.filter(item => !item.synced);

            if (unsynced.length === 0) {
                console.log('✨ No data to sync');
                return;
            }

            console.log(`🔄 Syncing ${unsynced.length} pending items...`);

            const syncedTimestamps = [];

            for (const item of unsynced) {
                let success = false;

                // Sync user session if first install
                if (item.data.firstInstall && item.data.sessionId) {
                    success = await this.syncUserSession(item.data);
                }

                // Sync blocked items if available
                if (item.data.blockedItems && item.data.blockedItems.length > 0) {
                    success = await this.syncBlockedItems(item.sessionId, item.data.blockedItems);
                }

                // Sync general metrics
                success = await this.syncUserMetrics(item.sessionId, item.data);

                if (success) {
                    syncedTimestamps.push(item.timestamp);
                }
            }

            // Mark synced items
            if (syncedTimestamps.length > 0) {
                try {
                    sessionManager.markAsSynced(syncedTimestamps);
                    console.log(`✅ Successfully synced ${syncedTimestamps.length} items`);
                } catch (error) {
                    console.warn('Could not mark items as synced:', error);
                }
            }

        } catch (error) {
            console.error('❌ Error during sync:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    // Get session manager from content scripts across all tabs
    async getSessionManager() {
        try {
            // Query all tabs that might have the extension running
            const tabs = await chrome.tabs.query({
                url: ['https://www.youtube.com/*', 'https://youtube.com/*', 'https://twitter.com/*', 'https://x.com/*', 'https://linkedin.com/*', 'https://reddit.com/*']
            });

            // Try to get session manager from any active tab
            for (const tab of tabs) {
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        type: 'GET_SESSION_MANAGER'
                    });

                    if (response && response.success && response.sessionManager) {
                        return response.sessionManager;
                    }
                } catch (error) {
                    // Tab might not have content script loaded, continue to next
                    continue;
                }
            }

            return null;
        } catch (error) {
            // Session manager might not be loaded yet
            return null;
        }
    }

    // Make HTTP request to backend
    async makeRequest(endpoint, method = 'GET', data = null, retries = 0) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            // Attach user token from storage for server-side auth
            try {
                const result = await chrome.storage.local.get(['topaz_access_token']);
                const userToken = result && result.topaz_access_token;
                if (userToken) {
                    options.headers['X-User-Token'] = userToken;
                } else {
                    console.warn('SupabaseSync: missing topaz_access_token; request may be rejected');
                }
            } catch (e) {
                console.warn('SupabaseSync: failed to read access token from storage');
            }

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.backendUrl}${endpoint}`, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${result.error || 'Request failed'}`);
            }

            return result;

        } catch (error) {
            console.warn(`Request failed (attempt ${retries + 1}):`, error.message);

            // Retry logic
            if (retries < this.retryAttempts) {
                await this.delay(this.retryDelay * (retries + 1));
                return this.makeRequest(endpoint, method, data, retries + 1);
            }

            // Final failure
            return { success: false, error: error.message };
        }
    }

    // Extract hostname from URL
    extractHostname(url) {
        try {
            return new URL(url).hostname;
        } catch (error) {
            return 'unknown';
        }
    }

    // Delay helper
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Stop sync system
    stop() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('⏹️ Supabase sync stopped');
    }

    // Get sync status
    getStatus() {
        return {
            syncInProgress: this.syncInProgress,
            intervalActive: !!this.syncInterval,
            backendUrl: this.backendUrl
        };
    }
}

// Export the class as default
export default SupabaseSync;