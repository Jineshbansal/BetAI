import React from 'react'
import PredictionCard from './PredictionCard'

export default function PredictionGrid({ questions, onPredict, loading }) {
  return (
    <div>
      {loading && (
        <div className="mb-3 text-sm text-white/60">Loading markets…</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(questions || []).map(q => (
          <PredictionCard key={q.id} q={q} onPredict={onPredict} />
        ))}
      </div>
      {!loading && (!questions || questions.length === 0) && (
        <div className="text-sm text-white/60">No markets found.</div>
      )}
    </div>
  )
}
