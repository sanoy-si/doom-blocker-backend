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
      
      // Validate token data structure
      if (!tokenData.user || !tokenData.accessToken) {
        console.error('❌ Invalid token data structure:', tokenData);
        return false;
      }
      
      // Send tokens to background script
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'TOKEN_RECEIVED',
          tokenData: tokenData
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Failed to send tokens to background:', chrome.runtime.lastError);
          } else {
            console.log('✅ Tokens sent to background successfully:', response);
            // Clear the stored tokens after successful transmission
            localStorage.removeItem('doom_blocker_auth');
          }
        });
      } else {
        console.error('❌ Chrome runtime not available in this context');
        console.log('🔐 Content script running in wrong context - trying alternative method');
        
        // Try to communicate via postMessage to the extension
        window.postMessage({
          type: 'TOKEN_FOR_EXTENSION',
          tokenData: tokenData
        }, '*');
      }
      
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
  console.log('🔐 Starting token monitoring...');
  
  // Check immediately
  if (extractTokensFromStorage()) {
    console.log('🔐 Tokens found immediately, monitoring complete');
    return;
  }
  
  // Check URL parameters
  if (checkUrlParameters()) {
    console.log('🔐 Auth success detected in URL, waiting for tokens...');
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
      console.log('🔐 Token storage detected via localStorage.setItem');
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
  
  // Also check periodically as a fallback
  const checkInterval = setInterval(() => {
    if (extractTokensFromStorage()) {
      clearInterval(checkInterval);
      console.log('🔐 Tokens found via periodic check, monitoring complete');
    }
  }, 2000);
  
  // Stop checking after 30 seconds
  setTimeout(() => {
    clearInterval(checkInterval);
    console.log('🔐 Token monitoring timeout reached');
  }, 30000);
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
  if (event.data && (event.data.type === 'AUTH_SUCCESS' || event.data.type === 'TOKEN_FOR_EXTENSION')) {
    console.log('🔐 Auth success message received:', event.data);
    
    // Send tokens to background script
    if (typeof chrome !== 'undefined' && chrome.runtime) {
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
    } else {
      console.error('❌ Chrome runtime not available for postMessage handler');
    }
  }
});
