'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { teamApi } from '@/lib/api/team'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { L } from '@/lib/i18n/inline'

export default function AcceptInvite() {
  const params = useParams<{ token: string }>()
  const token = String(params?.token ?? '')
  const { language } = useTranslation('admin')
  const t = (de: string, en: string) => L(language, de, en)

  const [invite, setInvite] = useState<{ email: string; role: string } | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'invalid' | 'done'>('loading')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    teamApi
      .inspectInvite(token)
      .then((data) => {
        setInvite(data)
        setState('ready')
      })
      .catch(() => setState('invalid'))
  }, [token])

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const firstName = (form.firstName as unknown as HTMLInputElement).value.trim()
    const lastName = (form.lastName as unknown as HTMLInputElement).value.trim()
    const password = (form.password as unknown as HTMLInputElement).value
    const confirm = (form.confirm as unknown as HTMLInputElement).value
    if (password.length < 10) return setError(t('Das Passwort braucht mindestens 10 Zeichen.', 'The password needs at least 10 characters.'))
    if (password !== confirm) return setError(t('Die Passwörter stimmen nicht überein.', 'The passwords do not match.'))

    setBusy(true)
    try {
      await teamApi.acceptInvite(token, { firstName, lastName, password })
      setState('done')
    } catch (err: any) {
      setError(err?.message || t('Das hat nicht geklappt.', 'That did not work.'))
    } finally {
      setBusy(false)
    }
  }

  const input =
    'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 focus:border-[color:var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]/30'
  const label = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70'

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#120d0a] px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(166,146,86,0.22),transparent_60%)]" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#1b1510]/90 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur sm:p-10">
        <Image src="/images/logo-header-dark.png" alt="La Cannelle" width={1438} height={439} priority className="mx-auto h-auto w-full max-w-[240px] object-contain" />
        <span className="mx-auto mt-6 block h-px w-10 bg-[color:var(--accent)]" />

        {state === 'loading' && <p className="mt-8 text-center text-white/70">{t('Einladung wird geprüft…', 'Checking your invitation…')}</p>}

        {state === 'invalid' && (
          <div className="mt-8 text-center">
            <h1 className="font-display text-2xl text-white">{t('Einladung ungültig', 'Invitation not valid')}</h1>
            <p className="mt-3 text-sm text-white/65">
              {t('Der Link ist abgelaufen oder wurde bereits verwendet. Bitten Sie um eine neue Einladung.', 'The link has expired or was already used. Ask for a new invitation.')}
            </p>
          </div>
        )}

        {state === 'done' && (
          <div className="mt-8 text-center">
            <h1 className="font-display text-2xl text-white">{t('Willkommen im Team', 'Welcome to the team')}</h1>
            <p className="mt-3 text-sm text-white/65">{t('Ihr Konto ist bereit. Sie können sich jetzt anmelden.', 'Your account is ready. You can sign in now.')}</p>
            <a href="/login" className="btn-accent mt-6 inline-flex">{t('Zur Anmeldung', 'Go to sign in')}</a>
          </div>
        )}

        {state === 'ready' && invite && (
          <>
            <h1 className="mt-6 text-center font-display text-3xl text-white">{t('Konto einrichten', 'Set up your account')}</h1>
            <p className="mt-2 text-center text-sm text-white/60">
              {invite.email} · {invite.role}
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="firstName">{t('Vorname', 'First name')}</label>
                  <input id="firstName" name="firstName" required autoComplete="given-name" className={input} />
                </div>
                <div>
                  <label className={label} htmlFor="lastName">{t('Nachname', 'Last name')}</label>
                  <input id="lastName" name="lastName" required autoComplete="family-name" className={input} />
                </div>
              </div>
              <div>
                <label className={label} htmlFor="password">{t('Passwort', 'Password')}</label>
                <input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" className={input} />
              </div>
              <div>
                <label className={label} htmlFor="confirm">{t('Passwort wiederholen', 'Repeat password')}</label>
                <input id="confirm" name="confirm" type="password" required minLength={10} autoComplete="new-password" className={input} />
              </div>
              {error && <p className="text-sm text-red-300" role="alert">{error}</p>}
              <button type="submit" disabled={busy} className="btn-accent w-full justify-center disabled:opacity-60">
                {busy ? t('Einen Moment…', 'One moment…') : t('Konto erstellen', 'Create account')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
