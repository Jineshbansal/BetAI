import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '../contexts/WalletContext'
import { ethers } from 'ethers'

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
  const [autonomousStatus, setAutonomousStatus] = useState('idle') // idle, running, stopped, fetching, error
  const [nextSignalTime, setNextSignalTime] = useState(null)
  const [betAmount, setBetAmount] = useState('10') // Default bet amount in HBAR
  const [questionId, setQuestionId] = useState(1) // Default question ID for betting
  const [statusMessage, setStatusMessage] = useState('') // Real-time status updates
  const [signalHistory, setSignalHistory] = useState([]) // Track signal history
  
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
  }

  // Function to fetch signal from backend
  const fetchSignal = async () => {
    setStatusMessage('🔄 Connecting to AI backend...')
    setAutonomousStatus('fetching')
    
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
          marketPrice: 0.65 // Default market price, can be made dynamic
        })
      })

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setCurrentSignal(data.signal)
        setStatusMessage(`✅ Signal received: ${data.signal.direction} (${(data.signal.confidence * 100).toFixed(1)}% confidence)`)
        
        // Add to history
        setSignalHistory(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          signal: data.signal
        }].slice(-5)) // Keep last 5 signals
        
        return data.signal
      } else {
        setStatusMessage('❌ Backend error: ' + (data.error || 'Unknown error'))
        console.error('Failed to generate signal:', data.error)
        return null
      }
    } catch (error) {
      console.error('Error fetching signal:', error)
      setStatusMessage(`❌ Cannot connect to backend: ${error.message}. Make sure Flask server is running on port 5000.`)
      setAutonomousStatus('error')
      return null
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

  // Function to place bet on contract (using ethers.js approach from PredictionMarket.jsx)
  const placeBet = async (outcomeIndex) => {
    if (!signer) {
      setStatusMessage('❌ Please connect your wallet first')
      return false
    }

    // Validate spending limit
    if (!validateSpendingLimit(betAmount)) {
      setStatusMessage('❌ Bet amount exceeds spending limit')
      return false
    }

    // Check wallet balance
    const balance = await checkBalance()
    if (balance !== null) {
      const betAmountNum = parseFloat(betAmount)
      const estimatedGasCost = 0.05 // Rough estimate for gas in HBAR
      const totalNeeded = betAmountNum + estimatedGasCost
      
      console.log(`Wallet balance: ${balance.toFixed(2)} HBAR`)
      console.log(`Bet amount: ${betAmountNum} HBAR`)
      console.log(`Estimated gas: ${estimatedGasCost} HBAR`)
      console.log(`Total needed: ${totalNeeded} HBAR`)
      
      if (balance < totalNeeded) {
        setStatusMessage(`❌ Insufficient balance! Need ${totalNeeded.toFixed(2)} HBAR, have ${balance.toFixed(2)} HBAR`)
        return false
      }
    }

    setStatusMessage(`💰 Placing bet: ${betAmount} HBAR on outcome ${outcomeIndex === 0 ? 'YES' : 'NO'}...`)

    try {
      // Import contract config
      const { CONTRACT_ADDRESS, contractABI } = await import('../contracts/config.js')
      
      const amountWei = ethers.parseUnits(String(betAmount).trim(), 18)
      const qId = BigInt(questionId)
      const oIdx = BigInt(outcomeIndex)
      
      const iface = new ethers.Interface(contractABI)
      const dataHex = iface.encodeFunctionData('placeBet', [qId, oIdx, amountWei])
      
      setStatusMessage('⏳ Waiting for wallet confirmation...')
      
      const txRequest = { 
        to: CONTRACT_ADDRESS, 
        data: dataHex, 
        value: ethers.toBeHex(amountWei), 
        gasLimit: 300000n 
      }
      
      const sent = await signer.sendTransaction(txRequest)
      setStatusMessage('⏳ Transaction submitted, waiting for confirmation...')
      
      const receipt = await sent.wait()
      console.log("✅ Transaction confirmed:", receipt)
      
      setStatusMessage(`✅ Bet placed successfully! Tx: ${receipt.hash.slice(0, 10)}...`)
      return true
      
    } catch (error) {
      console.error('Error placing bet:', error)
      
      // Provide more helpful error messages
      if (error.code === 'ACTION_REJECTED') {
        setStatusMessage('❌ Transaction rejected by user')
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        setStatusMessage(`❌ Insufficient funds for gas fees`)
      } else if (error.message?.includes('gas')) {
        setStatusMessage(`❌ Gas estimation failed. Check contract address and question ID.`)
      } else {
        setStatusMessage(`❌ Failed to place bet: ${error.message}`)
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

    if (!signer || !account) {
      alert('Please connect your wallet first')
      return
    }

    setIsAutonomousActive(true)
    setAutonomousStatus('running')
    setStatusMessage('🚀 Starting autonomous trading agent...')
    
    // Add a small delay to show the status update
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Fetch initial signal
    const signal = await fetchSignal()
    
    if (!signal) {
      setStatusMessage('❌ Failed to fetch signal. Check if backend is running.')
      setAutonomousStatus('error')
      setIsAutonomousActive(false)
      return
    }
    
    if (signal.direction === 'BUY') {
      setStatusMessage(`📊 BUY signal detected! Placing bet on YES...`)
      // Place bet for YES outcome (index 0) and stop
      const betPlaced = await placeBet(0)
      if (betPlaced) {
        setAutonomousStatus('completed')
        setIsAutonomousActive(false)
        alert('✅ Bet placed successfully! Autonomous trading completed for this question.')
        return
      } else {
        setAutonomousStatus('error')
        setIsAutonomousActive(false)
        return
      }
    } else if (signal.direction === 'SELL') {
      setStatusMessage(`📊 SELL signal detected! Placing bet on NO...`)
      // Place bet for NO outcome (index 1) and stop
      const betPlaced = await placeBet(1)
      if (betPlaced) {
        setAutonomousStatus('completed')
        setIsAutonomousActive(false)
        alert('✅ Bet placed successfully! Autonomous trading completed for this question.')
        return
      } else {
        setAutonomousStatus('error')
        setIsAutonomousActive(false)
        return
      }
    } else {
      // HOLD signal - continue monitoring
      setStatusMessage(`⏸️ HOLD signal received. Monitoring market... Next check in 1 hour.`)
      setAutonomousStatus('running')
    }

    // If we get HOLD, continue monitoring until we get BUY/SELL
    // Set up interval for continuous signal fetching (1 hour = 3600000 ms)
    // For testing, use 30 seconds: 30000 ms
    const checkInterval = 30000 // 30 seconds for testing, change to 3600000 for 1 hour
    
    intervalRef.current = setInterval(async () => {
      setStatusMessage('🔄 Checking for new signal...')
      const newSignal = await fetchSignal()
      
      if (!newSignal) {
        setStatusMessage('❌ Failed to fetch signal. Retrying next cycle...')
        setNextSignalTime(Date.now() + checkInterval)
        return
      }
      
      if (newSignal.direction === 'BUY') {
        setStatusMessage(`📊 BUY signal detected! Placing bet on YES...`)
        const betPlaced = await placeBet(0)
        if (betPlaced) {
          // Stop monitoring after successful bet placement
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setAutonomousStatus('completed')
          setIsAutonomousActive(false)
          setNextSignalTime(null)
          alert('✅ Bet placed successfully! Autonomous trading completed for this question.')
        } else {
          setStatusMessage('❌ Bet placement failed. Stopping autonomous trading.')
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setAutonomousStatus('error')
          setIsAutonomousActive(false)
          setNextSignalTime(null)
        }
      } else if (newSignal.direction === 'SELL') {
        setStatusMessage(`📊 SELL signal detected! Placing bet on NO...`)
        const betPlaced = await placeBet(1)
        if (betPlaced) {
          // Stop monitoring after successful bet placement
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setAutonomousStatus('completed')
          setIsAutonomousActive(false)
          setNextSignalTime(null)
          alert('✅ Bet placed successfully! Autonomous trading completed for this question.')
        } else {
          setStatusMessage('❌ Bet placement failed. Stopping autonomous trading.')
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setAutonomousStatus('error')
          setIsAutonomousActive(false)
          setNextSignalTime(null)
        }
      } else {
        // Still HOLD, continue monitoring
        setStatusMessage(`⏸️ HOLD signal. Continuing to monitor... Next check in ${checkInterval / 1000}s`)
      }
      
      // Update next signal time
      setNextSignalTime(Date.now() + checkInterval)
    }, checkInterval)

    // Set initial next signal time
    setNextSignalTime(Date.now() + checkInterval)
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
    setStatusMessage('⏹️ Autonomous trading stopped by user')
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
    <section className="mx-auto max-w-4xl px-6 pt-16">
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
                      ? 'border-blue-500 bg-blue-500/20 text-white'
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
                  ? 'border-green-500 bg-green-500/20 text-white'
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
                    ? 'border-blue-500 bg-blue-500/20 text-white'
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
            className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
            rows="3"
          />
        </div>
      </motion.div>

      {/* Execution Mode */}
      <motion.div 
        initial={{opacity:0,y:8}} 
        animate={{opacity:1,y:0}} 
        transition={{delay:0.5}}
        className="mt-6 rounded-lg border border-white/10 bg-white/5 p-6"
      >
        <h3 className="text-lg font-semibold mb-4">4. Execution Mode</h3>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={() => setSpendingMode('manual')}
              className={`flex-1 p-4 rounded-lg border transition-all ${
                spendingMode === 'manual'
                  ? 'border-blue-500 bg-blue-500/20 text-white'
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
                  ? 'border-blue-500 bg-blue-500/20 text-white'
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
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
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
                  className="w-full p-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-white/30 focus:border-blue-500 focus:outline-none"
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
          <h3 className="text-lg font-semibold mb-4">5. Autonomous Execution Settings</h3>
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
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/60">Autonomous Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  autonomousStatus === 'running' ? 'bg-green-500/20 text-green-300' :
                  autonomousStatus === 'fetching' ? 'bg-yellow-500/20 text-yellow-300' :
                  autonomousStatus === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                  autonomousStatus === 'stopped' ? 'bg-red-500/20 text-red-300' :
                  autonomousStatus === 'error' ? 'bg-red-500/20 text-red-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {autonomousStatus.toUpperCase()}
                </span>
              </div>
              
              {/* Real-time Status Message */}
              {statusMessage && (
                <div className="mb-3 p-2 rounded bg-blue-500/10 border border-blue-500/20">
                  <div className="text-sm text-blue-200">{statusMessage}</div>
                </div>
              )}
              
              {currentSignal && (
                <div className="text-sm text-white/80 mb-2 p-2 bg-white/5 rounded">
                  <div className="font-medium text-white mb-1">Latest Signal:</div>
                  <div>Direction: <span className={`font-medium ${
                    currentSignal.direction === 'BUY' ? 'text-green-400' :
                    currentSignal.direction === 'SELL' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>{currentSignal.direction}</span></div>
                  <div>Confidence: <span className="font-medium">{(currentSignal.confidence * 100).toFixed(1)}%</span></div>
                  <div>Reason: <span className="text-white/60">{currentSignal.reason}</span></div>
                </div>
              )}
              
              {/* Signal History */}
              {signalHistory.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-white/40 mb-2">Signal History:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {signalHistory.map((entry, idx) => (
                      <div key={idx} className="text-xs text-white/60 flex justify-between">
                        <span>{entry.timestamp}</span>
                        <span className={
                          entry.signal.direction === 'BUY' ? 'text-green-400' :
                          entry.signal.direction === 'SELL' ? 'text-red-400' :
                          'text-yellow-400'
                        }>
                          {entry.signal.direction} ({(entry.signal.confidence * 100).toFixed(0)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {spendingMode === 'auto' && agentAddress && spendingLimit && (
                <div className="text-sm text-white/80 mb-2 p-2 bg-blue-500/10 rounded">
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
                    className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
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
                      : 'bg-green-600 hover:bg-green-700 text-white'
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
          onClick={handleGenerateSignal}
          disabled={!selectedQuestion && !customQuestion}
          className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
            (!selectedQuestion && !customQuestion)
              ? 'bg-gray-600 cursor-not-allowed text-white/50'
              : spendingMode === 'auto' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {spendingMode === 'auto' ? 'Start Autonomous Trading' : 'Generate Trading Signal'}
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
        className="mt-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20"
      >
        <h4 className="font-semibold text-blue-300 mb-2">How it works:</h4>
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