// Simple Global State Management
// Replaces the complex CentralizedState + EventBus architecture

const state = {
  // Extension state
  isExtensionEnabled: true,
  isPowerUserMode: false,
  
  // User settings
  isCustomizationEnabled: true, // Default to enabled (matches StateManager default)
  showBlockCounter: true, // Default to enabled
  
  // Preview state - FIXED: Store preview state in appState like extension state
  isPreviewEnabled: false,
  
  // UI state
  currentView: 'main', // 'main' | 'edit'
  isEditMode: false,
  activeTab: 'blacklist', // 'whitelist' | 'blacklist'
  
  profiles: [], // Array of profile objects
  editingProfile: null,
  tempProfileData: {
    profileName: '',
    colour: '#f7c13d',
    whitelistTags: [],
    blacklistTags: [],
    allowedWebsites: ['youtube.com', 'twitter.com', 'x.com', 'linkedin.com', 'reddit.com'],
    isEnabled: true,
    originalData: null
  },
  
  // Stats
  blockedCount: 0,
  totalBlocked: 0,
  
  // UI helpers
  isLoading: false,
  error: null
};

// Simple state update function
function updateState(changes) {
  Object.assign(state, changes);
  // Render UI if available
  if (window.ui && window.ui.renderCurrentView) {
    window.ui.renderCurrentView();
  }
}

// Helper functions to get/set nested properties
function setNestedState(path, value) {
  const keys = path.split('.');
  let current = state;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
  // Render UI if available
  if (window.ui && window.ui.renderCurrentView) {
    window.ui.renderCurrentView();
  }
}

function getNestedState(path) {
  const keys = path.split('.');
  let current = state;
  
  for (const key of keys) {
    current = current[key];
    if (current === undefined) return undefined;
  }
  
  return current;
}

// Profile management helpers - updated to work with array structure
function validateProfile(profileData, isNew = false) {
  const errors = [];
  
  if (!profileData.profileName?.trim()) {
    errors.push('Profile name is required');
  }
  
  if (profileData.profileName?.length > 50) {
    errors.push('Profile name must be 50 characters or less');
  }
  
  if (isNew && state.profiles.find(p => p.profileName === profileData.profileName)) {
    errors.push('Profile name already exists');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function createProfile(profileData) {
  const validation = validateProfile(profileData, true);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  
  const newProfile = {
    profileName: profileData.profileName.trim(),
    isEnabled: profileData.isEnabled ?? true,
    whitelistTags: profileData.whitelistTags || [],
    blacklistTags: profileData.blacklistTags || [],
    allowedWebsites: profileData.allowedWebsites || ['youtube.com', 'twitter.com', 'x.com', 'linkedin.com', 'reddit.com'],
    colour: profileData.colour || '#f7c13d'
  };
  
  state.profiles.push(newProfile);
  
  // Render UI if available
  if (window.ui && window.ui.renderCurrentView) {
    window.ui.renderCurrentView();
  }
}

function updateProfile(profileName, profileData) {
  const profileIndex = state.profiles.findIndex(p => p.profileName === profileName);
  if (profileIndex === -1) {
    throw new Error('Profile not found');
  }
  
  const validation = validateProfile(profileData);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }
  
  // Update the profile in the array
  state.profiles[profileIndex] = {
    profileName: profileData.profileName.trim(),
    isEnabled: profileData.isEnabled ?? true,
    whitelistTags: profileData.whitelistTags || [],
    blacklistTags: profileData.blacklistTags || [],
    allowedWebsites: profileData.allowedWebsites || ['youtube.com', 'twitter.com', 'x.com', 'linkedin.com', 'reddit.com'],
    colour: profileData.colour || '#f7c13d'
  };
  
  // Render UI if available
  if (window.ui && window.ui.renderCurrentView) {
    window.ui.renderCurrentView();
  }
}

function deleteProfile(profileName) {
  const profileIndex = state.profiles.findIndex(p => p.profileName === profileName);
  if (profileIndex === -1) {
    throw new Error('Profile not found');
  }
  
  if (state.profiles.length <= 1) {
    throw new Error('Cannot delete the last profile');
  }
  
  state.profiles.splice(profileIndex, 1);
  
  // Render UI if available
  if (window.ui && window.ui.renderCurrentView) {
    window.ui.renderCurrentView();
  }
}

function getProfile(profileName) {
  return state.profiles.find(p => p.profileName === profileName);
}

function toggleProfileEnabled(profileName) {
  const profile = getProfile(profileName);
  if (profile) {
    profile.isEnabled = !profile.isEnabled;
    // Render UI if available
    if (window.ui && window.ui.renderCurrentView) {
      window.ui.renderCurrentView();
    }
  }
}

// Export for use in other files
window.appState = {
  state,
  updateState,
  setNestedState,
  getNestedState,
  createProfile,
  updateProfile,
  deleteProfile,
  validateProfile,
  getProfile,
  toggleProfileEnabled
}; 