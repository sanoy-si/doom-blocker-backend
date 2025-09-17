async function initializePopup() {
  console.log('🚀 Initializing Topaz popup...');
  
  try {
    // Check if all required modules are available
    console.log('🔍 Checking module availability...');
    console.log('- window.ui:', !!window.ui);
    console.log('- window.appState:', !!window.appState);
    console.log('- window.backgroundAPI:', !!window.backgroundAPI);
    
    if (!window.ui) {
      throw new Error('UI module not loaded');
    }
    if (!window.appState) {
      throw new Error('AppState module not loaded');
    }
    if (!window.backgroundAPI) {
      throw new Error('BackgroundAPI module not loaded');
    }
    
    console.log('✅ All modules are available');
    
    console.log('📦 Caching DOM elements...');
    window.ui.cacheElements();
    
    console.log('🔖 Setting version number from manifest...');
    setVersionNumber();
    
    console.log('🔧 Setting up event listeners...');
    setupEventListeners();
    
    console.log('📡 Setting up message listeners...');
    setupMessageListeners();
    
    console.log('📊 Loading initial data...');
    await loadInitialData();
    
    console.log('📞 Notifying background popup opened...');
    await notifyPopupOpened();
    
    console.log('💓 Starting heartbeat system...');
    startHeartbeatSystem();
    
    console.log('🎨 Rendering initial view...');
    window.ui.renderCurrentView();
    // Sync preview button with current tab state
    await syncPreviewButtonState();

    // Keyboard shortcut: Ctrl/Cmd + Shift + H toggles preview
    window.addEventListener('keydown', (e) => {
      const isModifier = (e.ctrlKey || e.metaKey) && e.shiftKey;
      if (isModifier && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        handlePreviewToggleClick();
      }
    });
    
    console.log('✅ Popup initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize popup:', error);
    console.error('Stack trace:', error.stack);
    showError('Failed to initialize popup: ' + error.message);
  }
}

async function loadInitialData() {
  try {
    const result = await window.backgroundAPI.loadUserSettings();
    
    if (result.success && result.settings) {
      const settings = result.settings;
      
      // If not in power mode, auto-enable the appropriate default profile
      if (!settings.isPowerUserMode && settings.profiles) {
        await autoEnableProfileForCurrentSite(settings.profiles);
      }
      
      // Fetch block stats for the current site
      const stats = await loadBlockStats();
      
      window.appState.updateState({
        isExtensionEnabled: settings.extensionEnabled ?? true,
        isPowerUserMode: settings.isPowerUserMode ?? false,
        isCustomizationEnabled: settings.customizationToggle ?? false,
        showBlockCounter: settings.showBlockCounter ?? true,
        profiles: settings.profiles || [],
        blockedCount: stats.blockedCount,
        totalBlocked: stats.totalBlocked
      });
    } else {
    }
  } catch (error) {
    showError('Failed to load settings: ' + error.message);
  }
}

// Helper function to load global block stats
async function loadBlockStats() {
  let blockedCount = 0;
  let totalBlocked = 0;
  
  try {
    const statsResult = await window.backgroundAPI.getBlockStats();
    if (statsResult.success && statsResult.globalBlockStats) {
      blockedCount = statsResult.globalBlockStats.blockedToday || 0;
      totalBlocked = statsResult.globalBlockStats.totalBlocked || 0;
    }
  } catch (error) {
    console.warn('Failed to load global block stats:', error);
  }
  
  return { blockedCount, totalBlocked };
}

// Set up all event listeners
function setupEventListeners() {
  console.log('🔧 Setting up event listeners...');
  
  const enableToggle = document.getElementById('enableToggle');
  console.log('🔘 Enable toggle element:', enableToggle);
  if (enableToggle) {
    enableToggle.addEventListener('click', handleExtensionToggle);
    console.log('✅ Extension toggle event listener added');
  } else {
    console.warn('⚠️ Enable toggle element not found');
  }
  
  const settingsButton = document.getElementById('settingsButton');
  console.log('⚙️ Settings button element:', settingsButton);
  if (settingsButton) {
    console.log('🎯 Adding click event listener to settings button');
    settingsButton.addEventListener('click', (e) => {
      console.log('🖱️ Settings button click event triggered!', e);
      console.log('🎯 Event target:', e.target);
      console.log('🎯 Current target:', e.currentTarget);
      handleSettingsOpen();
    });
    console.log('✅ Settings button event listener added');
  } else {
    console.warn('⚠️ Settings button element not found');
  }
  const editProfilesButton = document.getElementById('editProfilesButton');
  if (editProfilesButton) {
    editProfilesButton.addEventListener('click', handleEditProfilesClick);
  }
  const editBackButton = document.getElementById('editBackButton');
  if (editBackButton) {
    editBackButton.addEventListener('click', handleEditBack);
  }  
  const editSaveButton = document.getElementById('editSaveButton');
  if (editSaveButton) {
    editSaveButton.addEventListener('click', handleEditSave);
  }

  const editDeleteButton = document.getElementById('editDeleteButton');
  if (editDeleteButton) {
    editDeleteButton.addEventListener('click', handleEditDelete);
  }
  
  // Edit form inputs
  const editPageTitle = document.getElementById('editPageTitle');
  if (editPageTitle) {
    editPageTitle.addEventListener('input', handleProfileNameChange);
  }
  
  const editProfileColorInput = document.getElementById('editProfileColorInput');
  if (editProfileColorInput) {
    editProfileColorInput.addEventListener('change', handleColorChange);
  }
  
  // Tab buttons
  const editWhitelistTab = document.getElementById('editWhitelistTab');
  const editBlacklistTab = document.getElementById('editBlacklistTab');
  if (editWhitelistTab) {
    editWhitelistTab.addEventListener('click', () => switchTab('whitelist'));
  }
  if (editBlacklistTab) {
    editBlacklistTab.addEventListener('click', () => switchTab('blacklist'));
  }
  
  // Add item input
  const editAddItemInput = document.getElementById('editAddItemInput');
  if (editAddItemInput) {
    editAddItemInput.addEventListener('keypress', handleAddItemKeypress);
  }
  
  // Send button for edit mode
  const editSendButton = document.getElementById('editSendButton');
  if (editSendButton) {
    editSendButton.addEventListener('click', handleEditSendButtonClick);
  }
  
  // Reset button
  const editResetButton = document.getElementById('editResetButton');
  if (editResetButton) {
    editResetButton.addEventListener('click', handleResetProfile);
  }
  
  // Preview toggle button (show/hide hidden items with glow)
  const previewToggleButton = document.getElementById('previewToggleButton');
  if (previewToggleButton) {
    previewToggleButton.addEventListener('click', handlePreviewToggleClick);
  }
  
  // Simple mode send button
  const simpleSendButton = document.getElementById('simpleSendButton');
  if (simpleSendButton) {
    simpleSendButton.addEventListener('click', handleSimpleSendButtonClick);
  }
  
  // Simple mode save button
  const simpleSaveButton = document.getElementById('simpleSaveButton');
  if (simpleSaveButton) {
    simpleSaveButton.addEventListener('click', handleSimpleSaveButtonClick);
  }
  

  
  // Website pills
  const websitePills = document.querySelectorAll('.website-pill');
  websitePills.forEach(pill => {
    pill.addEventListener('click', () => toggleWebsite(pill.dataset.website));
  });
}

// Event handlers

// Handle extension toggle
async function handleExtensionToggle() {
  const { state } = window.appState;
  const newEnabled = !state.isExtensionEnabled;
  try {
    const result = await window.backgroundAPI.toggleExtension(newEnabled);
    if (result.success) {
      window.appState.updateState({ isExtensionEnabled: result.enabled });
      window.ui.showNotification({
        type: 'success',
        message: `Extension ${result.enabled ? 'enabled' : 'disabled'}`,
        duration: 2000
      });
      // Re-sync preview button availability when extension state changes
      await syncPreviewButtonState();
    } else {
      throw new Error(result.error || 'Failed to toggle extension');
    }
  } catch (error) {
    console.error('Failed to toggle extension:', error);
    showError('Failed to toggle extension: ' + error.message);
  }
}

function handleSettingsOpen() {
  console.log('🔧 Settings button clicked - handleSettingsOpen called');
  try {
    const { state } = window.appState;
    console.log('📊 Current state:', state);
    
    if (!window.ui) {
      console.error('❌ window.ui is not available');
      return;
    }
    
    if (!window.ui.showDialog) {
      console.error('❌ window.ui.showDialog is not available');
      return;
    }
    
    console.log('✅ UI components available, creating settings dialog...');
    
    const settingsContent = `
      <div class="settings-form">
        <div class="settings-option">
          <div class="settings-label">
            <span class="settings-text">Power User Mode</span>
            <label class="toggle-switch">
              <input type="checkbox" id="powerUserModeToggle" class="toggle-input" ${state.isPowerUserMode ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="settings-description">
            Enable profile management and advanced features
          </div>
        </div>
        <div class="settings-option">
          <div class="settings-label">
            <span class="settings-text">In-Browser Block Counter</span>
            <label class="toggle-switch">
              <input type="checkbox" id="blockCounterToggle" class="toggle-input" ${state.showBlockCounter ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="settings-description">
            Show toast notifications when content is blocked
          </div>
        </div>
      </div>
    `;
    
    console.log('📝 Settings content created:', settingsContent);
    
    const dialogConfig = {
      title: 'Settings',
      content: settingsContent,
      buttons: [
        {
          text: 'Cancel',
          onClick: () => {
            console.log('❌ Settings dialog cancelled');
            return true; // Close dialog
          }
        },
        {
          text: 'Save',
          primary: true,
          onClick: () => {
            console.log('💾 Settings save button clicked');
            handleSettingsSave();
            return true; // Close dialog
          }
        }
      ]
    };
    
    console.log('⚙️ Dialog config:', dialogConfig);
    console.log('🚀 Calling window.ui.showDialog...');
    
    const result = window.ui.showDialog(dialogConfig);
    console.log('✅ Dialog creation result:', result);
    
  } catch (error) {
    console.error('❌ Error in handleSettingsOpen:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Handle settings save
async function handleSettingsSave() {
  const powerUserToggle = document.getElementById('powerUserModeToggle');
  const blockCounterToggle = document.getElementById('blockCounterToggle');
  const newPowerUserMode = powerUserToggle?.checked || false;
  const newShowBlockCounter = blockCounterToggle?.checked ?? true;
  
  try {
    const newSettings = {
      isPowerUserMode: newPowerUserMode,
      showBlockCounter: newShowBlockCounter,
      extensionEnabled: window.appState.state.isExtensionEnabled,
      profiles: window.appState.state.profiles // Already an array
    };
    
    const result = await window.backgroundAPI.saveUserSettings(newSettings);
    
    if (result.success) {
      window.appState.updateState({ 
        isPowerUserMode: newPowerUserMode,
        showBlockCounter: newShowBlockCounter
      });
      window.ui.showNotification({
        type: 'success',
        message: 'Settings saved successfully',
        duration: 2000
      });
    } else {
      throw new Error(result.error || 'Failed to save settings');
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    showError('Failed to save settings: ' + error.message);
  }
}

// Handle edit profiles button click
function handleEditProfilesClick() {
  const { state } = window.appState;
  
  if (state.isEditMode) {
    // Exit edit mode
    window.appState.updateState({ 
      isEditMode: false,
      currentView: 'main' 
    });
  } else {
    // Enter edit mode
    window.appState.updateState({ 
      isEditMode: true,
      currentView: 'main' 
    });
  }
}

// Start edit mode (new profile)
function startEditMode(profileName = null) {
  const { state } = window.appState;
  
  let profileData = null;
  if (profileName) {
    profileData = window.appState.getProfile(profileName);
  }
  
  // Set up temp data for editing
  const tempData = {
    profileName: profileData?.profileName || '',
    colour: profileData?.colour || '#ff9823',
    whitelistTags: [...(profileData?.whitelistTags || [])],
    blacklistTags: [...(profileData?.blacklistTags || [])],
    allowedWebsites: [...(profileData?.allowedWebsites || ['youtube.com', 'twitter.com', 'x.com', 'linkedin.com', 'reddit.com'])],
    isEnabled: profileData?.isEnabled ?? true,
    originalData: profileData ? JSON.parse(JSON.stringify(profileData)) : null
  };
  
  window.appState.updateState({
    currentView: 'edit',
    isEditMode: true,
    editingProfile: profileName,
    tempProfileData: tempData,
    activeTab: 'blacklist'
  });
}

// Handle edit back button
function handleEditBack() {
  window.appState.updateState({
    currentView: 'main',
    isEditMode: false,
    editingProfile: null,
    tempProfileData: {
      profileName: '',
      colour: '#ff9823',
      whitelistTags: [],
      blacklistTags: [],
      allowedWebsites: ['youtube.com', 'twitter.com', 'x.com', 'linkedin.com', 'reddit.com'],
      isEnabled: true,
      originalData: null
    }
  });
}

// Handle edit save button
async function handleEditSave() {
  const { state } = window.appState;
  const tempData = state.tempProfileData;
  
  try {
    // Validate profile data
    const validation = window.appState.validateProfile(tempData, !state.editingProfile);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    
    // Save profile
    if (state.editingProfile) {
      window.appState.updateProfile(state.editingProfile, tempData);
    } else {
      window.appState.createProfile(tempData);
    }
    
    // Save to background - profiles are already an array
    const result = await window.backgroundAPI.saveProfiles(window.appState.state.profiles);
    
    if (result.success) {
      window.ui.showNotification({
        type: 'success',
        message: 'Profile saved successfully',
        duration: 2000
      });
      
      // Return to main view
      window.appState.updateState({
        currentView: 'main',
        isEditMode: false,
        editingProfile: null,
        tempProfileData: {
          profileName: '',
          colour: '#ff9823',
          whitelistTags: [],
          blacklistTags: [],
          allowedWebsites: ['youtube.com', 'twitter.com', 'x.com', 'linkedin.com', 'reddit.com'],
          isEnabled: true,
          originalData: null
        }
      });
    } else {
      throw new Error(result.error || 'Failed to save profile');
    }
    
  } catch (error) {
    console.error('Failed to save profile:', error);
    showError('Failed to save profile: ' + error.message);
  }
}

// Handle edit delete button
function handleEditDelete() {
  const { state } = window.appState;
  
  if (!state.editingProfile) return;
  
  window.ui.showDialog({
    title: 'Delete Profile',
    message: `Are you sure you want to delete the profile "${state.editingProfile}"?`,
    buttons: [
      {
        text: 'Cancel',
        onClick: () => true
      },
      {
        text: 'Delete',
        primary: true,
        onClick: async () => {
          try {
            window.appState.deleteProfile(state.editingProfile);
            
            // Save to background - profiles are already an array
            const result = await window.backgroundAPI.saveProfiles(window.appState.state.profiles);
            
            if (result.success) {
              window.ui.showNotification({
                type: 'success',
                message: 'Profile deleted successfully',
                duration: 2000
              });
              
              // Return to main view
              window.appState.updateState({
                currentView: 'main',
                isEditMode: false,
                editingProfile: null,
                tempProfileData: {
                  profileName: '',
                  colour: '#ff9823',
                  whitelistTags: [],
                  blacklistTags: [],
                  allowedWebsites: ['youtube.com', 'twitter.com', 'x.com', 'linkedin.com', 'reddit.com'],
                  isEnabled: true,
                  originalData: null
                }
              });
            } else {
              throw new Error(result.error || 'Failed to delete profile');
            }
          } catch (error) {
            console.error('Failed to delete profile:', error);
            showError('Failed to delete profile: ' + error.message);
          }
          return true; // Close dialog
        }
      }
    ]
  });
}

// Handle profile name change
function handleProfileNameChange(e) {
  window.appState.setNestedState('tempProfileData.profileName', e.target.value);
}

// Handle color change
function handleColorChange(e) {
  window.appState.setNestedState('tempProfileData.colour', e.target.value);
}

// Switch tabs in edit mode
function switchTab(tabName) {
  window.appState.updateState({ activeTab: tabName });
  if (window.ui && window.ui.setActiveTab) {
    window.ui.setActiveTab(tabName);
  }
}

// Handle add item keypress
function handleAddItemKeypress(e) {
  if (e.key === 'Enter') {
    const value = e.target.value.trim();
    if (value) {
      addTag(value);
      e.target.value = '';
    }
  }
}

// Handle edit mode send button click
function handleEditSendButtonClick() {
  const editAddItemInput = document.getElementById('editAddItemInput');
  if (editAddItemInput) {
    const value = editAddItemInput.value.trim();
    if (value) {
      addTag(value);
      editAddItemInput.value = '';
    }
  }
}

// Handle simple mode send button click
function handleSimpleSendButtonClick() {
  const simpleAddItemInput = document.getElementById('simpleAddItemInput');
  if (simpleAddItemInput && !simpleAddItemInput.disabled) {
    const value = simpleAddItemInput.value.trim();
    if (value) {
      addItemToSimpleMode();
    }
  }
}

// Handle simple mode save button click
function handleSimpleSaveButtonClick() {
  console.log('Simple save button clicked - closing popup');
  window.close();
}

// Preview toggle click handler
let previewEnabled = false;
async function handlePreviewToggleClick() {
  try {
    // Do nothing if extension is disabled
    if (!window.appState?.state?.isExtensionEnabled) {
      window.ui && window.ui.showNotification && window.ui.showNotification({
        type: 'warning',
        message: 'Enable Topaz to preview hidden content',
        duration: 1800
      });
      return;
    }
    const desired = !previewEnabled;
    const btn = document.getElementById('previewToggleButton');
    // Optimistic UI: show spinner state by toggling class, but finalize after response
    if (btn) btn.classList.add('active');
    const result = await window.backgroundAPI.togglePreviewHidden(desired);
    console.log('Preview toggle result:', result);
    if (!result?.success) {
      console.warn('Preview toggle failed:', result?.error);
      // Re-sync UI to actual state
      await syncPreviewButtonState();
      return;
    }
    // Derive final enabled state from content response when available
    const enabledFromContentVal = result?.response?.data?.enabled;
    const enabledFromContent = typeof enabledFromContentVal === 'boolean' ? enabledFromContentVal : undefined;
    previewEnabled = (enabledFromContent === undefined) ? desired : enabledFromContent;
    if (btn) {
      btn.classList.toggle('active', previewEnabled);
      btn.textContent = previewEnabled ? 'Hide Hidden Content' : 'Show Hidden Content';
    }
    // Do not sync immediately on success; content is source of truth and we just set from its response
  } catch (e) {
    console.error('Failed to toggle preview:', e);
    // Defer sync slightly to avoid racing with error cases
    setTimeout(() => { syncPreviewButtonState().catch(() => {}); }, 150);
  }
}

// Query content script for current preview state and update button UI
async function syncPreviewButtonState() {
  try {
    const btn = document.getElementById('previewToggleButton');
    if (!btn) return;
    // Get content preview state
    const res = await window.backgroundAPI.getPreviewState();
    const enabled = !!res?.response?.data?.enabled;
    const hiddenCount = Number(res?.response?.data?.hiddenCount || 0);
    // Always ask background for current extension state to avoid stale window.appState
    let extEnabled = true;
    try {
      const ext = await window.backgroundAPI.getExtensionState();
      extEnabled = !!ext?.enabled;
    } catch (_) {
      extEnabled = true; // default to enabled if we cannot determine
    }
    previewEnabled = enabled;
    btn.classList.toggle('active', enabled);
    // Button is disabled only when extension is disabled
    if (!extEnabled) {
      btn.disabled = true;
      btn.textContent = 'Show Hidden Content';
      btn.classList.remove('active');
      previewEnabled = false;
      return;
    }
    btn.disabled = false;
    // Keep clickable even if there are 0 to show; show a count hint when available
    btn.textContent = enabled ? 'Hide Hidden Content' : (hiddenCount > 0 ? `Show Hidden Content (${hiddenCount})` : 'Show Hidden Content');
  } catch (e) {
    // If we can't reach content script yet, leave default UI
    console.log('Could not sync preview state:', e?.message || e);
  }
}

// Add tag to current list
function addTag(tag) {
  const { state } = window.appState;
  const listType = state.activeTab === 'whitelist' ? 'whitelistTags' : 'blacklistTags';
  const currentList = state.tempProfileData?.[listType] || [];
  
  if (!currentList.includes(tag)) {
    currentList.push(tag);
    window.appState.setNestedState(`tempProfileData.${listType}`, currentList);
    if (window.ui && window.ui.renderTagChips) {
      window.ui.renderTagChips();
    }
  }
}

// Remove tag from list
function removeTag(tag, listType) {
  const { state } = window.appState;
  const currentList = state.tempProfileData?.[listType] || [];
  const newList = currentList.filter(t => t !== tag);
  
  window.appState.setNestedState(`tempProfileData.${listType}`, newList);
  if (window.ui && window.ui.renderTagChips) {
    window.ui.renderTagChips();
  }
}

// Handle reset profile
function handleResetProfile() {
  const { state } = window.appState;
  
  if (state.tempProfileData?.originalData) {
    // Reset to original data
    const original = state.tempProfileData.originalData;
    window.appState.updateState({
      tempProfileData: {
        profileName: original.profileName,
        colour: original.colour,
        whitelistTags: [...original.whitelistTags],
        blacklistTags: [...original.blacklistTags],
        allowedWebsites: [...original.allowedWebsites],
        isEnabled: original.isEnabled,
        originalData: original
      }
    });
  } else {
    // Reset to defaults for new profile
    window.appState.updateState({
      tempProfileData: {
        profileName: '',
        colour: '#ff9823',
        whitelistTags: [],
        blacklistTags: [],
        allowedWebsites: ['youtube.com', 'twitter.com', 'x.com', 'linkedin.com', 'reddit.com'],
        isEnabled: true,
        originalData: null
      }
    });
  }
}

// Toggle website in allowed list
function toggleWebsite(website) {
  const { state } = window.appState;
  const currentList = state.tempProfileData?.allowedWebsites || [];
  
  let newList;
  if (currentList.includes(website)) {
    newList = currentList.filter(w => w !== website);
  } else {
    newList = [...currentList, website];
  }
  
  window.appState.setNestedState('tempProfileData.allowedWebsites', newList);
  if (window.ui && window.ui.renderWebsitePills) {
    window.ui.renderWebsitePills();
  }
}

async function toggleProfile(profileName) {
  try {
    window.appState.toggleProfileEnabled(profileName);
    const result = await window.backgroundAPI.saveProfiles(window.appState.state.profiles);
    
    if (!result.success) {
      // Revert on failure
      window.appState.toggleProfileEnabled(profileName);
      throw new Error(result.error || 'Failed to toggle profile');
    }
    
  } catch (error) {
    console.error('Failed to toggle profile:', error);
    showError('Failed to toggle profile: ' + error.message);
  }
}

// Toggle default profile with special behavior
async function toggleDefaultProfile(profileName) {
  try {
    console.log('Toggling default profile');
    const { state } = window.appState;
    
    // Check if any default profile is currently enabled
    const anyDefaultEnabled = state.profiles.some(p => p.isDefault && p.isEnabled);
    const isEnabling = !anyDefaultEnabled;
    
    if (isEnabling) {
      // Try to get current tab URL to determine which site we're on
      let hostname = null;
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          const url = new URL(tab.url);
          hostname = url.hostname.toLowerCase().replace(/^www\./, '');
        }
      } catch (error) {
        console.log('Could not get current tab info, using fallback');
      }
      
      let profileToEnable = null;
      
      if (hostname) {
        // Find the matching default profile for the current site
        profileToEnable = state.profiles.find(profile => {
          return profile.isDefault && 
                 profile.allowedWebsites && 
                 profile.allowedWebsites.some(website => {
                   const cleanWebsite = website.toLowerCase().replace(/^www\./, '');
                   return hostname === cleanWebsite || hostname.endsWith('.' + cleanWebsite);
                 });
        });
      }
      
      // If no matching profile found, use the first default profile as fallback
      if (!profileToEnable) {
        profileToEnable = state.profiles.find(p => p.isDefault);
      }
      
      if (profileToEnable) {
        // Disable all default profiles first
        state.profiles.forEach(p => {
          if (p.isDefault) {
            p.isEnabled = false;
          }
        });
        
        // Enable the selected profile
        profileToEnable.isEnabled = true;
        
        // Update state and save
        window.appState.updateState({ profiles: state.profiles });
        const result = await window.backgroundAPI.saveProfiles(state.profiles);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update profiles');
        }
        
        // Show notification about what happened
        const message = hostname && profileToEnable.allowedWebsites?.some(website => {
          const cleanWebsite = website.toLowerCase().replace(/^www\./, '');
          return hostname === cleanWebsite || hostname.endsWith('.' + cleanWebsite);
        }) 
          ? `Enabled default profile for ${profileToEnable.profileName}`
          : `Enabled default profile (${profileToEnable.profileName})`;
          
        window.ui.showNotification({
          type: 'success',
          message,
          duration: 3000
        });
      } else {
        // No default profiles exist at all
        window.ui.showNotification({
          type: 'warning',
          message: 'No default profiles available',
          duration: 3000
        });
      }
    } else {
      // When disabling, disable all default profiles
      state.profiles.forEach(p => {
        if (p.isDefault) {
          p.isEnabled = false;
        }
      });
      
      // Update state and save
      window.appState.updateState({ profiles: state.profiles });
      const result = await window.backgroundAPI.saveProfiles(state.profiles);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profiles');
      }
      
      window.ui.showNotification({
        type: 'info',
        message: 'Default profile disabled',
        duration: 3000
      });
    }
    
  } catch (error) {
    console.error('Failed to toggle default profile:', error);
    showError('Failed to toggle default profile: ' + error.message);
  }
}

// Show profile context menu (edit/delete)
function showProfileContextMenu(event, profileName) {
  // Simple context menu implementation
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.position = 'fixed';
  menu.style.left = event.clientX + 'px';
  menu.style.top = event.clientY + 'px';
  menu.innerHTML = `
    <div class="context-menu-item" data-action="edit">Edit Profile</div>
    <div class="context-menu-item" data-action="delete">Delete Profile</div>
  `;
  
  document.body.appendChild(menu);
  
  // Handle clicks
  menu.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (action === 'edit') {
      startEditMode(profileName);
    } else if (action === 'delete') {
      // Call delete handler
      window.appState.updateState({ editingProfile: profileName });
      handleEditDelete();
    }
    document.body.removeChild(menu);
  });
  
  // Remove on outside click
  setTimeout(() => {
    document.addEventListener('click', () => {
      if (menu.parentNode) {
        document.body.removeChild(menu);
      }
    }, { once: true });
  }, 0);
}

// Auto-enable appropriate default profile for current site
async function autoEnableProfileForCurrentSite(profiles) {
  try {
    // Get current tab URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      console.log('No active tab or URL found');
      return;
    }
    
    const url = new URL(tab.url);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    
    console.log('Current site hostname:', hostname);
    
    // Find matching default profile for this site
    const matchingProfile = profiles.find(profile => {
      return profile.isDefault && 
             profile.allowedWebsites && 
             profile.allowedWebsites.some(website => {
               const cleanWebsite = website.toLowerCase().replace(/^www\./, '');
               return hostname === cleanWebsite || hostname.endsWith('.' + cleanWebsite);
             });
    });
    
    if (matchingProfile) {
      console.log('Found matching default profile for site:', matchingProfile.profileName);
      
      // Disable only other default profiles, leave non-default profiles alone
      profiles.forEach(profile => {
        if (profile.isDefault && profile !== matchingProfile) {
          profile.isEnabled = false;
        }
      });
      
      // Enable the matching profile
      matchingProfile.isEnabled = true;
      
      // Save changes to background without triggering instant filtering while popup is opening
      const saveResult = await window.backgroundAPI.saveProfiles(profiles, { triggerInstant: false });
      if (saveResult.success) {
        console.log('Auto-enabled profile for current site:', matchingProfile.profileName);
      } else {
        console.error('Failed to save auto-enabled profile:', saveResult.error);
      }
    } else {
      console.log('No matching default profile found for site:', hostname);
    }
    
  } catch (error) {
    console.error('Failed to auto-enable profile for current site:', error);
  }
}

// Utility functions

// Set version number from manifest
function setVersionNumber() {
  try {
    const manifestData = chrome.runtime.getManifest();
    const versionElement = document.getElementById('versionNumber');
    if (versionElement && manifestData.version) {
      versionElement.textContent = `v${manifestData.version}`;
      console.log('✅ Version number set to:', manifestData.version);
    }
  } catch (error) {
    console.error('❌ Failed to get version from manifest:', error);
  }
}

// Show error message
function showError(message) {
  window.ui.showDialog({
    title: 'Error',
    message: message,
    buttons: [{ text: 'OK', primary: true }]
  });
}

// Set up message listeners for background communication
function setupMessageListeners() {
  console.log('📡 Setting up message listeners...');
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📥 Received message from background:', message);
    
    switch (message.type) {
      case 'HEARTBEAT_PING':
        console.log('💓 Responding to heartbeat ping');
        sendResponse({
          type: 'HEARTBEAT_PONG',
          timestamp: Date.now()
        });
        break;
        
      default:
        console.log('❓ Unknown message type:', message.type);
        break;
    }
  });
  
  console.log('✅ Message listeners set up');
}

// Notify background that popup is opened (using API)
async function notifyPopupOpened() {
  try {
    const result = await window.backgroundAPI.notifyPopupOpened();
    if (!result.success) {
      console.warn('⚠️ Failed to notify popup opened:', result.error);
    }
  } catch (error) {
    console.error('❌ Failed to notify popup opened:', error);
  }
}

// Start periodic heartbeat system
function startHeartbeatSystem() {
  console.log('💓 Starting heartbeat system...');
  
  const heartbeatInterval = setInterval(async () => {
    try {
      const result = await window.backgroundAPI.sendHeartbeat();
      if (!result.success) {
        console.warn('⚠️ Heartbeat failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Heartbeat error:', error);
    }
  }, 1000);
  
  // Also refresh stats periodically
  const statsInterval = setInterval(async () => {
    try {
      const stats = await loadBlockStats();
      window.appState.updateState({
        blockedCount: stats.blockedCount,
        totalBlocked: stats.totalBlocked
      });
      // Also update the UI immediately to refresh stats
      window.ui.renderStats(stats.blockedCount, stats.totalBlocked);
    } catch (error) {
      console.warn('Failed to refresh stats:', error);
    }
  }, 2000); // Refresh every 2 seconds
  
  // Clean up intervals when popup closes
  window.addEventListener('beforeunload', () => {
    console.log('🔄 Cleaning up heartbeat and stats systems...');
    clearInterval(heartbeatInterval);
    clearInterval(statsInterval);
  });
  
  console.log('✅ Heartbeat and stats systems started');
}

// Make functions available globally for UI callbacks
window.toggleProfile = toggleProfile;
window.toggleDefaultProfile = toggleDefaultProfile;
window.startEditMode = startEditMode;
window.showProfileContextMenu = showProfileContextMenu;
window.removeTag = removeTag;

// Debug: Check if DOM is ready
console.log('📄 DOM Content State:', document.readyState);
console.log('🌐 Document loaded:', document.readyState === 'complete');

// Initialize popup immediately since scripts are loaded at end of body
console.log('🎬 Starting popup initialization...');
initializePopup();

