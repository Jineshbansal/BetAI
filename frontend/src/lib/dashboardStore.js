// Simple localStorage-backed store for investments/trades to power the Dashboard

const KEY = 'investments_v1'

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function writeAll(arr) {
  try {
    localStorage.setItem(KEY, JSON.stringify(arr))
  } catch {}
}

export function addInvestment(entry) {
  const now = new Date()
  const item = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    date: entry?.date || now.toISOString(),
    role: entry?.role || 'User', // 'User' | 'AI' | 'Joint'
    questionId: Number(entry?.questionId ?? 0),
    question: entry?.question || '',
    outcomeIndex: Number(entry?.outcomeIndex ?? 0),
    amountHBAR: Number(entry?.amountHBAR ?? 0),
  }
  const all = readAll()
  all.push(item)
  writeAll(all)
  return item
}

export function getInvestments() {
  return readAll().sort((a, b) => new Date(b.date) - new Date(a.date))
}

// Compute user stats using resolved markets from backend
// resolved: [{ questionId, winningOutcome, endTime, question, outcomeNames }]
export function computeUserStats(resolved = []) {
  const events = readAll().filter(e => e.role === 'User' || e.role === 'Joint' || e.role === 'AI')
  const byQ = Object.fromEntries(resolved.map(r => [Number(r.questionId), r]))
  let trades = 0
  let profitHBAR = 0

  for (const ev of events) {
    if (!ev || !ev.questionId || !ev.amountHBAR) continue
    const r = byQ[Number(ev.questionId)]
    if (!r || !r.isResolved) continue // unresolved => skip PnL for now
    trades += 1
    if (Number(r.winningOutcome) === Number(ev.outcomeIndex)) {
      profitHBAR += Number(ev.amountHBAR)
    } else {
      profitHBAR -= Number(ev.amountHBAR)
    }
  }

  // Convert to USD using a simple fixed rate used across the app
  const HBAR_PRICE_USD = 0.17
  const netProfitUSD = profitHBAR * HBAR_PRICE_USD
  return { trades, netProfitUSD, profitHBAR }
}

export function clearInvestments() {
  writeAll([])
}
