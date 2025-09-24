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
      // Authentication handlers
      [MESSAGE_TYPES.AUTO_LOGIN]: this.handleAutoLogin.bind(this),
      [MESSAGE_TYPES.GET_AUTH_STATE]: this.handleGetAuthState.bind(this),
      [MESSAGE_TYPES.LOGIN]: this.handleLogin.bind(this),
      [MESSAGE_TYPES.LOGOUT]: this.handleLogout.bind(this),
      [MESSAGE_TYPES.TOKEN_RECEIVED]: this.handleTokenReceived.bind(this),
      'SAVE_USER_BLOCKED_CONTENT': this.handleSaveUserBlockedContent.bind(this)
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
    } catch (e) {}
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
    } catch (e) {}
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
    
    if (enabledProfiles.length === 0) {
      console.log("🔍 [TOPAZ DEBUG] No enabled profiles, analysis not required");
      return {
        analysisRequired: false
      };
    }
    const url = message.currentUrl || sender.tab?.url;
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
      
      // Get tags from enabled profiles that are allowed on the current site
      const allProfiles = this.stateManager.getProfiles();
      const enabledProfiles = allProfiles.filter(profile => profile.isEnabled);

      // Extract hostname from URL
      const hostname = new URL(url).hostname.toLowerCase();
      const cleanHostname = hostname.replace(/^www\./, '');

      // Filter enabled profiles by those that are allowed on the current site
      const applicableProfiles = enabledProfiles.filter(profile => {
        return profile.allowedWebsites.some(allowedSite => {
          return cleanHostname === allowedSite ||
                 cleanHostname.endsWith('.' + allowedSite);
        });
      });

      // DEBUG: If no applicable profiles found for YouTube, try to auto-enable
      if (applicableProfiles.length === 0 && cleanHostname === 'youtube.com') {
        console.log('🔍 [TOPAZ DEBUG] No applicable profiles for YouTube, checking for YouTube profile to auto-enable');
        const youtubeProfile = allProfiles.find(p => p.profileName === 'YouTube' || p.allowedWebsites.includes('youtube.com'));
        if (youtubeProfile && !youtubeProfile.isEnabled) {
          console.log('🔍 [TOPAZ DEBUG] Found disabled YouTube profile, auto-enabling:', youtubeProfile.profileName);
          youtubeProfile.isEnabled = true;
          await this.stateManager.saveExtensionState();
          // Re-filter with the newly enabled profile
          const newEnabledProfiles = allProfiles.filter(profile => profile.isEnabled);
          applicableProfiles.push(...newEnabledProfiles.filter(profile => {
            return profile.allowedWebsites.some(allowedSite => {
              return cleanHostname === allowedSite ||
                     cleanHostname.endsWith('.' + allowedSite);
            });
          }));
        }
      }

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
          // Customization enabled: bundle default tags + custom tags from enabled default profiles
          applicableProfiles.forEach(profile => {
            if (profile.isDefault) {
              allWhitelistTags.push(...(profile.whitelistTags || []));
              allBlacklistTags.push(...(profile.blacklistTags || []));
              allWhitelistTags.push(...(profile.customWhitelist || []));
              allBlacklistTags.push(...(profile.customBlacklist || []));
            }
          });
        } else {
          // Customization disabled: only bundle default tags from enabled default profiles
          applicableProfiles.forEach(profile => {
            if (profile.isDefault) {
              allWhitelistTags.push(...(profile.whitelistTags || []));
              allBlacklistTags.push(...(profile.blacklistTags || []));
            }
          });
        }
      }

      // Remove duplicates
      const whitelistToSend = [...new Set(allWhitelistTags)];
      const blacklistToSend = [...new Set(allBlacklistTags)];

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



      // Split grid structure into chunks for multiple API requests
      const chunks = this.splitGridIntoChunks(gridStructure, API_CONFIG.GRID_CHUNK_SIZE);
      console.log("CHUNKS CHUNKS CHUNKS", chunks)
      


      // Send all chunk requests in parallel
      const chunkPromises = chunks.map(chunk => 
        this.api.fetchDistractingChunks(chunk, url, whitelistToSend, blacklistToSend)
      );

      const chunkResults = await Promise.all(chunkPromises);

      // Combine results from all chunks
      const combinedResult = this.combineChunkResults(chunkResults);

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
   * Handle save user blocked content message
   */
  async handleSaveUserBlockedContent(message, sender) {
    this.logger.debug('Save user blocked content requested', {
      sessionId: message.sessionId,
      itemCount: message.blockedItems?.length || 0
    });

    try {
      // Validate message data
      if (!message.blockedItems || !Array.isArray(message.blockedItems)) {
        throw new Error('Invalid blocked items data');
      }

      if (!message.sessionId) {
        throw new Error('Missing session ID');
      }

      // Save blocked content for authenticated user
      const result = await this.api.saveUserBlockedContent(message.sessionId, message.blockedItems);

      return {
        success: result.success,
        message: result.success ? 'Blocked content saved successfully' : 'Failed to save blocked content',
        error: result.error
      };
    } catch (error) {
      this.logger.error('Save user blocked content error', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle report blocked items message
   * Allows users to report incorrectly blocked content for feedback
   */
  async handleReportBlockedItems(message, sender) {
    this.logger.debug('Report blocked items requested', {
      url: message.url,
      itemCount: message.items?.length || 0
    });

    try {
      // Validate message data
      if (!message.items || !Array.isArray(message.items)) {
        throw new Error('Invalid items data');
      }

      if (!message.url) {
        throw new Error('Missing URL');
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
      this.logger.error('Failed to handle blocked items report', error);
      return {
        success: false,
        error: error.message
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
