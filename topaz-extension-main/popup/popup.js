async function initializePopup() {
  console.log('🚀 Initializing Doom Blocker popup...');
  
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
    
    
    window.ui.cacheElements();
    
    setVersionNumber();
    
    setupEventListeners();
    
    setupMessageListeners();
    
    await loadInitialData();
    
    await notifyPopupOpened();
    
    startHeartbeatSystem();
    
    // Load preview state from storage FIRST
    try {
      const result = await chrome.storage.local.get(['previewEnabled']);
      if (result.previewEnabled !== undefined) {
        window.appState.updateState({ isPreviewEnabled: result.previewEnabled });
      }
    } catch (error) {
      console.error('Failed to load preview state:', error);
    }
    
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
      
      // No auto-enable functionality - users must manually enable profiles
      
      // Fetch block stats for the current site
      const stats = await loadBlockStats();
      
      // Load YouTube feature settings
      await loadYouTubeFeatureSettings();
      
      window.appState.updateState({
        isExtensionEnabled: settings.extensionEnabled ?? true,
        isPowerUserMode: settings.isPowerUserMode ?? false,
        isCustomizationEnabled: settings.customizationToggle ?? true,
        showBlockCounter: settings.showBlockCounter ?? true,
        isPreviewEnabled: settings.previewEnabled ?? false, // FIXED: Load preview state from storage
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

  const profileButton = document.getElementById('profileButton');
  console.log('👤 Profile button element:', profileButton);
  if (profileButton) {
    console.log('🎯 Adding click event listener to profile button');
    profileButton.addEventListener('click', (e) => {
      console.log('🖱️ Profile button click event triggered!', e);
      handleProfileOpen();
    });
    console.log('✅ Profile button event listener added');
  } else {
    console.warn('⚠️ Profile button element not found');
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

  // Manual onboarding tour button removed
  
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

  // Suggestion tags
  const suggestionTags = document.querySelectorAll('.suggestion-tag');
  suggestionTags.forEach(tag => {
    tag.addEventListener('click', () => handleSuggestionTagClick(tag.dataset.tag));
  });

  // YouTube feature toggles - use event delegation for more reliability
  console.log('Setting up YouTube toggle event listeners...');
  
  // Use event delegation on the document to catch clicks on toggle inputs
  document.addEventListener('change', (event) => {
    if (event.target.id === 'blockShortsToggle') {
      console.log('Block Shorts toggle changed:', event.target.checked);
      handleYouTubeFeatureToggle('blockShorts', event.target.checked);
    } else if (event.target.id === 'blockHomeFeedToggle') {
      console.log('Block Home Feed toggle changed:', event.target.checked);
      handleYouTubeFeatureToggle('blockHomeFeed', event.target.checked);
    } else if (event.target.id === 'blockCommentsToggle') {
      console.log('Block Comments toggle changed:', event.target.checked);
      handleYouTubeFeatureToggle('blockComments', event.target.checked);
    }
  });

  // Also listen for clicks on toggle switches (in case change event doesn't fire)
  document.addEventListener('click', (event) => {
    if (event.target.id === 'blockShortsToggle' || event.target.closest('#blockShortsToggle')) {
      console.log('Block Shorts toggle clicked');
      setTimeout(() => {
        const toggle = document.getElementById('blockShortsToggle');
        if (toggle) {
          console.log('Block Shorts toggle state after click:', toggle.checked);
          handleYouTubeFeatureToggle('blockShorts', toggle.checked);
        }
      }, 10);
    } else if (event.target.id === 'blockHomeFeedToggle' || event.target.closest('#blockHomeFeedToggle')) {
      console.log('Block Home Feed toggle clicked');
      setTimeout(() => {
        const toggle = document.getElementById('blockHomeFeedToggle');
        if (toggle) {
          console.log('Block Home Feed toggle state after click:', toggle.checked);
          handleYouTubeFeatureToggle('blockHomeFeed', toggle.checked);
        }
      }, 10);
    } else if (event.target.id === 'blockCommentsToggle' || event.target.closest('#blockCommentsToggle')) {
      console.log('Block Comments toggle clicked');
      setTimeout(() => {
        const toggle = document.getElementById('blockCommentsToggle');
        if (toggle) {
          console.log('Block Comments toggle state after click:', toggle.checked);
          handleYouTubeFeatureToggle('blockComments', toggle.checked);
        }
      }, 10);
    }
  });

  // Also try direct event listeners as backup
  setTimeout(() => {
    const blockShortsToggle = document.getElementById('blockShortsToggle');
    const blockHomeFeedToggle = document.getElementById('blockHomeFeedToggle');
    const blockCommentsToggle = document.getElementById('blockCommentsToggle');

    console.log('YouTube toggle elements found (delayed):', {
      blockShortsToggle: !!blockShortsToggle,
      blockHomeFeedToggle: !!blockHomeFeedToggle,
      blockCommentsToggle: !!blockCommentsToggle
    });

    if (blockShortsToggle) {
      console.log('Adding direct event listener to blockShortsToggle');
      blockShortsToggle.addEventListener('change', () => {
        console.log('Direct Block Shorts toggle changed:', blockShortsToggle.checked);
        handleYouTubeFeatureToggle('blockShorts', blockShortsToggle.checked);
      });
    }
    
    if (blockHomeFeedToggle) {
      console.log('Adding direct event listener to blockHomeFeedToggle');
      blockHomeFeedToggle.addEventListener('change', () => {
        console.log('Direct Block Home Feed toggle changed:', blockHomeFeedToggle.checked);
        handleYouTubeFeatureToggle('blockHomeFeed', blockHomeFeedToggle.checked);
      });
    }
    
    if (blockCommentsToggle) {
      console.log('Adding direct event listener to blockCommentsToggle');
      blockCommentsToggle.addEventListener('change', () => {
        console.log('Direct Block Comments toggle changed:', blockCommentsToggle.checked);
        handleYouTubeFeatureToggle('blockComments', blockCommentsToggle.checked);
      });
    }
  }, 100);


  
  // Add a test function to the global scope for debugging
  window.testYouTubeToggles = function() {
    console.log('Testing YouTube toggles...');
    const toggles = ['blockShortsToggle', 'blockHomeFeedToggle', 'blockCommentsToggle'];
    toggles.forEach(toggleId => {
      const toggle = document.getElementById(toggleId);
      console.log(`${toggleId}:`, {
        exists: !!toggle,
        checked: toggle?.checked,
        disabled: toggle?.disabled,
        style: toggle ? {
          display: toggle.style.display,
          visibility: toggle.style.visibility,
          pointerEvents: toggle.style.pointerEvents,
          zIndex: toggle.style.zIndex
        } : null
      });
    });
  };

  // Test clicking the toggles programmatically
  window.testToggleClick = function(toggleId) {
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      console.log(`Manually clicking ${toggleId}`);
      toggle.click();
    } else {
      console.log(`${toggleId} not found`);
    }
  };
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

// Handle profile button click - opens analytics in new tab
async function handleProfileOpen() {
  console.log('👤 Profile button clicked - opening analytics');
  try {
    // Get user session ID for analytics
    const sessionId = await getUserSessionId();

    console.log('🔍 Retrieved session ID:', sessionId);

    // Always get fresh background stats and send to backend
    await sendCurrentStatsToBackend(sessionId);

    // Small delay to ensure data is processed before opening analytics
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Always construct URL with session ID (we always have one now)
    const analyticsUrl = `https://topaz-backend1.onrender.com/analytics?session=${sessionId}`;

    // Open analytics in new tab
    chrome.tabs.create({ url: analyticsUrl });

    console.log('✅ Analytics tab opened:', analyticsUrl);

    // Show success notification
    window.ui?.showNotification?.({
      type: 'success',
      message: 'Analytics opened in new tab',
      duration: 2000
    });

  } catch (error) {
    console.error('❌ Error opening analytics:', error);
    // Show error notification
    window.ui?.showNotification?.({
      type: 'error',
      message: 'Failed to open analytics',
      duration: 3000
    });
  }
}

// Send current stats to backend before opening analytics
async function sendCurrentStatsToBackend(sessionId) {
  try {
    console.log('📊 Sending current stats for session:', sessionId);

    // Get the exact numbers displayed in the popup UI
    const totalBlockedElement = document.getElementById('totalBlocked');
    const blockedCountElement = document.getElementById('blockedCount');

    const totalFromUI = totalBlockedElement ? parseInt(totalBlockedElement.textContent) : 0;
    const todayFromUI = blockedCountElement ? parseInt(blockedCountElement.textContent) : 0;

    console.log('🎯 Numbers from popup UI - Total:', totalFromUI, 'Today:', todayFromUI);

    // Also get background stats as backup
    const backgroundStats = await getGlobalBlockedStats();
    console.log('📈 Background stats - Total:', backgroundStats.totalBlocked, 'Today:', backgroundStats.blockedCount);

    // Use the higher number (UI or background)
    const finalTotal = Math.max(totalFromUI, backgroundStats.totalBlocked || 0);
    const finalToday = Math.max(todayFromUI, backgroundStats.blockedCount || 0);

    console.log('🏆 Final numbers to send - Total:', finalTotal, 'Today:', finalToday);

    // Send current session data
    const sessionData = {
      session_id: sessionId,
      device_info: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      created_at: new Date().toISOString(),
      extension_version: chrome.runtime.getManifest().version,
      first_install: false
    };

    // Send current metrics with real counts
    const metricsData = {
      session_id: sessionId,
      total_blocked: finalTotal,
      blocked_today: finalToday,
      sites_visited: [],
      profiles_used: [],
      last_updated: new Date().toISOString()
    };

    console.log('📊 Sending metrics data:', metricsData);

    // Send session data
    const sessionResponse = await fetch('https://topaz-backend1.onrender.com/api/user-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });

    const sessionResult = await sessionResponse.json();
    console.log('📝 Session data response:', sessionResult);

    // Send metrics with current stats
    const metricsResponse = await fetch('https://topaz-backend1.onrender.com/api/user-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metricsData)
    });

    const metricsResult = await metricsResponse.json();
    console.log('📊 Metrics response:', metricsResult);

    console.log('✅ Sent real UI stats to backend:', {total: finalTotal, today: finalToday});

  } catch (error) {
    console.warn('⚠️ Failed to send current stats:', error);
    // Don't fall back to test data anymore
  }
}

// Send real user data to backend to populate analytics
async function sendUserDataToBackend(sessionId) {
  try {
    console.log('📊 Sending real user data for session:', sessionId);

    // Get actual blocked stats from background
    const backgroundStats = await getGlobalBlockedStats();
    console.log('📊 Background stats:', backgroundStats);

    // Try to get real data from content scripts first
    const realData = await getRealUserData(sessionId);

    // Override metrics with actual background stats
    if (realData && realData.metricsData) {
      realData.metricsData.total_blocked = backgroundStats.totalBlocked || 0;
      realData.metricsData.blocked_today = backgroundStats.blockedCount || 0;
    }

    if (realData) {
      console.log('📈 Found real user data with background stats:', realData);

      // Send real session data
      if (realData.sessionData) {
        const sessionResponse = await fetch('https://topaz-backend1.onrender.com/api/user-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(realData.sessionData)
        });
        console.log('📝 Real session data response:', await sessionResponse.json());
      }

      // Send real metrics data
      if (realData.metricsData) {
        const metricsResponse = await fetch('https://topaz-backend1.onrender.com/api/user-metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(realData.metricsData)
        });
        console.log('📊 Real metrics data response:', await metricsResponse.json());
      }

      // Send real blocked items data
      if (realData.blockedItemsData && realData.blockedItemsData.blocked_items.length > 0) {
        const blockedResponse = await fetch('https://topaz-backend1.onrender.com/api/blocked-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(realData.blockedItemsData)
        });
        console.log('🚫 Real blocked items response:', await blockedResponse.json());
      }

      console.log('✅ Real user data sent successfully');
    } else if (backgroundStats.totalBlocked > 0 || backgroundStats.blockedCount > 0) {
      // No session data but we have background stats - create minimal data
      console.log('📊 No session data but found background stats, creating basic metrics');

      const basicMetricsData = {
        session_id: sessionId,
        total_blocked: backgroundStats.totalBlocked || 0,
        blocked_today: backgroundStats.blockedCount || 0,
        sites_visited: [],
        profiles_used: [],
        last_updated: new Date().toISOString()
      };

      // Send basic session data
      const sessionData = {
        session_id: sessionId,
        device_info: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        created_at: new Date().toISOString(),
        extension_version: chrome.runtime.getManifest().version,
        first_install: false
      };

      const sessionResponse = await fetch('https://topaz-backend1.onrender.com/api/user-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      console.log('📝 Basic session data response:', await sessionResponse.json());

      // Send metrics with real background stats
      const metricsResponse = await fetch('https://topaz-backend1.onrender.com/api/user-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basicMetricsData)
      });
      console.log('📊 Real background metrics response:', await metricsResponse.json());

      console.log('✅ Background stats sent successfully');
    } else {
      console.log('⚠️ No real data found, but not sending test data (this will show 0 counts)');
    }

  } catch (error) {
    console.warn('⚠️ Failed to send real user data:', error);
    // Don't send test data anymore - let analytics show real counts even if 0
  }
}

// Get real user data from content scripts
async function getRealUserData(sessionId) {
  try {
    // Get all tabs that might have the extension
    const tabs = await chrome.tabs.query({
      url: ['https://www.youtube.com/*', 'https://youtube.com/*', 'https://twitter.com/*', 'https://x.com/*', 'https://linkedin.com/*', 'https://reddit.com/*']
    });

    for (const tab of tabs) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'GET_SESSION_MANAGER'
        });

        if (response && response.success && response.sessionManager) {
          // Get session data
          const sessionInfo = response.sessionManager.getStoredSession?.() || {};
          const metrics = response.sessionManager.getMetrics?.() || {};
          const syncQueue = response.sessionManager.getSyncQueue?.() || [];

          if (sessionInfo.sessionId || metrics.totalBlocked > 0 || syncQueue.length > 0) {
            console.log('📈 Found real session data from tab:', tab.url);

            // Extract blocked items from sync queue
            const blockedItems = [];
            syncQueue.forEach(item => {
              if (item.data && item.data.blockedItems) {
                blockedItems.push(...item.data.blockedItems);
              }
            });

            return {
              sessionData: sessionInfo.sessionId ? {
                session_id: sessionInfo.sessionId,
                device_info: sessionInfo.deviceInfo || {
                  userAgent: navigator.userAgent,
                  language: navigator.language,
                  platform: navigator.platform
                },
                created_at: sessionInfo.createdAt ? new Date(sessionInfo.createdAt).toISOString() : new Date().toISOString(),
                extension_version: sessionInfo.version || chrome.runtime.getManifest().version,
                first_install: sessionInfo.firstInstall || false
              } : null,

              metricsData: {
                session_id: sessionId,
                total_blocked: metrics.totalBlocked || 0,
                blocked_today: metrics.blockedToday || 0,
                sites_visited: metrics.sitesVisited || [],
                profiles_used: metrics.profilesUsed || [],
                last_updated: new Date().toISOString()
              },

              blockedItemsData: blockedItems.length > 0 ? {
                session_id: sessionId,
                blocked_items: blockedItems.map(item => ({
                  timestamp: item.timestamp || new Date().toISOString(),
                  count: item.count || 1,
                  url: item.url || window.location.href,
                  hostname: item.hostname || new URL(item.url || window.location.href).hostname,
                  items: item.items || []
                }))
              } : null
            };
          }
        }
      } catch (error) {
        console.warn('Could not get data from tab:', tab.url, error);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting real user data:', error);
    return null;
  }
}

// Send test data to backend to populate analytics
async function sendTestDataToBackend(sessionId) {
  try {
    console.log('📊 Sending test data for session:', sessionId);

    // Create test session data
    const sessionData = {
      session_id: sessionId,
      device_info: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      created_at: new Date().toISOString(),
      extension_version: chrome.runtime.getManifest().version,
      first_install: true
    };

    // Send session data
    const sessionResponse = await fetch('https://topaz-backend1.onrender.com/api/user-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });

    console.log('📝 Session data response:', await sessionResponse.json());

    // Create test metrics data
    const metricsData = {
      session_id: sessionId,
      total_blocked: 25,
      blocked_today: 5,
      sites_visited: [
        { hostname: 'youtube.com', date: new Date().toDateString(), count: 3 },
        { hostname: 'twitter.com', date: new Date().toDateString(), count: 2 }
      ],
      profiles_used: [
        { profileName: 'Focus Mode', date: new Date().toDateString(), count: 1 }
      ],
      last_updated: new Date().toISOString()
    };

    // Send metrics data
    const metricsResponse = await fetch('https://topaz-backend1.onrender.com/api/user-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metricsData)
    });

    console.log('📊 Metrics data response:', await metricsResponse.json());

    // Create test blocked items data
    const blockedItemsData = {
      session_id: sessionId,
      blocked_items: [
        {
          timestamp: new Date().toISOString(),
          count: 3,
          url: 'https://youtube.com/watch?v=example',
          hostname: 'youtube.com',
          items: ['distracting video', 'clickbait title', 'recommended content']
        },
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          count: 2,
          url: 'https://twitter.com/home',
          hostname: 'twitter.com',
          items: ['promoted tweet', 'trending topic']
        }
      ]
    };

    // Send blocked items data
    const blockedResponse = await fetch('https://topaz-backend1.onrender.com/api/blocked-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blockedItemsData)
    });

    console.log('🚫 Blocked items response:', await blockedResponse.json());
    console.log('✅ Test data sent successfully');

  } catch (error) {
    console.warn('⚠️ Failed to send test data:', error);
    // Don't throw - analytics should still open even if test data fails
  }
}

// Get user session ID from content script or chrome.storage
async function getUserSessionId() {
  try {
    // First try to get from chrome.storage (accessible from popup)
    const result = await chrome.storage.local.get(['topaz_user_session']);
    if (result.topaz_user_session) {
      const sessionData = result.topaz_user_session;
      if (sessionData && sessionData.sessionId) {
        console.log('📦 Got session ID from chrome.storage:', sessionData.sessionId);
        return sessionData.sessionId;
      }
    }

    // Fallback: try to get from content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'GET_SESSION_MANAGER'
        });

        if (response && response.success && response.sessionManager) {
          const sessionId = response.sessionManager.getSessionId();
          console.log('📡 Got session ID from content script:', sessionId);
          return sessionId;
        }
      } catch (messageError) {
        console.warn('⚠️ Could not communicate with content script:', messageError);
      }
    }

    console.warn('⚠️ No session ID found, generating fallback');
    return await generateFallbackSessionId();
  } catch (error) {
    console.warn('Could not get session ID:', error);
    return await generateFallbackSessionId();
  }
}

// Generate a fallback session ID if none exists
async function generateFallbackSessionId() {
  try {
    // Check if we already have one in chrome.storage
    const result = await chrome.storage.local.get(['topaz_fallback_session']);
    let fallbackId = result.topaz_fallback_session;

    if (!fallbackId) {
      // Generate new UUID
      fallbackId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      // Store in chrome.storage
      await chrome.storage.local.set({ topaz_fallback_session: fallbackId });
      console.log('🆔 Generated fallback session ID:', fallbackId);
    } else {
      console.log('🔄 Using existing fallback session ID:', fallbackId);
    }

    return fallbackId;
  } catch (error) {
    console.error('Error with fallback session:', error);
    // Last resort: generate a temporary ID
    return 'temp-' + Date.now();
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
    colour: profileData?.colour || '#f7c13d',
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
      colour: '#f7c13d',
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
          colour: '#f7c13d',
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
                  colour: '#f7c13d',
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
      // Call the UI function directly
      if (window.ui && window.ui.addItemToSimpleMode) {
        window.ui.addItemToSimpleMode();
      }
    }
  }
}

// Handle simple mode save button click
function handleSimpleSaveButtonClick() {
  console.log('Simple save button clicked - closing popup');
  window.close();
}

// Preview toggle click handler - FIXED: Use appState instead of local variable
async function handlePreviewToggleClick() {
  try {
    // Do nothing if extension is disabled
    if (!window.appState?.state?.isExtensionEnabled) {
      window.ui && window.ui.showNotification && window.ui.showNotification({
        type: 'warning',
        message: 'Enable Doom Blocker to preview hidden content',
        duration: 1800
      });
      return;
    }
    
    const { state } = window.appState;
    const desired = !state.isPreviewEnabled;
    const btn = document.getElementById('previewToggleButton');
    
    console.log('🔍 [PREVIEW TOGGLE] Starting toggle:', { currentState: state.isPreviewEnabled, desired });
    
    // Optimistic UI: update button state based on desired state
    if (btn) {
      btn.classList.toggle('active', desired);
      btn.textContent = desired ? 'Hide Hidden Content' : 'Show Hidden Content';
    }
    
    const result = await window.backgroundAPI.togglePreviewHidden(desired);
    console.log('🔍 [PREVIEW TOGGLE] Toggle result:', result);
    
    if (!result?.success) {
      console.warn('Preview toggle failed:', result?.error);
      // Re-sync UI to actual state
      await syncPreviewButtonState();
      return;
    }
    
    // Derive final enabled state from content response when available
    const enabledFromContentVal = result?.response?.data?.enabled;
    const enabledFromContent = typeof enabledFromContentVal === 'boolean' ? enabledFromContentVal : undefined;
    const finalPreviewEnabled = (enabledFromContent === undefined) ? desired : enabledFromContent;
    
    // FIXED: Update appState and save to storage
    window.appState.updateState({ isPreviewEnabled: finalPreviewEnabled });
    
    // Save preview state to storage
    try {
      await chrome.storage.local.set({ previewEnabled: finalPreviewEnabled });
    } catch (error) {
      console.error('Failed to save preview state:', error);
    }
    
    console.log('🔍 [PREVIEW TOGGLE] Final state:', { 
      enabledFromContent, 
      desired, 
      finalPreviewEnabled 
    });
    
    if (btn) {
      btn.classList.toggle('active', finalPreviewEnabled);
      btn.textContent = finalPreviewEnabled ? 'Hide Hidden Content' : 'Show Hidden Content';
    }
    
    // Do not sync immediately on success; content is source of truth and we just set from its response
  } catch (e) {
    console.error('Failed to toggle preview:', e);
    // Defer sync slightly to avoid racing with error cases
    setTimeout(() => { syncPreviewButtonState().catch(() => {}); }, 150);
  }
}

// Query content script for current preview state and update button UI - FIXED: Use appState
async function syncPreviewButtonState() {
  try {
    const btn = document.getElementById('previewToggleButton');
    if (!btn) return;
    
    // Get content preview state
    const res = await window.backgroundAPI.getPreviewState();
    console.log('🔍 [PREVIEW SYNC] Raw response from content script:', res);
    
    const enabled = !!res?.response?.data?.enabled;
    const hiddenCount = Number(res?.response?.data?.hiddenCount || 0);
    
    console.log('🔍 [PREVIEW SYNC] Parsed state:', { enabled, hiddenCount });
    
    // Always ask background for current extension state to avoid stale window.appState
    let extEnabled = true;
    try {
      const ext = await window.backgroundAPI.getExtensionState();
      extEnabled = !!ext?.enabled;
    } catch (_) {
      extEnabled = true; // default to enabled if we cannot determine
    }
    
    // FIXED: Use saved state as the source of truth for user preference
    // Only override if extension is disabled
    const savedState = window.appState.state.isPreviewEnabled;
    const finalEnabled = extEnabled ? savedState : false;
    
    console.log('🔍 [PREVIEW SYNC] State decision:', { 
      contentScriptEnabled: enabled, 
      savedState, 
      finalEnabled 
    });
    
    // Update appState with final decision
    window.appState.updateState({ isPreviewEnabled: finalEnabled });
    btn.classList.toggle('active', finalEnabled);
    
    // Button is disabled only when extension is disabled
    if (!extEnabled) {
      btn.disabled = true;
      btn.textContent = 'Show Hidden Content';
      btn.classList.remove('active');
      window.appState.updateState({ isPreviewEnabled: false });
      return;
    }
    
    btn.disabled = false;
    // Keep clickable even if there are 0 to show; show a count hint when available
    btn.textContent = enabled ? 'Hide Hidden Content' : (hiddenCount > 0 ? `Show Hidden Content (${hiddenCount})` : 'Show Hidden Content');
    
    console.log('🔍 [PREVIEW SYNC] Button state updated:', { 
      enabled, 
      buttonText: btn.textContent, 
      hasActiveClass: btn.classList.contains('active'),
      appStatePreviewEnabled: window.appState.state.isPreviewEnabled
    });
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
        colour: '#f7c13d',
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

// Auto-enable functionality removed - users must manually enable profiles

// Handle suggestion tag click
async function handleSuggestionTagClick(tag) {
  console.log('Suggestion tag clicked:', tag);
  
  const { state } = window.appState;
  
  // Check if extension is disabled
  if (!state.isExtensionEnabled) {
    window.ui?.showNotification?.({
      type: 'warning',
      message: 'Enable Doom Blocker to add content filters',
      duration: 2000
    });
    return;
  }
  
  // Check if we're in edit mode
  if (state.currentView === 'edit') {
    // In edit mode, add the tag directly to the current active list
    addTag(tag);
  } else {
    // In simple mode, add the tag directly to the blocking area
    if (state.isCustomizationEnabled) {
      // Determine which tab is active (blacklist or whitelist)
      const isWhitelistActive = document.getElementById('simpleWhitelistTab')?.classList.contains('active');
      const listType = isWhitelistActive ? 'whitelist' : 'blacklist';
      
      // Add directly to the blocking area
      if (window.addTagToSimpleMode) {
        await window.addTagToSimpleMode(tag, listType);
        
        // Show success notification
        window.ui?.showNotification?.({
          type: 'success',
          message: `Added "${tag}" to ${listType}`,
          duration: 1500
        });
      }
    } else if (state.isPowerUserMode) {
      // In power user mode, show a message
      window.ui?.showNotification?.({
        type: 'info',
        message: `Enter edit mode to add "${tag}" to a profile`,
        duration: 2000
      });
    } else {
      // Show message to enable customization
      window.ui?.showNotification?.({
        type: 'warning',
        message: 'Enable customization to add content filters',
        duration: 2000
      });
    }
  }
}

// Handle YouTube feature toggle
async function handleYouTubeFeatureToggle(feature, enabled) {
  console.log(`🎬 YouTube feature ${feature} toggled:`, enabled);
  
  try {
    // Send message to content script to block/unblock YouTube features
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    console.log('Current tab:', tab);
    
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }

    // First, test if content script is responding
    try {
      const testResponse = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_PREVIEW_STATE'
      });
      console.log('Content script test response:', testResponse);
    } catch (testError) {
      console.error('Content script not responding:', testError);
      throw new Error('Content script not loaded or not responding');
    }

    let messageType;
    switch (feature) {
      case 'blockShorts':
        messageType = 'YOUTUBE_BLOCK_SHORTS';
        break;
      case 'blockHomeFeed':
        messageType = 'YOUTUBE_BLOCK_HOME_FEED';
        break;
      case 'blockComments':
        messageType = 'YOUTUBE_BLOCK_COMMENTS';
        break;
      default:
        throw new Error(`Unknown YouTube feature: ${feature}`);
    }

    console.log(`Sending message to content script:`, { type: messageType, enabled });

    const response = await chrome.tabs.sendMessage(tab.id, {
      type: messageType,
      enabled: enabled
    });

    console.log('Content script response:', response);

    if (response && response.success) {
      window.ui?.showNotification?.({
        type: 'success',
        message: response.message,
        duration: 2000
      });
    } else {
      throw new Error(response?.message || 'Failed to toggle YouTube feature');
    }
  } catch (error) {
    console.error('Failed to toggle YouTube feature:', error);
    showError('Failed to toggle YouTube feature: ' + error.message);
    
    // Revert the toggle state
    const toggleElement = document.getElementById(`${feature}Toggle`);
    if (toggleElement) {
      toggleElement.checked = !enabled;
    }
  }
}

// Add suggestion tag to simple mode (helper function for suggestion tags)
function addSuggestionTagToSimpleMode(item) {
  const { state } = window.appState;
  
  if (!state.isCustomizationEnabled) {
    window.ui?.showNotification?.({
      type: 'warning',
      message: 'Enable customization to add items',
      duration: 2000
    });
    return;
  }
  
  // Add to the current active list in simple mode
  const activeTab = state.activeTab || 'blacklist';
  const listType = activeTab === 'whitelist' ? 'whitelistTags' : 'blacklistTags';
  
  // Call the UI function to add the tag
  if (window.addTagToSimpleMode) {
    window.addTagToSimpleMode(item, listType);
  } else {
    // Fallback notification
    window.ui?.showNotification?.({
      type: 'info',
      message: `Added "${item}" to ${activeTab}`,
      duration: 2000
    });
  }
}

// Load YouTube feature settings - FIXED: Get from storage instead of content script
async function loadYouTubeFeatureSettings() {
  try {
    // Get settings directly from chrome.storage for reliability
    const result = await chrome.storage.local.get([
      'youtube_blockShorts',
      'youtube_blockHomeFeed', 
      'youtube_blockComments'
    ]);
    
    const settings = {
      blockShorts: result.youtube_blockShorts || false,
      blockHomeFeed: result.youtube_blockHomeFeed || false,
      blockComments: result.youtube_blockComments || false
    };
    
    console.log('📺 Loaded YouTube settings from storage:', settings);
    
    // Update toggle states with stored values
    const blockShortsToggle = document.getElementById('blockShortsToggle');
    const blockHomeFeedToggle = document.getElementById('blockHomeFeedToggle');
    const blockCommentsToggle = document.getElementById('blockCommentsToggle');
    
    if (blockShortsToggle) {
      blockShortsToggle.checked = settings.blockShorts;
      console.log('📺 Set blockShortsToggle to:', settings.blockShorts);
    }
    if (blockHomeFeedToggle) {
      blockHomeFeedToggle.checked = settings.blockHomeFeed;
      console.log('📺 Set blockHomeFeedToggle to:', settings.blockHomeFeed);
    }
    if (blockCommentsToggle) {
      blockCommentsToggle.checked = settings.blockComments;
      console.log('📺 Set blockCommentsToggle to:', settings.blockComments);
    }
  } catch (error) {
    console.warn('Failed to load YouTube feature settings:', error);
    
    // Fallback: try to get from content script
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.id) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'YOUTUBE_GET_SETTINGS'
        });

        if (response && response.success && response.settings) {
          const settings = response.settings;
          
          // Update toggle states
          const blockShortsToggle = document.getElementById('blockShortsToggle');
          const blockHomeFeedToggle = document.getElementById('blockHomeFeedToggle');
          const blockCommentsToggle = document.getElementById('blockCommentsToggle');
          
          if (blockShortsToggle) {
            blockShortsToggle.checked = settings.blockShorts || false;
          }
          if (blockHomeFeedToggle) {
            blockHomeFeedToggle.checked = settings.blockHomeFeed || false;
          }
          if (blockCommentsToggle) {
            blockCommentsToggle.checked = settings.blockComments || false;
          }
          
          console.log('📺 Loaded YouTube settings from content script (fallback):', settings);
        }
      }
    } catch (fallbackError) {
      console.warn('Fallback YouTube settings loading also failed:', fallbackError);
    }
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

