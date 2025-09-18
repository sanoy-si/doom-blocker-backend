import BackgroundController from './core/BackgroundController.js';
import SupabaseSync from './utils/SupabaseSync.js';

// Create and initialize the background controller
const controller = new BackgroundController();

// Create Supabase sync instance
const supabaseSync = new SupabaseSync();

// Initialize the extension and Supabase sync
controller.initialize().then(() => {
  console.log('Background controller initialized successfully');

  // Initialize Supabase sync system
  supabaseSync.initialize();
  console.log('Supabase sync initialized');
}).catch(error => {
  console.error('Background initialization failed:', error);
});

