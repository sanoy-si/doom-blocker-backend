// Auth Callback Content Script
// Monitors the callback page and extracts tokens

console.log('🔐 Auth callback content script loaded');

// Get extension ID from URL
const urlParams = new URLSearchParams(window.location.search);
const extensionId = urlParams.get('extension_id');
console.log('🔐 Extension ID from URL:', extensionId);

// Function to extract tokens from localStorage
function extractTokensFromStorage() {
  try {
    const storedTokens = localStorage.getItem('doom_blocker_auth');
    if (storedTokens) {
      const tokenData = JSON.parse(storedTokens);
      console.log('🔐 Tokens found in localStorage:', tokenData);
      
      // Send tokens to background script
      chrome.runtime.sendMessage({
        type: 'TOKEN_RECEIVED',
        tokenData: tokenData
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Failed to send tokens to background:', chrome.runtime.lastError);
        } else {
          console.log('✅ Tokens sent to background successfully:', response);
        }
      });
      
      return true;
    }
  } catch (error) {
    console.error('❌ Error extracting tokens:', error);
  }
  return false;
}

// Function to check URL parameters
function checkUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('auth_success') === 'true') {
    console.log('🔐 Auth success detected in URL');
    return true;
  }
  return false;
}

// Monitor for tokens
function monitorForTokens() {
  // Check immediately
  if (extractTokensFromStorage()) {
    return;
  }
  
  // Check URL parameters
  if (checkUrlParameters()) {
    // Wait a bit for localStorage to be updated
    setTimeout(() => {
      extractTokensFromStorage();
    }, 1000);
  }
  
  // Monitor localStorage changes
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    if (key === 'doom_blocker_auth') {
      console.log('🔐 Token storage detected');
      setTimeout(() => {
        extractTokensFromStorage();
      }, 100);
    }
  };
  
  // Monitor URL changes
  let lastUrl = window.location.href;
  const urlObserver = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log('🔐 URL changed:', lastUrl);
      if (checkUrlParameters()) {
        setTimeout(() => {
          extractTokensFromStorage();
        }, 1000);
      }
    }
  });
  
  urlObserver.observe(document, { subtree: true, childList: true });
}

// Start monitoring
monitorForTokens();

// Listen for custom auth event
window.addEventListener('auth-tokens-ready', () => {
  console.log('🔐 Auth tokens ready event received');
  extractTokensFromStorage();
});

// Also listen for postMessage from the page
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'AUTH_SUCCESS') {
    console.log('🔐 Auth success message received:', event.data);
    
    // Send tokens to background script
    chrome.runtime.sendMessage({
      type: 'TOKEN_RECEIVED',
      tokenData: event.data.tokenData
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Failed to send tokens to background:', chrome.runtime.lastError);
      } else {
        console.log('✅ Tokens sent to background successfully:', response);
      }
    });
  }
});
