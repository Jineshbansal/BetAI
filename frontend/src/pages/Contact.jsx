import React, { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }
  function onSubmit(e) {
    e.preventDefault()
    // For now, simulate a submission
    setTimeout(() => setSent(true), 300)
  }

  return (
    <section className="mx-auto max-w-3xl px-6 pt-16">
      <h1 className="text-2xl md:text-3xl font-semibold">Contact</h1>
      <p className="mt-3 text-white/70">Have questions or partnerships in mind? Send us a note.</p>

      {sent ? (
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-white/80">
          Thanks! Your message was queued. For production, wire this to an API or email service.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-white/70">Name</label>
            <input name="name" value={form.name} onChange={onChange} required className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-white/40 focus:border-accent" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-sm text-white/70">Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} required className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-white/40 focus:border-accent" placeholder="jane@example.com" />
          </div>
          <div>
            <label className="block text-sm text-white/70">Message</label>
            <textarea name="message" value={form.message} onChange={onChange} rows="5" required className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 outline-none placeholder:text-white/40 focus:border-accent" placeholder="How can we help?" />
          </div>
          <button type="submit" className="rounded-md bg-accent px-4 py-2 font-medium text-background hover:opacity-95">Send</button>
        </form>
      )}
    </section>
  )
}
