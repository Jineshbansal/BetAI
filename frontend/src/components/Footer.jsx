import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="relative mx-auto mt-20 max-w-7xl border-t border-white/10 px-6 py-8 text-sm text-white/70">
      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        {/* Brand + Accent Dot */}
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_3px_rgba(6,214,160,0.5)]" />
          <span className="font-medium text-white/80">AI Trading & Prediction System</span>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>

        {/* Copyright */}
        <div className="text-white/50 tracking-wide">
          © {new Date().getFullYear()} AI Trading System
        </div>
      </div>

    </footer>
  )
}
