import React from 'react'

export default function Privacy() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-16">
      <h1 className="text-2xl md:text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-3 text-white/70">We respect your privacy. This placeholder outlines how data may be processed in the future.</p>
      <ul className="mt-6 list-disc space-y-2 pl-6 text-white/70">
        <li>No personal data is collected without consent.</li>
        <li>Analytics may be aggregated and anonymized.</li>
        <li>Third-party providers will be documented here.</li>
      </ul>
      <p className="mt-6 text-white/60">Last updated: {new Date().toLocaleDateString()}</p>
    </section>
  )
}
