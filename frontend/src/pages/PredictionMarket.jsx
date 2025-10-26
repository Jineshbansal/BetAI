import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'
import { CONTRACT_ADDRESS, contractABI, HEDERA_CONTRACT_ID, HEDERA_TESTNET_CHAIN_ID_HEX, HEDERA_TESTNET_RPC } from '../contracts/config'
import PredictionGrid from '../components/PredictionGrid'
import ResolveTab from '../components/ResolveTab'
import { Client, ContractExecuteTransaction, Hbar, ContractFunctionParameters, PrivateKey, AccountId } from '@hashgraph/sdk'

export default function PredictionMarket() {
  const { account, signer, chainId } = useWallet()
  const [questionId, setQuestionId] = useState('0')
  const [market, setMarket] = useState(null)
  const [loadingMarket, setLoadingMarket] = useState(false)
  const [txPending, setTxPending] = useState(false)
  const [lastError, setLastError] = useState('')
  const [oracleAddr, setOracleAddr] = useState('')
  const [questionCount, setQuestionCount] = useState(null)
  const [hasCode, setHasCode] = useState(null)
  const [activeTab, setActiveTab] = useState('markets')
  const [questions, setQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  const [newQ, setNewQ] = useState('')
  const [newOutcomes, setNewOutcomes] = useState('Yes,No')
  const [newEndTime, setNewEndTime] = useState('')

  const [betOutcomeIndex, setBetOutcomeIndex] = useState('0')
  const [betAmount, setBetAmount] = useState('0.0')

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
      const idStr = String(id).trim()
      if (!/^\d+$/.test(idStr)) {
        setLastError('Question ID must be a non-negative integer')
        setMarket(null)
        return
      }
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
        const isBadData = callErr?.code === 'BAD_DATA' || String(callErr?.message || '').includes('could not decode result data')
        if (!isBadData) {
          setLastError(normalizeErr(callErr))
          setMarket(null)
          return
        }
        try {
          const q = await c.questions(BigInt(id))
          setMarket({
            question: q[0],
            outcomes: null,
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
  async function getQuestionById(id) {
    const c = readContract || contract
    if (!c) return null
    try {
      const res = await c.getMarket(BigInt(id))
      return {
        id,
        question: res[0],
        outcomes: (res[1] || []).map((o) => ({ name: o.name, totalBetAmount: o.totalBetAmount?.toString?.() || String(o.totalBetAmount) })),
        endTime: Number(res[2]),
        marketResolved: Boolean(res[3]),
        winningOutcome: Number(res[4]),
        totalMarketPool: res[5]?.toString?.() || String(res[5])
      }
    } catch (e) {
      try {
        const q = await c.questions(BigInt(id))
        return {
          id,
          question: q[0],
          outcomes: [{ name: 'Yes', totalBetAmount: '0' }, { name: 'No', totalBetAmount: '0' }],
          endTime: Number(q[1]),
          marketResolved: Boolean(q[2]),
          winningOutcome: Number(q[3]),
          totalMarketPool: q[4]?.toString?.() || String(q[4])
        }
      } catch {
        return null
      }
    }
  }
  async function fetchAllQuestions() {
    const c = readContract || contract
    if (!c) return
    setLoadingQuestions(true)
    try {
      setLastError('')
      const counter = await c.questionCounter().catch(() => 0n)
      const n = Number(counter || 0n)
      const items = []
      for (let i = 0; i < n; i++) {
        const q = await getQuestionById(i).catch(() => null)
        if (q && q.question) items.push(q)
      }
      if (items.length === 0) {
        for (let i = 1; i <= n; i++) {
          const q = await getQuestionById(i).catch(() => null)
          if (q && q.question) items.push(q)
        }
      }
      setQuestions(items)
    } catch (e) {
      setLastError(normalizeErr(e))
    } finally {
      setLoadingQuestions(false)
    }
  }

  useEffect(() => {
    if (questionId && (contract || readContract)) fetchMarket(questionId).catch(() => {})
  }, [questionId, contract, readContract])
  async function handleAddQuestion({ question, outcomesCsv, endTime }) {
    if (!contract) return
    if (!isOwner) { setLastError('Only owner can add questions.'); return }
    await ensureHederaTestnet()
    try {
      setTxPending(true)
      setLastError('')
      const qStr = String(question || '').trim()
      const outcomeArr = String(outcomesCsv || '').split(',').map(s => s.trim()).filter(Boolean)
      if (!qStr) throw new Error('Question cannot be empty')
      if (!outcomeArr.length) throw new Error('Provide at least one outcome (e.g., Yes,No)')
      const nowSec = Math.floor(Date.now()/1000)
      const endSec = Number(endTime) > 0 ? Number(endTime) : (nowSec + 3600)
      if (endSec <= nowSec) throw new Error('End time must be in the future (unix seconds)')

      let txResponse
      try {
        const fn = contract.getFunction ? contract.getFunction('addQuestion') : null
        if (fn && fn.populateTransaction) {
          const populated = await fn.populateTransaction(qStr, outcomeArr, BigInt(endSec))
          txResponse = await signer.sendTransaction({
            ...populated,
            gasLimit: populated.gasLimit ?? 500000n
          })
        } else {
          txResponse = await contract.addQuestion(qStr, outcomeArr, BigInt(endSec), { gasLimit: 500000n })
        }
      } catch (popErr) {
        txResponse = await contract.addQuestion(qStr, outcomeArr, BigInt(endSec), { gasLimit: 500000n })
      }
      await txResponse.wait()
      await fetchAllQuestions()
      try { const counter = await contract.questionCounter(); setQuestionCount(Number(counter)) } catch {}
    } catch (e) {
      const msg = normalizeErr(e)
      if (/circuit breaker/i.test(msg)) {
        setLastError('RPC circuit breaker is open. Please wait a minute and try again, or switch the Hedera Testnet RPC in your wallet settings.')
      } else {
        setLastError(msg)
      }
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
  useEffect(() => {
    if (contract || readContract) {
      fetchAllQuestions().catch(() => {})
    }
  }, [contract, readContract])

  const isOwner = useMemo(() => {
    if (!account || !oracleAddr) return false
    return account.toLowerCase() === oracleAddr.toLowerCase()
  }, [account, oracleAddr])

  async function handlePredict(qId, optionIndex, amountHBAR) {
    const ACC = String(import.meta.env.VITE_MY_ACCOUNT_ID || '').trim()
    const KEY = String(import.meta.env.VITE_MY_PRIVATE_KEY || '').trim()
    if (!ACC || !KEY) {
      setLastError('Missing Hedera operator keys. Create frontend/.env.local with VITE_MY_ACCOUNT_ID and VITE_MY_PRIVATE_KEY, then restart the dev server.')
      return
    }
    try {
      setTxPending(true)
      setLastError('')
      const amtStr = String(amountHBAR || '').trim()
      if (!amtStr || Number(amtStr) <= 0) throw new Error('Enter an amount greater than 0 (in HBAR).')

      const client = Client.forTestnet()
      let priv
      try {
        const keyNo0x = KEY.startsWith('0x') ? KEY.slice(2) : KEY
        if (/^0x[0-9a-fA-F]{64}$/.test(KEY)) {
          priv = PrivateKey.fromStringECDSA(KEY)
        } else if (/^(302e|302d|302c)/i.test(keyNo0x)) {
          priv = PrivateKey.fromStringDer(keyNo0x)
        } else if (/^[0-9a-fA-F]{64}$/.test(KEY)) {
          priv = PrivateKey.fromStringED25519(KEY)
        } else {
          priv = PrivateKey.fromString(KEY)
        }
      } catch (e) {
        throw new Error('Private key format not recognized.')
      }
      client.setOperator(AccountId.fromString(ACC), priv)
      const amountTinybars = Hbar.from(amtStr).toTinybars()

      const tx = new ContractExecuteTransaction()
        .setContractId(HEDERA_CONTRACT_ID)
        .setGas(200000)
        .setPayableAmount(Hbar.fromTinybars(amountTinybars))
        .setFunction(
          'placeBet',
          new ContractFunctionParameters()
            .addUint256(Number(qId))
            .addUint256(Number(optionIndex))
            .addUint256(amountTinybars)
        )

  const submit = await tx.execute(client)
  const receipt = await submit.getReceipt(client)
      const status = receipt.status?.toString?.() || String(receipt.status)
      if (!status.includes('SUCCESS')) throw new Error(`Transaction failed: ${status}`)

      await fetchAllQuestions()
    } catch (e) {
      const msg = normalizeErr(e)
      if (/INVALID_SIGNATURE/i.test(msg)) {
        setLastError('Invalid signature: The provided private key does not match the on-file key for account ' + ACC + '. Use the correct key for this account, or switch to the account that corresponds to this private key (ECDSA vs Ed25519 mismatch).')
      } else if (/circuit breaker/i.test(msg)) {
        setLastError('RPC circuit breaker is open. Please wait and try again, or switch RPC.')
      } else {
        setLastError(msg)
      }
    } finally {
      setTxPending(false)
    }
  }

  async function handleResolve(questionId, winnerIdx) {
    if (!contract || !signer) { setLastError('Connect wallet first.'); return }
    if (!isOwner) { setLastError('Only owner can resolve.'); return }
    await ensureHederaTestnet()
    try {
      setTxPending(true)
      setLastError('')
      const tx = await contract.resolveMarket(BigInt(questionId), BigInt(winnerIdx))
      await tx.wait()
      await fetchAllQuestions()
    } catch (e) {
      setLastError(normalizeErr(e))
    } finally {
      setTxPending(false)
    }
  }

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
      {/* Polymarket-style tabs */}
      <div className="mt-6">
        <div className="flex items-center gap-4 border-b border-white/10">
          <button
            className={`pb-2 text-sm ${activeTab==='markets' ? 'text-accent border-b-2 border-accent' : 'text-white/60'}`}
            onClick={()=>setActiveTab('markets')}
          >Markets</button>
          <button
            className={`pb-2 text-sm ${activeTab==='resolve' ? 'text-accent border-b-2 border-accent' : 'text-white/60'}`}
            onClick={()=>setActiveTab('resolve')}
          >Admin</button>
          <div className="flex-1" />
          {oracleAddr && (
            <div className="text-xs text-white/60">Owner: <span className="text-white/80">{oracleAddr.slice(0,6)}…{oracleAddr.slice(-4)}</span></div>
          )}
        </div>

        <div className="mt-4">
          {activeTab === 'markets' && (
            <PredictionGrid questions={questions} onPredict={handlePredict} loading={loadingQuestions} />
          )}
          {activeTab === 'resolve' && (
            <ResolveTab questions={questions} isOwner={isOwner} onResolve={handleResolve} onAddQuestion={handleAddQuestion} />
          )}
        </div>
      </div>
    </section>
  )
}
