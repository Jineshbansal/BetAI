import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useWallet } from '../contexts/WalletContext'

function short(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''
}

export default function ConnectButton() {
  const { account, isConnecting, connect, disconnect, autoConnect, setAutoConnect, balance } = useWallet()
  const [open, setOpen] = useState(false)

  if (account) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-white/60 md:inline">{short(account)}</span>
        <span className="hidden text-xs text-white/60 md:inline">{balance} ETH</span>
        <button
          onClick={disconnect}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:text-white"
          title={account}
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        disabled={isConnecting}
        onClick={() => setOpen(true)}
        className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-95 disabled:opacity-60"
      >
        {isConnecting ? 'Connecting…' : 'Connect Wallet'}
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center p-4 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 my-8 w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-background p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Connect Wallet</h3>
              <p className="mt-1 text-sm text-white/70">Choose a wallet to continue. We currently support MetaMask.</p>
            </div>

            <div className="space-y-3">
              <button
                disabled={isConnecting}
                onClick={async () => {
                  await connect()
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left hover:border-accent/50"
              >
                <span className="text-white">MetaMask</span>
                <span className="text-xs text-white/50">EVM</span>
              </button>

              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={autoConnect}
                  onChange={(e) => setAutoConnect(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-accent focus:ring-accent"
                />
                Auto-connect next time
              </label>
            </div>

            <div className="mt-5 flex justify-end">
              <button onClick={() => setOpen(false)} className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:text-white">Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
