import React from 'react'
import { motion } from 'framer-motion'
import { Database, Brain, Cpu, Gauge, Rocket, Activity } from 'lucide-react'

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const features = [
  { title: 'Market Data Ingestion', desc: 'APIs, news, social, and on-chain events streaming into the system.', Icon: Database },
  { title: 'Memory & Embeddings', desc: 'Vector DB + historical store for context-aware reasoning.', Icon: Brain },
  { title: 'AI Strategy Layer', desc: 'LLM + heuristics compose signals and candidate strategies.', Icon: Cpu },
  { title: 'Decision Engine', desc: 'Risk, sizing, and horizon selection based on constraints.', Icon: Gauge },
  { title: 'Execution Layer (Hedera)', desc: 'Intent-based building and settlement to Polymarket.', Icon: Rocket },
  { title: 'Monitoring & Dashboard', desc: 'Logging, backtests, and live alerts for transparency.', Icon: Activity },
]

export default function FeatureGrid() {
  return (
    <section className="relative mx-auto mt-16 max-w-6xl px-6">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 -z-10 radial-accent" />

      <div className="mb-8 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold heading-gradient">System Overview</h2>
        <p className="mt-3 text-white/70">A concise map of the core components powering autonomous trading.</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {features.map(({ title, desc, Icon }) => (
          <motion.div
            key={title}
            variants={item}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            className="relative overflow-hidden rounded-xl p-[1px]"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect()
              e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`)
              e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`)
            }}
          >
            {/* Animated gradient border */}
            {/* <div className="absolute inset-0 rounded-xl opacity-60 gradient-ring [mask-image:radial-gradient(250px_200px_at_var(--x,50%)_var(--y,50%),white,transparent)]" /> */}

            {/* Card content */}
            <div className="relative z-10 rounded-[11px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_20px_50px_rgba(6,214,160,0.18)]">
              <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-accent/10 px-2 py-1 text-accent">
                <Icon size={18} className="shrink-0" />
                <span className="text-xs tracking-wide">{title}</span>
              </div>
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm text-white/70">{desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
