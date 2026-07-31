import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { LogoMark } from '../../components/Logo'

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center">
          <LogoMark className="h-12 text-ink" />
        </div>
        <h1 className="display not-italic text-3xl text-center mt-6">{title}</h1>
        <p className="text-center text-muted text-sm mt-2">{subtitle}</p>
        <div className="card mt-8 p-6 sm:p-8">{children}</div>
      </motion.div>
    </div>
  )
}

/** Zielpfad nach der Anmeldung – nur interne Pfade zulassen. */
function useNextPath(): string | null {
  const [params] = useSearchParams()
  const next = params.get('next')
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null
  return next
}

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const next = useNextPath()

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (err) setError('Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort.')
    else navigate(next ?? '/dashboard')
  }

  return (
    <AuthShell
      title="Willkommen zurück"
      subtitle={next ? 'Melde dich an, dann geht es zurück zur Ausfahrt.' : 'Melde dich an, um deine Rides zu verwalten.'}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">E-Mail</label>
          <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Passwort</label>
          <input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy ? 'Anmelden …' : 'Anmelden'}
        </button>
      </form>
      <div className="mt-5 flex items-center justify-between text-sm">
        <Link to="/passwort-reset" className="text-muted hover:text-ink font-medium">Passwort vergessen?</Link>
        <Link
          to={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
          className="font-bold hover:underline underline-offset-4"
        >
          Konto erstellen
        </Link>
      </div>
    </AuthShell>
  )
}

export function Register() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const next = useNextPath()

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { first_name: form.first_name, last_name: form.last_name },
        // Nach dem Bestätigungslink direkt zurück zur Ausfahrt
        emailRedirectTo: window.location.origin + (next ?? '/dashboard'),
      },
    })
    setBusy(false)
    if (err) setError(err.message === 'User already registered' ? 'Diese E-Mail ist bereits registriert.' : 'Registrierung fehlgeschlagen: ' + err.message)
    else setDone(true)
  }

  if (done)
    return (
      <AuthShell title="Fast geschafft" subtitle="Bestätige deine E-Mail-Adresse.">
        <p className="text-sm text-ink/80 text-center">
          Wir haben dir eine E-Mail an <b>{form.email}</b> geschickt. Klicke auf den Link darin, um
          dein Konto zu aktivieren.
        </p>
        <Link to="/login" className="btn-primary w-full mt-6">Zur Anmeldung</Link>
      </AuthShell>
    )

  return (
    <AuthShell title="Mitglied werden" subtitle="Kostenlos. Alle Levels willkommen.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Vorname</label>
            <input required className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Nachname</label>
            <input required className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">E-Mail</label>
          <input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Passwort</label>
          <input type="password" required minLength={8} className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <p className="mt-1 text-xs text-muted">Mindestens 8 Zeichen.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy ? 'Erstellen …' : 'Konto erstellen'}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Schon dabei?{' '}
        <Link
          to={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
          className="font-bold text-ink hover:underline underline-offset-4"
        >
          Anmelden
        </Link>
      </p>
    </AuthShell>
  )
}

export function PasswordReset() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/passwort-neu',
    })
    setBusy(false)
    setDone(true)
  }

  return (
    <AuthShell title="Passwort zurücksetzen" subtitle="Wir schicken dir einen Link per E-Mail.">
      {done ? (
        <p className="text-sm text-center text-ink/80">
          Wenn ein Konto für <b>{email}</b> existiert, ist der Link unterwegs. Schau auch im
          Spam-Ordner nach.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">E-Mail</label>
            <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <button disabled={busy} className="btn-primary w-full disabled:opacity-50">
            {busy ? 'Senden …' : 'Link senden'}
          </button>
        </form>
      )}
      <p className="mt-5 text-center text-sm">
        <Link to="/login" className="text-muted hover:text-ink font-medium">Zurück zur Anmeldung</Link>
      </p>
    </AuthShell>
  )
}

export function NewPassword() {
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (!error) {
      setDone(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    }
  }

  return (
    <AuthShell title="Neues Passwort" subtitle="Wähle ein neues Passwort für dein Konto.">
      {done ? (
        <p className="text-sm text-center text-ink/80">Passwort aktualisiert – du wirst weitergeleitet …</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Neues Passwort</label>
            <input type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button disabled={busy} className="btn-primary w-full disabled:opacity-50">
            {busy ? 'Speichern …' : 'Passwort speichern'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
