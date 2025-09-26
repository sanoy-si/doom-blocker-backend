// Message types for Chrome extension communication
const MESSAGE_TYPES = {
  ANALYZE_GRID_STRUCTURE: "ANALYZE_GRID_STRUCTURE",
  CHECK_ANALYSIS_REQUIRED: "CHECK_ANALYSIS_REQUIRED",
  CONTENT_BLOCKED: "CONTENT_BLOCKED",
  GRID_CHILDREN_BLOCKED: "GRID_CHILDREN_BLOCKED",
  DISABLE: "DISABLE",
  ENABLE: "ENABLE",
  ERROR: "ERROR",
  GET_CONFIG: "GET_CONFIG",
  GET_TOAST_ENABLED: "GET_TOAST_ENABLED",
  HIDE_GRID_CHILDREN: "HIDE_GRID_CHILDREN",
  STOP_OBSERVING: "STOP_OBSERVING",
  UNHIDE_ELEMENT: "UNHIDE_ELEMENT",
  RESTORE_ALL_ELEMENTS: "RESTORE_ALL_ELEMENTS",
  GET_HIDDEN_ELEMENTS: "GET_HIDDEN_ELEMENTS",
  URL_CHANGED: "URL_CHANGED",
  // YouTube feature blocking
  YOUTUBE_BLOCK_SHORTS: "YOUTUBE_BLOCK_SHORTS",
  YOUTUBE_BLOCK_HOME_FEED: "YOUTUBE_BLOCK_HOME_FEED",
  YOUTUBE_BLOCK_COMMENTS: "YOUTUBE_BLOCK_COMMENTS",
  YOUTUBE_GET_SETTINGS: "YOUTUBE_GET_SETTINGS"
  // COMMENTED OUT: Auth functionality disabled
  // GET_AUTH_STATE: "GET_AUTH_STATE"
};

const HIDING_METHODS = {
  DISPLAY: "display",
  HEIGHT: "height",
  HIGHLIGHTING: "highlighting"
};

const CSS_CLASSES = {
  BLURRED: "topaz-element-blurred",
  COLLAPSED: "topaz-collapsed-element",
  HIDING_ANIMATION: "topaz-hiding-animation",
  INSTANT_HIDE: "topaz-instant-hide",
  NOTIFICATION: "topaz-notification",
  NOTIFICATION_VISIBLE: "topaz-notification-visible",
  NOTIFICATION_HIDING: "topaz-notification-hiding",
  NOTIFICATION_FADED: "topaz-notification-faded",
  NOTIFICATION_COUNTER_POP: "topaz-notification-counter-pop",
  NOTIFICATION_ERROR: "topaz-notification-error",
  NOTIFICATION_ERROR_TITLE: "topaz-notification-error-title",
  NOTIFICATION_ERROR_MESSAGE: "topaz-notification-error-message",
  // YouTube feature blocking
  YOUTUBE_SHORTS_HIDDEN: "topaz-youtube-shorts-hidden",
  YOUTUBE_HOME_FEED_HIDDEN: "topaz-youtube-home-feed-hidden",
  YOUTUBE_COMMENTS_HIDDEN: "topaz-youtube-comments-hidden"
};

const DATA_ATTRIBUTES = {
  BLUR_ID: "data-topaz-blur-id",
  STATE: "data-topaz-state"
};

const ELEMENT_STATES = {
  HIDDEN: "hidden",
  FLAGGED: "flagged"
};

const HARDCODED_TAGS_TO_IGNORE = new Set([
  "SCRIPT",
  "STYLE",
  "LINK",
  "NOSCRIPT"
]);

const SIMPLE_CONTENT_TAGS = new Set([
  "P", "SPAN", "A", "LI",
  "H1", "H2", "H3", "H4", "H5", "H6",
  "EM", "STRONG", "I", "B", "U",
  "SUB", "SUP", "CODE", "IMG"
]);

const TIMINGS = {
  MUTATION_DEBOUNCE: 500,
  ANALYSIS_TIMEOUT: 3000,
  NOTIFICATION_DISPLAY: 5000,
  NOTIFICATION_FADE: 2500,
  COUNTER_ANIMATION_SHORT: 400,
  COUNTER_ANIMATION_LONG: 800
};

const GRID_VALIDATION = {
  MIN_CHILDREN: 2,
  MIN_TEXT_LENGTH: 10,
  MIN_SIMILAR_ITEMS: 3,
  MAX_CARD_DEPTH: 15,
  CLUSTER_SCORE_CAP: 10,
  VIEWPORT_WIDTH_THRESHOLD: 0.9
}; 
// Make constants available globally for content script
window.MESSAGE_TYPES = MESSAGE_TYPES;
window.HIDING_METHODS = HIDING_METHODS;
// EVENTS is defined in content/core/EventBus.js; guard in case this file loads first
if (typeof EVENTS !== 'undefined') {
  window.EVENTS = EVENTS;
}
window.TIMINGS = TIMINGS;
window.GRID_VALIDATION = GRID_VALIDATION;
window.CSS_CLASSES = CSS_CLASSES;
window.DATA_ATTRIBUTES = DATA_ATTRIBUTES;
window.ELEMENT_STATES = ELEMENT_STATES;
window.HARDCODED_TAGS_TO_IGNORE = HARDCODED_TAGS_TO_IGNORE;
window.SIMPLE_CONTENT_TAGS = SIMPLE_CONTENT_TAGS;
