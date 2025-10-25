#!/usr/bin/env python3
"""
Example: How to use the backtest-enhanced signal generation
"""

import requests
import json

# Server URL
BASE_URL = "http://localhost:5000"

def example_1_basic_signal():
    """Example 1: Generate a basic signal (without backtest)"""
    print("\n" + "="*60)
    print("Example 1: Basic Signal (Fast, No Backtest)")
    print("="*60)
    
    response = requests.post(
        f"{BASE_URL}/api/generate-signal",
        json={
            "question": "Will Bitcoin reach $100,000 by end of 2024?",
            "riskLevel": "medium",
            "marketPrice": 0.65,
            "includeBacktest": False  # Fast response
        },
        timeout=30
    )
    
    result = response.json()
    print(f"✅ Direction: {result['signal']['direction']}")
    print(f"✅ Confidence: {result['signal']['confidence']}")
    print(f"✅ Reason: {result['signal']['reason']}")
    print(f"✅ Backtest Used: {result['backtest_used']}")
    print(f"⏱️  Response Time: ~2-5 seconds")

def example_2_enhanced_signal():
    """Example 2: Generate signal with backtest context"""
    print("\n" + "="*60)
    print("Example 2: Enhanced Signal (With Backtest Context)")
    print("="*60)
    
    print("⏳ Generating signal with backtest context...")
    print("   (This will take ~30-60 seconds)")
    
    response = requests.post(
        f"{BASE_URL}/api/generate-signal",
        json={
            "question": "Will Ethereum price exceed $5,000 in 2024?",
            "riskLevel": "medium",
            "marketPrice": 0.60,
            "includeBacktest": True  # Include historical performance
        },
        timeout=120
    )
    
    result = response.json()
    print(f"\n✅ Direction: {result['signal']['direction']}")
    print(f"✅ Confidence: {result['signal']['confidence']}")
    print(f"✅ Reason: {result['signal']['reason']}")
    print(f"✅ Backtest Used: {result['backtest_used']}")
    
    if result.get('backtest_summary'):
        bs = result['backtest_summary']
        print(f"\n📊 Historical Performance:")
        print(f"   • Accuracy: {bs['accuracy']}%")
        print(f"   • ROI: {bs['roi']}%")
        print(f"   • Total Bets: {bs['total_bets']}")
    
    print(f"⏱️  Response Time: ~30-60 seconds")

def example_3_comparison():
    """Example 3: Compare same question with and without backtest"""
    print("\n" + "="*60)
    print("Example 3: Side-by-Side Comparison")
    print("="*60)
    
    question = "Will crypto market cap exceed $3 trillion?"
    
    # Without backtest
    print("\n🔹 WITHOUT backtest context:")
    r1 = requests.post(
        f"{BASE_URL}/api/generate-signal",
        json={
            "question": question,
            "riskLevel": "medium",
            "marketPrice": 0.55,
            "includeBacktest": False
        },
        timeout=30
    )
    res1 = r1.json()
    print(f"   Confidence: {res1['signal']['confidence']}")
    print(f"   Direction: {res1['signal']['direction']}")
    
    # With backtest
    print("\n🔹 WITH backtest context:")
    r2 = requests.post(
        f"{BASE_URL}/api/generate-signal",
        json={
            "question": question,
            "riskLevel": "medium",
            "marketPrice": 0.55,
            "includeBacktest": True
        },
        timeout=120
    )
    res2 = r2.json()
    print(f"   Confidence: {res2['signal']['confidence']}")
    print(f"   Direction: {res2['signal']['direction']}")
    if res2.get('backtest_summary'):
        print(f"   Historical Accuracy: {res2['backtest_summary']['accuracy']}%")
    
    # Show difference
    conf_diff = res2['signal']['confidence'] - res1['signal']['confidence']
    print(f"\n📈 Confidence Change: {conf_diff:+.2f}")
    print(f"   The backtest context {'increased' if conf_diff > 0 else 'decreased'} confidence")

if __name__ == "__main__":
    print("\n🚀 Polymarket AI Agent - Backtest Integration Examples")
    print("="*60)
    print("Make sure the server is running: python start_server.py")
    print("="*60)
    
    try:
        # Check server
        requests.get(f"{BASE_URL}/api/health", timeout=5)
        
        # Run examples
        example_1_basic_signal()
        example_2_enhanced_signal()
        example_3_comparison()
        
        print("\n" + "="*60)
        print("✅ All examples completed successfully!")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Please start it first:")
        print("   cd backend && python start_server.py")
    except Exception as e:
        print(f"❌ Error: {e}")
