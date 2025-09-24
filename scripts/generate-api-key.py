#!/usr/bin/env python3
"""
API Key Generation Script
Generates secure API keys for the Doom Blocker backend
"""

import secrets
import string
import hashlib
import os

def generate_secure_api_key(length=32):
    """Generate a secure API key"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_user_api_key(user_id, secret_salt):
    """Generate a user-specific API key based on user ID"""
    combined = f"{user_id}:{secret_salt}:{secrets.token_hex(16)}"
    return hashlib.sha256(combined.encode()).hexdigest()

def main():
    print("🔐 Doom Blocker API Key Generator")
    print("=" * 40)
    
    # Generate main API key for backend authentication
    api_key = generate_secure_api_key(32)
    print(f"🔑 Backend API Key: {api_key}")
    print(f"   Length: {len(api_key)} characters")
    
    # Generate example user-specific keys
    print("\n👤 Example User API Keys:")
    secret_salt = secrets.token_hex(16)
    for i in range(3):
        user_id = f"user_{i+1}"
        user_key = generate_user_api_key(user_id, secret_salt)
        print(f"   {user_id}: {user_key[:16]}...{user_key[-8:]}")
    
    print(f"\n🧂 Secret Salt (store securely): {secret_salt}")
    
    print("\n📋 Environment Variable Setup:")
    print(f"API_AUTH_KEY={api_key}")
    
    print("\n⚠️  Security Notes:")
    print("- Store API keys securely (never commit to version control)")
    print("- Use environment variables or secure key management")
    print("- Rotate keys regularly in production")
    print("- Monitor API key usage for abuse")

if __name__ == "__main__":
    main()
