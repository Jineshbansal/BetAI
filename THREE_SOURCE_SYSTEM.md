# 🎯 Three-Source AI Prediction System

## Overview

The AI agent now uses **THREE data sources** simultaneously for maximum prediction accuracy:

```
┌─────────────────────────────────────────────────────────┐
│                   AI PREDICTION ENGINE                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1️⃣  REAL-TIME NEWS (NewsAPI)                          │
│      • Latest Bitcoin/crypto news                       │
│      • Market sentiment                                 │
│      • Breaking developments                            │
│                                                          │
│  2️⃣  MARKET INDICATORS (Reference Data)                │
│      • Price movements                                  │
│      • Fear & Greed Index                               │
│      • Whale activity                                   │
│      • Regulatory news                                  │
│                                                          │
│  3️⃣  HISTORICAL PERFORMANCE (Backtest - Optional)      │
│      • AI's past accuracy                               │
│      • Topic-specific performance                       │
│      • Confidence calibration                           │
│                                                          │
│                          ↓                               │
│                    LLM ANALYSIS                         │
│                          ↓                               │
│                  PREDICTION SIGNAL                      │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Source Details

### 1️⃣ Real-Time News (NewsAPI)

**What it provides:**
- Latest news articles about the question topic
- Up-to-date market sentiment
- Recent price movements and trends
- Breaking news that could affect predictions

**Example:**
```
📰 Latest News:
  - DeFi perpetual futures cross $1T monthly volume
  - Bitcoin price compression may spark expansion to $120K
  - Year-end crypto rally stronger than 2020
```

**Source:** NewsAPI.org
**Update Frequency:** Real-time
**Always Included:** Yes

---

### 2️⃣ Market Indicators (Reference Data)

**What it provides:**
- Key market metrics
- Fear & Greed Index
- Whale activity
- Regulatory developments
- General market trends

**Example:**
```
📊 Market Indicators:
  - Bitcoin hits $69,200 amid ETF optimism
  - Some traders expect pullback after rally
  - Whales are accumulating Bitcoin heavily
  - Regulators delay altcoin ETF decision
  - Market fear and greed index shows 82 (extreme greed)
```

**Source:** Hardcoded reference data (can be updated)
**Update Frequency:** Manual updates
**Always Included:** Yes

---

### 3️⃣ Historical Performance (Backtest Data)

**What it provides:**
- AI's historical accuracy
- Performance on similar questions
- Confidence level accuracy
- Topic-specific strengths/weaknesses
- Recent form

**Example:**
```
📊 Your Historical Performance:
- Overall Accuracy: 72% (13/18 correct)
- ROI: 45.2%
- Recent Form: 80% accuracy in last 5 trades
- High Confidence (>70%) Accuracy: 85%
- Topic-Specific Performance:
  • Bitcoin: 90% accuracy (5 trades)
  • Crypto: 75% accuracy (8 trades)
```

**Source:** Live backtesting on resolved markets
**Update Frequency:** Each time backtest is run
**Always Included:** Only when user enables it

---

## 🔄 How It Works

### Data Flow

```
User Question: "Will Bitcoin reach $100,000?"
        ↓
┌──────────────────────────────────────┐
│   STEP 1: Fetch News API             │
│   Query: "Bitcoin reach $100,000"    │
│   Returns: 6 latest news articles    │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│   STEP 2: Add Market Indicators      │
│   Always include reference data      │
│   (fear/greed, trends, etc.)         │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│   STEP 3: Add Backtest (if enabled)  │
│   Run historical performance test    │
│   Format insights for LLM            │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│   STEP 4: Combine All Sources        │
│   Create comprehensive context       │
│   News + Indicators + Performance    │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│   STEP 5: Send to LLM                │
│   Groq (llama-3.3-70b-versatile)    │
│   Analyzes all data sources          │
└──────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│   STEP 6: Return Prediction          │
│   Direction: BUY/SELL/HOLD           │
│   Confidence: 0.0-1.0                │
│   Reason: Explanation                │
└──────────────────────────────────────┘
```

---

## 💡 Example Prompt Sent to LLM

### Without Backtest:
```
You are a market prediction AI agent.

Question: Will Bitcoin reach $100,000 by end of 2024?

Current Market Context:
📰 Latest News:
  - DeFi perpetual futures cross $1T monthly volume
  - Bitcoin price compression may spark expansion to $120K
  - Year-end crypto rally stronger than 2020

📊 Market Indicators:
  - Bitcoin hits $69,200 amid ETF optimism
  - Some traders expect pullback after rally
  - Whales are accumulating Bitcoin heavily
  - Market fear and greed index shows 82 (extreme greed)

Respond with JSON: {"yes_probability": 0.75, "reason": "..."}
```

### With Backtest:
```
You are a market prediction AI agent.

Question: Will Bitcoin reach $100,000 by end of 2024?

Current Market Context:
📰 Latest News:
  - DeFi perpetual futures cross $1T monthly volume
  - Bitcoin price compression may spark expansion to $120K
  - Year-end crypto rally stronger than 2020

📊 Market Indicators:
  - Bitcoin hits $69,200 amid ETF optimism
  - Some traders expect pullback after rally
  - Whales are accumulating Bitcoin heavily
  - Market fear and greed index shows 82 (extreme greed)

📊 Your Historical Performance:
- Overall Accuracy: 72% (13/18 correct)
- ROI: 45.2%
- Recent Form: 80% accuracy in last 5 trades
- High Confidence (>70%) Accuracy: 85%
- Bitcoin: 90% accuracy (5 trades)

Note: Use your historical performance to calibrate confidence.

Respond with JSON: {"yes_probability": 0.75, "reason": "..."}
```

---

## 🎯 Benefits of Three-Source System

### ✅ **More Comprehensive Analysis**
- Real-time + historical + performance data
- Multiple perspectives on the same question
- Reduces blind spots

### ✅ **Better Accuracy**
- News provides current context
- Indicators provide market fundamentals
- Backtest provides AI self-awareness

### ✅ **Calibrated Confidence**
- AI knows when it's good vs. struggling
- Adjusts confidence based on past performance
- More reliable predictions

### ✅ **Redundancy & Reliability**
- If NewsAPI fails, still have indicators
- Multiple data points reduce error
- Fallback options available

---

## 🚀 Usage

### In Frontend (PredictOutput.jsx)

**Step 1:** Select or enter your question
**Step 2:** Choose whether to include backtest
**Step 3:** Click "Generate Signal"

**Result:** 
- Signal uses News + Indicators (always)
- Plus Backtest (if you enabled it)

### Via API

```bash
# With all sources (News + Indicators + Backtest)
curl -X POST http://localhost:5000/api/generate-signal \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Will Bitcoin reach $100,000?",
    "riskLevel": "medium",
    "marketPrice": 0.65,
    "includeBacktest": true
  }'

# Without backtest (News + Indicators only)
curl -X POST http://localhost:5000/api/generate-signal \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Will Bitcoin reach $100,000?",
    "riskLevel": "medium",
    "marketPrice": 0.65,
    "includeBacktest": false
  }'
```

---

## 📈 Performance Comparison

| Configuration | Data Sources | Response Time | Accuracy |
|--------------|-------------|---------------|----------|
| Basic | Indicators only | 2-3 sec | Good |
| Enhanced | News + Indicators | 3-5 sec | Better |
| Premium | News + Indicators + Backtest | 30-60 sec | Best |

---

## 🔧 Configuration

### Updating Reference Data

Edit `backend/index.py`:
```python
reference_data = [
    "Your custom market indicator 1",
    "Your custom market indicator 2",
    # Add more as needed
]
```

### NewsAPI Key

Set in `.env`:
```
NEWS_API_KEY=your_api_key_here
```

### Backtest Settings

In `index.py`:
```python
# Number of historical markets to test
markets = markets[:20]

# Initial capital for backtest
initial_capital = 1000

# Bet size percentage
bet_size_percent = 10
```

---

## ✅ Testing

Run comprehensive test:
```bash
cd backend
source venv/bin/activate
python3 test_all_sources.py
```

This will verify all three data sources are working! 🎉

---

## 🎉 Summary

Your AI agent now uses:
- ✅ Real-time news (NewsAPI)
- ✅ Market indicators (Reference data)
- ✅ Historical performance (Backtest)

All three combine to create the most accurate predictions possible! 🚀
