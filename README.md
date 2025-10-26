
# 🧠 **Bet AI – Decentralized AI-Powered Prediction Market**

![Hedera](https://img.shields.io/badge/Hedera-Blockchain-blue)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-green)
![Python](https://img.shields.io/badge/Backend-Flask%20%2B%20Groq-yellow)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

> **Bet AI** is a decentralized prediction market powered by **Hedera Hashgraph** and **AI-driven analytics**.  
> It allows users to place and resolve bets using real-time AI-generated market signals for transparency and trust.

---

## 🏗️ **Architecture Overview**

<img width="1667" height="834" alt="image" src="https://github.com/user-attachments/assets/8ec411f4-72d5-4af3-a7f0-e8e19c3a9fa6"/>

**Core Workflow:**
1. **Frontend (React + Vite):** Wallet connection, prediction creation, dashboard visualization.  
2. **Backend (Flask):** Fetches live news, processes GROQ-based AI reasoning, generates prediction signals.  
3. **Smart Contract (Hedera):** Stores market states, user bets, and resolves outcomes.  
4. **AI Agent:** Analyzes sentiment and returns insights to backend endpoints.  

---

## 📁 **Project Structure**
```bash
d:\ETHGlobal
├─ frontend
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ .env.local                 (dev secrets: VITE_MY_ACCOUNT_ID, VITE_MY_PRIVATE_KEY)
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
│  ├─ new.py                     (NewsAPI helpers; prints JSON when run directly)
│  ├─ requirements.txt
│  └─ .env                       (NEWS_API_KEY, GROQ_API_KEY, optional HEDERA_*)
│
└─ Contracts
   └─ PredictionMarket.sol
```

---

## ⚙️ **Setup Guide**

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/bet-ai.git
cd bet-ai
```

### 2. Configure Environment Variables
**Frontend (`frontend/.env.local`):**
```
VITE_MY_ACCOUNT_ID=0.0.xxxxx
VITE_MY_PRIVATE_KEY=302e...
```

**Backend (`backend/.env`):**
```
NEWS_API_KEY=your_news_api_key
GROQ_API_KEY=your_groq_key
HEDERA_CONTRACT_ID=0.0.xxxxx
```

### 3. Install Dependencies
```bash
cd frontend && npm install
cd ../backend && pip install -r requirements.txt
```

### 4. Run Services
```bash
# Backend (Flask)
python start_server.py

# Frontend (Vite)
npm run dev
```

---

## 🌐 **Endpoints (Backend Flask API)**

| Endpoint | Description |
|-----------|--------------|
| `/api/news-context` | Fetches contextual news for sentiment analysis |
| `/api/generate-signal` | Generates AI prediction signal via GROQ |
| `/api/agent-chat` | Chat endpoint for interactive market queries |

---

## 💡 **Features**
- 🤖 **AI-Driven Prediction Signals** (via GROQ API)
- 🌐 **Hedera Smart Contract Integration**
- 🧾 **Automated Bet Resolution**
- 📊 **Dashboard for Market Insights**
- 🧱 **Modular React + Flask Architecture**

---

## 🧩 **Tech Stack**
| Layer | Technology |
|--------|-------------|
| Frontend | React, Vite, TailwindCSS |
| Backend | Python, Flask, Groq API |
| Blockchain | Hedera Hashgraph |
| Smart Contracts | Solidity |
| Database | Hedera State Service / LocalStore |

---

## 🧾 **License**
This project is licensed under the [MIT License](LICENSE).

---

### 💬 **Developed for ETHGlobal Hackathon 2025**  
Built by innovators exploring the synergy between **AI + Blockchain + Prediction Markets**.
