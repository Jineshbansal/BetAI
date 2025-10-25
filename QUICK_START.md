# 🎯 Quick Start Guide - Using Backtesting Feature

## Where to Find It

### In the Frontend (PredictOutput.jsx)

Navigate to: **Predict Output & Generate Signals** page

Scroll to: **Section 3: Analysis Focus**

Look for: **📊 Use Backtesting Context (Recommended)** checkbox

---

## Step-by-Step Usage

### 1️⃣ Configure Your Settings
```
Section 1: Risk Settings
- Choose: Low, Medium, High, or Very High

Section 2: Data Sources
- Select at least 2 sources (e.g., CoinMarketCap, CoinGecko)

Section 3: Analysis Focus
- Choose a pre-defined question OR enter your own
```

### 2️⃣ Enable Backtesting (Optional but Recommended)
```
☐ 📊 Use Backtesting Context (Recommended)
    Include historical performance data to improve 
    prediction accuracy. The AI will consider how it 
    performed on similar questions in the past.
    ⚠️ This will take 30-60 seconds longer.
```

**Check this box to enable!** ✅

### 3️⃣ Generate Signal
```
Click: "Generate Trading Signal" button

Wait:
- WITHOUT backtest: 2-5 seconds
- WITH backtest: 30-60 seconds
```

### 4️⃣ View Results
```
Signal appears showing:
- Direction: BUY / SELL / HOLD
- Confidence: 0.0 - 1.0 (e.g., 0.82 = 82%)
- Reason: Brief explanation

If backtest was used, you'll also see:
┌─────────────────────────────────────┐
│ Last Backtest Performance:          │
│ • Accuracy: 72.5%                   │
│ • ROI: 45.2%                        │
│ • Total Bets: 18                    │
└─────────────────────────────────────┘
```

---

## Visual Location in UI

```
┌─────────────────────────────────────────────────────┐
│ Predict Output & Generate Signals                    │
├─────────────────────────────────────────────────────┤
│                                                       │
│ [Summary Cards: Risk Level | Sources | Bet Config]   │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 1. Risk Settings                                 │ │
│ │ [Low] [Medium] [High] [Very High]               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 2. Data Sources                                  │ │
│ │ [CoinMarketCap] [CoinGecko] [Binance] ...      │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 3. Analysis Focus                                │ │
│ │                                                   │ │
│ │ Choose a question:                               │ │
│ │ ○ Which cryptocurrency has highest growth?      │ │
│ │ ○ What are best DeFi tokens?                    │ │
│ │ ...                                              │ │
│ │                                                   │ │
│ │ Or enter custom:                                 │ │
│ │ [___________________________________]            │ │
│ │                                                   │ │
│ │ ┌───────────────────────────────────────────┐   │ │
│ │ │ ☑ 📊 Use Backtesting Context           │   │ │  ← HERE!
│ │ │                                            │   │ │
│ │ │ Include historical performance data...    │   │ │
│ │ │ ⚠️ This will take 30-60 seconds longer.  │   │ │
│ │ │                                            │   │ │
│ │ │ [Last Backtest Performance shown here]    │   │ │
│ │ └───────────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 4. News Context Preview                          │ │
│ │ [Fetch Context] [Generate Signal]               │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ [Generate Trading Signal] ← Click here               │
└─────────────────────────────────────────────────────┘
```

---

## When to Use Backtest vs. Fast Mode

### Use FAST Mode (Backtest OFF) when:
- ✓ Quick market check
- ✓ Testing different questions
- ✓ Time-sensitive decisions
- ✓ Exploring options
- **Response time: 2-5 seconds**

### Use ENHANCED Mode (Backtest ON) when:
- ✓ Important investment decisions
- ✓ Large bet amounts
- ✓ Want maximum accuracy
- ✓ Need confidence in prediction
- ✓ Similar questions were asked before
- **Response time: 30-60 seconds**

---

## Example Scenarios

### Scenario 1: Quick Check ⚡
```
Question: "Will Bitcoin crash tomorrow?"
Backtest: OFF ☐
Result: Fast answer, good enough for curiosity
Time: 3 seconds
```

### Scenario 2: Serious Investment 💰
```
Question: "Will Bitcoin reach $100,000 by year end?"
Backtest: ON ☑
Result: Enhanced answer with historical context
Time: 45 seconds
Shows: "I'm 90% accurate on Bitcoin questions"
```

### Scenario 3: New Topic 🆕
```
Question: "Will new crypto XYZ succeed?"
Backtest: ON ☑
Result: AI says "No historical data on this topic, 
        but based on similar new cryptos..."
Time: 45 seconds
```

---

## API Usage (For Developers)

### JavaScript/Frontend:
```javascript
// Fast mode
const response = await fetch('http://localhost:5000/api/generate-signal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "Will Bitcoin reach $100,000?",
    riskLevel: "medium",
    marketPrice: 0.65,
    includeBacktest: false  // Fast
  })
});

// Enhanced mode
const response = await fetch('http://localhost:5000/api/generate-signal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "Will Bitcoin reach $100,000?",
    riskLevel: "medium",
    marketPrice: 0.65,
    includeBacktest: true   // Enhanced
  })
});
```

### Python:
```python
import requests

# Fast mode
response = requests.post(
    'http://localhost:5000/api/generate-signal',
    json={
        'question': 'Will Bitcoin reach $100,000?',
        'riskLevel': 'medium',
        'marketPrice': 0.65,
        'includeBacktest': False  # Fast
    }
)

# Enhanced mode
response = requests.post(
    'http://localhost:5000/api/generate-signal',
    json={
        'question': 'Will Bitcoin reach $100,000?',
        'riskLevel': 'medium',
        'marketPrice': 0.65,
        'includeBacktest': True   # Enhanced
    }
)

result = response.json()
print(f"Direction: {result['signal']['direction']}")
print(f"Confidence: {result['signal']['confidence']}")
if result.get('backtest_summary'):
    print(f"Historical Accuracy: {result['backtest_summary']['accuracy']}%")
```

---

## Troubleshooting

### ❌ "This will take 30-60 seconds longer" - It's taking too long!
**Solution:** This is normal! Backtest runs 20 historical predictions. Be patient.

### ❌ Backtest checkbox not showing
**Solution:** Make sure you're on the latest version. Refresh the page.

### ❌ News API not working
**Solution:** Check `.env` file has `NEWS_API_KEY=0c17b412e22846c6b1ce4cd63d5d9fb4`

### ❌ Backend not responding
**Solution:** 
```bash
cd backend
python3 start_server.py
```

---

## 🎉 That's It!

You now have a self-aware AI trading agent that learns from its past performance!

**Pro Tip:** Use backtest mode for important decisions, fast mode for exploration.

Happy trading! 🚀
