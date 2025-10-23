#!/usr/bin/env python3
"""
Test script to verify signal generation is working
"""

import requests
import json

def test_signal_generation():
    """Test the signal generation endpoint"""
    
    # Test data
    test_data = {
        "question": "Will Bitcoin reach $100,000 by end of 2024?",
        "dataSources": ["CoinMarketCap", "CoinGecko"],
        "riskLevel": "medium",
        "marketPrice": 0.65
    }
    
    try:
        print("Testing signal generation...")
        print(f"Request data: {json.dumps(test_data, indent=2)}")
        
        # Make request to backend
        response = requests.post(
            "http://localhost:5000/api/generate-signal",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Success!")
            print(f"Response: {json.dumps(result, indent=2)}")
            
            if result.get("success"):
                signal = result.get("signal", {})
                print(f"\n📊 Signal Details:")
                print(f"Direction: {signal.get('direction')}")
                print(f"Confidence: {signal.get('confidence')}")
                print(f"Reason: {signal.get('reason')}")
            else:
                print(f"❌ API returned success=False: {result.get('error')}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the backend server is running on port 5000")
        print("Run: python index.py")
    except requests.exceptions.Timeout:
        print("❌ Timeout: The request took too long")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_signal_generation()
