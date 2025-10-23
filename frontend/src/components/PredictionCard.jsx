import React, { useMemo, useState } from 'react'

export default function PredictionCard({ q, onPredict, accentClass = 'bg-accent', disabled }) {
  const [amount, setAmount] = useState('0.1')

  const totalPool = useMemo(() => {
    const tp = Number(q.totalMarketPool || 0)
    return isNaN(tp) ? 0 : tp
  }, [q])

  const percents = useMemo(() => {
    if (!q.outcomes || q.outcomes.length < 2) return [50, 50]
    const nums = q.outcomes.map(o => Number(o.totalBetAmount || 0))
    const sum = nums.reduce((a,b)=>a+b,0)
    if (sum <= 0) return [50, 50]
    return nums.map(n => Math.round((n/sum)*100))
  }, [q])

  const endDateStr = useMemo(() => {
    if (!q.endTime) return '—'
    const d = new Date(Number(q.endTime) * 1000)
    return d.toLocaleString()
  }, [q])

  const yesLabel = q.outcomes?.[0]?.name || 'Yes'
  const noLabel = q.outcomes?.[1]?.name || 'No'

  const marketClosed = Boolean(q.marketResolved) || (q.endTime && (Date.now()/1000 > Number(q.endTime)))

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 flex flex-col">
      <div className="text-white font-medium text-sm line-clamp-2">{q.question || `Question #${q.id}`}</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] text-white/60">{yesLabel}</div>
          <div className="mt-1 text-xl font-semibold text-white">{percents[0]}%</div>
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 p-3">
          <div className="text-[11px] text-white/60">{noLabel}</div>
          <div className="mt-1 text-xl font-semibold text-white">{percents[1]}%</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-white/60">
        <div>Volume: <span className="text-white/80">{String(q.totalMarketPool || '0')}</span></div>
        <div>•</div>
        <div>Deadline: <span className="text-white/80">{endDateStr}</span></div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          className="w-24 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-accent/60"
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
          placeholder="0.1"
        />
        <span className="text-xs text-white/60">HBAR</span>
        <div className="flex-1" />
        <button
          className={`rounded-md ${accentClass} px-3 py-1.5 text-sm font-medium text-background hover:opacity-95 disabled:opacity-50`}
          disabled={disabled || marketClosed}
          onClick={()=> onPredict?.(q.id, 0, amount)}
        >{yesLabel}</button>
        <button
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:text-white/90 disabled:opacity-50"
          disabled={disabled || marketClosed}
          onClick={()=> onPredict?.(q.id, 1, amount)}
        >{noLabel}</button>
      </div>
      {marketClosed && (
        <div className="mt-2 text-[11px] text-yellow-300/80">Betting closed.</div>
      )}
    </div>
  )}
