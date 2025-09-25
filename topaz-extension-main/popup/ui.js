// Simple UI Rendering Functions
// Replaces the complex Component hierarchy and UIController

// UI Element references (cached for performance)
const elements = {
  // Main view elements
  mainPage: null,
  editPage: null,
  enableToggle: null,
  toggleStatus: null,
  previewToggleButton: null, // FIXED: Add preview button element
  settingsButton: null,
  editProfilesButton: null,
  profilesSection: null,
  profilesGrid: null,
  simpleModeSection: null,
  simpleCustomizationToggle: null,
  simpleWhitelistTab: null,
  simpleBlacklistTab: null,
  simpleWhitelistContent: null,
  simpleBlacklistContent: null,
  simpleWhitelistChips: null,
  simpleBlacklistChips: null,
  simpleAddItemInput: null,
  simpleSendButton: null,
  simpleResetButton: null,
  quickAddSection: null,
  blockedCount: null,
  totalBlocked: null,
  blockedTodayLabel: null,
  totalBlockedLabel: null,
  
  // Edit view elements
  editPageTitle: null,
  editProfileColorInput: null,
  editDeleteButton: null,
  editSaveButton: null,
  editBackButton: null,
  editWhitelistTab: null,
  editBlacklistTab: null,
  editWhitelistContent: null,
  editBlacklistContent: null,
  editWhitelistChips: null,
  editBlacklistChips: null,
  editAddItemInput: null,
  editSendButton: null,
  editResetButton: null,
  websitePills: null
};

// Cache DOM elements on initialization
function cacheElements() {
  elements.mainPage = document.getElementById('mainPage');
  elements.editPage = document.getElementById('editPage');
  elements.enableToggle = document.getElementById('enableToggle');
  elements.toggleStatus = document.getElementById('toggleStatus');
  elements.previewToggleButton = document.getElementById('previewToggleButton'); // FIXED: Cache preview button
  elements.settingsButton = document.getElementById('settingsButton');
  elements.editProfilesButton = document.getElementById('editProfilesButton');
  elements.profilesSection = document.getElementById('profilesSection');
  elements.profilesGrid = elements.profilesSection?.querySelector('.profiles-grid');
  elements.simpleModeSection = document.getElementById('simpleModeSection');
  elements.simpleWhitelistTab = document.getElementById('simpleWhitelistTab');
  elements.simpleBlacklistTab = document.getElementById('simpleBlacklistTab');
  elements.simpleWhitelistContent = document.getElementById('simpleWhitelistContent');
  elements.simpleBlacklistContent = document.getElementById('simpleBlacklistContent');
  elements.simpleWhitelistChips = document.getElementById('simpleWhitelistChips');
  elements.simpleBlacklistChips = document.getElementById('simpleBlacklistChips');
  elements.simpleAddItemInput = document.getElementById('simpleAddItemInput');
  elements.simpleSendButton = document.getElementById('simpleSendButton');
  elements.simpleSaveButton = document.getElementById('simpleSaveButton');
  elements.simpleResetButton = document.getElementById('simpleResetButton');
  elements.quickAddSection = document.querySelector('.quick-add-section');
  elements.blockedCount = document.getElementById('blockedCount');
  elements.totalBlocked = document.getElementById('totalBlocked');
  elements.blockedTodayLabel = document.getElementById('blockedTodayLabel');
  elements.totalBlockedLabel = document.getElementById('totalBlockedLabel');
  
  // Edit page elements
  elements.editPageTitle = document.getElementById('editPageTitle');
  elements.editProfileColorInput = document.getElementById('editProfileColorInput');
  elements.editDeleteButton = document.getElementById('editDeleteButton');
  elements.editSaveButton = document.getElementById('editSaveButton');
  elements.editBackButton = document.getElementById('editBackButton');
  elements.editWhitelistTab = document.getElementById('editWhitelistTab');
  elements.editBlacklistTab = document.getElementById('editBlacklistTab');
  elements.editWhitelistContent = document.getElementById('editWhitelistContent');
  elements.editBlacklistContent = document.getElementById('editBlacklistContent');
  elements.editWhitelistChips = document.getElementById('editWhitelistChips');
  elements.editBlacklistChips = document.getElementById('editBlacklistChips');
  elements.editAddItemInput = document.getElementById('editAddItemInput');
  elements.editSendButton = document.getElementById('editSendButton');
  elements.editResetButton = document.getElementById('editResetButton');
  elements.websitePills = document.querySelectorAll('.website-pill');
}

// Main render function - called after state changes
function renderCurrentView() {
  const { state } = window.appState;
  
  // Update extension toggle
  renderExtensionToggle();
  
  // FIXED: Update preview button
  renderPreviewButton();
  
  // Update stats
  renderStats();

  if (state.currentView === 'main') {
    showMainView();
    } else if (state.currentView === 'edit') {
      showEditView();
    }
  } 

// Render extension toggle button
function renderExtensionToggle() {
  const { state } = window.appState;
  
  if (!elements.enableToggle || !elements.toggleStatus) return;

  // On first render, temporarily disable transitions to prevent flash
  if (!elements.enableToggle._initialRenderDone) {
    elements.enableToggle.style.transition = 'none';
    elements.enableToggle._initialRenderDone = true;

    // Re-enable transitions after a frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        elements.enableToggle.style.transition = '';
      });
    });
  }
  
  if (state.isExtensionEnabled) {
    elements.enableToggle.classList.add('enabled');
    elements.enableToggle.classList.remove('disabled');
    elements.toggleStatus.textContent = 'enabled';
    
    // Enable suggestion section
    if (elements.quickAddSection) {
      elements.quickAddSection.classList.remove('disabled');
    }
    
    // Re-apply customization state when extension is enabled
    // This will respect the current customization toggle setting
    if (state.isCustomizationEnabled) {
      updateCustomizationState(true);
    } else {
      updateCustomizationState(false);
    }
  } else {
    elements.enableToggle.classList.remove('enabled');
    elements.enableToggle.classList.add('disabled');
    elements.toggleStatus.textContent = 'disabled';
    
    // Keep customization sections enabled even when extension is disabled
    // Users can add words/tags that will apply when extension is enabled
    if (elements.quickAddSection) {
      elements.quickAddSection.classList.remove('disabled');
    }
    
    // Apply customization state based on the customization toggle, not extension state
    try {
      if (state.isCustomizationEnabled) {
        updateCustomizationState(true);
      } else {
        updateCustomizationState(false);
      }
    } catch (error) {
      console.log('updateCustomizationState failed (elements not ready):', error);
    }
  }
}

// FIXED: Add preview button rendering function
function renderPreviewButton() {
  const { state } = window.appState;
  
  if (!elements.previewToggleButton) return;
  
  if (state.isPreviewEnabled) {
    elements.previewToggleButton.classList.add('active');
    elements.previewToggleButton.textContent = 'Hide Hidden Content';
  } else {
    elements.previewToggleButton.classList.remove('active');
    elements.previewToggleButton.textContent = 'Show Hidden Content';
  }
}

// Render statistics
function renderStats(blockedCount, totalBlocked) {
  let count = blockedCount;
  let total = totalBlocked;
  if (typeof count === 'undefined' || typeof total === 'undefined') {
    const { state } = window.appState;
    count = state.blockedCount;
    total = state.totalBlocked;
  }
  
  // Update the numbers
  if (elements.blockedCount) {
    elements.blockedCount.textContent = count.toString();
  }
  if (elements.totalBlocked) {
    elements.totalBlocked.textContent = total.toString();
  }
  
  // Set static labels for global stats
  if (elements.blockedTodayLabel) {
    elements.blockedTodayLabel.textContent = 'Blocked Today';
  }
  if (elements.totalBlockedLabel) {
    elements.totalBlockedLabel.textContent = 'Total Blocked';
  }
}

// Update stats UI directly
function updateStatsUI(blockedCount, totalBlocked) {
  renderStats(blockedCount, totalBlocked);
}

// Show main view
function showMainView() {
  const { state } = window.appState;
  
  if (elements.mainPage) {
    elements.mainPage.style.display = '';
    elements.mainPage.classList.remove('hidden');
  }
  if (elements.editPage) {
    elements.editPage.style.display = 'none';
    elements.editPage.classList.add('hidden');
  }
  
  if (state.isPowerUserMode) {
    showProfilesSection();
    hideSimpleModeSection();
  } else {
    hideProfilesSection();
    showSimpleModeSection();
  }
  
  updateEditButtonState();
}

// Show edit view
function showEditView() {
  const { state } = window.appState;
  
  if (elements.mainPage) {
    elements.mainPage.style.display = 'none';
    elements.mainPage.classList.add('hidden');
  }
  
  if (elements.editPage) {
    elements.editPage.style.display = '';
    elements.editPage.classList.remove('hidden');
  }
  
  renderEditForm();
}

// Render profiles grid
function renderProfilesGrid() {
  const { state } = window.appState;
  
  if (!elements.profilesGrid) return;
  
  // Show profiles section
  if (elements.profilesSection) {
    elements.profilesSection.style.display = '';
    elements.profilesSection.classList.remove('hidden');
  }
  
  // Clear existing profiles
  elements.profilesGrid.innerHTML = '';
  
  // In power user mode, consolidate default profiles into one
  if (state.isPowerUserMode) {
    // Create a single default profile button
    const defaultProfile = {
      profileName: "Default",
      isEnabled: state.profiles.some(p => p.isDefault && p.isEnabled),
      isDefault: true,
      colour: "#f7c13d" // Use the orange theme color
    };
    const defaultChip = createProfileChip(defaultProfile);
    elements.profilesGrid.appendChild(defaultChip);
    
    // Add non-default profiles
    state.profiles.filter(profile => !profile.isDefault).forEach(profile => {
      const chip = createProfileChip(profile);
      elements.profilesGrid.appendChild(chip);
    });
  } else {
    // In non-power user mode, show all profiles as before
    state.profiles.forEach(profile => {
      const chip = createProfileChip(profile);
      elements.profilesGrid.appendChild(chip);
    });
  }
  
  // Add "New Profile" button only in edit mode
  if (state.isEditMode) {
    const newProfileButton = createNewProfileButton();
    elements.profilesGrid.appendChild(newProfileButton);
  }
  
  // Update edit button appearance
  updateEditButtonState();
}

// Hide profiles grid
function hideProfilesGrid() {
  if (elements.profilesSection) {
    elements.profilesSection.style.display = 'none';
    elements.profilesSection.classList.add('hidden');
  }
}

// Show profiles section
function showProfilesSection() {
  if (elements.profilesSection) {
    elements.profilesSection.style.display = '';
    elements.profilesSection.classList.remove('hidden');
  }
  renderProfilesGrid();
}

// Hide profiles section
function hideProfilesSection() {
  if (elements.profilesSection) {
    elements.profilesSection.style.display = 'none';
    elements.profilesSection.classList.add('hidden');
  }
}

// Show simple mode section
function showSimpleModeSection() {
  if (elements.simpleModeSection) {
    elements.simpleModeSection.style.display = '';
    elements.simpleModeSection.classList.remove('hidden');
  }
  renderSimpleModeContent();
}

// Hide simple mode section
function hideSimpleModeSection() {
  if (elements.simpleModeSection) {
    elements.simpleModeSection.style.display = 'none';
    elements.simpleModeSection.classList.add('hidden');
  }
}

// Render simple mode content
async function renderSimpleModeContent() {  
  // Always enable customization - no toggle needed
  updateCustomizationState(true);
  
  // Apply customization state - always enabled
  if (!elements.simpleWhitelistTab._isSetup) {
    setupSimpleModeTabs();
    if (elements.simpleWhitelistTab) elements.simpleWhitelistTab._isSetup = true;
    if (elements.simpleBlacklistTab) elements.simpleBlacklistTab._isSetup = true;
  }
  // Check if we're on an allowed website first
  const isOnAllowedSite = await isCurrentSiteAllowed();
  
  if (!isOnAllowedSite) {
    // On non-allowed sites, show no chips at all
    renderSimpleChips([], elements.simpleWhitelistChips);
    renderSimpleChips([], elements.simpleBlacklistChips);
  } else {
    // On allowed sites, proceed with normal logic
    // Find the current website's default profile
    const currentProfile = await getCurrentWebsiteProfile(state.profiles);
    
    // Check if we should show custom tags based on customization toggle
    const shouldShowCustomTags = await shouldShowCustomTagsForCurrentSite(state.isCustomizationEnabled);
    
    if (currentProfile && shouldShowCustomTags) {
      renderSimpleChips(currentProfile.customWhitelist || [], elements.simpleWhitelistChips);
      renderSimpleChips(currentProfile.customBlacklist || [], elements.simpleBlacklistChips);
    } else {
      // Show empty lists when customization is off
      renderSimpleChips([], elements.simpleWhitelistChips);
      renderSimpleChips([], elements.simpleBlacklistChips);
    }
  }
  if (!elements.simpleAddItemInput._isSetup) {
    setupSimpleModeAddItem();
    if (elements.simpleAddItemInput) elements.simpleAddItemInput._isSetup = true;
  }
}

// Render chips in simple mode
function renderSimpleChips(tags, container) {
  if (!container) return;
  
  container.innerHTML = '';
  
  tags.forEach(tag => {
    const chip = createSimpleChip(tag);
    container.appendChild(chip);
  });
  
  // Apply disabled state if customization is turned off
  const { state } = window.appState;
  const isCustomizationEnabled = state.isCustomizationEnabled;
  
  if (!isCustomizationEnabled) {
    const allChips = container.querySelectorAll('.chip');
    allChips.forEach(chip => {
      chip.style.opacity = '0.4';
      chip.style.pointerEvents = 'none';
      chip.style.cursor = 'default';
    });
  }
}

// Create simple mode chip
function createSimpleChip(tag) {
  const chip = document.createElement('div');
  chip.className = 'chip';
  chip.innerHTML = `
    <span class="chip-text">${escapeHtml(tag)}</span>
  `;
  
  // Add remove handler
  chip.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Call remove tag function (to be implemented)
    console.log('Remove tag:', tag);
    if (window.removeTagFromSimpleMode) {
      window.removeTagFromSimpleMode(tag);
    }
  });
  
  return chip;
}

// Set up simple mode tabs
async function setupSimpleModeTabs() {
  if (!elements.simpleWhitelistTab || !elements.simpleBlacklistTab) return;
  
  elements.simpleWhitelistTab.addEventListener('click', async () => {
    await setSimpleModeActiveTab('whitelist');
  });
  
  elements.simpleBlacklistTab.addEventListener('click', async () => {
    await setSimpleModeActiveTab('blacklist');
  });
  
  // Set initial placeholder text (whitelist is active by default)
  if (elements.simpleAddItemInput) {
    const domain = await getCurrentDomain();
    const domainText = domain ? ` for ${domain}` : '';
    elements.simpleAddItemInput.placeholder = `content to unblock${domainText}...`;
  }
}

// Set up customization toggle
async function setupCustomizationToggle() {
  console.log('Setting up customization toggle...');
  
  if (!elements.simpleCustomizationToggle) {
    console.warn('simpleCustomizationToggle element not found');
    return;
  }
  
  console.log('Toggle element found:', elements.simpleCustomizationToggle);
  
  // Check if we're on an allowed website
  const isOnAllowedSite = await isCurrentSiteAllowed();
  
  // Set initial state based on loaded app state and current site
  const { state } = window.appState;
  const isCustomizationEnabled = state.isCustomizationEnabled;
  
  if (!isOnAllowedSite) {
    // On non-allowed sites, force toggle to OFF and disable it (don't update state)
    elements.simpleCustomizationToggle.checked = false;
    elements.simpleCustomizationToggle.disabled = true;
    updateCustomizationState(false);
  } else {
    // On allowed sites, use the actual state value
    elements.simpleCustomizationToggle.checked = isCustomizationEnabled;
    elements.simpleCustomizationToggle.disabled = false;
    updateCustomizationState(isCustomizationEnabled);
  }
  const handleToggleChange = async (e) => {
    console.log('Toggle event triggered:', e.type, 'checked:', e.target.checked);
    const isEnabled = e.target.checked;
    console.log('Customization toggle changed:', isEnabled);
    
    // Check if we're on an allowed site before allowing toggle changes
    const isOnAllowedSite = await isCurrentSiteAllowed();
    if (!isOnAllowedSite) {
      console.log('Toggle change blocked: not on allowed site');
      // Revert toggle to OFF and keep it disabled
      e.target.checked = false;
      e.target.disabled = true;
      updateCustomizationState(false);
      return;
    }
    
    // Update local app state
    if (window.appState && window.appState.state) {
      window.appState.updateState({ isCustomizationEnabled: isEnabled });
    }
    updateCustomizationState(isEnabled);
    if (window.backgroundAPI && window.backgroundAPI.saveUserSettings) {
      console.log('Saving customization toggle to background...');
      window.backgroundAPI.saveUserSettings({ customizationToggle: isEnabled })
        .then((result) => {
          console.log('Customization toggle saved to background successfully:', result);
        })
        .catch(error => {
          console.error('Failed to save customization toggle to background:', error);
          // Revert the toggle state on error
          elements.simpleCustomizationToggle.checked = !isEnabled;
          window.appState.updateState({ isCustomizationEnabled: !isEnabled });
          updateCustomizationState(!isEnabled);
        });
    } else {
      console.warn('Background API not available, toggle change not persisted');
    }
    
    // Call external handler if available
    if (window.onCustomizationToggleChange) {
      window.onCustomizationToggleChange(isEnabled);
    }
  };
  
  // Add event listeners
  elements.simpleCustomizationToggle.addEventListener('change', handleToggleChange);
  
  // Also handle clicks on the entire toggle switch container
  const toggleContainer = elements.simpleCustomizationToggle.closest('.toggle-switch');
  if (toggleContainer) {
    console.log('Toggle container found, adding click handler');
    toggleContainer.addEventListener('click', (e) => {
      console.log('Toggle container clicked');
      // Don't prevent default here, let the checkbox handle it naturally
      if (e.target !== elements.simpleCustomizationToggle) {
        elements.simpleCustomizationToggle.checked = !elements.simpleCustomizationToggle.checked;
        handleToggleChange({ target: elements.simpleCustomizationToggle });
      }
    });
  } else {
    console.warn('Toggle container not found');
  }
  
  console.log('Toggle setup complete');
}

// Update UI based on customization state
function updateCustomizationState(isEnabled) {
  const chipSystem = elements.simpleModeSection?.querySelector('.simple-chip-system');
  if (!chipSystem) {
    console.log('updateCustomizationState: chipSystem not found, skipping');
    return;
  }
  
  // Get references to the UI elements
  const tabButtons = chipSystem.querySelector('.tab-buttons');
  const tabContent = chipSystem.querySelector('.tab-content');
  const addItemContainer = chipSystem.querySelector('.add-item-container');
  const addItemInput = chipSystem.querySelector('.add-item-input');
  const saveButton = chipSystem.querySelector('.save-button');
  const resetButton = chipSystem.querySelector('.reset-button');
  
  // Get the quick-add-section (suggestion tags)
  const quickAddSection = elements.quickAddSection || document.querySelector('.quick-add-section');
  
  if (isEnabled) {
    // Enable customization UI - remove disabled class and reset styles
    if (tabButtons) {
      tabButtons.classList.remove('disabled');
      tabButtons.style.display = '';
      tabButtons.style.opacity = '1';
      tabButtons.style.pointerEvents = 'auto';
      tabButtons.style.filter = 'none';
    }
    if (tabContent) {
      tabContent.classList.remove('disabled');
      tabContent.style.display = '';
      tabContent.style.opacity = '1';
      tabContent.style.pointerEvents = 'auto';
      tabContent.style.filter = 'none';
    }
    if (addItemContainer) {
      addItemContainer.classList.remove('disabled');
      addItemContainer.style.display = '';
      addItemContainer.style.opacity = '1';
      addItemContainer.style.pointerEvents = 'auto';
      addItemContainer.style.filter = 'none';
    }
    if (quickAddSection) {
      quickAddSection.classList.remove('disabled');
      quickAddSection.style.opacity = '1';
      quickAddSection.style.pointerEvents = 'auto';
      quickAddSection.style.filter = 'none';
    }
    if (addItemInput) {
      addItemInput.disabled = false;
      addItemInput.style.opacity = '1';
    }
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.style.opacity = '1';
      saveButton.style.pointerEvents = 'auto';
    }
    if (resetButton) {
      resetButton.disabled = false;
      resetButton.style.opacity = '1';
      resetButton.style.pointerEvents = 'auto';
    }
    
    // Enable send button
    const sendButton = chipSystem.querySelector('.send-button');
    if (sendButton) {
      sendButton.disabled = false;
      sendButton.style.opacity = '1';
      sendButton.style.pointerEvents = 'auto';
    }
    
    // Enable tab buttons
    const whitelistTab = chipSystem.querySelector('#simpleWhitelistTab');
    const blacklistTab = chipSystem.querySelector('#simpleBlacklistTab');
    if (whitelistTab) {
      whitelistTab.disabled = false;
      whitelistTab.style.opacity = '1';
      whitelistTab.style.pointerEvents = 'auto';
    }
    if (blacklistTab) {
      blacklistTab.disabled = false;
      blacklistTab.style.opacity = '1';
      blacklistTab.style.pointerEvents = 'auto';
    }
    
    // Enable chips (make them clickable)
    const allChips = chipSystem.querySelectorAll('.chip');
    allChips.forEach(chip => {
      chip.style.opacity = '1';
      chip.style.pointerEvents = 'auto';
      chip.style.cursor = 'pointer';
    });
    
  } else {
    // Disable customization UI - add disabled class for blur effect
    if (tabButtons) {
      tabButtons.classList.add('disabled');
      tabButtons.style.display = '';
    }
    if (tabContent) {
      tabContent.classList.add('disabled');
      tabContent.style.display = '';
    }
    if (addItemContainer) {
      addItemContainer.classList.add('disabled');
      addItemContainer.style.display = '';
    }
    if (quickAddSection) {
      quickAddSection.classList.add('disabled');
    }
    if (addItemInput) {
      addItemInput.disabled = true;
      addItemInput.style.opacity = '0.4';
    }
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.style.opacity = '0.4';
      saveButton.style.pointerEvents = 'none';
    }
    if (resetButton) {
      resetButton.disabled = true;
      resetButton.style.opacity = '0.4';
      resetButton.style.pointerEvents = 'none';
    }
    
    // Disable send button
    const sendButton = chipSystem.querySelector('.send-button');
    if (sendButton) {
      sendButton.disabled = true;
      sendButton.style.opacity = '0.4';
      sendButton.style.pointerEvents = 'none';
    }
    // Disable tab buttons
    const whitelistTab = chipSystem.querySelector('#simpleWhitelistTab');
    const blacklistTab = chipSystem.querySelector('#simpleBlacklistTab');
    if (whitelistTab) {
      whitelistTab.disabled = true;
      whitelistTab.style.opacity = '0.4';
      whitelistTab.style.pointerEvents = 'none';
    }
    if (blacklistTab) {
      blacklistTab.disabled = true;
      blacklistTab.style.opacity = '0.4';
      blacklistTab.style.pointerEvents = 'none';
    }
    
    // Disable chips (make them non-clickable and greyed out)
    const allChips = chipSystem.querySelectorAll('.chip');
    allChips.forEach(chip => {
      chip.style.opacity = '0.4';
      chip.style.pointerEvents = 'none';
      chip.style.cursor = 'default';
    });
  }
}

// Set active tab in simple mode
async function setSimpleModeActiveTab(tabName) {
  // Update tab buttons
  if (elements.simpleWhitelistTab && elements.simpleBlacklistTab) {
    elements.simpleWhitelistTab.classList.toggle('active', tabName === 'whitelist');
    elements.simpleBlacklistTab.classList.toggle('active', tabName === 'blacklist');
  }
  
  // Show/hide tab content
  if (elements.simpleWhitelistContent && elements.simpleBlacklistContent) {
    if (tabName === 'whitelist') {
      elements.simpleWhitelistContent.classList.add('active');
      elements.simpleBlacklistContent.classList.remove('active');
    } else {
      elements.simpleWhitelistContent.classList.remove('active');
      elements.simpleBlacklistContent.classList.add('active');
    }
  }
  
  // Update placeholder text based on active tab
  if (elements.simpleAddItemInput) {
    const domain = await getCurrentDomain();
    const domainText = domain ? ` for ${domain}` : '';
    if (tabName === 'whitelist') {
      elements.simpleAddItemInput.placeholder = `content to unblock${domainText}...`;
    } else {
      elements.simpleAddItemInput.placeholder = `content to block${domainText}...`;
    }
  }
}

// Set up simple mode add item functionality
function setupSimpleModeAddItem() {
  if (!elements.simpleAddItemInput) return;
  
  // Handle Enter key
  elements.simpleAddItemInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addItemToSimpleMode();
    }
  });
  
  // Handle send button
  if (elements.simpleSendButton) {
    elements.simpleSendButton.addEventListener('click', () => {
      addItemToSimpleMode();
    });
  }
  
  // Handle reset button
  if (elements.simpleResetButton) {
    elements.simpleResetButton.addEventListener('click', () => {
      console.log('Reset simple mode');
      if (window.resetSimpleMode) {
        window.resetSimpleMode();
      }
    });
  }
}

// Add item to simple mode
function addItemToSimpleMode() {
  if (!elements.simpleAddItemInput) return;
  
  const value = elements.simpleAddItemInput.value.trim();
  if (!value) return;
  
  // Determine which tab is active
  const isWhitelistActive = elements.simpleWhitelistTab?.classList.contains('active');
  const listType = isWhitelistActive ? 'whitelist' : 'blacklist';
  
  console.log('Add item to simple mode:', value, 'to', listType);
  
  // Call add tag function (to be implemented)
  if (window.addTagToSimpleMode) {
    window.addTagToSimpleMode(value, listType);
  }
  
  // Clear input
  elements.simpleAddItemInput.value = '';
}

// Create profile chip element
function createProfileChip(profile) {
  const { state } = window.appState;
  const chip = document.createElement('button');
  
  let className = `profile-chip ${profile.isEnabled ? 'enabled' : 'disabled'}`;
  if (state.isEditMode) {
    className += ' edit-mode';
  }
  if (profile.isDefault) {
    className += ' default-profile';
  }
  
  chip.className = className;
  
  // Add tooltip for default profiles in edit mode
  if (profile.isDefault && state.isEditMode) {
    chip.title = 'Default cannot be changed';
  }
  
  chip.innerHTML = `
    <span class="profile-name">${escapeHtml(profile.profileName)}</span>
  `;
  
  // Add click handler based on mode
  if (state.isEditMode) {
    // In edit mode, clicking opens the edit view
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Edit mode chip clicked:', profile.profileName);
      
      // Check if trying to edit a default profile
      if (profile.isDefault) {
        window.ui.showDialog({
          title: 'Not Allowed',
          message: 'Default cannot be changed',
          buttons: [{ text: 'OK', primary: true }]
        });
        return;
      }
      
      window.startEditMode(profile.profileName);
    });
  } else {
    // In normal mode, clicking toggles the profile
    chip.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Toggle profile clicked:', profile.profileName);
      
      // Special handling for default profiles in power user mode
      if (profile.isDefault && state.isPowerUserMode) {
        await window.toggleDefaultProfile(profile.profileName);
      } else {
        window.toggleProfile(profile.profileName);
      }
    });
  }
  
  // Add context menu for edit/delete (only in edit mode and not for default profiles)
  if (state.isEditMode && !profile.isDefault) {
    chip.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      window.showProfileContextMenu(e, profile.profileName);
    });
  }
  
  return chip;
}

// Create new profile button
function createNewProfileButton() {
  const button = document.createElement('button');
  button.className = 'profile-chip new-profile';
  button.innerHTML = `
    <span class="profile-name">+ New Profile</span>
  `;
  
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('New profile button clicked');
    window.startEditMode();
  });
  
  return button;
}

// Update edit button appearance based on edit mode
function updateEditButtonState() {
  const { state } = window.appState;
  
  if (elements.editProfilesButton) {
    if (state.isEditMode) {
      elements.editProfilesButton.classList.add('edit-active');
      elements.editProfilesButton.querySelector('span').textContent = 'done';
    } else {
      elements.editProfilesButton.classList.remove('edit-active');
      elements.editProfilesButton.querySelector('span').textContent = 'edit';
    }
  }
}

// Render edit form
async function renderEditForm() {
  const { state } = window.appState;
  const tempData = state.tempProfileData;
  
  // Set form values
  if (elements.editPageTitle) {
    elements.editPageTitle.value = tempData?.profileName || '';
  }
  
  if (elements.editProfileColorInput) {
    elements.editProfileColorInput.value = tempData?.colour || '#f7c13d';
  }
  
  // Set active tab
  await setActiveTab(state.activeTab || 'blacklist');
  
  // Set initial placeholder text based on active tab
  if (elements.editAddItemInput) {
    const activeTab = state.activeTab || 'blacklist';
    if (activeTab === 'whitelist') {
      elements.editAddItemInput.placeholder = 'content to unblock...';
    } else {
      elements.editAddItemInput.placeholder = 'content to block...';
    }
  }
  
  // Render tags
  renderTagChips();
  
  // Update website pills
  renderWebsitePills();
  
  // Show/hide delete button (hide for new profiles)
  if (elements.editDeleteButton) {
    elements.editDeleteButton.style.display = state.editingProfile ? '' : 'none';
  }
}

// Render tag chips in edit mode
function renderTagChips() {
  const { state } = window.appState;
  const tempData = state.tempProfileData;
  
  // Render whitelist chips
  if (elements.editWhitelistChips && tempData?.whitelistTags) {
    elements.editWhitelistChips.innerHTML = '';
    tempData.whitelistTags.forEach(tag => {
      const chip = createTagChip(tag, 'whitelistTags');
      elements.editWhitelistChips.appendChild(chip);
    });
  }
  
  // Render blacklist chips
  if (elements.editBlacklistChips && tempData?.blacklistTags) {
    elements.editBlacklistChips.innerHTML = '';
    tempData.blacklistTags.forEach(tag => {
      const chip = createTagChip(tag, 'blacklistTags');
      elements.editBlacklistChips.appendChild(chip);
    });
  }
}

// Create tag chip element
function createTagChip(tag, listType) {
  const chip = document.createElement('div');
  chip.className = 'chip';
  chip.innerHTML = `
    <span class="chip-text">${escapeHtml(tag)}</span>
  `;
  
  // Add remove handler to the entire chip
  chip.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.removeTag(tag, listType);
  });
  
  return chip;
}

// Render website pills
function renderWebsitePills() {
  const { state } = window.appState;
  const allowedWebsites = state.tempProfileData?.allowedWebsites || [];
  
  elements.websitePills?.forEach(pill => {
    const website = pill.dataset.website;
    if (allowedWebsites.includes(website)) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });
}

// Set active tab in edit mode
async function setActiveTab(tabName) {
  // Update tab buttons
  if (elements.editWhitelistTab && elements.editBlacklistTab) {
    elements.editWhitelistTab.classList.toggle('active', tabName === 'whitelist');
    elements.editBlacklistTab.classList.toggle('active', tabName === 'blacklist');
  }
  
  // Show/hide tab content
  if (elements.editWhitelistContent && elements.editBlacklistContent) {
    if (tabName === 'whitelist') {
      elements.editWhitelistContent.classList.add('active');
      elements.editBlacklistContent.classList.remove('active');
    } else {
      elements.editWhitelistContent.classList.remove('active');
      elements.editBlacklistContent.classList.add('active');
    }
  }
  
  // Update placeholder text based on active tab
  if (elements.editAddItemInput) {
    if (tabName === 'whitelist') {
      elements.editAddItemInput.placeholder = 'content to unblock...';
    } else {
      elements.editAddItemInput.placeholder = 'content to block...';
    }
  }
}

// Check if current site is in the allowed list
async function isCurrentSiteAllowed() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      console.log('No active tab or URL found');
      return false;
    }
    
    const url = new URL(tab.url);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    
    // List of allowed extension sites
    const allowedSites = ['youtube.com', 'twitter.com', 'x.com', 'linkedin.com', 'reddit.com'];
    
    const isOnAllowedSite = allowedSites.some(site => {
      return hostname === site || hostname.endsWith('.' + site);
    });
    
    console.log('Checking current site:', hostname, 'allowed:', isOnAllowedSite);
    return isOnAllowedSite;
    
  } catch (error) {
    console.error('Failed to check current site:', error);
    return false;
  }
}

// Check if we should show custom tags based on customization toggle and current site
async function shouldShowCustomTagsForCurrentSite(isCustomizationEnabled) {
  // If customization is enabled, always show custom tags
  if (isCustomizationEnabled) {
    return true;
  }
  
  // If customization is disabled, only show custom tags if we're on an allowed site
  return await isCurrentSiteAllowed();
}

// Get the current website's matching default profile
async function getCurrentWebsiteProfile(profiles) {
  try {
    // Get current tab URL
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      console.log('No active tab or URL found, using first enabled profile');
      return profiles.find(p => p.isEnabled) || profiles[0];
    }
    
    const url = new URL(tab.url);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    
    // Find matching default profile for this site that is also enabled
    const matchingProfile = profiles.find(profile => {
      return profile.isDefault && 
             profile.isEnabled &&
             profile.allowedWebsites && 
             profile.allowedWebsites.some(website => {
               const cleanWebsite = website.toLowerCase().replace(/^www\./, '');
               return hostname === cleanWebsite || hostname.endsWith('.' + cleanWebsite);
             });
    });
    if (matchingProfile) {
      console.log('Found matching default profile for current site:', matchingProfile.profileName);
      return matchingProfile;
    } else {
      console.log('No matching default profile found for site:', hostname);
      // Fallback to first enabled profile or first profile
      return profiles.find(p => p.isEnabled) || profiles[0];
    }
    
  } catch (error) {
    console.error('Failed to get current website profile:', error);
    // Fallback to first enabled profile or first profile
    return profiles.find(p => p.isEnabled) || profiles[0];
  }
}

// Helper functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Get current domain for placeholder text
async function getCurrentDomain() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return '';
    
    const url = new URL(tab.url);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    return hostname;
  } catch (error) {
    return '';
  }
}


// Dialog/notification functions
function showDialog(config) {
  console.log('🪟 showDialog called with config:', config);
  
  try {
    // Use browser's native confirm dialog instead of overlay
    const message = config.message || config.content || 'Are you sure?';
    const title = config.title || 'Confirm';
    
    // For simple confirmations, use native confirm
    if (config.buttons && config.buttons.length === 2) {
      const result = confirm(`${title}\n\n${message}`);
      
      // Find the appropriate button based on result
      const button = result ? 
        config.buttons.find(btn => btn.primary || btn.text.toLowerCase().includes('yes') || btn.text.toLowerCase().includes('ok') || btn.text.toLowerCase().includes('delete')) :
        config.buttons.find(btn => !btn.primary || btn.text.toLowerCase().includes('no') || btn.text.toLowerCase().includes('cancel'));
      
      if (button && button.onClick) {
        button.onClick();
      }
      
      return { result };
    } else {
      // For single button dialogs, use alert
      alert(`${title}\n\n${message}`);
      
      const button = config.buttons && config.buttons[0];
      if (button && button.onClick) {
        button.onClick();
      }
      
      return { result: true };
    }
    
  } catch (error) {
    console.error('❌ Error in showDialog:', error);
    return null;
  }
}

// closeDialog function removed - using native browser dialogs now

function showNotification(config) {
  const notification = document.createElement('div');
  notification.className = `notification ${config.type || 'info'}`;
  notification.innerHTML = `
    <div class="notification-content">
      ${escapeHtml(config.message)}
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, config.duration || 3000);
}

// Export for use in other files
window.ui = {
  cacheElements,
  renderCurrentView,
  renderExtensionToggle,
  renderPreviewButton, // FIXED: Export renderPreviewButton
  renderStats,
  showMainView,
  showEditView,
  renderProfilesGrid,
  hideProfilesGrid,
  showProfilesSection,
  hideProfilesSection,
  showSimpleModeSection,
  hideSimpleModeSection,
  renderSimpleModeContent,
  renderSimpleChips,
  setSimpleModeActiveTab,
  setupSimpleModeTabs,
  setupCustomizationToggle,
  updateCustomizationState,
  setupSimpleModeAddItem,
  isCurrentSiteAllowed,
  shouldShowCustomTagsForCurrentSite,
  addItemToSimpleMode,
  renderEditForm,
  renderTagChips,
  renderWebsitePills,
  setActiveTab,
  updateEditButtonState,
  showDialog,
  showNotification
};

// Debug function to test toggle manually
window.testToggle = function() {
  console.log('Testing toggle...');
  const toggle = document.getElementById('simpleCustomizationToggle');
  if (toggle) {
    console.log('Toggle element:', toggle);
    console.log('Toggle checked:', toggle.checked);
    console.log('Toggle parent:', toggle.parentNode);
    console.log('Toggle container:', toggle.closest('.toggle-switch'));
    
    // Try to manually trigger the toggle
    toggle.checked = !toggle.checked;
    toggle.dispatchEvent(new Event('change'));
    console.log('Toggle manually triggered, new state:', toggle.checked);
  } else {
    console.error('Toggle element not found!');
  }
};

// Debug function to check if elements are cached properly
window.debugElements = function() {
  console.log('Cached elements:', elements);
  console.log('simpleCustomizationToggle:', elements.simpleCustomizationToggle);
  console.log('DOM element:', document.getElementById('simpleCustomizationToggle'));
};

// Debug function to test site checking
window.debugSite = async function() {
  console.log('Testing site checking...');
  const isAllowed = await isCurrentSiteAllowed();
  console.log('Is current site allowed:', isAllowed);
  
  const shouldShow = await shouldShowCustomTagsForCurrentSite(true);
  console.log('Should show custom tags (customization ON):', shouldShow);
  
  const shouldShowOff = await shouldShowCustomTagsForCurrentSite(false);
  console.log('Should show custom tags (customization OFF):', shouldShowOff);
  
  const domain = await getCurrentDomain();
  console.log('Current domain:', domain);
};

// Simple Mode Tag Management Functions
// These functions handle adding, removing, and resetting tags in simple mode

// Remove a tag from simple mode
window.removeTagFromSimpleMode = async function(tag) {
  console.log('Removing tag from simple mode:', tag);
  
  const { state } = window.appState;
  if (!state || !state.profiles || state.profiles.length === 0) {
    console.warn('No profiles available');
    return;
  }
  
  // Check if we're on an allowed site first
  const isOnAllowedSite = await isCurrentSiteAllowed();
  if (!isOnAllowedSite) {
    console.warn('Custom tag modification not allowed: not on allowed site');
    return;
  }
  
  // Check if we should allow custom tag modification
  const shouldShowCustomTags = await shouldShowCustomTagsForCurrentSite(state.isCustomizationEnabled);
  if (!shouldShowCustomTags) {
    console.warn('Custom tag modification not allowed: customization disabled');
    return;
  }
  
  // Get current website's default profile
  const currentProfile = await getCurrentWebsiteProfile(state.profiles);
  if (!currentProfile) {
    console.warn('No current profile found');
    return;
  }
  
  // Remove from both custom whitelist and blacklist
  if (currentProfile.customWhitelist) {
    currentProfile.customWhitelist = currentProfile.customWhitelist.filter(t => t !== tag);
  }
  if (currentProfile.customBlacklist) {
    currentProfile.customBlacklist = currentProfile.customBlacklist.filter(t => t !== tag);
  }
  
  // Update the state
  window.appState.updateState({ profiles: state.profiles });
  
  // Save to background
  if (window.backgroundAPI && window.backgroundAPI.saveProfiles) {
    try {
      const result = await window.backgroundAPI.saveProfiles(state.profiles);
      if (result.success) {
        console.log('Profiles saved to background after tag removal:', result);
        
        // 🔄 INSTANT RE-ANALYSIS: Trigger filtering to restore content
        console.log('🔄 Triggering instant filtering after tag removal to restore content...');
        console.log('🏷️ Removed tag:', tag, 'from profile:', currentProfile.profileName);
        try {
          await window.backgroundAPI.triggerInstantFiltering();
          console.log('✅ Instant filtering triggered successfully after tag removal');
          
          // Show success notification
          window.ui.showNotification({
            type: 'success',
            message: `Removed "${tag}" - content restored`,
            duration: 2000
          });
        } catch (filterError) {
          console.warn('⚠️ Instant filtering failed after tag removal:', filterError);
          // Don't show error to user - filtering will happen on next page load
        }
        
      } else {
        console.error('Failed to save profiles to background after tag removal:', result.error);
        // Show error notification to user
        window.ui.showNotification({
          type: 'error',
          message: 'Failed to save changes: ' + result.error,
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Failed to save profiles to background after tag removal:', error);
      // Show error notification to user
      window.ui.showNotification({
        type: 'error',
        message: 'Failed to save changes: ' + error.message,
        duration: 4000
      });
    }
  }
  
  // Re-render the chips
  renderSimpleChips(currentProfile.customWhitelist || [], elements.simpleWhitelistChips);
  renderSimpleChips(currentProfile.customBlacklist || [], elements.simpleBlacklistChips);
  
  console.log('Tag removed successfully');
};

// Add a tag to simple mode
window.addTagToSimpleMode = async function(value, listType) {
  console.log('Adding tag to simple mode:', value, 'to', listType);
  
  if (!value || !value.trim()) {
    console.warn('Empty tag value provided');
    return;
  }
  
  const { state } = window.appState;
  if (!state || !state.profiles || state.profiles.length === 0) {
    console.warn('No profiles available');
    return;
  }
  
  // Check if we're on an allowed site first
  const isOnAllowedSite = await isCurrentSiteAllowed();
  if (!isOnAllowedSite) {
    console.warn('Custom tag modification not allowed: not on allowed site');
    return;
  }
  
  // Check if we should allow custom tag modification
  const shouldShowCustomTags = await shouldShowCustomTagsForCurrentSite(state.isCustomizationEnabled);
  if (!shouldShowCustomTags) {
    console.warn('Custom tag modification not allowed: customization disabled');
    return;
  }
  
  // Get current website's default profile
  const currentProfile = await getCurrentWebsiteProfile(state.profiles);
  if (!currentProfile) {
    console.warn('No current profile found');
    return;
  }
  
  const trimmedValue = value.trim();
  
  // Initialize arrays if they don't exist
  if (!currentProfile.customWhitelist) {
    currentProfile.customWhitelist = [];
  }
  if (!currentProfile.customBlacklist) {
    currentProfile.customBlacklist = [];
  }
  
  // Add to the appropriate list
  if (listType === 'whitelist') {
    // Check if already exists in custom whitelist
    if (!currentProfile.customWhitelist.includes(trimmedValue)) {
      currentProfile.customWhitelist.push(trimmedValue);
      // Remove from custom blacklist if it exists there
      currentProfile.customBlacklist = currentProfile.customBlacklist.filter(t => t !== trimmedValue);
    } else {
      console.log('Tag already exists in custom whitelist');
      return;
    }
  } else if (listType === 'blacklist') {
    // Check if already exists in custom blacklist
    if (!currentProfile.customBlacklist.includes(trimmedValue)) {
      currentProfile.customBlacklist.push(trimmedValue);
      // Remove from custom whitelist if it exists there
      currentProfile.customWhitelist = currentProfile.customWhitelist.filter(t => t !== trimmedValue);
    } else {
      console.log('Tag already exists in custom blacklist');
      return;
    }
  } else {
    console.warn('Invalid list type:', listType);
    return;
  }
  
  // Update the state
  window.appState.updateState({ profiles: state.profiles });
  
  // Save to background
  if (window.backgroundAPI && window.backgroundAPI.saveProfiles) {
    try {
      const result = await window.backgroundAPI.saveProfiles(state.profiles);
      if (result.success) {
        console.log('Profiles saved to background after tag addition:', result);
      } else {
        console.error('Failed to save profiles to background after tag addition:', result.error);
        // Show error notification to user
        window.ui.showNotification({
          type: 'error',
          message: 'Failed to save changes: ' + result.error,
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Failed to save profiles to background after tag addition:', error);
      // Show error notification to user
      window.ui.showNotification({
        type: 'error',
        message: 'Failed to save changes: ' + error.message,
        duration: 4000
      });
    }
  }
  
  // Re-render the chips
  renderSimpleChips(currentProfile.customWhitelist || [], elements.simpleWhitelistChips);
  renderSimpleChips(currentProfile.customBlacklist || [], elements.simpleBlacklistChips);
  
  console.log('Tag added successfully');
};

// Reset simple mode to defaults
window.resetSimpleMode = async function() {
  console.log('Resetting simple mode to defaults');
  
  const { state } = window.appState;
  if (!state || !state.profiles || state.profiles.length === 0) {
    console.warn('No profiles available');
    return;
  }
  
  // Check if we're on an allowed site first
  const isOnAllowedSite = await isCurrentSiteAllowed();
  if (!isOnAllowedSite) {
    console.warn('Custom tag modification not allowed: not on allowed site');
    return;
  }
  
  // Check if we should allow custom tag modification
  const shouldShowCustomTags = await shouldShowCustomTagsForCurrentSite(state.isCustomizationEnabled);
  if (!shouldShowCustomTags) {
    console.warn('Custom tag modification not allowed: customization disabled');
    return;
  }
  
  // Get current website's default profile
  const currentProfile = await getCurrentWebsiteProfile(state.profiles);
  if (!currentProfile) {
    console.warn('No current profile found');
    return;
  }
  
  // Show confirmation dialog
  window.ui.showDialog({
    title: 'Reset Simple Mode',
    message: 'Are you sure you want to reset all whitelist and blacklist items? This action cannot be undone.',
    buttons: [
      {
        text: 'Cancel',
        onClick: () => {
          console.log('Reset cancelled');
          return true; // Close dialog
        }
      },
      {
        text: 'Reset',
        primary: true,
        onClick: async () => {
          // Reset the custom lists
          currentProfile.customWhitelist = [];
          currentProfile.customBlacklist = [];
          
          // Update the state
          window.appState.updateState({ profiles: state.profiles });
          
          // Save to background
          if (window.backgroundAPI && window.backgroundAPI.saveProfiles) {
            try {
              const result = await window.backgroundAPI.saveProfiles(state.profiles);
              if (result.success) {
                console.log('Profiles saved to background after reset:', result);
              } else {
                console.error('Failed to save profiles to background after reset:', result.error);
                // Show error notification to user
                window.ui.showNotification({
                  type: 'error',
                  message: 'Failed to save reset changes: ' + result.error,
                  duration: 4000
                });
                return true; // Close dialog anyway
              }
            } catch (error) {
              console.error('Failed to save profiles to background after reset:', error);
              // Show error notification to user
              window.ui.showNotification({
                type: 'error',
                message: 'Failed to save reset changes: ' + error.message,
                duration: 4000
              });
              return true; // Close dialog anyway
            }
          }
          
          // Re-render the chips
          renderSimpleChips([], elements.simpleWhitelistChips);
          renderSimpleChips([], elements.simpleBlacklistChips);
          
          // Show success notification
          window.ui.showNotification({
            type: 'success',
            message: 'Simple mode has been reset to defaults',
            duration: 2000
          });
          
          console.log('Simple mode reset successfully');
          return true; // Close dialog
        }
      }
    ]
  });
};

window.updateStatsUI = updateStatsUI;

// Debug function to test stats labels
window.testStatsLabels = function() {
  console.log('Testing global stats labels...');
  
  renderStats(5, 25);
  console.log('Updated stats with test values (5 today, 25 total)');
  
  if (elements.blockedTodayLabel && elements.totalBlockedLabel) {
    console.log('Blocked today label:', elements.blockedTodayLabel.textContent);
    console.log('Total blocked label:', elements.totalBlockedLabel.textContent);
  } else {
    console.log('Label elements not found');
  }
};