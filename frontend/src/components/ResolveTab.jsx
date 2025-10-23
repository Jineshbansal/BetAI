import React, { useState } from 'react'

export default function ResolveTab({ questions, isOwner, onResolve, onAddQuestion }) {
  const [selectedWinners, setSelectedWinners] = useState({})
  const [newQ, setNewQ] = useState('')
  const [newOutcomes, setNewOutcomes] = useState('Yes,No')
  const [newEndTime, setNewEndTime] = useState('') // unix seconds

  if (!isOwner) {
    return (
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
        ⚠️ Only the contract owner can resolve questions.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Owner-only: Add Question */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/60">Add Question</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs text-white/60">Question</label>
            <input value={newQ} onChange={(e)=>setNewQ(e.target.value)} placeholder="Will BTC close > $100k in 2025?" className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60" />
          </div>
          <div>
            <label className="block text-xs text-white/60">Outcomes (CSV)</label>
            <input value={newOutcomes} onChange={(e)=>setNewOutcomes(e.target.value)} placeholder="Yes,No" className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60" />
          </div>
          <div>
            <label className="block text-xs text-white/60">End time (unix seconds)</label>
            <input value={newEndTime} onChange={(e)=>setNewEndTime(e.target.value)} placeholder={`${Math.floor(Date.now()/1000) + 3600}`} className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent/60" />
          </div>
        </div>
        <button
          className="mt-3 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-background hover:opacity-95"
          onClick={() => onAddQuestion?.({ question: newQ, outcomesCsv: newOutcomes, endTime: newEndTime })}
        >Create</button>
      </div>

      {(questions || []).map(q => {
        const winner = selectedWinners[q.id] ?? 0
        return (
          <div key={q.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="text-white font-medium text-sm">{q.question || `Question #${q.id}`}</div>
            <div className="mt-2 text-xs text-white/70">ID: {q.id}</div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/80">
              {(q.outcomes || [{name:'Yes'},{name:'No'}]).map((o, idx) => (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`winner-${q.id}`}
                    checked={Number(winner) === idx}
                    onChange={() => setSelectedWinners(prev => ({ ...prev, [q.id]: idx }))}
                  />
                  <span>{o.name ?? (idx === 0 ? 'Yes' : 'No')}</span>
                </label>
              ))}
            </div>
            <div className="mt-3">
              <button
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-background hover:opacity-95 disabled:opacity-50"
                disabled={q.marketResolved === true}
                onClick={() => onResolve?.(q.id, Number(selectedWinners[q.id] ?? 0))}
              >Resolve</button>
              {q.marketResolved === true && (
                <span className="ml-3 text-[11px] text-white/60">Already resolved.</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
