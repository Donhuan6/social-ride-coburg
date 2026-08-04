import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Ride } from '../lib/types'
import { formatDateLong, formatTime } from '../lib/format'

interface Props {
  ride: Ride
  open: boolean
  onClose: () => void
  onJoined: () => void
}

export function JoinModal({ ride, open, onClose, onJoined }: Props) {
  const { session, profile, loading, refreshProfile } = useAuth()
  const location = useLocation()
  const redirect = encodeURIComponent(location.pathname + location.search)

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

  const email = session?.user.email ?? ''

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
  }, [open, profile, session])

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

    const first = form.first_name.trim()
    const last = form.last_name.trim()
    const phone = form.phone.trim() || null
    const emergency = form.emergency_contact.trim() || null

    const { error: err } = await supabase.from('registrations').insert({
      ride_id: ride.id,
      user_id: session.user.id,
      first_name: first,
      last_name: last,
      email: email.toLowerCase(),
      phone,
      emergency_contact: emergency,
      waiver_accepted: checks.waiver,
      privacy_accepted: checks.privacy,
      risk_accepted: checks.risk,
    })

    if (err) {
      setSubmitting(false)
      if (err.code === '23505') setError('Du bist für diese Ausfahrt bereits angemeldet.')
      else if (err.code === '42501')
        setError('Anmeldung nicht möglich – die Ausfahrt ist ausgebucht oder die Anmeldung ist geschlossen.')
      else setError('Etwas ist schiefgelaufen. Bitte versuche es erneut.')
      return
    }

    // Angaben ins Profil übernehmen, damit sie beim nächsten Mal schon dastehen.
    await supabase
      .from('profiles')
      .update({
        first_name: first,
        last_name: last,
        phone,
        emergency_contact: emergency,
      })
      .eq('id', session.user.id)
    await refreshProfile()

    setSubmitting(false)
    setSuccess(true)
    onJoined()
  }

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
            {success ? (
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
                  {formatTime(ride.starts_at)} Uhr. Die Anmeldung findest du jederzeit unter „Meine Rides".
                </p>
                <Link to="/dashboard/meine-rides" className="btn-secondary mt-6 w-full">
                  Zu meinen Rides
                </Link>
                <button onClick={onClose} className="btn-primary mt-2 w-full">
                  Alles klar
                </button>
              </div>
            ) : (
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

                {loading ? (
                  <div className="mt-8 h-40 animate-pulse rounded-2xl bg-line/40" />
                ) : !session ? (
                  <div className="mt-6">
                    <div className="rounded-2xl border border-line bg-bg p-6 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#111" strokeWidth="2">
                          <rect x="4" y="10" width="16" height="10" rx="2.5" />
                          <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                        </svg>
                      </div>
                      <h4 className="display not-italic mt-4 text-xl">Konto erforderlich</h4>
                      <p className="mt-2 text-sm text-muted">
                        Für die Anmeldung zu einer Ausfahrt brauchst du ein kostenloses Konto. So hast du
                        deine Anmeldungen im Blick, kannst jederzeit stornieren und musst deine Daten nur
                        einmal eingeben.
                      </p>
                    </div>
                    <Link to={`/register?redirect=${redirect}`} className="btn-primary mt-5 w-full">
                      Konto erstellen
                    </Link>
                    <Link to={`/login?redirect=${redirect}`} className="btn-secondary mt-2 w-full">
                      Ich habe schon ein Konto
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="mt-6 rounded-xl border border-line bg-bg px-4 py-3">
                      <p className="label !mb-0.5">Angemeldet als</p>
                      <p className="text-sm font-semibold break-all">{email}</p>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                            <a href="/haftungsausschluss" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
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
                            <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
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
                  </>
                )}
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
