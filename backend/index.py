import os
import json
import time
import requests
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
from new import get_news_lines
from dotenv import load_dotenv


load_dotenv()
app = Flask(__name__)
CORS(app)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Envio GraphQL endpoint
ENVIO_GRAPHQL_URL = "https://indexer.dev.hyperindex.xyz/2d0d192/v1/graphql"

def fetch_historical_markets():
    """Fetch historical market data from Envio GraphQL endpoint"""
    query = """
    query GetHistoricalMarkets {
      ParimutuelPredictionMarket_QuestionAdded(
        order_by: {endTime: desc}
        limit: 100
      ) {
        id
        questionId
        question
        outcomeNames
        endTime
      }
      ParimutuelPredictionMarket_MarketResolved(
        order_by: {id: desc}
        limit: 100
      ) {
        id
        questionId
        winningOutcome
      }
    }
    """
    
    try:
        response = requests.post(
            ENVIO_GRAPHQL_URL,
            json={"query": query},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        if "errors" in data:
            print(f"GraphQL errors: {data['errors']}")
            return None
            
        return data.get("data", {})
        
    except Exception as e:
        print(f"Error fetching historical markets: {e}")
        return None

def get_resolved_markets():
    """Get markets that have been resolved with their outcomes"""
    data = fetch_historical_markets()
    if not data:
        return []
    
    questions = {q["questionId"]: q for q in data.get("ParimutuelPredictionMarket_QuestionAdded", [])}
    resolutions = {r["questionId"]: r for r in data.get("ParimutuelPredictionMarket_MarketResolved", [])}
    
    resolved_markets = []
    for question_id, question in questions.items():
        if question_id in resolutions:
            resolution = resolutions[question_id]
            winning_outcome = int(resolution["winningOutcome"])
            
            resolved_markets.append({
                "questionId": question_id,
                "question": question["question"],
                "outcomeNames": question["outcomeNames"],
                "winningOutcome": winning_outcome,
                "winningOutcomeName": question["outcomeNames"][winning_outcome] if winning_outcome < len(question["outcomeNames"]) else "Unknown",
                "endTime": int(question["endTime"]),
                "isResolved": True
            })
    
    return resolved_markets

def run_backtest(markets=None, initial_capital=1000, bet_size_percent=10):
    """Run backtesting on historical markets"""
    if markets is None:
        markets = get_resolved_markets()
    
    if not markets:
        return {
            "success": False,
            "error": "No resolved markets found for backtesting"
        }
    
    # Limit to recent markets for faster testing
    markets = markets[:20]  # Test on last 20 resolved markets
    
    results = []
    total_capital = initial_capital
    total_bets = 0
    winning_bets = 0
    total_profit = 0
    
    for market in markets:
        try:
            # Get AI prediction for this market (blind - without knowing outcome)
            ai_result = generate_signal(
                question=market["question"],
                data_sources=[],
                risk_level="medium",
                market_price=0.5  # Assume 50/50 for backtesting
            )
            
            if not ai_result["success"]:
                continue
                
            ai_confidence = ai_result["signal"]["confidence"]
            ai_direction = ai_result["signal"]["direction"]
            
            # Determine bet based on AI prediction
            bet_amount = total_capital * (bet_size_percent / 100)
            if bet_amount < 1:  # Minimum bet
                bet_amount = 1
                
            # Simulate betting on "Yes" outcome (index 0)
            # In real markets, you'd bet on the outcome you think will win
            bet_on_yes = ai_confidence > 0.5
            
            # Check if AI was correct
            actual_winner = market["winningOutcome"]
            ai_correct = (bet_on_yes and actual_winner == 0) or (not bet_on_yes and actual_winner != 0)
            
            # Calculate profit/loss
            if ai_correct:
                # Assume 2x return for correct prediction (simplified)
                profit = bet_amount * 1.0  # 100% profit
                total_capital += profit
                winning_bets += 1
            else:
                # Lose the bet
                total_capital -= bet_amount
                profit = -bet_amount
            
            total_profit += profit
            total_bets += 1
            
            results.append({
                "questionId": market["questionId"],
                "question": market["question"],
                "aiConfidence": ai_confidence,
                "aiDirection": ai_direction,
                "betOnYes": bet_on_yes,
                "actualWinner": actual_winner,
                "actualWinnerName": market["winningOutcomeName"],
                "aiCorrect": ai_correct,
                "betAmount": bet_amount,
                "profit": profit,
                "capitalAfter": total_capital,
                "timestamp": market["endTime"]
            })
            
        except Exception as e:
            print(f"Error processing market {market['questionId']}: {e}")
            continue
    
    # Calculate performance metrics
    accuracy = (winning_bets / total_bets * 100) if total_bets > 0 else 0
    roi = ((total_capital - initial_capital) / initial_capital * 100) if initial_capital > 0 else 0
    
    return {
        "success": True,
        "summary": {
            "totalMarkets": len(markets),
            "totalBets": total_bets,
            "winningBets": winning_bets,
            "accuracy": round(accuracy, 2),
            "initialCapital": initial_capital,
            "finalCapital": round(total_capital, 2),
            "totalProfit": round(total_profit, 2),
            "roi": round(roi, 2),
            "betSizePercent": bet_size_percent
        },
        "results": results
    }

def generate_signal(question, data_sources, risk_level, market_price=0.65):
    """Generate trading signal based on question and data sources"""
    
    # Pull live context from NewsAPI via new.py using the incoming question
    texts = get_news_lines(question, max_items=6) or [
        "Bitcoin hits $69,200 amid ETF optimism.",
        "Some traders expect pullback after short-term rally.",
        "Whales are accumulating Bitcoin heavily again",
        "Regulators delay altcoin ETF decision, BTC unaffected.",
        "Market fear and greed index shows 82 (extreme greed)."
    ]
    
    context = "\n".join(f"- {t}" for t in texts)
    
    prompt = f"""
    You are a market prediction AI agent. You MUST respond with ONLY valid JSON.

    Analyze the question and context, then return your assessment in this exact JSON format:
    {{
      "yes_probability": 0.75,
      "reason": "Brief explanation of key signals"
    }}

    Guidelines:
    - yes_probability: number between 0.0 and 1.0
    - 0.9-1.0: very strong positive evidence
    - 0.7-0.9: moderate positive evidence  
    - 0.4-0.7: neutral/mixed signals
    - 0.1-0.4: moderate negative evidence
    - 0.0-0.1: strong negative evidence
    - reason: short explanation (max 50 words)

    Question: {question}
    Context:
    {context}

    Respond with ONLY the JSON object, no other text:
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a market prediction AI agent. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Lower temperature for more consistent JSON
            max_tokens=200,   # Shorter response to focus on JSON
        )

        raw_output = response.choices[0].message.content.strip()
        
        print(f"Raw AI response: {raw_output}")  # Debug logging
        
        # Try to find JSON in the response
        start = raw_output.find("{")
        end = raw_output.rfind("}") + 1
        
        parsed = None
        
        if start != -1 and end > start:
            json_str = raw_output[start:end]
            try:
                parsed = json.loads(json_str)
                print(f"Successfully parsed JSON: {parsed}")  # Debug logging
            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {e}")
                print(f"Failed to parse: {json_str}")
        
        # If parsing failed, try to extract information manually
        if not parsed:
            print("Attempting manual parsing...")
            # Try to extract yes_probability and reason from text
            yes_prob = 0.5  # Default neutral
            reason = "Unable to parse AI response, using neutral stance."
            
            # Look for probability patterns
            import re
            prob_match = re.search(r'(\d+\.?\d*)\s*(?:%|percent)', raw_output.lower())
            if prob_match:
                yes_prob = float(prob_match.group(1)) / 100
            else:
                # Look for decimal patterns
                decimal_match = re.search(r'(\d+\.\d+)', raw_output)
                if decimal_match:
                    val = float(decimal_match.group(1))
                    if val <= 1.0:
                        yes_prob = val
                    elif val <= 100:
                        yes_prob = val / 100
            
            # Extract reason (first sentence or key phrases)
            sentences = raw_output.split('.')
            if sentences:
                reason = sentences[0].strip()
                if len(reason) > 100:
                    reason = reason[:100] + "..."
            
            parsed = {"yes_probability": yes_prob, "reason": reason}
            print(f"Manual parsing result: {parsed}")

        # Ensure we have valid data
        if "yes_probability" not in parsed:
            parsed["yes_probability"] = 0.5
        if "reason" not in parsed:
            parsed["reason"] = "Analysis completed with neutral stance"
            
        confidence_yes = float(parsed["yes_probability"])
        
        # Ensure confidence is within valid range
        if confidence_yes < 0 or confidence_yes > 1:
            confidence_yes = 0.5
            parsed["reason"] = "Invalid confidence value, using neutral stance"

        # Risk-based thresholds
        if risk_level == "low":
            buy_threshold, sell_threshold = 0.8, 0.4
        elif risk_level == "medium":
            buy_threshold, sell_threshold = 0.7, 0.3
        elif risk_level == "high":
            buy_threshold, sell_threshold = 0.6, 0.4
        else:  # very-high
            buy_threshold, sell_threshold = 0.55, 0.45

        # Determine action
        decision = "HOLD"
        if confidence_yes > buy_threshold and confidence_yes > market_price:
            decision = "BUY"
        elif confidence_yes < sell_threshold and (1 - market_price) > confidence_yes:
            decision = "SELL"
        else:
            decision = "HOLD"

        return {
            "success": True,
            "signal": {
                "direction": decision,
                "confidence": confidence_yes,
                "reason": parsed["reason"],
                "market_price": market_price,
                "risk_level": risk_level,
                "timestamp": int(time.time() * 1000)
            }
        }
        
    except Exception as e:
        print(f"Error in generate_signal: {e}")
        # Return a fallback response instead of failing
        return {
            "success": True,
            "signal": {
                "direction": "HOLD",
                "confidence": 0.5,
                "reason": f"AI analysis temporarily unavailable: {str(e)[:50]}...",
                "market_price": market_price,
                "risk_level": risk_level,
                "timestamp": int(time.time() * 1000)
            }
        }

@app.route('/api/generate-signal', methods=['POST'])
def api_generate_signal():
    """API endpoint to generate trading signals"""
    try:
        data = request.get_json()
        
        question = data.get('question', '')
        data_sources = data.get('dataSources', [])
        risk_level = data.get('riskLevel', 'medium')
        market_price = data.get('marketPrice', 0.65)
        
        if not question:
            return jsonify({"success": False, "error": "Question is required"}), 400
        
        result = generate_signal(question, data_sources, risk_level, market_price)
        
        if result["success"]:
            return jsonify(result)
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/backtest/run', methods=['POST'])
def api_run_backtest():
    """API endpoint to run backtesting"""
    try:
        data = request.get_json() or {}
        
        initial_capital = data.get('initialCapital', 1000)
        bet_size_percent = data.get('betSizePercent', 10)
        
        # Validate inputs
        if initial_capital <= 0:
            return jsonify({"success": False, "error": "Initial capital must be positive"}), 400
        
        if bet_size_percent <= 0 or bet_size_percent > 100:
            return jsonify({"success": False, "error": "Bet size must be between 1-100%"}), 400
        
        result = run_backtest(
            initial_capital=initial_capital,
            bet_size_percent=bet_size_percent
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/backtest/markets', methods=['GET'])
def api_get_resolved_markets():
    """API endpoint to get resolved markets for backtesting"""
    try:
        markets = get_resolved_markets()
        return jsonify({
            "success": True,
            "markets": markets,
            "count": len(markets)
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/news-context', methods=['GET', 'POST'])
def api_news_context():
    try:
        question = ''
        limit = 6
        if request.method == 'POST':
            data = request.get_json(silent=True) or {}
            question = (data.get('question') or '').strip()
            try:
                limit = int(data.get('limit', limit))
            except Exception:
                pass
        else:
            question = (request.args.get('q') or '').strip()
            l = request.args.get('limit')
            if l:
                try:
                    limit = int(l)
                except Exception:
                    pass
        lines = get_news_lines(question, max_items=limit)
        return jsonify({
            "success": True,
            "query": question,
            "count": len(lines),
            "lines": lines
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Backend is running"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
