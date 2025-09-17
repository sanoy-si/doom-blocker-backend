# 🚀 Google Auth + Supabase Setup

## ✅ Files Created (Separate & Clean):

1. **`google-auth.js`** - Google OAuth handling
2. **`supabase-auth.js`** - Supabase user management  
3. **`signin-flow.js`** - Simple sign-in flow
4. **`manifest.json`** - Updated with OAuth permissions

## 🔧 Quick Setup:

### 1. Google Cloud Console:
- Create OAuth 2.0 Client ID
- Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` in:
  - `manifest.json` (line 48)
  - `google-auth.js` (line 4)

### 2. Supabase:
- Create project
- Create `users` table:
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  picture TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- Replace in `supabase-auth.js`:
  - `YOUR_SUPABASE_PROJECT` (line 4)
  - `YOUR_SUPABASE_ANON_KEY` (line 5)

## 🎯 How It Works:

1. **User clicks "Sign in with Google"**
2. **Google OAuth popup opens**
3. **User signs in with Google**
4. **Extension gets Google user data**
5. **Extension saves user to Supabase**
6. **Extension stores data locally**
7. **User sees main page**

## ✨ Features:

- ✅ **Separate files** (clean architecture)
- ✅ **Google OAuth** authentication
- ✅ **Supabase** user storage
- ✅ **Simple sign-in flow**
- ✅ **No existing code changed**

**Ready to test!** Just update the credentials and reload the extension.
