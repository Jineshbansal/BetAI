import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '../contexts/WalletContext'
import { ethers } from 'ethers'
import {
  Client,
  ContractExecuteTransaction,
  Hbar,
  ContractFunctionParameters,
  PrivateKey,
  AccountId
} from "@hashgraph/sdk";

export default function PredictOutput() {
  const { signer, account } = useWallet()
  const [riskLevel, setRiskLevel] = useState('medium')
  const [dataSources, setDataSources] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState('')
  const [customQuestion, setCustomQuestion] = useState('')
  const [spendingMode, setSpendingMode] = useState('manual')
  const [agentAddress, setAgentAddress] = useState('')
  const [spendingLimit, setSpendingLimit] = useState('')
  
  // Signal and autonomous execution state
  const [currentSignal, setCurrentSignal] = useState(null)
  const [isAutonomousActive, setIsAutonomousActive] = useState(false)
  const [autonomousStatus, setAutonomousStatus] = useState('idle') // idle, running, stopped
  const [nextSignalTime, setNextSignalTime] = useState(null)
  const [betAmount, setBetAmount] = useState('10') // Default bet amount in HBAR
  const [questionId, setQuestionId] = useState(1) // Default question ID for betting
  const [newsQuery, setNewsQuery] = useState('')
  const [newsLines, setNewsLines] = useState([])
  const [isFetchingContext, setIsFetchingContext] = useState(false)
  const [lastContextFetchedAt, setLastContextFetchedAt] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const intervalRef = useRef(null)
  const BACKEND_URL = 'http://localhost:5000'

  // Available data sources
  const availableDataSources = [
    'CoinMarketCap',
    'CoinGecko',
    'Binance API',
    'Coinbase API',
    'Yahoo Finance',
    'Twitter Trends',
    'Reddit Crypto',
    'News API'
  ]

  // Pre-defined profitable questions
  const profitableQuestions = [
    'Which cryptocurrency has the highest growth potential in the next 24 hours?',
    'What are the best DeFi tokens to invest in right now?',
    'Which NFT collections show promising trading volume?',
    'What are the most undervalued altcoins currently?',
    'Which trading pairs have the best arbitrage opportunities?'
  ]

  const handleDataSourceToggle = (source) => {
    if (dataSources.includes(source)) {
      setDataSources(dataSources.filter(s => s !== source))
    } else {
      setDataSources([...dataSources, source])
    }
  }

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question)
    setCustomQuestion('')
  }

  const handleCustomQuestionChange = (e) => {
    setCustomQuestion(e.target.value)
    setSelectedQuestion('')
    setNewsLines([])
  }

  // Function to fetch signal from backend
  const fetchSignal = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-signal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: selectedQuestion || customQuestion,
          dataSources,
          riskLevel,
          marketPrice: 0.65
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setCurrentSignal(data.signal)
        return data.signal
      } else {
        console.error('Failed to generate signal:', data.error)
        return null
      }
    } catch (error) {
      console.error('Error fetching signal:', error)
      return null
    }
  }

  const fetchNewsContext = async () => {
    const q = selectedQuestion || customQuestion
    if (!q) {
      alert('Please select or enter a question first')
      return
    }
    setIsFetchingContext(true)
    setNewsLines([])
    setNewsQuery(q)
    try {
      const res = await fetch(`${BACKEND_URL}/api/news-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, limit: 6 })
      })
      const data = await res.json()
      if (data?.success) {
        setNewsLines(Array.isArray(data.lines) ? data.lines : [])
        setLastContextFetchedAt(new Date())
      } else {
        console.error('Failed to fetch news context:', data)
      }
    } catch (err) {
      console.error('Error fetching news context:', err)
    } finally {
      setIsFetchingContext(false)
    }
  }
  // Function to validate spending limit
  const validateSpendingLimit = (betAmountHBAR) => {
    if (!spendingLimit || spendingLimit === '') {
      return true // No limit set
    }
    
    // Convert HBAR to USD (HBAR ≈ $0.17)
    const HBAR_PRICE_USD = 0.17
    const betAmountUSD = parseFloat(betAmountHBAR) * HBAR_PRICE_USD
    const limitUSD = parseFloat(spendingLimit)
    
    if (betAmountUSD > limitUSD) {
      alert(`Bet amount (${betAmountHBAR} HBAR ≈ $${betAmountUSD.toFixed(2)}) exceeds spending limit ($${limitUSD.toFixed(2)})`)
      return false
    }
    
    return true
  }

  // Function to check wallet balance
  const checkBalance = async () => {
    if (!signer) return null
    
    try {
      const balance = await signer.provider.getBalance(await signer.getAddress())
      // Convert from tinybars to HBAR
      const balanceHBAR = parseFloat(ethers.formatUnits(balance, 8))
      return balanceHBAR
    } catch (error) {
      console.error('Error checking balance:', error)
      return null
    }
  }

  // Function to place bet on contract
  const placeBet = async (outcomeIndex) => {
    if (!signer) {
      alert('Please connect your wallet first')
      return false
    }

    // Validate spending limit
    if (!validateSpendingLimit(betAmount)) {
      return false
    }

    // Check wallet balance
    const balance = await checkBalance()
    if (balance !== null) {
      const betAmountNum = parseFloat(betAmount)
      const estimatedGasCost = 0.1 // Rough estimate for gas in HBAR
      const totalNeeded = betAmountNum + estimatedGasCost
      
      console.log(`Wallet balance: ${balance.toFixed(2)} HBAR`)
      console.log(`Bet amount: ${betAmountNum} HBAR`)
      console.log(`Estimated gas: ${estimatedGasCost} HBAR`)
      console.log(`Total needed: ${totalNeeded} HBAR`)
      
      if (balance < totalNeeded) {
        alert(`Insufficient balance!\n\nYour balance: ${balance.toFixed(2)} HBAR\nBet amount: ${betAmountNum} HBAR\nEstimated gas: ${estimatedGasCost} HBAR\nTotal needed: ${totalNeeded} HBAR\n\nPlease reduce bet amount or add more HBAR to your wallet.`)
        return false
      }
    }


    try {
      // ✅ Connect to Hedera testnet (use Vite env vars in frontend)
      const client = Client.forTestnet();
      const ACC = String(import.meta.env.VITE_MY_ACCOUNT_ID || '').trim()
      const KEY = String(import.meta.env.VITE_MY_PRIVATE_KEY || '').trim()
      if (!ACC || !KEY) {
        alert('Missing Hedera operator keys. Create frontend/.env.local with VITE_MY_ACCOUNT_ID and VITE_MY_PRIVATE_KEY, then restart the dev server.')
        return false
      }
      let priv
      try {
        const keyNo0x = KEY.startsWith('0x') ? KEY.slice(2) : KEY
        if (/^0x[0-9a-fA-F]{64}$/.test(KEY)) {
          // ECDSA secp256k1 raw hex
          priv = PrivateKey.fromStringECDSA(KEY)
        } else if (/^(302e|302d|302c)/i.test(keyNo0x)) {
          // DER-encoded Ed25519 private key (hex)
          priv = PrivateKey.fromStringDer(keyNo0x)
        } else if (/^[0-9a-fA-F]{64}$/.test(KEY)) {
          // Raw 32-byte Ed25519 hex
          priv = PrivateKey.fromStringED25519(KEY)
        } else {
          // Fallback to generic
          priv = PrivateKey.fromString(KEY)
        }
      } catch (e) {
        alert('Private key format not recognized. Use 0x<64-hex> for ECDSA or 302e.. DER hex for Ed25519.')
        return false
      }
      client.setOperator(AccountId.fromString(ACC), priv);
  
      // Convert HBAR to tinybars (1 HBAR = 100,000,000 tinybars)
      const amountTinybars = Hbar.from(betAmount).toTinybars();
  
      console.log(`Placing bet of ${betAmount} HBAR (${amountTinybars} tinybars)`);
  
      // ✅ Build the transaction to call the contract function
      const tx = new ContractExecuteTransaction()
        .setContractId('0.0.7100616') // NOT address — use Hedera Contract ID (e.g., "0.0.123456")
        .setGas(200000) // adjust based on function complexity
        .setPayableAmount(Hbar.fromTinybars(amountTinybars))
        .setFunction(
          "placeBet",
          new ContractFunctionParameters()
            .addUint256(questionId)
            .addUint256(outcomeIndex)
            .addUint256(amountTinybars)
        );
  
      // Submit the transaction
      const submitTx = await tx.execute(client);
  
      // Get the receipt to confirm success
      const receipt = await submitTx.getReceipt(client);
      console.log("✅ Transaction status:", receipt.status.toString());
  
      if (receipt.status.toString() === "SUCCESS") {
        alert("Bet placed successfully!");
        return true;
      } else {
        alert(`Transaction failed: ${receipt.status.toString()}`);
        return false;
      }
    } catch (error) {
      console.error('Error placing bet:', error)
      
      // Provide more helpful error messages
      if (error.code === 'INSUFFICIENT_FUNDS') {
        alert(`Insufficient funds for transaction.\n\nYou need:\n- ${betAmount} HBAR for the bet\n- Additional HBAR for gas fees\n\nTry reducing the bet amount or ensure you have enough HBAR for both the bet and gas fees.`)
      } else if (error.message.includes('gas')) {
        alert(`Gas estimation failed. This might be due to:\n- Insufficient funds for gas\n- Contract not deployed\n- Invalid question ID\n\nError: ${error.message}`)
      } else if (/INVALID_SIGNATURE/i.test(error?.message || '')) {
        alert('Invalid signature: The provided private key does not match the on-file key for account ' + (import.meta.env.VITE_MY_ACCOUNT_ID || '') + '. Use the correct key for this account, or switch to the account that corresponds to this private key (ECDSA vs Ed25519 mismatch).')
      } else {
        alert('Failed to place bet: ' + error.message)
      }
      return false
    }
  }

  // Function to handle autonomous execution
  const startAutonomousExecution = async () => {
    if (!selectedQuestion && !customQuestion) {
      alert('Please select or enter an analysis question first')
      return
    }

    if (spendingMode !== 'auto') {
      alert('Please select autonomous execution mode first')
      return
    }

    setIsAutonomousActive(true)
    setAutonomousStatus('running')
    
    // Fetch initial signal
    const signal = await fetchSignal()
    
    if (signal && signal.direction === 'BUY') {
      // Place bet for YES outcome (index 0) and stop
      const betPlaced = await placeBet(0)
      if (betPlaced) {
        setAutonomousStatus('completed')
        setIsAutonomousActive(false)
        alert('Bet placed successfully! Autonomous trading completed for this question.')
        return
      }
    } else if (signal && signal.direction === 'SELL') {
      // Place bet for NO outcome (index 1) and stop
      const betPlaced = await placeBet(1)
      if (betPlaced) {
        setAutonomousStatus('completed')
        setIsAutonomousActive(false)
        alert('Bet placed successfully! Autonomous trading completed for this question.')
        return
      }
    }

    // If we get HOLD, continue monitoring until we get BUY/SELL
    // Set up interval for continuous signal fetching (1 hour = 3600000 ms)
    intervalRef.current = setInterval(async () => {
      const newSignal = await fetchSignal()
      
      if (newSignal && newSignal.direction === 'BUY') {
        const betPlaced = await placeBet(0)
        if (betPlaced) {
          // Stop monitoring after successful bet placement
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setAutonomousStatus('completed')
          setIsAutonomousActive(false)
          setNextSignalTime(null)
          alert('Bet placed successfully! Autonomous trading completed for this question.')
        }
      } else if (newSignal && newSignal.direction === 'SELL') {
        const betPlaced = await placeBet(1)
        if (betPlaced) {
          // Stop monitoring after successful bet placement
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setAutonomousStatus('completed')
          setIsAutonomousActive(false)
          setNextSignalTime(null)
          alert('Bet placed successfully! Autonomous trading completed for this question.')
        }
      }
      // If HOLD, continue monitoring (don't place bet, don't stop)
      
      // Update next signal time
      setNextSignalTime(Date.now() + 3600000)
    }, 3600000) // 1 hour interval

    // Set initial next signal time
    setNextSignalTime(Date.now() + 3600000)
  }

  // Function to stop autonomous execution
  const stopAutonomousExecution = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsAutonomousActive(false)
    setAutonomousStatus('stopped')
    setNextSignalTime(null)
  }

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleGenerateSignal = async () => {
    if (spendingMode === 'auto') {
      // Start autonomous execution
      await startAutonomousExecution()
    } else {
      // Manual mode - just fetch and display signal
      const signal = await fetchSignal()
      if (signal) {
        alert(`Signal Generated!\n\nDirection: ${signal.direction}\nConfidence: ${(signal.confidence * 100).toFixed(1)}%\nReason: ${signal.reason}`)
      }
    }
  }

  return (
  <section className="mx-auto max-w-7xl px-6 pt-16">
      <motion.h2 
        initial={{opacity:0,y:8}} 
        animate={{opacity:1,y:0}} 
        transition={{duration:0.5}} 
        className="text-2xl md:text-3xl font-semibold"
      >
        Predict Output & Generate Signals
      </motion.h2>
      
      <motion.p 
        initial={{opacity:0}} 
        animate={{opacity:1}} 
        transition={{delay:0.1}} 
        className="mt-3 text-white/70"
      >
        Configure AI analysis parameters to generate profitable trading signals and predictions.
      </motion.p>

      {/* Summary bar */}
      <motion.div
        initial={{opacity:0,y:8}}
        animate={{opacity:1,y:0}}
        transition={{delay:0.15}}
        className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">Risk Level</div>
          <div className="mt-1 text-white font-medium">{riskLevel.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ')}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">Selected Sources</div>
          <div className="mt-1 text-white font-medium">{dataSources.length} selected</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-white/50">Bet Config</div>
          <div className="mt-1 text-white font-medium">{betAmount} HBAR • QID #{questionId}</div>
        </div>
      </motion.div>

      {/* Risk Settings */}
      <motion.div 
        initial={{opacity:0,y:8}} 
        animate={{opacity:1,y:0}} 
        transition={{delay:0.2}}
        className="mt-8 rounded-lg border border-white/10 bg-white/5 p-6"
      >
        <h3 className="text-lg font-semibold mb-4">1. Risk Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-2 block">
              Select your risk tolerance level:
            </label>
            <div className="flex flex-wrap gap-3">
              {['low', 'medium', 'high', 'very-high'].map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskLevel(level)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    riskLevel === level
                      ? 'border-accent bg-accent/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
                  }`}
                >
                  {level.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-4">
            <label className="text-sm text-white/60 mb-2 block">
              Risk Description:
            </label>
            <div className="text-white/80 text-sm">
              {riskLevel === 'low' && 'Conservative approach with minimal risk exposure. Focus on stable assets.'}
              {riskLevel === 'medium' && 'Balanced approach with moderate risk. Mix of stable and growth assets.'}
              {riskLevel === 'high' && 'Aggressive approach targeting higher returns with increased volatility.'}
              {riskLevel === 'very-high' && 'Very aggressive strategy with high-risk, high-reward investments.'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Data Sources */}
      <motion.div 
        initial={{opacity:0,y:8}} 
        animate={{opacity:1,y:0}} 
        transition={{delay:0.3}}
        className="mt-6 rounded-lg border border-white/10 bg-white/5 p-6"
      >
        <h3 className="text-lg font-semibold mb-4">2. Data Sources</h3>
        <label className="text-sm text-white/60 mb-4 block">
          Select data sources for analysis (select at least 2 for better predictions):
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availableDataSources.map((source) => (
            <button
              key={source}
              onClick={() => handleDataSourceToggle(source)}
              className={`p-3 rounded-lg border text-sm transition-all ${
                dataSources.includes(source)
                  ? 'border-accent bg-accent/20 text-white'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
              }`}
            >
              {source}
            </button>
          ))}
        </div>
        {dataSources.length > 0 && (
          <div className="mt-4">
            <label className="text-sm text-white/60 mb-2 block">Selected Sources:</label>
            <div className="text-white/80 text-sm">
              {dataSources.join(', ')}
            </div>
          </div>
        )}
      </motion.div>

      {/* Trading Question */}
      <motion.div 
        initial={{opacity:0,y:8}} 
        animate={{opacity:1,y:0}} 
        transition={{delay:0.4}}
        className="mt-6 rounded-lg border border-white/10 bg-white/5 p-6"
      >
        <h3 className="text-lg font-semibold mb-4">3. Analysis Focus</h3>
        
        {/* Pre-defined Questions */}
        <div className="mb-6">
          <label className="text-sm text-white/60 mb-3 block">
            Choose a pre-defined profitable question (Recommended for best results):
          </label>
          <div className="space-y-2">
            {profitableQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuestionSelect(question)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedQuestion === question
                    ? 'border-accent bg-accent/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
                }`}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Question */}
        <div>
          <label className="text-sm text-white/60 mb-3 block">
            Or enter your own custom analysis question:
          </label>
          <textarea
            value={customQuestion}
            onChange={handleCustomQuestionChange}
            placeholder="Enter your trading analysis question (e.g., 'Analyze Bitcoin price movement for next 48 hours')..."
            className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-accent focus:outline-none"
            rows="3"
          />
        </div>
      </motion.div>

      {/* News Context Preview */}
      <motion.div
        initial={{opacity:0,y:8}}
        animate={{opacity:1,y:0}}
        transition={{delay:0.45}}
        className="mt-6 rounded-lg border border-white/10 bg-white/5 p-6"
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold">4. News Context Preview</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNewsContext}
              disabled={!(selectedQuestion || customQuestion) || isFetchingContext}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !(selectedQuestion || customQuestion) || isFetchingContext
                  ? 'bg-gray-600 cursor-not-allowed text-white/50'
                  : 'bg-accent text-gray-900 hover:brightness-110'
              }`}
            >
              {isFetchingContext ? 'Fetching…' : 'Fetch Context'}
            </button>
            <button
              onClick={() => setNewsLines([])}
              disabled={newsLines.length === 0}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                newsLines.length === 0 ? 'bg-gray-600 cursor-not-allowed text-white/50' : 'bg-zinc-700 hover:bg-zinc-600 text-white'
              }`}
            >
              Clear
            </button>
            <button
              onClick={handleGenerateSignal}
              disabled={(!selectedQuestion && !customQuestion) || isGenerating}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                (!selectedQuestion && !customQuestion) || isGenerating
                  ? 'bg-gray-600 cursor-not-allowed text-white/50'
                  : 'bg-accent text-gray-900 hover:brightness-110'
              }`}
            >
              {isGenerating ? 'Generating…' : 'Generate Signal'}
            </button>
          </div>
        </div>
        <div className="text-sm text-white/60 mb-2">Query:</div>
        <div className="text-white/80 text-sm font-mono break-words mb-4">
          {(selectedQuestion || customQuestion) || '—'}
        </div>
        {lastContextFetchedAt && (
          <div className="text-xs text-white/50 mb-2">Last fetched: {lastContextFetchedAt.toLocaleString()}</div>
        )}
        {newsLines.length > 0 ? (
          <div>
            <div className="text-sm text-white/60 mb-2">Context Lines:</div>
            <div className="max-h-64 overflow-y-auto pr-2">
              <ul className="space-y-2 text-sm text-white/80 list-disc pl-5">
                {newsLines.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-white/50 text-sm">No context fetched yet.</div>
        )}

        {currentSignal && (
          <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Latest Signal</h4>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  currentSignal.direction === 'BUY'
                    ? 'bg-accent/20 text-accent'
                    : currentSignal.direction === 'SELL'
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-gray-500/20 text-gray-300'
                }`}
              >
                {currentSignal.direction}
              </span>
            </div>
            <div className="text-sm text-white/80">
              <div>Confidence: <span className="font-medium">{(currentSignal.confidence * 100).toFixed(1)}%</span></div>
              <div className="mt-1 text-white/60">Reason: {currentSignal.reason}</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Execution Mode */}
      <motion.div 
        initial={{opacity:0,y:8}} 
        animate={{opacity:1,y:0}} 
        transition={{delay:0.5}}
        className="mt-6 rounded-lg border border-white/10 bg-white/5 p-6"
      >
  <h3 className="text-lg font-semibold mb-4">5. Execution Mode</h3>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={() => setSpendingMode('manual')}
              className={`flex-1 p-4 rounded-lg border transition-all ${
                spendingMode === 'manual'
                  ? 'border-accent bg-accent/20 text-white'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
              }`}
            >
              <div className="font-semibold">Manual Execution</div>
              <div className="text-sm mt-1">You execute trades manually based on signals</div>
            </button>
            
            <button
              onClick={() => setSpendingMode('auto')}
              className={`flex-1 p-4 rounded-lg border transition-all ${
                spendingMode === 'auto'
                  ? 'border-accent bg-accent/20 text-white'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20'
              }`}
            >
              <div className="font-semibold">Autonomous Execution</div>
              <div className="text-sm mt-1">AI automatically executes trades from allocated funds</div>
            </button>
          </div>

          {spendingMode === 'auto' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-2 block">
                  Agent Wallet Address (where funds will be allocated):
                </label>
                <input
                  type="text"
                  value={agentAddress}
                  onChange={(e) => setAgentAddress(e.target.value)}
                  placeholder="Enter wallet address for autonomous execution..."
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-accent focus:outline-none"
                />
              </div>
              
              <div>
                <label className="text-sm text-white/60 mb-2 block">
                  Maximum Spending Limit (USD):
                </label>
                <input
                  type="number"
                  value={spendingLimit}
                  onChange={(e) => setSpendingLimit(e.target.value)}
                  placeholder="Enter maximum amount agent can spend..."
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-accent focus:outline-none"
                />
                <div className="text-xs text-white/50 mt-2">
                  This is the maximum amount the AI agent can spend on trades. Set according to your risk tolerance.
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Autonomous Execution Controls */}
      {spendingMode === 'auto' && (
        <motion.div 
          initial={{opacity:0,y:8}} 
          animate={{opacity:1,y:0}} 
          transition={{delay:0.55}}
          className="mt-6 rounded-lg border border-white/10 bg-white/5 p-6"
        >
          <h3 className="text-lg font-semibold mb-4">6. Autonomous Execution Settings</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/60 mb-2 block">
                  Bet Amount (HBAR):
                </label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="10"
                  step="0.001"
                  min="0.001"
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
                />
                <div className="text-xs text-white/50 mt-1">
                  ≈ ${(parseFloat(betAmount || 0) * 0.17).toFixed(2)} USD
                </div>
              </div>
              
              <div>
                <label className="text-sm text-white/60 mb-2 block">
                  Question ID (Market):
                </label>
                <input
                  type="number"
                  value={questionId}
                  onChange={(e) => setQuestionId(parseInt(e.target.value))}
                  placeholder="1"
                  min="1"
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Autonomous Status Display */}
            <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/60">Autonomous Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  autonomousStatus === 'running' ? 'bg-accent/20 text-accent' :
                  autonomousStatus === 'completed' ? 'bg-accent/10 text-accent' :
                  autonomousStatus === 'stopped' ? 'bg-red-500/20 text-red-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {autonomousStatus.toUpperCase()}
                </span>
              </div>
              
              {currentSignal && (
                <div className="text-sm text-white/80 mb-2">
                  <div>Last Signal: <span className="font-medium">{currentSignal.direction}</span></div>
                  <div>Confidence: <span className="font-medium">{(currentSignal.confidence * 100).toFixed(1)}%</span></div>
                  <div>Reason: <span className="text-white/60">{currentSignal.reason}</span></div>
                </div>
              )}
              
              {spendingMode === 'auto' && agentAddress && spendingLimit && (
                <div className="text-sm text-white/80 mb-2 p-2 bg-accent/10 rounded">
                  <div>Agent Wallet: <span className="font-mono text-xs">{agentAddress.slice(0, 6)}...{agentAddress.slice(-4)}</span></div>
                  <div>Spending Limit: <span className="font-medium">${spendingLimit}</span></div>
                  <div>Current Bet: <span className="font-medium">{betAmount} HBAR ≈ ${(parseFloat(betAmount) * 0.17).toFixed(2)}</span></div>
                </div>
              )}
              
              {nextSignalTime && (
                <div className="text-sm text-white/60">
                  Next signal in: {Math.max(0, Math.floor((nextSignalTime - Date.now()) / 60000))} minutes
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3">
              {autonomousStatus === 'completed' ? (
                <div className="text-center">
                  <div className="text-green-300 text-sm mb-2">✅ Bet placed successfully!</div>
                  <button
                    onClick={() => {
                      setAutonomousStatus('idle')
                      setCurrentSignal(null)
                      setNextSignalTime(null)
                    }}
                    className="px-4 py-2 rounded-lg font-medium bg-accent text-gray-900 hover:brightness-110 transition-colors"
                  >
                    Reset for New Question
                  </button>
                </div>
              ) : !isAutonomousActive ? (
                <button
                  onClick={startAutonomousExecution}
                  disabled={!selectedQuestion && !customQuestion}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    (!selectedQuestion && !customQuestion)
                      ? 'bg-gray-600 cursor-not-allowed text-white/50'
                      : 'bg-accent text-gray-900 hover:brightness-110'
                  }`}
                >
                  Start Autonomous Trading
                </button>
              ) : (
                <button
                  onClick={stopAutonomousExecution}
                  className="px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  Stop Autonomous Trading
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Generate Signal Button */}
      <motion.div 
        initial={{opacity:0,y:8}} 
        animate={{opacity:1,y:0}} 
        transition={{delay:0.6}}
        className="mt-8"
      >
        <button
          onClick={async () => {
            try {
              setIsGenerating(true)
              await handleGenerateSignal()
            } finally {
              setIsGenerating(false)
            }
          }}
          disabled={(!selectedQuestion && !customQuestion) || isGenerating}
          className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
            (!selectedQuestion && !customQuestion) || isGenerating
              ? 'bg-gray-600 cursor-not-allowed text-white/50'
              : 'bg-accent text-gray-900 hover:brightness-110'
          }`}
        >
          {isGenerating
            ? 'Generating…'
            : (spendingMode === 'auto' ? 'Start Autonomous Trading' : 'Generate Trading Signal')}
        </button>
        <div className="text-center text-white/50 text-sm mt-3">
          {!selectedQuestion && !customQuestion 
            ? 'Please select or enter an analysis question to generate signals'
            : spendingMode === 'auto'
              ? 'AI will monitor signals and place ONE bet when BUY/SELL signal is detected'
            : 'AI will analyze selected data sources and generate profitable trading signals'
          }
        </div>
      </motion.div>

      {/* Additional Info */}
      <motion.div 
        initial={{opacity:0}} 
        animate={{opacity:1}} 
        transition={{delay:0.7}}
  className="mt-8 p-4 rounded-lg bg-accent/10 border border-accent/20"
      >
  <h4 className="font-semibold text-accent mb-2">How it works:</h4>
        <ul className="text-sm text-white/70 space-y-1">
          <li>• AI analyzes selected data sources in real-time</li>
          <li>• Generates predictions based on your risk tolerance</li>
          <li>• Provides specific buy/sell/hold recommendations</li>
          <li>• {spendingMode === 'auto' ? 'Monitors signals every hour and places ONE bet when BUY/SELL is detected' : 'You manually execute recommended trades'}</li>
        </ul>
      </motion.div>
    </section>
  )
}
