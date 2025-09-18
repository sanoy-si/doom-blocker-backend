import BackgroundController from './core/BackgroundController.js';

// Import Supabase sync module
if (typeof importScripts === 'function') {
  importScripts('./utils/SupabaseSync.js');
}

// Create and initialize the background controller
const controller = new BackgroundController();

// Initialize the extension and Supabase sync
controller.initialize().then(() => {
  // Initialize Supabase sync system
  if (typeof window !== 'undefined' && window.TopazSupabaseSync) {
    window.TopazSupabaseSync.initialize();
  }
}).catch(error => {
  console.error('Background initialization failed:', error);
});

