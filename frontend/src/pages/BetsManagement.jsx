import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '../contexts/WalletContext'
import {
  getAllMarkets,
  getAllUserBets,
  hasUserClaimed,
  claimWinnings,
  calculateWinnings
} from '../lib/contractUtils'

export default function BetsManagement() {
  const { account, provider, signer } = useWallet()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markets, setMarkets] = useState([])
  const [userBets, setUserBets] = useState([])
  const [claimStatus, setClaimStatus] = useState({})
  const [claiming, setClaiming] = useState({})
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showDebug, setShowDebug] = useState(false)

  // Load all markets and user bets
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!provider) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      
      try {
        console.log('🔍 Loading markets...')
        // Fetch all markets
        const allMarkets = await getAllMarkets(provider)
        console.log('📊 Markets loaded:', allMarkets.length)
        if (cancelled) return
        setMarkets(allMarkets)

        // Fetch user bets if wallet is connected
        if (account) {
          console.log('👤 Fetching bets for account:', account)
          const bets = await getAllUserBets(provider, account)
          console.log('💰 User bets found:', bets.length, bets)
          if (cancelled) return
          setUserBets(bets)

          // Check claim status for each bet on resolved markets
          const claimStatuses = {}
          for (const bet of bets) {
            if (bet.marketData.marketResolved) {
              const claimed = await hasUserClaimed(provider, bet.questionId, account)
              claimStatuses[bet.questionId] = claimed
              console.log(`✅ Question ${bet.questionId} claim status:`, claimed)
            }
          }
          if (!cancelled) setClaimStatus(claimStatuses)
        } else {
          console.log('⚠️ No account connected')
          setUserBets([])
        }
      } catch (e) {
        console.error('❌ Error loading bets:', e)
        if (!cancelled) setError(e?.message || 'Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [provider, account, refreshTrigger])

  const handleClaim = async (questionId) => {
    if (!signer) {
      alert('Please connect your wallet first')
      return
    }

    setClaiming(prev => ({ ...prev, [questionId]: true }))
    try {
      await claimWinnings(signer, questionId)
      alert('Winnings claimed successfully!')
      // Refresh data
      setRefreshTrigger(prev => prev + 1)
    } catch (e) {
      console.error('Claim error:', e)
      alert(`Failed to claim: ${e?.message || 'Unknown error'}`)
    } finally {
      setClaiming(prev => ({ ...prev, [questionId]: false }))
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const isMarketEnded = (endTime) => {
    return Date.now() > endTime * 1000
  }

  // Calculate potential winnings for a user bet
  const getPotentialWinnings = (bet) => {
    if (!bet.marketData.marketResolved) return null
    
    const { marketData, outcomeIndex, amount } = bet
    const winningOutcome = marketData.winningOutcome
    
    if (outcomeIndex !== winningOutcome) return 0
    
    const totalWinningPool = marketData.outcomes[winningOutcome].totalBetAmount
    return calculateWinnings(amount, totalWinningPool, marketData.totalMarketPool)
  }

  const SectionCard = ({ title, children, className = '' }) => (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-5 ${className}`}>
      <div className="mb-4 text-lg font-semibold text-white/90">{title}</div>
      {children}
    </div>
  )

  const MarketCard = ({ market, userBet }) => {
    const ended = isMarketEnded(market.endTime)
    const resolved = market.marketResolved
    const potentialWinnings = userBet ? getPotentialWinnings(userBet) : null
    const hasClaimed = claimStatus[market.questionId]
    const isWinner = userBet && resolved && userBet.outcomeIndex === market.winningOutcome
    const isClaiming = claiming[market.questionId]

    return (
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white/90 mb-2">{market.question}</h4>
            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2 py-1 rounded ${resolved ? 'bg-green-500/20 text-green-300' : ended ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'}`}>
                {resolved ? 'Resolved' : ended ? 'Ended' : 'Active'}
              </span>
              <span className="text-white/50">ID: {market.questionId}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs text-white/70 mb-3">
          <div className="flex justify-between">
            <span>End Time:</span>
            <span className="text-white/90">{formatDate(market.endTime)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Pool:</span>
            <span className="text-white/90">{parseFloat(market.totalMarketPool).toFixed(4)} HBAR</span>
          </div>
        </div>

        {/* Outcomes */}
        <div className="mb-3">
          <div className="text-xs font-semibold text-white/60 mb-2">Outcomes:</div>
          <div className="space-y-1">
            {market.outcomes.map((outcome, idx) => (
              <div key={idx} className={`flex justify-between text-xs px-2 py-1 rounded ${resolved && idx === market.winningOutcome ? 'bg-green-500/20 text-green-300' : 'text-white/70'}`}>
                <span className="flex items-center gap-2">
                  {outcome.name}
                  {resolved && idx === market.winningOutcome && <span className="text-green-400">✓ Winner</span>}
                  {userBet && userBet.outcomeIndex === idx && <span className="text-blue-400">(Your Bet)</span>}
                </span>
                <span>{parseFloat(outcome.totalBetAmount).toFixed(4)} HBAR</span>
              </div>
            ))}
          </div>
        </div>

        {/* User bet info */}
        {userBet && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="text-xs font-semibold text-white/60 mb-2">Your Bet:</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-white/70">Outcome:</span>
                <span className="text-white/90">{userBet.outcomeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Amount:</span>
                <span className="text-white/90">{parseFloat(userBet.amount).toFixed(4)} HBAR</span>
              </div>
              
              {resolved && (
                <>
                  <div className="flex justify-between">
                    <span className="text-white/70">Result:</span>
                    <span className={isWinner ? 'text-green-400 font-semibold' : 'text-red-400'}>
                      {isWinner ? 'Won' : 'Lost'}
                    </span>
                  </div>
                  
                  {isWinner && potentialWinnings > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-white/70">Winnings:</span>
                        <span className="text-accent font-semibold">{potentialWinnings.toFixed(4)} HBAR</span>
                      </div>
                      
                      {!hasClaimed ? (
                        <button
                          onClick={() => handleClaim(market.questionId)}
                          disabled={isClaiming}
                          className="mt-2 w-full px-4 py-2 rounded-lg font-medium bg-accent text-gray-900 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isClaiming ? 'Claiming...' : 'Claim Winnings'}
                        </button>
                      ) : (
                        <div className="mt-2 text-center text-green-400 text-xs font-semibold">
                          ✓ Winnings Claimed
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!provider) {
    return (
      <section className="mx-auto max-w-7xl px-6 pt-16">
        <div className="text-center text-white/60">
          <p>Please connect your wallet to view bets</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pt-16 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl md:text-3xl font-semibold mb-2">Bets Management</h2>
        <p className="text-white/60 mb-4">View all markets and manage your bets</p>
        
        {/* Debug Toggle */}
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs px-3 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-white/60"
        >
          {showDebug ? '🔍 Hide Debug Info' : '🔍 Show Debug Info'}
        </button>
        
        {/* Debug Panel */}
        {showDebug && (
          <div className="mt-4 rounded-lg bg-black/40 border border-white/10 p-4 text-xs font-mono space-y-2">
            <div className="text-accent font-semibold">Debug Information:</div>
            <div><span className="text-white/50">Wallet Connected:</span> <span className="text-white">{account ? '✅ Yes' : '❌ No'}</span></div>
            {account && <div><span className="text-white/50">Account:</span> <span className="text-white">{account}</span></div>}
            <div><span className="text-white/50">Provider:</span> <span className="text-white">{provider ? '✅ Connected' : '❌ Not connected'}</span></div>
            <div><span className="text-white/50">Total Markets:</span> <span className="text-white">{markets.length}</span></div>
            <div><span className="text-white/50">Your Bets Found:</span> <span className="text-white">{userBets.length}</span></div>
            <div><span className="text-white/50">Contract Address:</span> <span className="text-white">0x53f25235e70380605ea794da768d9662ab72ad52</span></div>
            <div className="pt-2 text-white/50">💡 Open browser console (F12) for detailed logs</div>
          </div>
        )}
      </motion.div>

      {loading && (
        <div className="text-center py-8 text-white/60">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <p className="mt-2">Loading markets...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* User Connection Status */}
          {!account && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-3 text-blue-300 text-sm">
                💡 Connect your wallet to see your bets and claim winnings
              </div>
            </motion.div>
          )}

          {/* No Bets Message */}
          {account && userBets.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-yellow-300 text-sm">
                📊 You haven't placed any bets yet. Browse the markets below to get started!
              </div>
            </motion.div>
          )}

          {/* User's Bets Section */}
          {account && userBets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <SectionCard title={`Your Active Bets (${userBets.length})`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userBets.map((bet) => (
                    <MarketCard
                      key={`${bet.questionId}-${bet.outcomeIndex}`}
                      market={bet.marketData}
                      userBet={bet}
                    />
                  ))}
                </div>
              </SectionCard>
            </motion.div>
          )}

          {/* All Markets Section */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <SectionCard title={`All Markets (${markets.length})`}>
              {markets.length === 0 ? (
                <p className="text-white/60 text-center py-8">No markets found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {markets.map((market) => {
                    const userBet = userBets.find(b => b.questionId === market.questionId)
                    return (
                      <MarketCard
                        key={market.questionId}
                        market={market}
                        userBet={userBet}
                      />
                    )
                  })}
                </div>
              )}
            </SectionCard>
          </motion.div>

          {/* Summary Stats */}
          {account && userBets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-white/50 mb-1">Total Bets</div>
                <div className="text-2xl font-semibold text-accent">{userBets.length}</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-white/50 mb-1">Active Markets</div>
                <div className="text-2xl font-semibold text-accent">
                  {userBets.filter(b => !b.marketData.marketResolved).length}
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-wide text-white/50 mb-1">Resolved Markets</div>
                <div className="text-2xl font-semibold text-accent">
                  {userBets.filter(b => b.marketData.marketResolved).length}
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </section>
  )
}
