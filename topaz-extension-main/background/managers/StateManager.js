import { BACKGROUND_EVENTS as EVENTS, STORAGE_KEYS, CONFIG, DEFAULT_TAGS, DEFAULT_PROFILES } from '../../shared/constants.js';

/**
 * StateManager - Manages the global extension state
 */
class StateManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.state = {
      extensionEnabled: true,
      // COMMENTED OUT: Auth functionality disabled
      // isAuthenticated: false,
      tabUrls: new Map(),
      tabCooldownMap: new Map(),
      profiles: [],
      isPowerUserMode: false,
      customizationToggle: true,
      showBlockCounter: true,
      globalBlockStats: { totalBlocked: 0, blockedToday: 0, lastBlockedDate: new Date().toISOString().slice(0, 10) } // Global stats instead of per-hostname
    };
    // State snapshots for change detection
    this.profileSnapshot = null;
    this.stateSnapshot = null;
  }

  async initialize() {
    try {
      await this.loadExtensionState();
    } catch (error) {
    }
  }

  /**
   * Load extension state from Chrome storage
   */
  async loadExtensionState() {
    try {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.EXTENSION_ENABLED,
        STORAGE_KEYS.PROFILES,
        'userSettings', // Load power user mode and customization 
        'globalBlockStats', // Load global block stats
        'blockStats' // For migration from old per-hostname stats
        // COMMENTED OUT: Auth functionality disabled
        // STORAGE_KEYS.IS_AUTHENTICATED
      ]);
      let needsSave = false;
      
      // Handle extension enabled state
      if (result[STORAGE_KEYS.EXTENSION_ENABLED] !== undefined) {
        this.state.extensionEnabled = result[STORAGE_KEYS.EXTENSION_ENABLED];
      } else {
        this.state.extensionEnabled = true; // Default value
        needsSave = true;
      }
      
      // Handle power user mode
      if (result.userSettings?.isPowerUserMode !== undefined) {
        this.state.isPowerUserMode = result.userSettings.isPowerUserMode;
      } else {
        this.state.isPowerUserMode = false; // Default value
        needsSave = true;
      }

      // Handle customization toggle
      if (result.userSettings?.customizationToggle !== undefined) {
        this.state.customizationToggle = result.userSettings.customizationToggle;
      } else {
        this.state.customizationToggle = true; // Default value
        needsSave = true;
      }

      // Handle showBlockCounter
      if (result.userSettings?.showBlockCounter !== undefined) {
        this.state.showBlockCounter = result.userSettings.showBlockCounter;
      } else {
        this.state.showBlockCounter = true; // Default value
        needsSave = true;
      }
      
      // Handle profiles
      if (result[STORAGE_KEYS.PROFILES] !== undefined && Array.isArray(result[STORAGE_KEYS.PROFILES]) && result[STORAGE_KEYS.PROFILES].length > 0) {
        this.state.profiles = result[STORAGE_KEYS.PROFILES];
        
        // Update default profiles with latest tags from constants while preserving custom tags
        this.state.profiles.forEach(profile => {
          if (profile.isDefault) {
            const matchingDefaultProfile = DEFAULT_PROFILES.find(dp => dp.profileName === profile.profileName);
            if (matchingDefaultProfile) {
              // Preserve custom tags but update default tags from constants
              const customWhitelist = profile.customWhitelist || [];
              const customBlacklist = profile.customBlacklist || [];
              
              profile.whitelistTags = [...matchingDefaultProfile.whitelistTags];
              profile.blacklistTags = [...matchingDefaultProfile.blacklistTags];
              profile.customWhitelist = customWhitelist;
              profile.customBlacklist = customBlacklist;
              
              needsSave = true;
            }
          }
        });
        
        // Check for missing default profiles and add them
        const existingProfileNames = this.state.profiles.map(p => p.profileName);
        const missingDefaultProfiles = DEFAULT_PROFILES.filter(defaultProfile => 
          !existingProfileNames.includes(defaultProfile.profileName)
        );
        
        if (missingDefaultProfiles.length > 0) {
          // Add missing default profiles (disabled by default)
          missingDefaultProfiles.forEach(missingProfile => {
            const profileCopy = JSON.parse(JSON.stringify(missingProfile));
            profileCopy.isEnabled = false; // Disable by default
            this.state.profiles.push(profileCopy);
          });
          needsSave = true;
        }
      } else {
        // No profiles exist - create all default profiles (disabled by default)
        const defaultProfilesCopy = JSON.parse(JSON.stringify(DEFAULT_PROFILES));
        defaultProfilesCopy.forEach(profile => {
          profile.isEnabled = false; // Disable by default
        });
        this.state.profiles = defaultProfilesCopy;
        needsSave = true;
      }
      
      // Handle globalBlockStats with migration from old per-hostname stats
      if (result.globalBlockStats && typeof result.globalBlockStats === 'object') {
        this.state.globalBlockStats = result.globalBlockStats;
        // Ensure we have all required fields
        if (!this.state.globalBlockStats.totalBlocked) this.state.globalBlockStats.totalBlocked = 0;
        if (!this.state.globalBlockStats.blockedToday) this.state.globalBlockStats.blockedToday = 0;
        if (!this.state.globalBlockStats.lastBlockedDate) {
          this.state.globalBlockStats.lastBlockedDate = new Date().toISOString().slice(0, 10);
          needsSave = true;
        }
      } else {
        // No global stats exist - initialize and migrate from old per-hostname stats if they exist
        this.state.globalBlockStats = { totalBlocked: 0, blockedToday: 0, lastBlockedDate: new Date().toISOString().slice(0, 10) };
        
        // Migrate from old per-hostname blockStats if they exist
        const oldBlockStats = result.blockStats;
        if (oldBlockStats && typeof oldBlockStats === 'object') {
          let totalMigrated = 0;
          Object.values(oldBlockStats).forEach(hostStats => {
            if (hostStats && typeof hostStats === 'object') {
              totalMigrated += (hostStats.totalBlocked || 0);
            }
          });
          if (totalMigrated > 0) {
            this.state.globalBlockStats.totalBlocked = totalMigrated;
            console.log(`Migrated ${totalMigrated} total blocked items from per-hostname stats to global stats`);
          }
        }
        
        needsSave = true;
      }
      
      // Save defaults to storage if any were missing
      if (needsSave) {
        await this.saveExtensionState();
      }
      
      // Clean up old per-hostname blockStats after migration
      if (result.blockStats) {
        try {
          await chrome.storage.local.remove('blockStats');
          console.log('Cleaned up old per-hostname blockStats after migration');
        } catch (cleanupError) {
          console.warn('Failed to clean up old blockStats:', cleanupError);
        }
      }
  

    } catch (error) {
      this.state.extensionEnabled = true;
      this.state.isPowerUserMode = false;
      this.state.customizationToggle = true;
      this.state.showBlockCounter = true;
      this.state.profiles = JSON.parse(JSON.stringify(DEFAULT_PROFILES));
      this.state.globalBlockStats = { totalBlocked: 0, blockedToday: 0, lastBlockedDate: new Date().toISOString().slice(0, 10) };
      try {
        await this.saveExtensionState();
      } catch (saveError) {
      }
    }
  }

  /**
   * Save extension state to Chrome storage
   */
  async saveExtensionState() {
    try {
      const dataToSave = {
        [STORAGE_KEYS.EXTENSION_ENABLED]: this.state.extensionEnabled,
        [STORAGE_KEYS.PROFILES]: this.state.profiles,
        userSettings: {
          isPowerUserMode: this.state.isPowerUserMode,
          customizationToggle: this.state.customizationToggle,
          showBlockCounter: this.state.showBlockCounter
        },
        globalBlockStats: this.state.globalBlockStats
        // COMMENTED OUT: Auth functionality disabled
        // [STORAGE_KEYS.IS_AUTHENTICATED]: this.state.isAuthenticated
      };
        
      await chrome.storage.local.set(dataToSave);
      
      // Emit state changed event
      this.eventBus.emit(EVENTS.STATE_CHANGED, {
        extensionEnabled: this.state.extensionEnabled,
        profiles: this.state.profiles,
        isPowerUserMode: this.state.isPowerUserMode,
        customizationToggle: this.state.customizationToggle,
        showBlockCounter: this.state.showBlockCounter
        // COMMENTED OUT: Auth functionality disabled
        // isAuthenticated: this.state.isAuthenticated
      });
    } catch (error) {
    }
  }

  /**
   * Set extension enabled state
   */
  async setExtensionEnabled(enabled) {
    const previousState = this.state.extensionEnabled;
    this.state.extensionEnabled = enabled;
    
    await this.saveExtensionState();
    
    if (previousState !== enabled) {
      this.eventBus.emit(
        enabled ? EVENTS.EXTENSION_ENABLED : EVENTS.EXTENSION_DISABLED,
        { enabled }
      );
    }
  }

  /**
   * Get extension enabled state
   */
  isExtensionEnabled() {
    return this.state.extensionEnabled;
  }

  // COMMENTED OUT: Auth functionality disabled
  /**
   * Set authentication state
   */
  // async setAuthenticated(isAuthenticated, user = null) {
  //   const previousState = this.state.isAuthenticated;
  //   this.state.isAuthenticated = isAuthenticated;
  //   
  //   await this.saveExtensionState();
  //   
  //   if (previousState !== isAuthenticated) {
  //     this.eventBus.emit(EVENTS.AUTH_STATE_CHANGED, {
  //       isAuthenticated,
  //       user
  //     });
  //   }
  //   
  //   this.logger.info(`Authentication state changed to ${isAuthenticated}`);
  // }

  /**
   * Get authentication state
   */
  // isAuthenticated() {
  //   return this.state.isAuthenticated;
  // }

  /**
   * Track tab URL
   */
  setTabUrl(tabId, url) {
    this.state.tabUrls.set(tabId, url);
  }

  /**
   * Get tab URL
   */
  getTabUrl(tabId) {
    return this.state.tabUrls.get(tabId);
  }

  /**
   * Remove tab tracking
   */
  removeTab(tabId) {
    this.state.tabUrls.delete(tabId);
    this.state.tabCooldownMap.delete(tabId);
  }

  /**
   * Check if URL is from an allowed website
   */
  isAllowedWebsite(url) {
    if (!url) return false;

    try {
      const hostname = new URL(url).hostname.toLowerCase();
      const cleanHostname = hostname.replace(/^www\./, '');
      
      return CONFIG.ALLOWED_WEBSITES.some(allowedSite => {
        return cleanHostname === allowedSite || 
               cleanHostname.endsWith('.' + allowedSite);
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all profiles
   */
  getProfiles() {
    return [...this.state.profiles];
  }

  /**
   * Get a specific profile by name
   */
  getProfile(profileName) {
    return this.state.profiles.find(profile => profile.profileName === profileName);
  }


  async addProfile(profileData) {
    if (!profileData.profileName || typeof profileData.profileName !== 'string') {
      throw new Error('Profile name must be a valid string');
    }
    // Check if profile already exists
    if (this.state.profiles.some(profile => profile.profileName === profileData.profileName)) {
      throw new Error('Profile with this name already exists');
    }

    const newProfile = {
      profileName: profileData.profileName,
      whitelistTags: Array.isArray(profileData.whitelistTags) ? profileData.whitelistTags : [],
      blacklistTags: Array.isArray(profileData.blacklistTags) ? profileData.blacklistTags : [],
      customWhitelist: Array.isArray(profileData.customWhitelist) ? profileData.customWhitelist : [],
      customBlacklist: Array.isArray(profileData.customBlacklist) ? profileData.customBlacklist : [],
      allowedWebsites: Array.isArray(profileData.allowedWebsites) ? profileData.allowedWebsites : [],
      isEnabled: Boolean(profileData.isEnabled),
      colour: profileData.colour || "#ff9823",
      isDefault: Boolean(profileData.isDefault) || false // User-created profiles are not default unless explicitly specified
    };

    this.state.profiles.push(newProfile);
    await this.saveExtensionState();
    return newProfile;
  }

  /**
   * Update an existing profile
   */
  async updateProfile(profileName, updates) {
    const profileIndex = this.state.profiles.findIndex(profile => profile.profileName === profileName);
    
    if (profileIndex === -1) {
      throw new Error('Profile not found');
    }

    const profile = this.state.profiles[profileIndex];
    
    // Update profile properties
    if (updates.whitelistTags !== undefined) {
      profile.whitelistTags = Array.isArray(updates.whitelistTags) ? updates.whitelistTags : [];
    }
    if (updates.blacklistTags !== undefined) {
      profile.blacklistTags = Array.isArray(updates.blacklistTags) ? updates.blacklistTags : [];
    }
    if (updates.customWhitelist !== undefined) {
      profile.customWhitelist = Array.isArray(updates.customWhitelist) ? updates.customWhitelist : [];
    }
    if (updates.customBlacklist !== undefined) {
      profile.customBlacklist = Array.isArray(updates.customBlacklist) ? updates.customBlacklist : [];
    }
    if (updates.allowedWebsites !== undefined) {
      profile.allowedWebsites = Array.isArray(updates.allowedWebsites) ? updates.allowedWebsites : [];
    }
    if (updates.isEnabled !== undefined) {
      profile.isEnabled = Boolean(updates.isEnabled);
    }
    if (updates.colour !== undefined) {
      profile.colour = updates.colour || "#ff9823";
    }
    if (updates.isDefault !== undefined) {
      profile.isDefault = Boolean(updates.isDefault);
    }
    await this.saveExtensionState();
    
    return profile;
  }

  /**
   * Delete a profile
   */
  async deleteProfile(profileName) {
    const profileIndex = this.state.profiles.findIndex(profile => profile.profileName === profileName);
    
    if (profileIndex === -1) {
      throw new Error('Profile not found');
    }

    const deletedProfile = this.state.profiles.splice(profileIndex, 1)[0];
    
    await this.saveExtensionState();
    
    return deletedProfile;
  }

  /**
   * Enable a specific profile
   */
  async enableProfile(profileName) {
    const profile = this.state.profiles.find(p => p.profileName === profileName);
    
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Enable the specified profile
    profile.isEnabled = true;

    await this.saveExtensionState();
    
    return profile;
  }

  /**
   * Disable a specific profile
   */
  async disableProfile(profileName) {
    const profile = this.state.profiles.find(p => p.profileName === profileName);
    
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Disable the specified profile
    profile.isEnabled = false;

    await this.saveExtensionState();
    
    return profile;
  }

  /**
   * Get all enabled profiles
   */
  getEnabledProfiles() {
    return this.state.profiles.filter(profile => profile.isEnabled);
  }

  /**
   * Get current state snapshot
   */
  getState() {
    return {
      extensionEnabled: this.state.extensionEnabled,
      // COMMENTED OUT: Auth functionality disabled
      // isAuthenticated: this.state.isAuthenticated,
      trackedTabs: this.state.tabUrls.size,
      profiles: this.state.profiles,
      isPowerUserMode: this.state.isPowerUserMode,
      customizationToggle: this.state.customizationToggle,
      showBlockCounter: this.state.showBlockCounter
    };
  }

  /**
   * Take a snapshot of current state for comparison
   */
  takeProfileSnapshot() {
    console.log('[stop heartbeat debug] Taking state snapshot for change detection', {
      profileCount: this.state.profiles.length,
      enabledProfiles: this.state.profiles.filter(p => p.isEnabled).map(p => p.profileName),
      isPowerUserMode: this.state.isPowerUserMode,
      customizationToggle: this.state.customizationToggle,
      showBlockCounter: this.state.showBlockCounter,
      profiles: this.state.profiles.map(p => ({
        name: p.profileName,
        enabled: p.isEnabled,
        whitelistCount: p.whitelistTags?.length || 0,
        blacklistCount: p.blacklistTags?.length || 0,
        customWhitelistCount: p.customWhitelist?.length || 0,
        customBlacklistCount: p.customBlacklist?.length || 0,
        websiteCount: p.allowedWebsites?.length || 0
      }))
    });
    this.stateSnapshot = {
      profiles: JSON.parse(JSON.stringify(this.state.profiles)),
      isPowerUserMode: this.state.isPowerUserMode,
      customizationToggle: this.state.customizationToggle,
      showBlockCounter: this.state.showBlockCounter
    };
    // Keep backward compatibility
    this.profileSnapshot = this.stateSnapshot.profiles;
  }

  hasRelevantProfileChanges() {
    console.log('[stop heartbeat debug] Starting detailed state change analysis...');
    
    if (!this.profileSnapshot || !this.stateSnapshot) {
      console.log('[stop heartbeat debug] State change analysis: NO SNAPSHOT EXISTS - returning false');
      return false;
    }
    
    console.log('[stop heartbeat debug] Current state:', {
      profiles: this.state.profiles.map(p => ({
        name: p.profileName,
        enabled: p.isEnabled,
        whitelistTags: p.whitelistTags,
        blacklistTags: p.blacklistTags,
        customWhitelist: p.customWhitelist,
        customBlacklist: p.customBlacklist
      })),
      isPowerUserMode: this.state.isPowerUserMode,
      customizationToggle: this.state.customizationToggle,
      showBlockCounter: this.state.showBlockCounter
    });
    
    console.log('[stop heartbeat debug] Snapshot state:', {
      profiles: this.stateSnapshot.profiles.map(p => ({
        name: p.profileName,
        enabled: p.isEnabled,
        whitelistTags: p.whitelistTags,
        blacklistTags: p.blacklistTags,
        customWhitelist: p.customWhitelist,
        customBlacklist: p.customBlacklist
      })),
      isPowerUserMode: this.stateSnapshot.isPowerUserMode,
      customizationToggle: this.stateSnapshot.customizationToggle,
      showBlockCounter: this.stateSnapshot.showBlockCounter
    });
    
    // Check power user mode changes
    if (this.state.isPowerUserMode !== this.stateSnapshot.isPowerUserMode) {
      console.log('[stop heartbeat debug] State change detected: POWER USER MODE CHANGED', {
        was: this.stateSnapshot.isPowerUserMode,
        now: this.state.isPowerUserMode
      });
      return true;
    }
    
    // Check customization toggle changes
    if (this.state.customizationToggle !== this.stateSnapshot.customizationToggle) {
      console.log('[stop heartbeat debug] State change detected: CUSTOMIZATION TOGGLE CHANGED', {
        was: this.stateSnapshot.customizationToggle,
        now: this.state.customizationToggle
      });
      return true;
    }

    // Check showBlockCounter changes
    if (this.state.showBlockCounter !== this.stateSnapshot.showBlockCounter) {
      console.log('[stop heartbeat debug] State change detected: SHOW BLOCK COUNTER CHANGED', {
        was: this.stateSnapshot.showBlockCounter,
        now: this.state.showBlockCounter
      });
      return true;
    }
    
    const current = this.state.profiles;
    const snapshot = this.profileSnapshot;
    
    console.log('[stop heartbeat debug] Profile counts:', {
      current: current.length,
      snapshot: snapshot.length
    });
    
    if (current.length !== snapshot.length) {
      console.log('[stop heartbeat debug] Profile change detected: COUNT MISMATCH - refresh needed');
      return true;
    }
    
    for (let i = 0; i < current.length; i++) {
      const curr = current[i];
      const snap = snapshot.find(p => p.profileName === curr.profileName);
      
      console.log('[stop heartbeat debug] Analyzing profile:', curr.profileName);
      
      if (!snap) {
        console.log('[stop heartbeat debug] Profile change detected: NEW PROFILE FOUND - refresh needed');
        return true;
      }
      
      if (curr.isEnabled !== snap.isEnabled) {
        console.log('[stop heartbeat debug] Profile change detected: ENABLED STATE CHANGED', {
          profile: curr.profileName,
          was: snap.isEnabled,
          now: curr.isEnabled
        });
        return true;
      }
      
      if (JSON.stringify(curr.whitelistTags?.sort()) !== JSON.stringify(snap.whitelistTags?.sort())) {
        console.log('[stop heartbeat debug] Profile change detected: WHITELIST TAGS CHANGED', {
          profile: curr.profileName,
          was: snap.whitelistTags,
          now: curr.whitelistTags
        });
        return true;
      }
      
      if (JSON.stringify(curr.blacklistTags?.sort()) !== JSON.stringify(snap.blacklistTags?.sort())) {
        console.log('[stop heartbeat debug] Profile change detected: BLACKLIST TAGS CHANGED', {
          profile: curr.profileName,
          was: snap.blacklistTags,
          now: curr.blacklistTags
        });
        return true;
      }
      
      if (JSON.stringify(curr.allowedWebsites?.sort()) !== JSON.stringify(snap.allowedWebsites?.sort())) {
        console.log('[stop heartbeat debug] Profile change detected: ALLOWED WEBSITES CHANGED', {
          profile: curr.profileName,
          was: snap.allowedWebsites,
          now: curr.allowedWebsites
        });
        return true;
      }
      
      if (JSON.stringify(curr.customWhitelist?.sort()) !== JSON.stringify(snap.customWhitelist?.sort())) {
        console.log('[stop heartbeat debug] Profile change detected: CUSTOM WHITELIST CHANGED', {
          profile: curr.profileName,
          was: snap.customWhitelist,
          now: curr.customWhitelist
        });
        return true;
      }
      
      if (JSON.stringify(curr.customBlacklist?.sort()) !== JSON.stringify(snap.customBlacklist?.sort())) {
        console.log('[stop heartbeat debug] Profile change detected: CUSTOM BLACKLIST CHANGED', {
          profile: curr.profileName,
          was: snap.customBlacklist,
          now: curr.customBlacklist
        });
        return true;
      }
      
      console.log('[stop heartbeat debug] Profile unchanged:', curr.profileName);
    }
    
    console.log('[stop heartbeat debug] State change analysis: NO CHANGES DETECTED - refresh not needed');
    return false;
  }

  /**
   * Get all user settings in one call - this encapsulates all loading logic
   */
  async getUserSettings() {
    try {
      // Ensure we have the latest data from storage
      await this.loadExtensionState();
      
      const settings = {
        extensionEnabled: this.state.extensionEnabled,
        profiles: [...this.state.profiles], // Return a copy
        isPowerUserMode: this.state.isPowerUserMode,
        customizationToggle: this.state.customizationToggle,
        showBlockCounter: this.state.showBlockCounter
      };

      return settings;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user settings - handles any settings updates
   */
  async updateUserSettings(newSettings) {
    try {
      let settingsChanged = false;

      // Handle power user mode update
      if (newSettings.hasOwnProperty('isPowerUserMode') && 
          newSettings.isPowerUserMode !== this.state.isPowerUserMode) {
        this.state.isPowerUserMode = newSettings.isPowerUserMode;
        settingsChanged = true;
      }

      // Handle extension enabled state update
      if (newSettings.hasOwnProperty('extensionEnabled') && 
          newSettings.extensionEnabled !== this.state.extensionEnabled) {
        this.state.extensionEnabled = newSettings.extensionEnabled;
        settingsChanged = true;
      }

      // Handle customization toggle update
      if (newSettings.hasOwnProperty('customizationToggle') && 
          newSettings.customizationToggle !== this.state.customizationToggle) {
        this.state.customizationToggle = newSettings.customizationToggle;
        settingsChanged = true;
      }

      // Handle showBlockCounter update
      if (newSettings.hasOwnProperty('showBlockCounter') && 
          newSettings.showBlockCounter !== this.state.showBlockCounter) {
        this.state.showBlockCounter = newSettings.showBlockCounter;
        settingsChanged = true;
      }

      // Save to storage if any settings changed
      if (settingsChanged) {
        await this.saveExtensionState();
      }

      return { success: true, settingsChanged };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set power user mode
   */
  async setPowerUserMode(enabled) {
    try {
      this.state.isPowerUserMode = enabled;
      
      // Save to Chrome storage
      const userSettings = { 
        isPowerUserMode: enabled,
        customizationToggle: this.state.customizationToggle,
        showBlockCounter: this.state.showBlockCounter
      };
      await chrome.storage.local.set({ userSettings });
      
      // Emit event for any listeners
      this.eventBus.emit(EVENTS.STATE_CHANGED, {
        extensionEnabled: this.state.extensionEnabled,
        profiles: this.state.profiles,
        isPowerUserMode: this.state.isPowerUserMode,
        customizationToggle: this.state.customizationToggle,
        showBlockCounter: this.state.showBlockCounter
      });
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get power user mode state
   */
  isPowerUserModeEnabled() {
    return this.state.isPowerUserMode;
  }

  /**
   * Set customization toggle state
   */
  async setCustomizationToggle(enabled) {
    try {
      this.state.customizationToggle = enabled;
      
      // Save to Chrome storage
      const userSettings = { 
        isPowerUserMode: this.state.isPowerUserMode,
        customizationToggle: enabled,
        showBlockCounter: this.state.showBlockCounter
      };
      await chrome.storage.local.set({ userSettings });
      
      // Emit event for any listeners
      this.eventBus.emit(EVENTS.STATE_CHANGED, {
        extensionEnabled: this.state.extensionEnabled,
        profiles: this.state.profiles,
        isPowerUserMode: this.state.isPowerUserMode,
        customizationToggle: this.state.customizationToggle,
        showBlockCounter: this.state.showBlockCounter
      });
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get customization toggle state
   */
  isCustomizationToggleEnabled() {
    return this.state.customizationToggle;
  }

  /**
   * Set show block counter state
   */
  async setShowBlockCounter(enabled) {
    try {
      this.state.showBlockCounter = enabled;
      
      // Save to Chrome storage
      const userSettings = { 
        isPowerUserMode: this.state.isPowerUserMode,
        customizationToggle: this.state.customizationToggle,
        showBlockCounter: enabled
      };
      await chrome.storage.local.set({ userSettings });
      
      // Emit event for any listeners
      this.eventBus.emit(EVENTS.STATE_CHANGED, {
        extensionEnabled: this.state.extensionEnabled,
        profiles: this.state.profiles,
        isPowerUserMode: this.state.isPowerUserMode,
        customizationToggle: this.state.customizationToggle,
        showBlockCounter: this.state.showBlockCounter
      });
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get show block counter state
   */
  isShowBlockCounterEnabled() {
    return this.state.showBlockCounter;
  }

  /**
   * Increment global block stats
   * @param {number} count - Number of items blocked (default 1)
   */
  async incrementGlobalBlockStats(count = 1) {
    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const stats = this.state.globalBlockStats;
      
      // Reset today's count if date changed
      if (stats.lastBlockedDate !== today) {
        stats.blockedToday = 0;
        stats.lastBlockedDate = today;
      }
      
      stats.totalBlocked += count;
      stats.blockedToday += count;
      await this.saveExtensionState();
    } catch (e) {}
  }

  /**
   * Get global block stats object
   */
  getGlobalBlockStats() {
    return { ...this.state.globalBlockStats };
  }

  /**
   * Reset 'blockedToday' stat (e.g. at midnight)
   */
  async resetBlockedToday() {
    const today = new Date().toISOString().slice(0, 10);
    this.state.globalBlockStats.blockedToday = 0;
    this.state.globalBlockStats.lastBlockedDate = today;
    await this.saveExtensionState();
  }


}

export default StateManager;