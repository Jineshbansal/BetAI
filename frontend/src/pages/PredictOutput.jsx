import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function PredictOutput() {
  const [riskLevel, setRiskLevel] = useState('medium')
  const [dataSources, setDataSources] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState('')
  const [customQuestion, setCustomQuestion] = useState('')
  const [spendingMode, setSpendingMode] = useState('manual')
  const [agentAddress, setAgentAddress] = useState('')
  const [spendingLimit, setSpendingLimit] = useState('')

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

  const handleGenerateSignal = () => {
    // Generate prediction/signal based on configuration
    const predictionConfig = {
      riskLevel,
      dataSources,
      question: selectedQuestion || customQuestion,
      spendingMode,
      agentAddress: spendingMode === 'auto' ? agentAddress : null,
      spendingLimit: spendingMode === 'auto' ? spendingLimit : null
    }
    
    console.log('Generating prediction with config:', predictionConfig)
    
    // Here you would integrate with your AI/ML backend to generate the signal
    // For now, we'll simulate a response
    const simulatedPrediction = {
      asset: 'ETH/USDT',
      direction: 'BUY',
      confidence: '85%',
      timeframe: '24 hours',
      expectedReturn: '+5-8%',
      riskAssessment: 'Medium-High'
    }
    
    alert(`Prediction Generated!\n\nAsset: ${simulatedPrediction.asset}\nSignal: ${simulatedPrediction.direction}\nConfidence: ${simulatedPrediction.confidence}\nTimeframe: ${simulatedPrediction.timeframe}\nExpected Return: ${simulatedPrediction.expectedReturn}\nRisk: ${simulatedPrediction.riskAssessment}`)
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
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          Generate Trading Signal
        </button>
        <div className="text-center text-white/50 text-sm mt-3">
          {!selectedQuestion && !customQuestion 
            ? 'Please select or enter an analysis question to generate signals'
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
          <li>• {spendingMode === 'auto' ? 'Automatically executes trades within spending limit' : 'You manually execute recommended trades'}</li>
        </ul>
      </motion.div>
    </section>
  )
}