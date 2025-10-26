# Polymarket AI Backtesting System

A comprehensive backtesting system that evaluates your AI's prediction accuracy against historical Polymarket data using Envio's GraphQL API.

## 🚀 Features

- **Historical Data Fetching**: Retrieves resolved markets from your Envio GraphQL endpoint
- **AI Prediction Testing**: Tests your AI's predictions against known outcomes (blind testing)
- **Performance Metrics**: Calculates accuracy, ROI, profit/loss, and other key metrics
- **Beautiful UI**: Modern React interface with detailed results visualization
- **Configurable Parameters**: Adjustable initial capital and bet sizing

## 📊 How It Works

1. **Data Collection**: Fetches historical market data from your Envio indexer
2. **Market Filtering**: Identifies resolved markets with known outcomes
3. **AI Testing**: Runs your AI prediction model on each market (without revealing outcomes)
4. **Performance Analysis**: Compares AI predictions against actual results
5. **Metrics Calculation**: Computes accuracy, ROI, and profit/loss statistics

## 🛠️ Setup

### Backend Setup

1. **Install Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Environment Variables**:
   Make sure your `.env` file contains:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Start the Backend**:
   ```bash
   python index.py
   ```

### Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Frontend**:
   ```bash
   npm run dev
   ```

## 🧪 Testing

Run the test script to verify everything is working:

```bash
cd backend
python test_backtest.py
```

This will test:
- GraphQL connection to Envio
- Market data extraction
- Backtest execution

## 📈 API Endpoints

### `POST /api/backtest/run`

Run a backtest with custom parameters.

**Request Body**:
```json
{
  "initialCapital": 1000,
  "betSizePercent": 10
}
```

**Response**:
```json
{
  "success": true,
  "summary": {
    "totalMarkets": 20,
    "totalBets": 18,
    "winningBets": 12,
    "accuracy": 66.67,
    "initialCapital": 1000,
    "finalCapital": 1200.0,
    "totalProfit": 200.0,
    "roi": 20.0,
    "betSizePercent": 10
  },
  "results": [...]
}
```

### `GET /api/backtest/markets`

Get available resolved markets for backtesting.

**Response**:
```json
{
  "success": true,
  "markets": [...],
  "count": 45
}
```

## 🎯 Usage

1. **Navigate to Backtesting**: Go to `/backtesting` in your frontend
2. **Configure Parameters**: Set initial capital and bet size percentage
3. **Run Backtest**: Click "Run Backtest" to start the analysis
4. **View Results**: Review accuracy, ROI, and detailed trade-by-trade results

## 📊 Metrics Explained

- **Accuracy**: Percentage of correct predictions
- **ROI**: Return on Investment (final capital - initial capital) / initial capital * 100
- **Total Profit**: Absolute profit/loss in dollars
- **Final Capital**: Ending capital after all trades
- **Winning Bets**: Number of correct predictions
- **Total Bets**: Total number of trades placed

## 🔧 Configuration

### Backend Configuration

The system uses your Envio GraphQL endpoint:
- **URL**: `https://indexer.dev.hyperindex.xyz/2d0d192/v1/graphql`
- **Deployment**: `https://envio.dev/app/jineshbansal/polymarket-ai-agent/3d39942`

### Frontend Configuration

The backtesting page is accessible at `/backtesting` and doesn't require wallet connection.

## 🚨 Important Notes

1. **Data Source**: The system fetches data from your deployed Envio indexer
2. **AI Model**: Uses your existing Groq-powered AI prediction system
3. **Market Simulation**: Assumes 2x return for correct predictions (simplified model)
4. **Test Scope**: Currently tests on the last 20 resolved markets for performance

## 🔮 Future Enhancements

- [ ] Real-time market price integration
- [ ] More sophisticated betting strategies
- [ ] Historical performance charts
- [ ] Export results to CSV
- [ ] Multiple AI model comparison
- [ ] Risk-adjusted metrics (Sharpe ratio, etc.)

## 🐛 Troubleshooting

### Common Issues

1. **GraphQL Connection Failed**:
   - Check if your Envio indexer is running
   - Verify the GraphQL endpoint URL
   - Ensure the indexer has indexed some markets

2. **No Resolved Markets**:
   - Your indexer might not have any resolved markets yet
   - Check if markets have been resolved in your smart contract

3. **AI Prediction Errors**:
   - Verify your GROQ_API_KEY is set correctly
   - Check if the AI model is responding properly

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export FLASK_DEBUG=1
```

## 📝 License

This backtesting system is part of your Polymarket AI agent project.
