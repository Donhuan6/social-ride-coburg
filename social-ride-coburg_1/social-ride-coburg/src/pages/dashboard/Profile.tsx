import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { BIKE_LABEL } from '../../lib/types'

const EXPERIENCE_LABEL: Record<string, string> = {
  beginner: 'Einsteiger',
  intermediate: 'Fortgeschritten',
  advanced: 'Sehr erfahren',
}

export function ProfilePage() {
  const { session, profile, refreshProfile } = useAuth()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    bike_type: '',
    experience: '',
    phone: '',
    emergency_contact: '',
    instagram: '',
  })
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (profile)
      setForm({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        bike_type: profile.bike_type ?? '',
        experience: profile.experience ?? '',
        phone: profile.phone ?? '',
        emergency_contact: profile.emergency_contact ?? '',
        instagram: profile.instagram ?? '',
      })
  }, [profile])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!session) return
    setBusy(true)
    await supabase
      .from('profiles')
      .update({
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        bike_type: form.bike_type || null,
        experience: form.experience || null,
        phone: form.phone || null,
        emergency_contact: form.emergency_contact || null,
        instagram: form.instagram || null,
      })
      .eq('id', session.user.id)
    await refreshProfile()
    setBusy(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const initials =
    ((profile?.first_name?.[0] ?? '') + (profile?.last_name?.[0] ?? '')).toUpperCase() || 'SR'

  return (
    <div className="space-y-6">
      <div className="card p-6 flex items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink text-accent display text-xl">
          {initials}
        </div>
        <div>
          <p className="display not-italic text-xl">
            {profile?.first_name} {profile?.last_name}
          </p>
          <p className="text-sm text-muted">{session?.user.email}</p>
        </div>
      </div>

      <form onSubmit={submit} className="card p-6 md:p-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Vorname</label>
            <input className="input" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Nachname</label>
            <input className="input" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Bike</label>
            <select className="input" value={form.bike_type} onChange={(e) => setForm({ ...form, bike_type: e.target.value })}>
              <option value="">Bitte wählen</option>
              {Object.entries(BIKE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Erfahrung</label>
            <select className="input" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}>
              <option value="">Bitte wählen</option>
              {Object.entries(EXPERIENCE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Telefon</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Notfallkontakt</label>
            <input className="input" placeholder="Name + Telefonnummer" value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Instagram</label>
            <input className="input" placeholder="@dein_handle" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button disabled={busy} className="btn-primary disabled:opacity-50">
            {busy ? 'Speichern …' : 'Profil speichern'}
          </button>
          {saved && <span className="text-sm font-semibold text-ink">✓ Gespeichert</span>}
        </div>
      </form>
    </div>
  )
}

export function SettingsPage() {
  const { session } = useAuth()
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password })
    setMsg(error ? 'Fehler: ' + error.message : 'Passwort aktualisiert.')
    setPassword('')
  }

  return (
    <div className="space-y-6">
      <form onSubmit={changePassword} className="card p-6 md:p-8">
        <h2 className="display not-italic text-lg">Passwort ändern</h2>
        <div className="mt-4 max-w-sm">
          <label className="label">Neues Passwort</label>
          <input type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {msg && <p className="mt-3 text-sm font-medium">{msg}</p>}
        <button className="btn-primary mt-5">Speichern</button>
      </form>

      <div className="card p-6 md:p-8">
        <h2 className="display not-italic text-lg">Konto</h2>
        <p className="mt-2 text-sm text-muted">
          Angemeldet als <b className="text-ink">{session?.user.email}</b>. Wenn du dein Konto
          löschen möchtest, melde dich beim Orga-Team – wir kümmern uns darum.
        </p>
      </div>
    </div>
  )
}
