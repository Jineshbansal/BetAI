# 🎯 Bet AI — Hedera-Powered AI Prediction Market

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Hedera](https://img.shields.io/badge/Hedera-Testnet-5A00FF.svg)
![AI Agent](https://img.shields.io/badge/AI-Agent-green.svg)
![Status](https://img.shields.io/badge/status-Active-brightgreen.svg)

> Built for **ETHGlobal 2025 Hackathon** — integrating AI-driven decision-making with Hedera-based decentralized prediction markets.

---

## 🧭 Overview

**Bet AI** is a **next-generation decentralized prediction market** built on **Hedera Hashgraph**, integrating **AI-driven confidence signals**, **news sentiment analysis**, and **autonomous market behavior**.

The platform allows **oracles** to create and resolve markets, while **users** can place bets on outcomes. An embedded **AI agent** continuously analyzes market data, news context, and social sentiment to assist or even autonomously act on behalf of users.

---

## 🧠 How It Works

### 🔹 1. Oracle-Driven Market Creation
The oracle (admin) can post prediction questions (e.g., “Will BTC cross $70k by next week?”) via the smart contract using the function:

```solidity
addQuestion(string question, string[] outcomeNames, uint256 endTime)
```

This creates a new prediction market on the Hedera Testnet (chainId **296**, 0x128).

### 🔹 2. User Betting
Users can browse live markets and place bets using HBAR. The HBAR amount is converted to **tinybars** before contract execution.

```javascript
Hbar.from(amountHBAR).toTinybars();
```

They place their bet via:
```solidity
placeBet(uint256 questionId, uint256 outcomeIndex, uint256 amount) payable;
```

### 🔹 3. AI Confidence Generation (Predict Output Page)
After a bet is placed, the backend AI agent (powered by Gemini, OpenAI, and DeepSeek) generates a **confidence score** — a probability distribution indicating the AI’s estimated likelihood of each outcome.  
The **Predict Output Page** visualizes this signal with explanations, recent news context, and sentiment insights.

### 🔹 4. Resolution and Hedera Settlement
Once the event concludes, the oracle calls:
```solidity
resolveMarket(uint256 questionId, uint256 winningOutcome);
```
The contract automatically distributes winnings to correct bettors on the **Hedera Testnet**.

### 🔹 5. Autonomous Mode (AI Trading)
Beyond manual prediction, Bet AI offers an **autonomous mode**, where the AI agent manages wallet funds and executes **buy/sell/hold** operations based on signal strength and backtesting data. This turns Bet AI into a hybrid **prediction-trading platform**.

---

## 🧩 Architecture Overview
<img width="1582" height="845" alt="image" src="https://github.com/user-attachments/assets/10b08aab-0a8f-4f5e-96a3-24c0d9e7cc53" />


```
Frontend (React + Vite + Tailwind CSS)
│
├── User Dashboard — Shows bets, profit/loss, and AI confidence charts
├── Prediction Market — Lists active questions and betting options
└── Predict Output — AI analysis + autonomous actions
│
Backend (Flask + Python)
│
├── /api/news-context — Fetches news sentiment using NewsAPI
├── /api/generate-signal — Produces AI confidence using LLMs (Gemini, OpenAI, DeepSeek)
└── /api/agent-chat — Chat interface for the Hedera AI Agent
│
Smart Contract (Hedera Parimutuel Market)
│
└── HBAR-based parimutuel contract for transparent payouts
```

---

## ⚙️ Environment Variables

### 🖥️ Frontend (`frontend/.env.local`)
```bash
VITE_MY_ACCOUNT_ID=0.0.xxxxxxx
VITE_MY_PRIVATE_KEY=<Ed25519 DER or ECDSA key>
```

### 🧠 Backend (`backend/.env`)
```bash
NEWS_API_KEY=0c17b412e22846c6b1ce4cd63d5d9fb4
GROQ_API_KEY=<your_groq_key>
HEDERA_ACCOUNT_ID=0.0.xxxxxxx
HEDERA_PRIVATE_KEY=<private_key>
```

---

## 🔗 Backend Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/news-context` | Fetch contextual market news |
| POST | `/api/generate-signal` | Generate AI-based market confidence |
| POST | `/api/agent-chat` | Chat interface with Hedera AI agent |

---

## 💻 Run Commands (Windows)

### Frontend
```bash
cd d:\ETHGlobal\frontend
npm install
npm run dev
```

### Backend
```bash
cd d:\ETHGlobal\backend
pip install -r requirements.txt
python index.py
```

---

## 🧩 Troubleshooting

| Issue | Cause / Fix |
|-------|--------------|
| INVALID_SIGNATURE | Ensure correct key type (Ed25519 vs ECDSA) |
| process is not defined | Use `import.meta.env.VITE_*` variables |
| Circuit breaker open | Wait 60–120s and retry (Hashio throttle) |
| No context returned | Ensure `NEWS_API_KEY` is valid |

---

## 🔒 Security Notes

- Never commit `.env` files to version control.  
- Frontend keys are for **development only** — use a server-side signer for production.  
- Admin tab is visible to all but only **oracles** can resolve markets.  

---

## 📊 Dashboard Metrics

| KPI | Source | Description |
|-----|---------|-------------|
| Net Profit | Local store + backend | Tracks AI & user bets |
| Trade Count | Local logs | Per user/session |
| PnL Chart | Chart.js | Tracks performance over time |
| News Context | Backend API | Aggregated from NewsAPI + Twitter |

---

## 🧩 Project Structure

```
d:\ETHGlobal
├─ frontend
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ .env.local                 (VITE_MY_ACCOUNT_ID, VITE_MY_PRIVATE_KEY)
│  ├─ public
│  │  └─ index.html
│  └─ src
│     ├─ main.jsx
│     ├─ App.jsx
│     ├─ contracts
│     │  └─ config.js            (HEDERA_CONTRACT_ID, chainId, RPC)
│     ├─ contexts
│     │  ├─ WalletContext.jsx
│     │  └─ HashConnectContext.jsx
│     ├─ components
│     │  ├─ Header.jsx
│     │  ├─ PredictionGrid.jsx
│     │  └─ ResolveTab.jsx
│     ├─ lib
│     │  ├─ dashboardStore.js
│     │  └─ hedera
│     │     └─ placeBet.js
│     └─ pages
│        ├─ Home.jsx
│        ├─ Dashboard.jsx
│        ├─ PredictionMarket.jsx
│        └─ PredictOutput.jsx
│
├─ backend
│  ├─ index.py                   (Flask app: /api/news-context, /api/generate-signal, /api/agent-chat)
│  ├─ start_server.py
│  ├─ news.py                    (NewsAPI helper functions)
│  ├─ requirements.txt
│  └─ .env                       (NEWS_API_KEY, GROQ_API_KEY, HEDERA_*)
│
└─ contracts
   └─ PredictionMarket.sol
```

---

## 🧮 Smart Contract Interface

```solidity
addQuestion(string question, string[] outcomeNames, uint256 endTime) // owner-only
placeBet(uint256 questionId, uint256 outcomeIndex, uint256 amount) payable
resolveMarket(uint256 questionId, uint256 winningOutcome) // owner-only
getMarket(uint256 questionId)
```

**Contract ID:** `0.0.7100616`  
**EVM Address:** `0x53f25235e70380605ea794da768d9662ab72ad52`  
**Network:** Hedera Testnet (chainId 296 / 0x128)

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Python (Flask) |
| Blockchain | Hedera Hashgraph |
| Smart Contracts | Solidity (ParimutuelPredictionMarket) |
| AI Models | Gemini, OpenAI, DeepSeek |
| News & Sentiment | NewsAPI, Twitter API |
| Deployment | Hedera SDK + IPFS (optional) |

---

## 🧾 License

This project is licensed under the [MIT License](LICENSE).

---

## 👥 Contributors

| Name | Role |
|------|------|
| **Suryansh Garg** | AI & Blockchain Developer |
| **Jaydeep Pokhariya** | AI & Blockchain Developer |
| **Vivek Maurya** | AI & Blockchain Developer |
| **Jinesh Bansal** | AI & Blockchain Developer |

---

> ⚡ *AI-driven intelligence meets blockchain transparency — empowering decentralized, data-backed prediction markets with autonomous trading capabilities.*
