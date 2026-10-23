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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl p-6">
        <Image
          src="/images/logo-header.png"
          alt="La Cannelle"
          width={1438}
          height={439}
          priority
          quality={100}
          className="mx-auto h-auto w-full max-w-[320px] object-contain"
        />
        <h1 className="text-2xl font-bold text-gray-900">{t.auth.title}</h1>
        <p className="text-sm text-gray-600 mt-1">{t.auth.subtitle}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">{t.auth.loginLabel}</label>
            <input
              name="login"
              type="text"
              placeholder="lacannelle"
              autoComplete="username"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">{t.auth.passwordLabel}</label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? t.auth.signingIn : t.auth.submit}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <LoginInner />
    </Suspense>
  )
}
