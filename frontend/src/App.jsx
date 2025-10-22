import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'

// cleaned: removed inline components; layout uses shared Header/Footer

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
