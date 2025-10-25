import React, { useState, useEffect } from 'react'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  PlayIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'

const Backtesting = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [markets, setMarkets] = useState([])
  const [config, setConfig] = useState({
    initialCapital: 1000,
    betSizePercent: 10
  })
  const [error, setError] = useState(null)

  // Fetch available markets on component mount
  useEffect(() => {
    fetchMarkets()
  }, [])

  const fetchMarkets = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/backtest/markets')
      const data = await response.json()
      
      if (data.success) {
        setMarkets(data.markets)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to fetch markets: ' + err.message)
    }
  }

  const runBacktest = async () => {
    setIsRunning(true)
    setError(null)
    setResults(null)

    try {
      const response = await fetch('http://localhost:5000/api/backtest/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      const data = await response.json()
      
      if (data.success) {
        setResults(data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to run backtest: ' + err.message)
    } finally {
      setIsRunning(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`
  }

  const getProfitColor = (profit) => {
    if (profit > 0) return 'text-green-600'
    if (profit < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getProfitIcon = (profit) => {
    if (profit > 0) return <ArrowUpIcon className="h-4 w-4 text-green-600" />
    if (profit < 0) return <ArrowDownIcon className="h-4 w-4 text-red-600" />
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Prediction Backtesting
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Test your AI's prediction accuracy against historical Polymarket data. 
            See how well your AI would have performed on resolved markets.
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Backtest Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Capital
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={config.initialCapital}
                  onChange={(e) => setConfig({...config, initialCapital: parseFloat(e.target.value) || 0})}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  step="1"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bet Size (% of capital)
              </label>
              <div className="relative">
                <ChartBarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  value={config.betSizePercent}
                  onChange={(e) => setConfig({...config, betSizePercent: parseFloat(e.target.value) || 0})}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="100"
                  step="1"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>Available Markets: <span className="font-semibold">{markets.length}</span></p>
              <p>Test Period: Last 20 resolved markets</p>
            </div>
            
            <button
              onClick={runBacktest}
              disabled={isRunning || markets.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-colors"
            >
              {isRunning ? (
                <>
                  <ClockIcon className="h-5 w-5 animate-spin" />
                  <span>Running Backtest...</span>
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5" />
                  <span>Run Backtest</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {results && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Backtest Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-600">Accuracy</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatPercentage(results.summary.accuracy)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-600">Final Capital</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(results.summary.finalCapital)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-purple-600">Total Profit</p>
                    <p className={`text-2xl font-bold ${getProfitColor(results.summary.totalProfit)}`}>
                      {formatCurrency(results.summary.totalProfit)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-orange-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-orange-600">ROI</p>
                    <p className={`text-2xl font-bold ${getProfitColor(results.summary.roi)}`}>
                      {formatPercentage(results.summary.roi)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-gray-600">Total Bets</p>
                <p className="text-xl font-semibold text-gray-900">{results.summary.totalBets}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Winning Bets</p>
                <p className="text-xl font-semibold text-green-600">{results.summary.winningBets}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Losing Bets</p>
                <p className="text-xl font-semibold text-red-600">
                  {results.summary.totalBets - results.summary.winningBets}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Results Table */}
        {results && results.results && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900">Detailed Results</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AI Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AI Prediction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actual Winner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bet Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit/Loss
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.results.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {result.question}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {formatPercentage(result.aiConfidence * 100)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.betOnYes ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.betOnYes ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {result.actualWinnerName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.aiCorrect ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(result.betAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center ${getProfitColor(result.profit)}`}>
                          {getProfitIcon(result.profit)}
                          <span className="ml-1 text-sm font-medium">
                            {formatCurrency(result.profit)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Backtesting
