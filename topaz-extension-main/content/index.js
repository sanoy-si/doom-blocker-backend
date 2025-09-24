function loadCSS() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = chrome.runtime.getURL("content/content.css");
  document.head.appendChild(link);
}

function initialize() {
  console.time("🧠 TOPAZ INITIAL: Total Load Time");
  console.log("🔍 [TOPAZ DEBUG] Content script initialize() called");
  console.log("🔍 [TOPAZ DEBUG] Current URL:", window.location.href);
  console.log("🔍 [TOPAZ DEBUG] Current hostname:", window.location.hostname);

  // Check if this is the auth page opened by extension
  const urlParams = new URLSearchParams(window.location.search);
  const isExtension = urlParams.get('extension') === 'true';
  if (isExtension) {
    console.log('🔐 Extension auth page detected, setting up token monitoring');
    setupTokenMonitoring();
  }

  const allowedWebsites = [
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    "x.com",
    "twitter.com",
    "linkedin.com",
    "reddit.com",
    "localhost"
  ];

  function isAllowedWebsite() {
    const currentHostname = window.location.hostname.toLowerCase();
    const isAllowed = allowedWebsites.some(allowedSite => 
      currentHostname === allowedSite || currentHostname.endsWith('.' + allowedSite)
    );
    console.log("🔍 [TOPAZ DEBUG] isAllowedWebsite check:", { currentHostname, isAllowed });
    return isAllowed;
  }
  
  if (!isAllowedWebsite()) {
    console.log("🔍 [TOPAZ DEBUG] Website not allowed, exiting");
    console.timeEnd("🧠 TOPAZ INITIAL: Total Load Time");
    return;
  }

  console.log("🔍 [TOPAZ DEBUG] Website is allowed, proceeding with initialization");
  loadCSS();

  const controller = new ExtensionController();

  window.__topazController = controller;

  async function handleInitialExtraction() {
    console.log("🔍 [TOPAZ DEBUG] handleInitialExtraction() called");
    await controller.enable();
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      handleInitialExtraction();
    });
  } else {
    handleInitialExtraction();
  }
}

// Token monitoring function for extension auth
function setupTokenMonitoring() {
  console.log('🔐 Setting up token monitoring...');
  
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
        
        return true;
      }
    } catch (error) {
      console.error('❌ Error extracting tokens:', error);
    }
    return false;
  }

  // Check immediately
  if (extractTokensFromStorage()) {
    console.log('🔐 Tokens found immediately, monitoring complete');
    return;
  }
  
  // Listen for custom auth event
  window.addEventListener('auth-tokens-ready', () => {
    console.log('🔐 Auth tokens ready event received');
    extractTokensFromStorage();
  });
  
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

// Initialize the extension
initialize();
