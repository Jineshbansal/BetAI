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

def analyze_backtest_insights(backtest_results):
    """Analyze backtest results and extract key insights for future predictions"""
    if not backtest_results or not backtest_results.get("success"):
        return None
    
    summary = backtest_results.get("summary", {})
    results = backtest_results.get("results", [])
    
    if not results:
        return None
    
    # Basic performance metrics
    accuracy = summary.get("accuracy", 0)
    roi = summary.get("roi", 0)
    total_bets = summary.get("totalBets", 0)
    winning_bets = summary.get("winningBets", 0)
    
    # Analyze confidence levels vs outcomes
    high_conf_correct = 0
    high_conf_total = 0
    low_conf_correct = 0
    low_conf_total = 0
    
    # Analyze recent performance (last 5 trades)
    recent_results = results[-5:] if len(results) >= 5 else results
    recent_correct = sum(1 for r in recent_results if r.get("aiCorrect", False))
    recent_accuracy = (recent_correct / len(recent_results) * 100) if recent_results else 0
    
    # Categorize by confidence levels
    for result in results:
        confidence = result.get("aiConfidence", 0.5)
        is_correct = result.get("aiCorrect", False)
        
        if confidence >= 0.7:  # High confidence
            high_conf_total += 1
            if is_correct:
                high_conf_correct += 1
        elif confidence <= 0.3:  # Low confidence (betting NO)
            low_conf_total += 1
            if is_correct:
                low_conf_correct += 1
    
    high_conf_accuracy = (high_conf_correct / high_conf_total * 100) if high_conf_total > 0 else 0
    low_conf_accuracy = (low_conf_correct / low_conf_total * 100) if low_conf_total > 0 else 0
    
    # Identify question patterns (simple keyword analysis)
    question_keywords = {}
    for result in results:
        question = result.get("question", "").lower()
        is_correct = result.get("aiCorrect", False)
        
        # Extract key terms
        keywords = ["bitcoin", "crypto", "ethereum", "election", "political", "sports", "market", "price"]
        for keyword in keywords:
            if keyword in question:
                if keyword not in question_keywords:
                    question_keywords[keyword] = {"total": 0, "correct": 0}
                question_keywords[keyword]["total"] += 1
                if is_correct:
                    question_keywords[keyword]["correct"] += 1
    
    # Calculate accuracy by keyword
    keyword_performance = {}
    for keyword, stats in question_keywords.items():
        if stats["total"] >= 2:  # Only include if we have at least 2 samples
            keyword_performance[keyword] = {
                "accuracy": (stats["correct"] / stats["total"] * 100),
                "total": stats["total"]
            }
    
    insights = {
        "overall_accuracy": round(accuracy, 2),
        "roi": round(roi, 2),
        "total_bets": total_bets,
        "winning_bets": winning_bets,
        "recent_accuracy": round(recent_accuracy, 2),
        "recent_trades": len(recent_results),
        "high_confidence_accuracy": round(high_conf_accuracy, 2),
        "high_confidence_count": high_conf_total,
        "low_confidence_accuracy": round(low_conf_accuracy, 2),
        "low_confidence_count": low_conf_total,
        "keyword_performance": keyword_performance
    }
    
    return insights

def format_backtest_summary(insights):
    """Format backtest insights into a concise text summary for LLM context"""
    if not insights:
        return ""
    
    summary_lines = []
    summary_lines.append(f"📊 Your Historical Performance:")
    summary_lines.append(f"- Overall Accuracy: {insights['overall_accuracy']}% ({insights['winning_bets']}/{insights['total_bets']} correct)")
    summary_lines.append(f"- ROI: {insights['roi']}%")
    
    if insights.get('recent_trades', 0) > 0:
        summary_lines.append(f"- Recent Form: {insights['recent_accuracy']}% accuracy in last {insights['recent_trades']} trades")
    
    # Confidence level performance
    if insights.get('high_confidence_count', 0) >= 3:
        summary_lines.append(f"- High Confidence (>70%) Accuracy: {insights['high_confidence_accuracy']}% ({insights['high_confidence_count']} trades)")
    
    # Keyword-specific performance
    keyword_perf = insights.get('keyword_performance', {})
    if keyword_perf:
        summary_lines.append(f"- Topic-Specific Performance:")
        for keyword, stats in sorted(keyword_perf.items(), key=lambda x: x[1]['accuracy'], reverse=True)[:3]:
            summary_lines.append(f"  • {keyword.capitalize()}: {stats['accuracy']:.0f}% accuracy ({stats['total']} trades)")
    
    return "\n".join(summary_lines)

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
            # Don't use backtest context during backtesting (would be circular)
            ai_result = generate_signal(
                question=market["question"],
                data_sources=[],
                risk_level="medium",
                market_price=0.5,  # Assume 50/50 for backtesting
                backtest_context=None  # Don't use backtest data during backtesting
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

def generate_signal(question, data_sources, risk_level, market_price=0.65, backtest_context=None):
    """Generate trading signal based on question and data sources"""
    
    # 1. Pull live news from NewsAPI
    news_lines = get_news_lines(question, max_items=6)
    
    # 2. Always include fallback/reference data (market indicators)
    reference_data = [
        "Bitcoin hits $69,200 amid ETF optimism.",
        "Some traders expect pullback after short-term rally.",
        "Whales are accumulating Bitcoin heavily again",
        "Regulators delay altcoin ETF decision, BTC unaffected.",
        "Market fear and greed index shows 82 (extreme greed)."
    ]
    
    # 3. Combine all data sources
    all_context_lines = []
    
    # Add news if available
    if news_lines:
        all_context_lines.append("📰 Latest News:")
        all_context_lines.extend([f"  - {line}" for line in news_lines])
    
    # Always add reference market data
    all_context_lines.append("\n📊 Market Indicators:")
    all_context_lines.extend([f"  - {line}" for line in reference_data])
    
    context = "\n".join(all_context_lines)
    
    # Add backtest context if available
    backtest_summary = ""
    if backtest_context:
        backtest_summary = format_backtest_summary(backtest_context)
    
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
    
    Current Market Context:
    {context}
    """
    
    # Add backtest performance context if available
    if backtest_summary:
        prompt += f"""
    
    {backtest_summary}
    
    Note: Use your historical performance data to calibrate your confidence. If you performed well on similar topics, you can be more confident. If you struggled, be more cautious.
    """
    
    prompt += """

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
        include_backtest = data.get('includeBacktest', False)
        
        if not question:
            return jsonify({"success": False, "error": "Question is required"}), 400
        
        # Get backtest context if requested
        backtest_context = None
        if include_backtest:
            # Run a quick backtest to get insights
            backtest_results = run_backtest(initial_capital=1000, bet_size_percent=10)
            if backtest_results.get("success"):
                backtest_context = analyze_backtest_insights(backtest_results)
        
        result = generate_signal(question, data_sources, risk_level, market_price, backtest_context)
        
        if result["success"]:
            # Add info about whether backtest context was used
            result["backtest_used"] = include_backtest and backtest_context is not None
            if backtest_context:
                result["backtest_summary"] = {
                    "accuracy": backtest_context.get("overall_accuracy"),
                    "roi": backtest_context.get("roi"),
                    "total_bets": backtest_context.get("total_bets")
                }
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
        
        print(f"Fetching news for query: '{question}' (limit: {limit})")
        lines = get_news_lines(question, max_items=limit)
        print(f"Got {len(lines)} news lines")
        
        return jsonify({
            "success": True,
            "query": question,
            "count": len(lines),
            "lines": lines
        })
    except Exception as e:
        print(f"Error in api_news_context: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Backend is running"})

@app.route('/api/agent-chat', methods=['POST'])
def api_agent_chat():
    """Proxy endpoint to run the Node-based Hedera Agent with a prompt and return its JSON output.
    Expects: { "prompt": "..." }
    """
    try:
        data = request.get_json(silent=True) or {}
        prompt = (data.get('prompt') or '').strip()
        if not prompt:
            return jsonify({"success": False, "error": "prompt is required"}), 400

        # Locate the hedera_agent.js under the frontend folder
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
        agent_path = os.path.join(repo_root, 'frontend', 'src', 'pages', 'hedera_agent.js')
        if not os.path.exists(agent_path):
            return jsonify({"success": False, "error": f"Agent file not found at {agent_path}"}), 500

        # Prepare environment: pass through existing env plus map Vite keys if present
        env = os.environ.copy()
        # Map VITE_* to agent expected vars if available
        if not env.get('HEDERA_ACCOUNT_ID') and env.get('VITE_MY_ACCOUNT_ID'):
            env['HEDERA_ACCOUNT_ID'] = env['VITE_MY_ACCOUNT_ID']
        if not env.get('HEDERA_PRIVATE_KEY') and env.get('VITE_MY_PRIVATE_KEY'):
            env['HEDERA_PRIVATE_KEY'] = env['VITE_MY_PRIVATE_KEY']

        # Node command
        node_cmd = ['node', agent_path, prompt]
        import subprocess
        # Run from repo root so ESM imports resolve and node can find dependencies in frontend
        result = subprocess.run(
            node_cmd,
            cwd=os.path.join(repo_root, 'frontend'),
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )

        stdout = (result.stdout or '').strip()
        stderr = (result.stderr or '').strip()

        if result.returncode != 0:
            return jsonify({"success": False, "error": "Agent process failed", "stderr": stderr}), 500

        # Try to parse stdout as JSON
        try:
            output = json.loads(stdout)
        except Exception:
            # In case agent prints other logs, try to extract JSON object
            start = stdout.find('{')
            end = stdout.rfind('}') + 1
            if start != -1 and end > start:
                try:
                    output = json.loads(stdout[start:end])
                except Exception as e:
                    return jsonify({"success": False, "error": f"Failed to parse agent output: {str(e)}", "raw": stdout}), 500
            else:
                return jsonify({"success": False, "error": "No JSON output from agent", "raw": stdout}), 500

        return jsonify({"success": True, "agent": output})

    except subprocess.TimeoutExpired:
        return jsonify({"success": False, "error": "Agent timed out"}), 504
    except FileNotFoundError as e:
        # node not found
        return jsonify({"success": False, "error": f"Node runtime not found: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
