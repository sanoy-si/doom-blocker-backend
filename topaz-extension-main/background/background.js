console.log("🚀 Background script starting...");

// Import all modules at the top level (required for service workers)
import BackgroundController from "./core/BackgroundController.js";
import SupabaseSync from "./utils/SupabaseSync.js";
import { MESSAGE_TYPES } from "../shared/constants.js";

// Create and initialize the background controller
const controller = new BackgroundController();
const supabaseSync = new SupabaseSync();

// Onboarding state management
let armPopupTour = false;

// Initialize the extension and Supabase sync
controller
  .initialize()
  .then(() => {
    console.log("✅ Background controller initialized successfully");

    // Initialize Supabase sync system
    supabaseSync.initialize();
    console.log("✅ Supabase sync initialized");

    // Make controller available globally for debugging (use globalThis instead of window)
    globalThis.controller = controller;
    console.log("✅ Controller available globally for debugging");
  })
  .catch((error) => {
    console.error("❌ Background initialization failed:", error);
  });

// Auto-login on extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log("🚀 Extension startup - checking for auto login");

  try {
    if (globalThis.controller) {
      const result = await globalThis.controller.handleAutoLogin({}, {});
      if (result.success) {
        console.log("✅ Auto login initiated on startup");
      } else {
        console.log("⚠️ Auto login not initiated:", result.message);
      }
    } else {
      console.log("⚠️ Controller not available yet");
    }
  } catch (error) {
    console.error("❌ Auto login failed:", error);
  }
});

// Auto-login on extension install/update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("📦 Extension installed/updated:", details.reason);

  if (details.reason === "install") {
    console.log("🆕 First time install - initiating auto login");

    // Wait for controller to be ready
    const waitForController = () => {
      return new Promise((resolve) => {
        const checkController = () => {
          if (globalThis.controller) {
            resolve(globalThis.controller);
          } else {
            setTimeout(checkController, 100);
          }
        };
        checkController();
      });
    };

    try {
      const controller = await waitForController();
      console.log("✅ Controller ready, initiating auto login");

      const result = await controller.handleAutoLogin({}, {});
      if (result.success) {
        console.log("✅ Auto login initiated for new install");
      } else {
        console.log("⚠️ Auto login not initiated:", result.message);
      }
    } catch (error) {
      console.error("❌ Auto login failed:", error);
    }
  } else if (details.reason === "update") {
    console.log("🔄 Extension updated - not triggering auto login");
  }
});

// Add a manual trigger for testing
globalThis.testAutoLogin = async () => {
  console.log("🧪 Manual auto-login test triggered");
  try {
    if (globalThis.controller) {
      const result = await globalThis.controller.handleAutoLogin({}, {});
      console.log("Response:", result);
    } else {
      console.log("⚠️ Controller not available");
    }
  } catch (error) {
    console.error("❌ Manual test failed:", error);
  }
};

// Onboarding message handlers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      // Handle onboarding popup tour arming
      if (message && message.type === "ARM_POPUP_TOUR") {
        armPopupTour = true;
        console.log("🎯 Popup tour armed");
        sendResponse({ ok: true });
        return;
      }

      // Handle opening the extension popup
      if (message && message.type === "OPEN_POPUP") {
        // Must be triggered from a user gesture (button click in content script)
        try {
          await chrome.action.openPopup();
          console.log("🎯 Extension popup opened");
          sendResponse({ ok: true });
        } catch (e) {
          console.warn("⚠️ Failed to open popup:", e);
          sendResponse({ ok: false, error: String(e) });
        }
        return;
      }

      // Handle checking if popup tour should run
      if (message && message.type === "SHOULD_RUN_POPUP_TOUR") {
        const run = armPopupTour;
        armPopupTour = false; // one-time use
        console.log("🎯 Popup tour check:", run);
        sendResponse({ run });
        return;
      }
    } catch (e) {
      console.error("❌ Onboarding message handler error:", e);
      sendResponse({ ok: false, error: String(e) });
    }
  })();
  return true; // keep message channel open for async
});
