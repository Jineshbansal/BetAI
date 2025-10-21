import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [autoConnect, setAutoConnectState] = useState(() => {
    try { return localStorage.getItem('wallet:autoConnect') === 'true' } catch { return false }
  })
  const [chainId, setChainId] = useState(null)
  const [balance, setBalance] = useState('0.0000')
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)

  useEffect(() => {
    const { ethereum } = window
    if (!ethereum) return

    const handleAccountsChanged = (accs) => {
      if (accs && accs.length > 0) setAccount(accs[0])
      else setAccount(null)
    }
    const handleDisconnect = () => setAccount(null)

    ethereum.on?.('accountsChanged', handleAccountsChanged)
    ethereum.on?.('disconnect', handleDisconnect)
    ethereum.on?.('chainChanged', (cid) => {
      setChainId(cid)
      // balance may change with chain
      setTimeout(refreshBalance, 0)
    })

    // Only try to restore silently if the user opted-in to auto-connect
    if (autoConnect) {
      ethereum.request?.({ method: 'eth_accounts' })
        .then((accs) => {
          if (accs && accs.length > 0) setAccount(accs[0])
        })
        .catch(() => {})
    }
    // read initial chainId if available
    ethereum.request?.({ method: 'eth_chainId' }).then(setChainId).catch(() => {})

    return () => {
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged)
      ethereum.removeListener?.('disconnect', handleDisconnect)
    }
  }, [autoConnect])

  // Fetch balance whenever account or chainId changes
  useEffect(() => {
    if (!account) { setBalance('0.0000'); return }
    refreshBalance()
  }, [account, chainId])

  // Initialize ethers BrowserProvider once when ethereum is available
  useEffect(() => {
    const { ethereum } = window
    if (!ethereum) { setProvider(null); return }
    const prov = new ethers.BrowserProvider(ethereum)
    setProvider(prov)
  }, [])

  // Refresh signer when account or provider changes
  useEffect(() => {
    let cancelled = false
    async function fetchSigner() {
      try {
        if (!provider || !account) { setSigner(null); return }
        const s = await provider.getSigner()
        if (!cancelled) setSigner(s)
      } catch {
        if (!cancelled) setSigner(null)
      }
    }
    fetchSigner()
    return () => { cancelled = true }
  }, [provider, account])

  function formatEthFromHexWei(hexWei) {
    try {
      const wei = BigInt(hexWei)
      const etherInt = wei / 10n ** 18n
      const etherFrac = Number(wei % 10n ** 18n) / 1e18
      const ether = Number(etherInt) + etherFrac
      return ether.toFixed(4)
    } catch {
      return '0.0000'
    }
  }

  async function refreshBalance() {
    try {
      const { ethereum } = window
      if (!ethereum || !account) return
      const hex = await ethereum.request({ method: 'eth_getBalance', params: [account, 'latest'] })
      setBalance(formatEthFromHexWei(hex))
    } catch (e) {
      console.error('Failed to fetch balance', e)
    }
  }

  const connect = async () => {
    const { ethereum } = window
    if (!ethereum) {
      alert('MetaMask not found. Please install MetaMask to continue.')
      return
    }
    try {
      setIsConnecting(true)
      const accs = await ethereum.request({ method: 'eth_requestAccounts' })
      if (accs && accs.length > 0) setAccount(accs[0])
      const cid = await ethereum.request({ method: 'eth_chainId' })
      setChainId(cid)
      await refreshBalance()
    } catch (err) {
      console.error(err)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    // EIP-1193 does not define a standard disconnect. Clear local state.
    setAccount(null)
  }

  const setAutoConnect = (v) => {
    setAutoConnectState(v)
    try { localStorage.setItem('wallet:autoConnect', String(v)) } catch {}
  }

  const value = useMemo(
    () => ({ account, isConnecting, connect, disconnect, autoConnect, setAutoConnect, chainId, balance, refreshBalance, provider, signer }),
    [account, isConnecting, autoConnect, chainId, balance, provider, signer]
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
