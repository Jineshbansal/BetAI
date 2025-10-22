import os
import json
from groq import Groq
from dotenv import load_dotenv

# ----------------------------
# 1️⃣ Setup and Client Init
# ----------------------------
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ----------------------------
# 2️⃣ Inputs
# ----------------------------
question = "Will Bitcoin cross $70,000 by end of October?"

texts = [
    "Bitcoin hits $69,200 amid ETF optimism.",
    "Some traders expect pullback after short-term rally.",
    "Whales are accumulating Bitcoin heavily again 🚀",
    "Regulators delay altcoin ETF decision, BTC unaffected.",
    "Market fear and greed index shows 82 (extreme greed)."
]

context = "\n".join(f"- {t}" for t in texts)
market_price = 0.65        # Current market YES probability from Polymarket
user_risk = "moderate"     # Can be "conservative", "moderate", or "aggressive"

# ----------------------------
# 3️⃣ Build Prompt
# ----------------------------
prompt = f"""
You are a market prediction AI agent.

Follow these steps carefully:
1. Read the question carefully.
2. Analyze the context lines to see whether most signals are positive (bullish) or negative (bearish) toward the event happening.
3. Consider mixed signals as neutral.
4. Assign a confidence score (0–1) for the event being TRUE, following this scale:
   - 0.9–1.0 → very strong positive evidence
   - 0.7–0.9 → moderate positive evidence
   - 0.4–0.7 → neutral/mixed signals
   - 0.1–0.4 → moderate negative evidence
   - 0.0–0.1 → strong negative evidence
5. Base this confidence only on the provided context, not outside knowledge.
6. Return your reasoning and the final confidence in JSON strictly as:
{{
  "yes_probability": float,
  "reason": "short explanation of key signals"
}}

Question: {question}
Context:
{context}
"""

# ----------------------------
# 4️⃣ Call Groq Model
# ----------------------------
response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",  # Groq’s fast LLaMA 3.3 model
    messages=[
        {"role": "system", "content": "You are a market prediction AI agent."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.3,
    max_tokens=300,
)

raw_output = response.choices[0].message.content.strip()

# ----------------------------
# 5️⃣ Extract JSON Safely
# ----------------------------
start = raw_output.find("{")
end = raw_output.rfind("}") + 1

try:
    parsed = json.loads(raw_output[start:end])
except:
    print("⚠️ Could not parse model output, raw text below:\n", raw_output)
    parsed = {"yes_probability": 0.5, "reason": "Parsing failed, neutral stance."}

confidence_yes = parsed["yes_probability"]

# ----------------------------
# 6️⃣ Show Reasoning
# ----------------------------
print("\n🧩 Model Reasoning")
print(f"→ {parsed['reason']}")
print(f"→ Predicted Probability (YES): {confidence_yes:.2f}")

# ----------------------------
# 7️⃣ Decision Logic
# ----------------------------
if user_risk == "conservative":
    buy_threshold, sell_threshold = 0.8, 0.4
elif user_risk == "moderate":
    buy_threshold, sell_threshold = 0.7, 0.3
else:
    buy_threshold, sell_threshold = 0.55, 0.45

decision = "HOLD"
if confidence_yes > buy_threshold and confidence_yes > market_price:
    decision = "BUY YES"
elif confidence_yes < sell_threshold and (1 - market_price) > confidence_yes:
    decision = "BUY NO"
else:
    decision = "HOLD"

print("\n💡 Decision Summary")
print(f"   Market YES price: {market_price:.2f}")
print(f"   Agent Confidence: {confidence_yes:.2f}")
print(f"   Risk Mode: {user_risk}")
print(f"   → Action: {decision}")
