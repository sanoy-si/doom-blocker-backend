/**
 * Shared constants for Doom Blocker extension
 * Used by both popup and background scripts
 */

// Global debug flag to control verbose logging
export const DEBUG = false;

// Chrome runtime message types (shared between popup and background)
export const MESSAGE_TYPES = {
  // Grid analysis
  ANALYZE_GRID_STRUCTURE: 'ANALYZE_GRID_STRUCTURE',
  CHECK_ANALYSIS_REQUIRED: 'CHECK_ANALYSIS_REQUIRED',
  HIDE_GRID_CHILDREN: 'HIDE_GRID_CHILDREN',
  GRID_CHILDREN_BLOCKED: 'GRID_CHILDREN_BLOCKED',

  // Content blocking
  CONTENT_BLOCKED: 'CONTENT_BLOCKED',
  UNDO_BLOCK: 'UNDO_BLOCK',
  UNHIDE_ELEMENT: 'UNHIDE_ELEMENT',
  RESTORE_ALL_ELEMENTS: 'RESTORE_ALL_ELEMENTS',

  // Extension state
  EXTENSION_TOGGLED: 'EXTENSION_TOGGLED',
  GET_EXTENSION_STATE: 'GET_EXTENSION_STATE',
  ENABLE: 'ENABLE',
  DISABLE: 'DISABLE',
  URL_CHANGED: 'URL_CHANGED',
  // Error handling
  ERROR: 'ERROR',
  // Profile management
  GET_PROFILE_DATA: 'GET_PROFILE_DATA',
  ACCUMULATE_PROFILE_DATA: 'ACCUMULATE_PROFILE_DATA',
  // User settings
  GET_USER_SETTINGS: 'GET_USER_SETTINGS',
  UPDATE_USER_SETTINGS: 'UPDATE_USER_SETTINGS',
  GET_TOAST_ENABLED: 'GET_TOAST_ENABLED',
  // Heartbeat
  HEARTBEAT_PING: 'HEARTBEAT_PING',
  HEARTBEAT_PONG: 'HEARTBEAT_PONG',
  // Block stats
  GET_BLOCK_STATS: 'GET_BLOCK_STATS',
};

// Background EventBus events
export const BACKGROUND_EVENTS = {
  // State events
  STATE_CHANGED: 'state:changed',
  EXTENSION_ENABLED: 'extension:enabled',
  EXTENSION_DISABLED: 'extension:disabled',

  // Tab events
  TAB_UPDATED: 'tab:updated',
  TAB_REMOVED: 'tab:removed',
  TAB_ACTIVATED: 'tab:activated',
  TAB_READY: 'tab:ready',
  TAB_URL_CHANGED: 'tab:urlChanged',

  // Config events
  CONFIG_LOADED: 'config:loaded',
  CONFIG_UPDATED: 'config:updated',

  // Storage events
  STORAGE_CHANGED: 'storage:changed',

  // Analysis events
  GRID_ANALYSIS_REQUEST: 'analysis:gridRequest',
  GRID_ANALYSIS_COMPLETE: 'analysis:gridComplete',

  // Heartbeat events
  POPUP_OPENED: 'popup:opened',
  POPUP_CLOSED: 'popup:closed',
  HEARTBEAT_MONITORING_STARTED: 'heartbeat:monitoringStarted',
  HEARTBEAT_MONITORING_STOPPED: 'heartbeat:monitoringStopped',
  CHANGES_ACCUMULATED: 'heartbeat:changesAccumulated',
  ACCUMULATED_CHANGES_APPLIED: 'heartbeat:accumulatedChangesApplied',

  // Message events
  MESSAGE_RECEIVED: 'message:received',
  MESSAGE_SEND: 'message:send'
};

// Popup EventBus events
export const POPUP_EVENTS = {
  // UI events
  UI_INITIALIZE: 'ui:initialize',
  UI_STATIC_INITIALIZED: 'ui:staticInitialized',
  UI_RENDERED: 'ui:rendered',
  UI_REFRESHED: 'ui:refreshed',
  UI_ERROR: 'ui:error',
  UI_SHOW_ERROR_DIALOG: 'ui:showErrorDialog',
  UI_EXIT_EDIT_MODE: 'ui:exitEditMode',
  UI_LOADING_START: 'ui:loadingStart',
  UI_LOADING_END: 'ui:loadingEnd',
  UI_SETTINGS_OPEN: 'ui:settingsOpen',
  UI_SETTINGS_CLOSE: 'ui:settingsClose',

  // ProfileGrid events
  PROFILE_GRID_RENDER_REQUEST: 'profileGrid:renderRequest',
  PROFILE_GRID_HIDE_REQUEST: 'profileGrid:hideRequest',

  // UI Navigation events  
  UI_NAVIGATE_TO: 'ui:navigateTo',
  UI_SHOW_DIALOG: 'ui:showDialog',
  UI_SHOW_NOTIFICATION: 'ui:showNotification',

  // UI State events
  UI_STATE_GET: 'ui:state:get',
  UI_STATE_SET: 'ui:state:set',
  UI_STATE_MERGE: 'ui:state:merge',
  UI_STATE_RESPONSE: 'ui:state:response',
  UI_STATE_CHANGED: 'ui:state:changed',
  UI_STATE_GET_CURRENT_VIEW: 'ui:state:getCurrentView',
  UI_STATE_GET_EDIT_MODE: 'ui:state:getEditMode',
  UI_STATE_GET_ACTIVE_TAB: 'ui:state:getActiveTab',
  UI_STATE_GET_EDITING_PROFILE: 'ui:state:getEditingProfile',
  UI_STATE_GET_TEMP_PROFILE_CHANGES: 'ui:state:getTempProfileChanges',
  UI_STATE_GET_POWER_USER_MODE: 'ui:state:getPowerUserMode',
  UI_STATE_GET_LOADING_STATES: 'ui:state:getLoadingStates',

  // State change events (trigger UI updates)
  STATE_EXTENSION_ENABLED_CHANGED: 'state:extensionEnabledChanged',
  STATE_PROFILES_CHANGED: 'state:profilesChanged',

  STATE_SETTINGS_CHANGED: 'state:settingsChanged',
  STATE_UPDATE_SETTINGS: 'state:updateSettings',

  // Data events
  DATA_PROFILES_LOADED: 'data:profilesLoaded',
  DATA_PROFILES_UPDATED: 'data:profilesUpdated',
  DATA_PROFILE_REQUESTED: 'data:profileRequested',
  DATA_PROFILE_RECEIVED: 'data:profileReceived',
  DATA_PROFILE_SAVE_RESULT: 'data:profileSaveResult',

  // User interaction events
  USER_PROFILE_TOGGLED: 'user:profileToggled',
  USER_PROFILE_SELECTED: 'user:profileSelected',
  USER_PROFILE_DELETED: 'user:profileDeleted',
  USER_PROFILE_CREATED: 'user:profileCreated',
  USER_PROFILE_UPDATED: 'user:profileUpdated',
  USER_EXTENSION_TOGGLED: 'user:extensionToggled',
  USER_ITEM_UNHIDDEN: 'user:itemUnhidden',
  USER_ALL_ITEMS_RESTORED: 'user:allItemsRestored',
  USER_EXPORT_REQUESTED: 'user:exportRequested',
  USER_IMPORT_REQUESTED: 'user:importRequested',
  USER_SETTINGS_UPDATED: 'user:settingsUpdated',
  USER_PROFILE_EDIT_REQUESTED: 'user:profileEditRequested',

  // Background communication events
  BACKGROUND_CONNECTED: 'background:connected',
  BACKGROUND_DISCONNECTED: 'background:disconnected',
  BACKGROUND_MESSAGE_RECEIVED: 'background:messageReceived',
  BACKGROUND_MESSAGE_SENT: 'background:messageSent',
  BACKGROUND_MESSAGE_ERROR: 'background:messageError',
  BACKGROUND_MESSAGE_SEND: 'background:messageSend',
  BACKGROUND_MESSAGE_RESPONSE: 'background:messageResponse',

  // State events
  STATE_CHANGED: 'state:changed',
  STATE_SYNCED: 'state:synced',
  STATE_ERROR: 'state:error',
  STATE_EXTENSION_TOGGLED: 'state:extensionToggled',

  STATE_STATS_CHANGED: 'state:statsChanged',
  // Popup lifecycle events
  POPUP_INITIALIZED: 'popup:initialized',
  POPUP_READY: 'popup:ready',
  POPUP_CLOSING: 'popup:closing',
  POPUP_ACTIVE: 'popup:active',

  // Heartbeat events
  HEARTBEAT_SENT: 'heartbeat:sent',
  HEARTBEAT_RECEIVED: 'heartbeat:received',
  HEARTBEAT_TIMEOUT: 'heartbeat:timeout'
};

// Storage keys
export const STORAGE_KEYS = {
  EXTENSION_ENABLED: 'extensionEnabled',
  PROFILES: 'profiles'
};

export const CONFIG = {
  STAGING_WEBSITE: 'https://topaz-backend1.onrender.com',
  ALLOWED_WEBSITES: ['youtube.com', 'twitter.com', 'x.com', "linkedin.com", "reddit.com"],
  TAB_ENABLE_MAX_RETRIES: 3,
  TAB_ENABLE_RETRY_DELAY: 300
};

export const DEFAULT_TAGS = {
  'youtube.com': {
    defaultWhitelist: [],
    defaultBlacklist: []
  },
  'twitter.com': {
    defaultWhitelist: [],
    defaultBlacklist: []
  },
  'x.com': {
    defaultWhitelist: [],
    defaultBlacklist: []
  },
  'linkedin.com': {
    defaultWhitelist: [],
    defaultBlacklist: []
  },
  'reddit.com': {
    defaultWhitelist: [],
    defaultBlacklist: []
  }
};

// Default profiles for new installations (disabled by default)
export const DEFAULT_PROFILES = [
  {
    profileName: "YouTube",
    whitelistTags: DEFAULT_TAGS['youtube.com'].defaultWhitelist,
    blacklistTags: DEFAULT_TAGS['youtube.com'].defaultBlacklist,
    customWhitelist: [],
    customBlacklist: [],
    allowedWebsites: ['youtube.com'],
    isEnabled: false,
    colour: "#ff0000",
    isDefault: true
  },
  {
    profileName: "Twitter",
    whitelistTags: DEFAULT_TAGS['twitter.com'].defaultWhitelist,
    blacklistTags: DEFAULT_TAGS['twitter.com'].defaultBlacklist,
    customWhitelist: [],
    customBlacklist: [],
    allowedWebsites: ['twitter.com', 'x.com'],
    isEnabled: false,
    colour: "#1da1f2",
    isDefault: true
  },
  {
    profileName: "LinkedIn",
    whitelistTags: DEFAULT_TAGS['linkedin.com'].defaultWhitelist,
    blacklistTags: DEFAULT_TAGS['linkedin.com'].defaultBlacklist,
    customWhitelist: [],
    customBlacklist: [],
    allowedWebsites: ['linkedin.com'],
    isEnabled: false,
    colour: "#0077b5",
    isDefault: true
  },
  {
    profileName: "Reddit",
    whitelistTags: DEFAULT_TAGS['reddit.com'].defaultWhitelist,
    blacklistTags: DEFAULT_TAGS['reddit.com'].defaultBlacklist,
    customWhitelist: [],
    customBlacklist: [],
    allowedWebsites: ['reddit.com'],
    isEnabled: false,
    colour: "#ff4500",
    isDefault: true
  }
];

// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: 'https://topaz-backend1.onrender.com',
  FETCH_DISTRACTING_CHUNKS: '/fetch_distracting_chunks',
  FETCH_SEARCH_RESULTS: '/fetch_search_results'
};

export const API_CONFIG = {
  GRID_CHUNK_SIZE: 60
}

export const UI_ELEMENTS = {
  TOGGLE_BUTTON: 'toggleButton',
  TOGGLE_TEXT: 'toggleText',
  PROFILES_CONTAINER: 'profilesContainer',
  PROFILE_LIST: 'profileList'
};

// Timing constants
export const TIMINGS = {
  HEARTBEAT_INTERVAL: 1000,
  HEARTBEAT_TIMEOUT: 2500,
  UI_ANIMATION_DURATION: 300
};

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 500,
  contentScriptTimeout: 200
};
// List types
export const LIST_TYPES = {
  WHITELIST: 'whitelist',
  BLACKLIST: 'blacklist'
};

// Timeout constants (for background communication)
export const TIMEOUTS = {
  MESSAGE_TIMEOUT: 2000,
  TABS_QUERY_TIMEOUT: 2000,
  BACKGROUND_RESPONSE_TIMEOUT: 3000
}; 