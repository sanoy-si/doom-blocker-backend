function loadCSS() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = chrome.runtime.getURL("content/content.css");
  document.head.appendChild(link);
}

function initialize() {
  console.log("🔍 [TOPAZ DEBUG] Content script initialize() called");
  console.log("🔍 [TOPAZ DEBUG] Current URL:", window.location.href);
  console.log("🔍 [TOPAZ DEBUG] Current hostname:", window.location.hostname);

  const allowedWebsites = [
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    "x.com",
    "twitter.com",
    "linkedin.com",
    "reddit.com"
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

// Initialize the extension
initialize();
