#!/usr/bin/env python3
"""
Test script for the backtesting functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from index import fetch_historical_markets, get_resolved_markets, run_backtest

def test_graphql_connection():
    """Test GraphQL connection to Envio"""
    print("Testing GraphQL connection to Envio...")
    data = fetch_historical_markets()
    
    if data:
        print("✅ Successfully connected to Envio GraphQL endpoint")
        questions = data.get("ParimutuelPredictionMarket_QuestionAdded", [])
        resolutions = data.get("ParimutuelPredictionMarket_MarketResolved", [])
        print(f"   Found {len(questions)} questions and {len(resolutions)} resolutions")
        return True
    else:
        print("❌ Failed to connect to Envio GraphQL endpoint")
        return False

def test_resolved_markets():
    """Test getting resolved markets"""
    print("\nTesting resolved markets extraction...")
    markets = get_resolved_markets()
    
    if markets:
        print(f"✅ Found {len(markets)} resolved markets")
        for i, market in enumerate(markets[:3]):  # Show first 3
            print(f"   {i+1}. {market['question'][:60]}...")
            print(f"      Winner: {market['winningOutcomeName']}")
        return True
    else:
        print("❌ No resolved markets found")
        return False

def test_backtest():
    """Test running a small backtest"""
    print("\nTesting backtest execution...")
    try:
        result = run_backtest(initial_capital=100, bet_size_percent=5)
        
        if result["success"]:
            summary = result["summary"]
            print("✅ Backtest completed successfully")
            print(f"   Accuracy: {summary['accuracy']}%")
            print(f"   ROI: {summary['roi']}%")
            print(f"   Total Bets: {summary['totalBets']}")
            print(f"   Final Capital: ${summary['finalCapital']}")
            return True
        else:
            print(f"❌ Backtest failed: {result.get('error', 'Unknown error')}")
            return False
    except Exception as e:
        print(f"❌ Backtest failed with exception: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Polymarket AI Backtesting System")
    print("=" * 50)
    
    tests = [
        test_graphql_connection,
        test_resolved_markets,
        test_backtest
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backtesting system is ready.")
    else:
        print("⚠️  Some tests failed. Check the output above for details.")

if __name__ == "__main__":
    main()
