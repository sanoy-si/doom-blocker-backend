// Supabase Authentication Helper
class SupabaseAuth {
  constructor() {
    this.url = 'https://YOUR_SUPABASE_PROJECT.supabase.co';
    this.anonKey = 'YOUR_SUPABASE_ANON_KEY';
  }

  // Save user to Supabase
  async saveUser(googleUserInfo) {
    try {
      const userData = {
        google_id: googleUserInfo.id,
        email: googleUserInfo.email,
        name: googleUserInfo.name,
        picture: googleUserInfo.picture,
        is_premium: false,
        created_at: new Date().toISOString()
      };

      const response = await fetch(`${this.url}/rest/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        // User might exist, try to update
        return await this.updateUser(googleUserInfo);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update existing user
  async updateUser(googleUserInfo) {
    try {
      const response = await fetch(`${this.url}/rest/v1/users?google_id=eq.${googleUserInfo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`
        },
        body: JSON.stringify({
          email: googleUserInfo.email,
          name: googleUserInfo.name,
          picture: googleUserInfo.picture,
          updated_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        return { success: false, error: 'Failed to update user' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get user from Supabase
  async getUser(googleId) {
    try {
      const response = await fetch(`${this.url}/rest/v1/users?google_id=eq.${googleId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.length > 0) {
        return { success: true, data: data[0] };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create global instance
window.supabaseAuth = new SupabaseAuth();
