import React from 'react'
import { motion } from 'framer-motion'
import FeatureGrid from '../components/FeatureGrid'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

function Hero() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 pt-16 text-center">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.h1 variants={item} className="text-3xl md:text-5xl font-semibold tracking-tight">
          AI Trading & Prediction System
        </motion.h1>
        <motion.p variants={item} className="mx-auto max-w-3xl text-base md:text-lg text-white/70">
          An autonomous AI-driven trading ecosystem integrating market data, strategy generation, and decentralized
          execution on Polymarket via Hedera.
        </motion.p>
        <motion.div variants={item} className="mx-auto mt-4 h-px w-40 bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
      </motion.div>
    </section>
  )
}


function Icon({ path }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-accent">
      <path d={path} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InfoCards() {
  const cards = [
    {
      title: 'Autonomous Agent',
      desc: 'Continuously scans markets, aggregates signals, and learns with embeddings and memory.',
      path: 'M11 2h2v3h-2V2Zm-7 8a6 6 0 1 1 12 0v6H4v-6ZM6.5 11.5h.01M13.5 11.5h.01',
    },
    {
      title: 'Prediction Layer',
      desc: 'LLM + heuristics generate strategies with risk-aware position sizing and horizons.',
      path: 'M4 20V6m5 14V10m5 10V4m5 16V12',
    },
    {
      title: 'Execution Engine',
      desc: 'Intent-based execution via Hedera to Polymarket; transparent logs and feedback.',
      path: 'M13 2 6 13h5l-1 9 7-11h-5l1-9Z',
    },
  ]
  return (
    <div className="mx-auto mt-12 max-w-6xl px-6">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {cards.map(({ title, desc, path }) => (
          <motion.div
            variants={item}
            key={title}
            className="card-hover relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(250px_200px_at_var(--x,50%)_var(--y,50%),white,transparent)] bg-accent/10" />
            <div className="relative z-10 flex items-start gap-4">
              <div className="rounded-md bg-accent/10 p-2 shadow-glow">
                <Icon path={path} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-white/70">{desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <InfoCards />
    </>
  )
}
