import React from 'react'
import { motion } from 'framer-motion'

export default function PredictionMarket() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-16">
      <motion.h2 initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.5}} className="text-2xl md:text-3xl font-semibold">
        Prediction Market
      </motion.h2>
      <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.1}} className="mt-3 text-white/70">
        Explore markets, view signals, and review historical outcomes. This is a placeholder page ready for wiring into
        your data sources and Polymarket integrations.
      </motion.p>
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1,2,3,4].map((i)=> (
          <motion.div key={i} initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-white/60">Market #{i}</div>
            <div className="mt-1 text-white">Coming soon…</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
