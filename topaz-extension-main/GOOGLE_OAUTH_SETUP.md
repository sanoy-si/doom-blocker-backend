# Google OAuth Setup Instructions

## 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Chrome App" as application type
6. Copy the Client ID

## 2. Update Manifest

Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` in `manifest.json` with your actual Client ID:

```json
"oauth2": {
  "client_id": "123456789-abcdefghijklmnop.apps.googleusercontent.com",
  "scopes": ["openid", "email", "profile"]
}
```

## 3. Features Implemented

✅ **Real Google OAuth Login**
- Uses Chrome Identity API
- Gets actual user info from Google
- Stores OAuth token securely
- Validates token on each session

✅ **Complete Authentication Flow**
- Welcome screen for new users
- Google sign-in button
- Real user data (name, email, profile)
- Logout functionality
- Token validation

✅ **Premium Upgrade System**
- Small upgrade button after login
- Hides customization features without upgrade
- Unlocks profiles and editing after upgrade

✅ **User Experience**
- Persistent login state
- Automatic token validation
- Proper error handling
- User-friendly notifications

## 4. How It Works

1. **First Install**: Shows welcome screen with Google sign-in
2. **User Signs In**: Real Google OAuth popup opens
3. **After Login**: Extension shows with premium upgrade option
4. **Without Upgrade**: Only basic features visible
5. **With Upgrade**: All customization features unlocked
6. **Logout**: Returns to welcome screen, clears all data

The extension now uses real Google authentication instead of fake login!
