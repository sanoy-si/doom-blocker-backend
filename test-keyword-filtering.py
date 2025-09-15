#!/usr/bin/env python3
"""
Test script to debug keyword filtering issues
"""

import json
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Test data
test_data = {
    "gridStructure": {
        "timestamp": "2025-01-15T16:00:00.000Z",
        "totalGrids": 1,
        "grids": [
            {
                "id": "g1",
                "totalChildren": 3,
                "gridText": "YouTube Homepage Videos",
                "children": [
                    {
                        "id": "g1c0",
                        "text": "PUTIN'S NUKE BOMBER TO COUNTER US IN CARIBBEAN?"
                    },
                    {
                        "id": "g1c1", 
                        "text": "Russia to Send Tu-160 Nuclear Bombers to Venezuela? Trump 'Doesn't Rule Out' Maduro Being Ousted"
                    },
                    {
                        "id": "g1c2",
                        "text": "Master Carousels in Framer (Slideshow, Ticker, Carousel)"
                    }
                ]
            }
        ]
    },
    "currentUrl": "https://www.youtube.com/",
    "whitelist": [],
    "blacklist": ["russia and related thing"],
    "visitorId": "test_visitor_123"
}

def test_keyword_filtering():
    """Test the keyword filtering with a simple example"""
    
    # Get API endpoint
    api_url = os.getenv('API_ENDPOINT', 'http://localhost:8000')
    if not api_url.startswith('http'):
        api_url = f'https://{api_url}'
    
    endpoint = f"{api_url}/fetch_distracting_chunks"
    
    print("🧪 Testing keyword filtering...")
    print(f"📡 API Endpoint: {endpoint}")
    print(f"🔍 Test URL: {test_data['currentUrl']}")
    print(f"🚫 Blacklist: {test_data['blacklist']}")
    print(f"✅ Whitelist: {test_data['whitelist']}")
    print()
    
    try:
        response = requests.post(endpoint, json=test_data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API Response received!")
            print(f"📊 Response: {json.dumps(result, indent=2)}")
            
            # Check if any items were marked for removal
            if isinstance(result, list) and len(result) > 0:
                print(f"🎯 Found {len(result)} items to remove:")
                for item in result:
                    print(f"   - {item}")
            else:
                print("❌ No items marked for removal - this might be the issue!")
                
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_keyword_filtering()
