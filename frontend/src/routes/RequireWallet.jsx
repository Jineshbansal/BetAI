import React, { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'

export default function RequireWallet() {
  const { account } = useWallet()
  const location = useLocation()

  if (!account) {
    // Pop up a message once before redirecting
    return <GuardAlert to={location} />
  }
  return <Outlet />
}

function GuardAlert({ to }) {
  // Use sessionStorage to avoid duplicate alerts in React Strict Mode (double-mount in dev)
  useEffect(() => {
    try {
      const KEY = 'requireWalletGuardAlertOnce'
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1')
        alert('Please connect your wallet to access this section.')
        // Clear shortly after so subsequent attempts later can show again, but not twice immediately
        setTimeout(() => {
          try { sessionStorage.removeItem(KEY) } catch {}
        }, 1000)
      }
    } catch {}
  }, [])
  return <Navigate to="/" replace state={{ from: to }} />
}
