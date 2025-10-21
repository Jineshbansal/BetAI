import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'
import { CONTRACT_ADDRESS, contractABI, HEDERA_CONTRACT_ID, HEDERA_TESTNET_CHAIN_ID_HEX, HEDERA_TESTNET_RPC } from '../contracts/config'

export default function PredictionMarket() {
  const { account, signer, chainId } = useWallet()
  const [questionId, setQuestionId] = useState('0')
  const [market, setMarket] = useState(null)
  const [loadingMarket, setLoadingMarket] = useState(false)
  const [txPending, setTxPending] = useState(false)
  const [lastError, setLastError] = useState('')
  const [oracleAddr, setOracleAddr] = useState('')
  const [questionCount, setQuestionCount] = useState(null)
  const [hasCode, setHasCode] = useState(null) // null=unknown, true/false once checked

  // addQuestion form
  const [newQ, setNewQ] = useState('')
  const [newOutcomes, setNewOutcomes] = useState('Yes,No')
  const [newEndTime, setNewEndTime] = useState('') // unix seconds

  // placeBet form
  const [betOutcomeIndex, setBetOutcomeIndex] = useState('0')
  const [betAmount, setBetAmount] = useState('0.0') // ETH as string

  const contract = useMemo(() => {
    try {
      if (!signer) return null
      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return null
      if (!Array.isArray(contractABI) || contractABI.length === 0) return null
      return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)
    } catch (e) {
      console.error('Failed to init contract', e)
      return null
    }
  }, [signer])

  // Read-only contract via Hedera RPC to avoid wallet network issues for reads
  const readContract = useMemo(() => {
    try {
      if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') return null
      if (!Array.isArray(contractABI) || contractABI.length === 0) return null
      const roProvider = new ethers.JsonRpcProvider(HEDERA_TESTNET_RPC)
      return new ethers.Contract(CONTRACT_ADDRESS, contractABI, roProvider)
    } catch (e) {
      console.error('Failed to init read-only contract', e)
      return null
    }
  }, [])

  // Check that the contract code exists at the address on Hedera Testnet
  useEffect(() => {
    let cancelled = false
    async function checkCode() {
      try {
        const roProvider = new ethers.JsonRpcProvider(HEDERA_TESTNET_RPC)
        const code = await roProvider.getCode(CONTRACT_ADDRESS)
        if (!cancelled) setHasCode(code && code !== '0x')
      } catch (e) {
        if (!cancelled) setHasCode(false)
      }
    }
    checkCode()
    return () => { cancelled = true }
  }, [])

  async function ensureHederaTestnet() {
    const { ethereum } = window
    if (!ethereum) return
    try {
      if (chainId !== HEDERA_TESTNET_CHAIN_ID_HEX) {
        await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: HEDERA_TESTNET_CHAIN_ID_HEX }] })
      }
    } catch (e) {
      // If chain is not added to wallet, attempt to add it (error code 4902)
      if (e && (e.code === 4902 || e.message?.includes('Unrecognized chain ID'))) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: HEDERA_TESTNET_CHAIN_ID_HEX,
              chainName: 'Hedera Testnet',
              nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
              rpcUrls: ['https://testnet.hashio.io/api'],
              blockExplorerUrls: ['https://hashscan.io/testnet']
            }]
          })
        } catch (addErr) {
          console.warn('Add network failed or rejected', addErr)
        }
      } else {
        console.warn('Switch network failed or rejected', e)
      }
    }
  }

  async function fetchMarket(id) {
    const c = readContract || contract
    if (!c) return
    setLoadingMarket(true)
    try {
      setLastError('')
      // Validate id is a non-negative integer
      const idStr = String(id).trim()
      if (!/^\d+$/.test(idStr)) {
        setLastError('Question ID must be a non-negative integer')
        setMarket(null)
        return
      }
      // Sanity check: ensure code exists at the address; helps diagnose BAD_DATA
      try {
        const roProvider = new ethers.JsonRpcProvider(HEDERA_TESTNET_RPC)
        const code = await roProvider.getCode(CONTRACT_ADDRESS)
        if (!code || code === '0x') {
          setHasCode(false)
          throw new Error('No contract code at this address on Hedera Testnet. Check EVM address or network.')
        } else {
          setHasCode(true)
        }
      } catch (codeErr) {
        throw codeErr
      }
      try {
        const res = await c.getMarket(BigInt(id))
        // res: [question, outcomes[], endTime, marketResolved, winningOutcome, totalMarketPool]
        const parsed = {
          question: res[0],
          outcomes: (res[1] || []).map((o) => ({ name: o.name, totalBetAmount: o.totalBetAmount?.toString?.() || String(o.totalBetAmount) })),
          endTime: Number(res[2]),
          marketResolved: Boolean(res[3]),
          winningOutcome: Number(res[4]),
          totalMarketPool: res[5]?.toString?.() || String(res[5])
        }
        setMarket(parsed)
      } catch (callErr) {
        // Fallback: some RPCs may return 0x for tuple[] returns; try minimal questions() read
        const isBadData = callErr?.code === 'BAD_DATA' || String(callErr?.message || '').includes('could not decode result data')
        if (!isBadData) {
          setLastError(normalizeErr(callErr))
          setMarket(null)
          return
        }
        try {
          const q = await c.questions(BigInt(id))
          // q: [question, endTime, marketResolved, winningOutcome, totalMarketPool]
          setMarket({
            question: q[0],
            outcomes: null, // unknown
            endTime: Number(q[1]),
            marketResolved: Boolean(q[2]),
            winningOutcome: Number(q[3]),
            totalMarketPool: q[4]?.toString?.() || String(q[4]),
            _fallback: true
          })
          setLastError('Note: getMarket() decoding failed on this RPC. Showing basic market info; outcomes not available.')
        } catch (qErr) {
          setLastError('This RPC did not return decodable data for getMarket(). Try a different RPC or a lighter view method.')
          setMarket(null)
          return
        }
      }
    } catch (e) {
      console.error(e)
      setLastError(normalizeErr(e))
      setMarket(null)
    } finally {
      setLoadingMarket(false)
    }
  }

  useEffect(() => {
    // auto fetch on questionId change if valid
    if (questionId && (contract || readContract)) fetchMarket(questionId).catch(() => {})
  }, [questionId, contract, readContract])

  async function onAddQuestion(e) {
    e.preventDefault()
    if (!contract) return
    await ensureHederaTestnet()
    try {
      setTxPending(true)
      setLastError('')
      const outcomeArr = newOutcomes.split(',').map(s => s.trim()).filter(Boolean)
      const end = BigInt(newEndTime || Math.floor(Date.now()/1000) + 3600)
      const tx = await contract.addQuestion(newQ, outcomeArr, end)
      const receipt = await tx.wait()
      console.log('Question added', receipt)
      // Try refetch the latest counter to hint the new ID
      try { const counter = await contract.questionCounter(); setQuestionCount(Number(counter)); setQuestionId(String(counter)) } catch {}
    } catch (e) {
      console.error(e)
      setLastError(normalizeErr(e))
    } finally {
      setTxPending(false)
    }
  }

  async function onPlaceBet(e) {
    e.preventDefault()
    if (!contract) return
    await ensureHederaTestnet()
    try {
      setTxPending(true)
      setLastError('')
      const amountWei = ethers.parseEther(betAmount || '0')
      const tx = await contract.placeBet(BigInt(questionId), BigInt(betOutcomeIndex), amountWei, { value: amountWei })
      const receipt = await tx.wait()
      console.log('Bet placed', receipt)
      await fetchMarket(questionId)
    } catch (e) {
      console.error(e)
      setLastError(normalizeErr(e))
    } finally {
      setTxPending(false)
    }
  }

  async function onResolve(e) {
    e.preventDefault()
    if (!contract) return
    await ensureHederaTestnet()
    try {
      setTxPending(true)
      setLastError('')
      const tx = await contract.resolveMarket(BigInt(questionId), BigInt(betOutcomeIndex))
      const receipt = await tx.wait()
      console.log('Resolved', receipt)
      await fetchMarket(questionId)
    } catch (e) {
      console.error(e)
      setLastError(normalizeErr(e))
    } finally {
      setTxPending(false)
    }
  }

  async function onClaim(e) {
    e.preventDefault()
    if (!contract) return
    await ensureHederaTestnet()
    try {
      setTxPending(true)
      setLastError('')
      const tx = await contract.claimWinnings(BigInt(questionId))
      const receipt = await tx.wait()
      console.log('Claimed', receipt)
      await fetchMarket(questionId)
    } catch (e) {
      console.error(e)
      setLastError(normalizeErr(e))
    } finally {
      setTxPending(false)
    }
  }

  // Helper to prettify common EVM errors
  function normalizeErr(e) {
    try {
      if (!e) return 'Unknown error'
      if (typeof e === 'string') return e
      if (e.reason) return e.reason
      if (e.error?.message) return e.error.message
      if (e.data?.message) return e.data.message
      if (e.message) return e.message
      return JSON.stringify(e)
    } catch { return 'Unknown error' }
  }

  // Fetch some globals (oracle, counter)
  useEffect(() => {
    let cancelled = false
    async function loadGlobals() {
      if (!contract) return
      try {
        const [o, c] = await Promise.all([
          contract.oracle().catch(() => ''),
          contract.questionCounter().catch(() => null)
        ])
        if (!cancelled) {
          setOracleAddr(String(o || ''))
          setQuestionCount(c != null ? Number(c) : null)
        }
      } catch {}
    }
    loadGlobals()
    return () => { cancelled = true }
  }, [contract])

  return (
    <section className="mx-auto max-w-4xl px-6 pt-16">
      <motion.h2 initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.5}} className="text-2xl md:text-3xl font-semibold">
        Prediction Market
      </motion.h2>
      <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.1}} className="mt-3 text-white/70">
        Connected wallet interactions with the deployed Hedera contract.
      </motion.p>
      {lastError && (
        <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {lastError}
        </div>
      )}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Wallet</div>
          <div className="mt-1 text-white text-sm">{account ? `${account.slice(0,6)}…${account.slice(-4)}` : 'Not connected'}</div>
          <div className="mt-1 text-white/70 text-xs">ChainId: {chainId || '—'}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Contract</div>
          <div className="mt-1 text-white text-sm break-all">ID: {HEDERA_CONTRACT_ID}</div>
          <div className="mt-1 text-white/70 text-xs break-all">EVM: {CONTRACT_ADDRESS}</div>
          <div className="mt-2 text-xs">
            <span className={contract ? 'text-green-400' : 'text-red-400'}>
              {contract ? 'Ready' : 'Awaiting valid ABI/address/signer'}
            </span>
          </div>
          <div className="mt-1 text-xs text-white/70">Code on Hedera: {hasCode == null ? 'checking…' : hasCode ? 'yes' : 'no'}</div>
          <div className="mt-2 text-xs text-white/70 break-all">Oracle: {oracleAddr || '—'}</div>
          <div className="mt-1 text-xs text-white/70">questionCounter: {questionCount ?? '—'}</div>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <motion.div initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Query Market</div>
          <form className="mt-3 space-y-2" onSubmit={(e)=>{e.preventDefault(); fetchMarket(questionId)}}>
            <label className="block text-xs text-white/60">Question ID</label>
            <input value={questionId} onChange={(e)=>setQuestionId(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60" />
            <button className="mt-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-background hover:opacity-95 disabled:opacity-50" disabled={!contract || loadingMarket}>
              {loadingMarket ? 'Loading…' : 'Fetch'}
            </button>
          </form>
          {market && (
            <div className="mt-4 text-sm">
              <div className="text-white">{market.question}</div>
              <div className="mt-1 text-white/70">End time: {market.endTime} (unix)</div>
              <div className="mt-1 text-white/70">Resolved: {String(market.marketResolved)}</div>
              <div className="mt-1 text-white/70">Winning Outcome: {market.winningOutcome}</div>
              <div className="mt-1 text-white/70">Total Pool: {market.totalMarketPool}</div>
              {market.outcomes ? (
                <>
                  <div className="mt-2 text-white/80">Outcomes:</div>
                  <ul className="mt-1 list-disc pl-4 text-white/80">
                    {(market.outcomes||[]).map((o, idx)=> (
                      <li key={idx}>{idx}. {o.name} — {o.totalBetAmount}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="mt-2 text-xs text-white/60">Outcomes could not be decoded from RPC; consider using a different RPC or adding a lighter view to the contract.</div>
              )}
            </div>
          )}
        </motion.div>

        <motion.div initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Add Question</div>
          <form className="mt-3 space-y-2" onSubmit={onAddQuestion}>
            <label className="block text-xs text-white/60">Question</label>
            <input value={newQ} onChange={(e)=>setNewQ(e.target.value)} placeholder="Will ETH > $5k by EOY?" className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60" />
            <label className="block text-xs text-white/60">Outcome names (comma-separated)</label>
            <input value={newOutcomes} onChange={(e)=>setNewOutcomes(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60" />
            <label className="block text-xs text-white/60">End time (unix seconds)</label>
            <input value={newEndTime} onChange={(e)=>setNewEndTime(e.target.value)} placeholder={`${Math.floor(Date.now()/1000) + 3600}`} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60" />
            {!account && <div className="text-xs text-white/50">Connect wallet to create questions.</div>}
            <button className="mt-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-background hover:opacity-95 disabled:opacity-50" disabled={!contract || txPending || !account}>
              {txPending ? 'Submitting…' : 'Create'}
            </button>
          </form>
        </motion.div>

        <motion.div initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Place Bet</div>
          <form className="mt-3 space-y-2" onSubmit={onPlaceBet}>
            <label className="block text-xs text-white/60">Question ID</label>
            <input value={questionId} onChange={(e)=>setQuestionId(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60" />
            <label className="block text-xs text-white/60">Outcome Index</label>
            <input value={betOutcomeIndex} onChange={(e)=>setBetOutcomeIndex(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60" />
            <label className="block text-xs text-white/60">Amount (HBAR/ETH units)</label>
            <input value={betAmount} onChange={(e)=>setBetAmount(e.target.value)} placeholder="0.1" className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60" />
            <button className="mt-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-background hover:opacity-95 disabled:opacity-50" disabled={!contract || txPending}>
              {txPending ? 'Submitting…' : 'Bet'}
            </button>
          </form>
        </motion.div>

        <motion.div initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-white/60">Resolve / Claim</div>
          <form className="mt-3 space-y-2" onSubmit={onResolve}>
            <label className="block text-xs text-white/60">Question ID</label>
            <input value={questionId} onChange={(e)=>setQuestionId(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60" />
            <label className="block text-xs text-white/60">Winning Outcome Index</label>
            <input value={betOutcomeIndex} onChange={(e)=>setBetOutcomeIndex(e.target.value)} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60" />
            <div className="flex gap-2">
              <button type="submit" className="mt-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-background hover:opacity-95 disabled:opacity-50" disabled={!contract || txPending || !account || (oracleAddr && account && account.toLowerCase() !== oracleAddr.toLowerCase())}>
                {txPending ? 'Submitting…' : 'Resolve'}
              </button>
              <button type="button" onClick={onClaim} className="mt-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:text-white/90 disabled:opacity-50" disabled={!contract || txPending}>
                Claim Winnings
              </button>
            </div>
            {account && oracleAddr && account.toLowerCase() !== oracleAddr.toLowerCase() && (
              <div className="text-xs text-yellow-300/80 mt-1">Only oracle can resolve markets.</div>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  )
}
