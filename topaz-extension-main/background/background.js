console.log('🚀 Background script starting...');

// Import all modules at the top level (required for service workers)
import BackgroundController from './core/BackgroundController.js';
import SupabaseSync from './utils/SupabaseSync.js';
import { MESSAGE_TYPES } from '../shared/constants.js';

// Create and initialize the background controller
const controller = new BackgroundController();
const supabaseSync = new SupabaseSync();

// Initialize the extension and Supabase sync
controller.initialize().then(() => {
  console.log('✅ Background controller initialized successfully');

  // Initialize Supabase sync system
  supabaseSync.initialize();
  console.log('✅ Supabase sync initialized');
  
  // Make controller available globally for debugging (use globalThis instead of window)
  globalThis.controller = controller;
  console.log('✅ Controller available globally for debugging');
}).catch(error => {
  console.error('❌ Background initialization failed:', error);
});

// Auto-login on extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('🚀 Extension startup - checking for auto login');
  
  try {
    if (globalThis.controller) {
      const result = await globalThis.controller.handleAutoLogin({}, {});
      if (result.success) {
        console.log('✅ Auto login initiated on startup');
      } else {
        console.log('⚠️ Auto login not initiated:', result.message);
      }
    } else {
      console.log('⚠️ Controller not available yet');
    }
  } catch (error) {
    console.error('❌ Auto login failed:', error);
  }
});

// Auto-login on extension install/update
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('📦 Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    console.log('🆕 First time install - initiating auto login');
    
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
      console.log('✅ Controller ready, initiating auto login');
      
      const result = await controller.handleAutoLogin({}, {});
      if (result.success) {
        console.log('✅ Auto login initiated for new install');
      } else {
        console.log('⚠️ Auto login not initiated:', result.message);
      }
    } catch (error) {
      console.error('❌ Auto login failed:', error);
    }
  } else if (details.reason === 'update') {
    console.log('🔄 Extension updated - not triggering auto login');
  }
});

// Add a manual trigger for testing
globalThis.testAutoLogin = async () => {
  console.log('🧪 Manual auto-login test triggered');
  try {
    if (globalThis.controller) {
      const result = await globalThis.controller.handleAutoLogin({}, {});
      console.log('Response:', result);
    } else {
      console.log('⚠️ Controller not available');
    }
  } catch (error) {
    console.error('❌ Manual test failed:', error);
  }
};

