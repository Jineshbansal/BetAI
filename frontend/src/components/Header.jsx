import React, { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import ConnectButton from './ConnectButton'

export default function Header() {
  const [open, setOpen] = useState(false)
  const links = [
    { label: 'Home', to: '/' },
    { label: 'Prediction Market', to: '/prediction-market' },
    { label: 'Custom AI Agent', to: '/custom-agent' },
  ]
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_20px_6px_rgba(6,214,160,0.55)]" />
          <span className="text-sm font-medium tracking-wider text-accent">AI TRADING</span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <nav className="flex items-center gap-6 text-sm">
            {links.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  `transition-colors ${isActive ? 'text-accent' : 'text-white/80 hover:text-white'}`
                }
                end={l.to === '/'}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <ConnectButton />
        </div>
        <button
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/80 hover:text-white"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/5 bg-background/95">
          <nav className="mx-auto flex max-w-7xl flex-col px-6 py-3 text-sm">
            {links.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-2 transition-colors ${isActive ? 'text-accent' : 'text-white/80 hover:text-white'}`
                }
                end={l.to === '/'}
              >
                {l.label}
              </NavLink>
            ))}
            <div className="py-2">
              <ConnectButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
