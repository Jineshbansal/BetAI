import React from 'react'

export default function Terms() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-16">
      <h1 className="text-2xl md:text-3xl font-semibold">Terms of Use</h1>
      <p className="mt-3 text-white/70">By using this site, you agree to these placeholder terms.</p>
      <ol className="mt-6 list-decimal space-y-2 pl-6 text-white/70">
        <li>This interface is for informational purposes only.</li>
        <li>Trading involves risk; conduct your own research.</li>
        <li>Services may change without notice.</li>
      </ol>
      <p className="mt-6 text-white/60">Last updated: {new Date().toLocaleDateString()}</p>
    </section>
  )
}
