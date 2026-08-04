import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { LogoMark } from '../../components/Logo'

/**
 * Liest das ?redirect=-Ziel aus der URL. Erlaubt sind nur seiteninterne Pfade,
 * damit die Weiterleitung nicht auf eine fremde Domain zeigen kann.
 */
/**
 * Übersetzt die Fehlercodes von Supabase Auth in verständliche Sätze.
 * Wichtig: "E-Mail noch nicht bestätigt" darf nicht als falsches Passwort
 * erscheinen, sonst suchen Leute den Fehler an der komplett falschen Stelle.
 */
function authErrorText(err: { code?: string; message?: string; status?: number }): string {
  switch (err.code) {
    case 'email_not_confirmed':
      return 'Deine E-Mail-Adresse ist noch nicht bestätigt. Klicke auf den Link in der Bestätigungsmail – schau auch im Spam-Ordner nach.'
    case 'invalid_credentials':
      return 'Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort.'
    case 'user_already_exists':
    case 'email_exists':
      return 'Diese E-Mail ist bereits registriert. Melde dich stattdessen an oder setze dein Passwort zurück.'
    case 'weak_password':
      return 'Das Passwort ist zu schwach. Wähle ein längeres Passwort, das du nirgends sonst verwendest.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Gerade wurden zu viele E-Mails verschickt. Bitte versuche es in einer Stunde noch einmal – oder melde dich bei uns, dann schalten wir dich direkt frei.'
    case 'signup_disabled':
      return 'Neue Registrierungen sind momentan deaktiviert.'
    case 'validation_failed':
      return 'Bitte prüfe deine Eingaben.'
    default:
      if (err.status === 429)
        return 'Zu viele Versuche in kurzer Zeit. Bitte warte einen Moment und probiere es erneut.'
      if (err.message === 'User already registered')
        return 'Diese E-Mail ist bereits registriert. Melde dich stattdessen an.'
      return 'Das hat leider nicht geklappt. Bitte versuche es erneut.'
  }
}

function useRedirectTarget(): { target: string; query: string } {
  const [params] = useSearchParams()
  const raw = params.get('redirect') ?? ''
  const safe = raw.startsWith('/') && !raw.startsWith('//') ? raw : ''
  return { target: safe || '/dashboard', query: safe ? `?redirect=${encodeURIComponent(safe)}` : '' }
}

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

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [resent, setResent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { target, query } = useRedirectTarget()
  const fromRide = target.startsWith('/rides/')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setResent(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    setUnconfirmed(err?.code === 'email_not_confirmed')
    if (err) setError(authErrorText(err))
    else navigate(target)
  }

  async function resendConfirmation() {
    setBusy(true)
    const { error: err } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: window.location.origin + target },
    })
    setBusy(false)
    setResent(err ? authErrorText(err) : 'Bestätigungsmail ist unterwegs. Schau auch im Spam-Ordner nach.')
  }

  return (
    <AuthShell
      title="Willkommen zurück"
      subtitle={
        fromRide
          ? 'Melde dich an, um dich für die Ausfahrt anzumelden.'
          : 'Melde dich an, um deine Rides zu verwalten.'
      }
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
        {unconfirmed && (
          <button
            type="button"
            onClick={resendConfirmation}
            disabled={busy}
            className="btn-secondary w-full disabled:opacity-50"
          >
            Bestätigungsmail erneut senden
          </button>
        )}
        {resent && <p className="text-sm text-muted">{resent}</p>}
        <button disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy ? 'Anmelden …' : 'Anmelden'}
        </button>
      </form>
      <div className="mt-5 flex items-center justify-between text-sm">
        <Link to="/passwort-reset" className="text-muted hover:text-ink font-medium">Passwort vergessen?</Link>
        <Link to={`/register${query}`} className="font-bold hover:underline underline-offset-4">Konto erstellen</Link>
      </div>
    </AuthShell>
  )
}

export function Register() {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { target, query } = useRedirectTarget()
  const fromRide = target.startsWith('/rides/')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { data, error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { first_name: form.first_name, last_name: form.last_name },
        emailRedirectTo: window.location.origin + target,
      },
    })
    setBusy(false)
    if (err) {
      setError(authErrorText(err))
      return
    }
    // Falls die E-Mail-Bestätigung deaktiviert ist, ist man sofort eingeloggt.
    if (data.session) navigate(target)
    else setDone(true)
  }

  if (done)
    return (
      <AuthShell title="Fast geschafft" subtitle="Bestätige deine E-Mail-Adresse.">
        <p className="text-sm text-ink/80 text-center">
          Wir haben dir eine E-Mail an <b>{form.email}</b> geschickt. Klicke auf den Link darin, um
          dein Konto zu aktivieren.
          {fromRide && ' Danach landest du direkt wieder bei der Ausfahrt und kannst dich anmelden.'}
        </p>
        <Link to={`/login${query}`} className="btn-primary w-full mt-6">Zur Anmeldung</Link>
      </AuthShell>
    )

  return (
    <AuthShell
      title="Mitglied werden"
      subtitle={
        fromRide
          ? 'Kostenlos – danach kannst du dich für die Ausfahrt anmelden.'
          : 'Kostenlos. Alle Levels willkommen.'
      }
    >
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
        <Link to={`/login${query}`} className="font-bold text-ink hover:underline underline-offset-4">Anmelden</Link>
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
