import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Ride } from '../lib/types'
import { formatDateLong, formatTime } from '../lib/format'
import { LogoMark } from './Logo'

interface Props {
  ride: Ride
  open: boolean
  onClose: () => void
  onJoined: () => void
}

export function JoinModal({ ride, open, onClose, onJoined }: Props) {
  const { session, profile } = useAuth()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    emergency_contact: '',
  })
  const [checks, setChecks] = useState({ waiver: false, privacy: false, risk: false })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setSuccess(false)
      setError(null)
      setChecks({ waiver: false, privacy: false, risk: false })
      setForm({
        first_name: profile?.first_name ?? '',
        last_name: profile?.last_name ?? '',
        phone: profile?.phone ?? '',
        emergency_contact: profile?.emergency_contact ?? '',
      })
    }
  }, [open, profile])

  const email = session?.user.email ?? ''
  const valid =
    !!session &&
    form.first_name.trim() &&
    form.last_name.trim() &&
    checks.waiver &&
    checks.privacy &&
    checks.risk

  async function submit() {
    if (!valid || submitting || !session) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.from('registrations').insert({
      ride_id: ride.id,
      user_id: session.user.id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: email.toLowerCase(),
      phone: form.phone.trim() || null,
      emergency_contact: form.emergency_contact.trim() || null,
      waiver_accepted: checks.waiver,
      privacy_accepted: checks.privacy,
      risk_accepted: checks.risk,
    })
    setSubmitting(false)
    if (err) {
      if (err.code === '23505') setError('Du bist für diese Ausfahrt bereits angemeldet.')
      else if (err.code === '42501')
        setError('Anmeldung nicht möglich – die Ausfahrt ist ausgebucht oder die Anmeldung wurde geschlossen.')
      else setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.')
      return
    }
    setSuccess(true)
    onJoined()
  }

  const backTo = `/rides/${ride.slug}`

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm p-0 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-white rounded-t-[24px] sm:rounded-[24px] shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            {/* NICHT ANGEMELDET */}
            {!session ? (
              <div className="p-8 text-center">
                <LogoMark className="h-10 text-ink mx-auto" />
                <h3 className="display not-italic mt-5 text-2xl">Kurz anmelden, dann geht's los</h3>
                <p className="mt-3 text-sm text-muted">
                  Für die Teilnahme an <b className="text-ink">{ride.title}</b> brauchst du ein
                  kostenloses Konto. So haben wir am Ride-Tag eine verlässliche Teilnehmerliste, du
                  siehst deine Anmeldungen im Dashboard und kannst jederzeit wieder absagen.
                </p>
                <div className="mt-7 flex flex-col gap-2">
                  <Link
                    to={`/register?next=${encodeURIComponent(backTo)}`}
                    className="btn-primary w-full"
                    onClick={onClose}
                  >
                    Konto erstellen
                  </Link>
                  <Link
                    to={`/login?next=${encodeURIComponent(backTo)}`}
                    className="btn-secondary w-full"
                    onClick={onClose}
                  >
                    Ich habe schon ein Konto
                  </Link>
                </div>
                <button
                  onClick={onClose}
                  className="mt-5 text-sm font-semibold text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  Später
                </button>
              </div>
            ) : success ? (
              <div className="p-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent"
                >
                  <motion.svg
                    viewBox="0 0 24 24"
                    className="h-10 w-10"
                    fill="none"
                    stroke="#111"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <motion.path
                      d="M4 12.5 L9.5 18 L20 6.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: 0.35 }}
                    />
                  </motion.svg>
                </motion.div>
                <h3 className="display not-italic mt-6 text-2xl">Wir sehen uns beim Ride!</h3>
                <p className="mt-2 text-muted text-sm">
                  Du bist angemeldet für <b>{ride.title}</b> am {formatDateLong(ride.starts_at)} um{' '}
                  {formatTime(ride.starts_at)} Uhr. Du findest die Anmeldung jederzeit unter
                  „Meine Rides".
                </p>
                <button onClick={onClose} className="btn-primary mt-8 w-full">
                  Alles klar
                </button>
              </div>
            ) : (
              /* ANGEMELDET – FORMULAR */
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="label">Anmeldung</p>
                    <h3 className="display not-italic text-2xl leading-tight">{ride.title}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {formatDateLong(ride.starts_at)} · {formatTime(ride.starts_at)} Uhr
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-full border border-line p-2 hover:border-ink transition-colors cursor-pointer"
                    aria-label="Schließen"
                  >
                    <svg viewBox="0 0 20 20" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                      <path d="M5 5 L15 15 M15 5 L5 15" />
                    </svg>
                  </button>
                </div>

                <div className="mt-5 rounded-xl bg-bg border border-line px-4 py-3 text-sm">
                  Angemeldet als <b>{email}</b>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Vorname *</label>
                    <input
                      className="input"
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Nachname *</label>
                    <input
                      className="input"
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Telefon (optional)</label>
                    <input
                      className="input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Notfallkontakt (optional)</label>
                    <input
                      className="input"
                      value={form.emergency_contact}
                      onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Check
                    checked={checks.waiver}
                    onChange={(v) => setChecks({ ...checks, waiver: v })}
                    label={
                      <>
                        Ich habe den{' '}
                        <a href="/haftungsausschluss" target="_blank" className="underline underline-offset-2">
                          Haftungsausschluss
                        </a>{' '}
                        gelesen und akzeptiere ihn. *
                      </>
                    }
                  />
                  <Check
                    checked={checks.privacy}
                    onChange={(v) => setChecks({ ...checks, privacy: v })}
                    label={
                      <>
                        Ich stimme der{' '}
                        <a href="/datenschutz" target="_blank" className="underline underline-offset-2">
                          Datenschutzerklärung
                        </a>{' '}
                        zu. *
                      </>
                    }
                  />
                  <Check
                    checked={checks.risk}
                    onChange={(v) => setChecks({ ...checks, risk: v })}
                    label="Mir ist bewusst, dass die Teilnahme auf eigene Gefahr erfolgt. *"
                  />
                </div>

                {error && (
                  <p className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </p>
                )}

                <button
                  onClick={submit}
                  disabled={!valid || submitting}
                  className="btn-primary mt-6 w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-ink disabled:hover:text-white"
                >
                  {submitting ? 'Wird angemeldet …' : 'Verbindlich anmelden'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          checked ? 'bg-ink border-ink' : 'border-line bg-white group-hover:border-ink'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="#F5C400" strokeWidth="3">
            <path d="M4 10.5 L8 14.5 L16 5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm text-ink/80">{label}</span>
    </label>
  )
}
