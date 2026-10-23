'use client'

import { Suspense, useMemo, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { adminTranslations } from '@/lib/translations/admin'

function LoginInner() {
  const searchParams = useSearchParams()
  const nextUrl = useMemo(() => searchParams.get('next') || '/dashboard', [searchParams])
  const { t: rawT } = useTranslation('admin')
  const t = rawT as typeof adminTranslations.EN
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const login = (form.login as HTMLInputElement).value
    const password = (form.password as HTMLInputElement).value

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
      credentials: 'include',
    })

    setLoading(false)

    if (!res.ok) {
      let errorText = ''
      try {
        const data = await res.json()
        errorText = String((data as any)?.error ?? '')
      } catch {}

      if (res.status === 401) {
        setError(t.auth.invalidCredentials)
        return
      }

      setError(errorText || `Login failed (${res.status})`)
      return
    }

    window.location.href = nextUrl
  }

  return (
    <div className="relative min-h-screen bg-[#120d0a] flex items-center justify-center px-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(166,146,86,0.22),transparent_60%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#1b1510]/90 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur p-8 sm:p-10">
        <Image
          src="/images/logo-header-dark.png"
          alt="La Cannelle"
          width={1438}
          height={439}
          priority
          quality={100}
          className="mx-auto h-auto w-full max-w-[260px] object-contain"
        />
        <span className="mx-auto mt-6 block h-px w-10 bg-[color:var(--accent)]" />
        <h1 className="mt-6 text-center text-3xl font-display text-white">{t.auth.title}</h1>
        <p className="mt-2 text-center text-sm text-white/60">{t.auth.subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 mb-2">{t.auth.loginLabel}</label>
            <input
              name="login"
              type="text"
              placeholder="lacannelle"
              autoComplete="username"
              required
              className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40 focus:border-[color:var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70 mb-2">{t.auth.passwordLabel}</label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/40 focus:border-[color:var(--accent)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? t.auth.signingIn : t.auth.submit}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#120d0a]" />}>
      <LoginInner />
    </Suspense>
  )
}
