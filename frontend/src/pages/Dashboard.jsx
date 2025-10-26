import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aiStats, setAiStats] = useState({ netProfit: 0, trades: 0 })
  const [userStats, setUserStats] = useState({ netProfit: 0, trades: 0 })
  const [investments, setInvestments] = useState([])
  const [pnlSeries, setPnlSeries] = useState({ labels: [], user: [], ai: [], joint: [] })

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        // 1) Fetch AI backtest to drive AI stats and AI line
        const backtestRes = await fetch('http://localhost:5000/api/backtest/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initialCapital: 1000, betSizePercent: 10 }),
        })
        const backtest = await backtestRes.json()

        // 2) Fetch resolved markets to compute user stats from recorded investments
        const marketsRes = await fetch('http://localhost:5000/api/backtest/markets')
        const marketsJson = await marketsRes.json()
        const resolved = marketsJson?.markets || []

        // 3) Read investments from localStorage
        const { getInvestments, computeUserStats } = await import('../lib/dashboardStore')
        const inv = getInvestments()

        // Compute user stats by joining with resolved
        const user = computeUserStats(resolved)

        // Build AI stats
        let ai = { netProfit: 0, trades: 0 }
        let labels = []
        let aiLine = []
        if (backtest?.success) {
          const summary = backtest.summary || {}
          ai.trades = summary.totalBets || 0
          ai.netProfit = Number(summary.totalProfit || 0)
          // Build a cumulative line from results
          const results = Array.isArray(backtest.results) ? backtest.results : []
          results.sort((a,b)=> (a.timestamp||0) - (b.timestamp||0))
          let cum = 0
          labels = results.map((r, idx) => `#${idx+1}`)
          aiLine = results.map(r => { cum += Number(r.profit || 0); return cum })
        }

        // Build user line (HBAR -> USD conversion consistent with store)
        const HBAR_PRICE_USD = 0.17
        const userLine = []
        let userCumUSD = 0
        // For simplicity, map each investment to +amount or -amount upon resolution order by date
        const invSorted = [...inv].sort((a,b)=> new Date(a.date)-new Date(b.date))
        for (const e of invSorted) {
          const r = resolved.find(m => Number(m.questionId) === Number(e.questionId))
          if (!r || !r.isResolved) continue
          const pnlHBAR = Number(r.winningOutcome) === Number(e.outcomeIndex) ? Number(e.amountHBAR) : -Number(e.amountHBAR)
          userCumUSD += pnlHBAR * HBAR_PRICE_USD
          userLine.push(userCumUSD)
        }

        const maxLen = Math.max(aiLine.length, userLine.length)
        const paddedLabels = labels.length === maxLen ? labels : Array.from({ length: maxLen }, (_, i) => `#${i+1}`)
        const paddedUser = userLine.length === maxLen ? userLine : [...userLine, ...Array(maxLen - userLine.length).fill(userCumUSD)]
        const paddedAi = aiLine.length === maxLen ? aiLine : [...aiLine, ...Array(maxLen - aiLine.length).fill(aiLine[aiLine.length-1] || 0)]
        const joint = paddedUser.map((v, i) => v + (paddedAi[i] || 0))

        if (!cancelled) {
          setAiStats(ai)
          setUserStats({ netProfit: user.netProfitUSD, trades: user.trades })
          setInvestments(inv)
          setPnlSeries({ labels: paddedLabels, user: paddedUser, ai: paddedAi, joint })
        }
      } catch (e) {
        if (!cancelled) setError(String(e?.message || e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const chartData = useMemo(() => ({
    labels: pnlSeries.labels,
    datasets: [
      { label: 'User', data: pnlSeries.user, borderColor: '#60a5fa', backgroundColor: 'rgba(96,165,250,0.15)', tension: 0.3 },
      { label: 'AI Agent', data: pnlSeries.ai, borderColor: '#06d6a0', backgroundColor: 'rgba(6,214,160,0.15)', tension: 0.3 },
      { label: 'Joint', data: pnlSeries.joint, borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.15)', tension: 0.3 },
    ],
  }), [pnlSeries])

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: 'rgba(255,255,255,0.8)' } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
      y: { ticks: { color: 'rgba(255,255,255,0.6)' }, grid: { color: 'rgba(255,255,255,0.06)' } },
    },
  }

  const jointStats = { netProfit: (userStats.netProfit || 0) + (aiStats.netProfit || 0), trades: (userStats.trades || 0) + (aiStats.trades || 0) }

  const SectionCard = ({ title, children }) => (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 text-sm font-semibold text-white/80">{title}</div>
      {children}
    </div>
  )

  const Stat = ({ label, value, accent }) => (
    <div>
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${accent ? 'text-accent' : ''}`}>{value}</div>
    </div>
  )

  return (
    <section className="mx-auto max-w-7xl px-6 pt-16">
      <motion.h2 initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.5}} className="text-2xl md:text-3xl font-semibold">
        Dashboard
      </motion.h2>

      {/* Top grid: User / AI / Joint */}
      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard title="User">
          <div className="flex items-center justify-between">
            <Stat label="Net Profit (USD)" value={`$${Number(userStats.netProfit || 0).toFixed(2)}`} accent />
            <Stat label="Trades" value={Number(userStats.trades || 0)} />
          </div>
        </SectionCard>
        <SectionCard title="AI Agent">
          <div className="flex items-center justify-between">
            <Stat label="Net Profit (USD)" value={`$${Number(aiStats.netProfit || 0).toFixed(2)}`} accent />
            <Stat label="Trades" value={Number(aiStats.trades || 0)} />
          </div>
        </SectionCard>
        <SectionCard title="Joint">
          <div className="flex items-center justify-between">
            <Stat label="Net Profit (USD)" value={`$${Number(jointStats.netProfit || 0).toFixed(2)}`} accent />
            <Stat label="Trades" value={Number(jointStats.trades || 0)} />
          </div>
        </SectionCard>
      </motion.div>

      {/* Chart */}
      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="mb-3 text-sm font-semibold text-white/80">Profit / Loss Over Time</div>
        <div className="h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
        {loading && <div className="text-xs text-white/60 mt-2">Loading…</div>}
        {error && <div className="text-xs text-red-300 mt-2">{error}</div>}
      </motion.div>

      {/* Investments list with CTA */}
      <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.25}} className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Recent Investments</h3>
          <a href="#all-investments" className="px-4 py-2 rounded-lg font-medium bg-accent text-gray-900 hover:brightness-110 transition-colors">View full list</a>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Question</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Amount (HBAR)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {investments.map((row) => (
                <tr key={row.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-sm text-white/80">{row.question}</td>
                  <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded text-xs font-medium ${row.role === 'User' ? 'bg-blue-500/15 text-blue-300' : row.role === 'AI' ? 'bg-accent/20 text-accent' : 'bg-amber-500/15 text-amber-300'}`}>{row.role}</span></td>
                  <td className="px-4 py-3 text-sm text-white/80">{row.amountHBAR}</td>
                  <td className="px-4 py-3 text-sm text-white/60">{new Date(row.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Full list anchor */}
      <motion.div id="all-investments" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="mb-3 text-sm font-semibold text-white/80">All Question Investments</div>
        <ul className="space-y-2 text-white/80 text-sm list-disc pl-5">
          {investments.map((row) => (
            <li key={`full-${row.id}`}>{row.question} — {row.amountHBAR} HBAR ({row.role})</li>
          ))}
        </ul>
      </motion.div>
    </section>
  )
}
