import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Ride } from '../../lib/types'
import { BIKE_LABEL, DIFFICULTY_LABEL } from '../../lib/types'
import { slugify } from '../../lib/format'
import { adminSaveRide, adminUpload } from '../../lib/admin'
import { RideCard } from '../../components/RideCard'

/** Häufige Treffpunkte in Coburg – Klick setzt Name + Koordinaten */
const MEETING_POINTS = [
  { name: 'Schlossplatz, Coburg', lat: 50.2564, lng: 10.9685 },
  { name: 'Marktplatz, Coburg', lat: 50.2584, lng: 10.9646 },
  { name: 'Anger, Coburg', lat: 50.2631, lng: 10.9603 },
  { name: 'Bahnhof Coburg', lat: 50.2617, lng: 10.9524 },
]

function nextSaturday16h(): { date: string; time: string } {
  const d = new Date()
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7))
  return { date: d.toISOString().slice(0, 10), time: '16:00' }
}

const defaults = {
  title: '',
  slug: '',
  cover_image_url: '',
  ...nextSaturday16h(),
  meeting_point: 'Schlossplatz, Coburg',
  lat: '50.2564',
  lng: '10.9685',
  distance_km: '30',
  elevation_m: '250',
  avg_pace: '18–20 km/h',
  difficulty: 'easy',
  bike_types: ['gravel', 'road', 'mtb'] as string[],
  description: '',
  notes: 'Lockeres Tempo – No Drop Ride. Bitte Helm, Licht und ausreichend zu trinken mitbringen.',
  gpx_url: '',
  organizer: 'Social Ride Coburg',
  max_participants: '30',
  registration_open: true,
  status: 'upcoming',
  tags: '',
}

export function AdminRideForm() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'neu'
  const navigate = useNavigate()
  const [form, setForm] = useState(defaults)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)

  useEffect(() => {
    if (isNew) return
    supabase
      .from('rides')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return
        const r = data as Ride
        const d = new Date(r.starts_at)
        const pad = (n: number) => String(n).padStart(2, '0')
        setSlugTouched(true)
        setForm({
          title: r.title,
          slug: r.slug,
          cover_image_url: r.cover_image_url ?? '',
          date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
          time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
          meeting_point: r.meeting_point,
          lat: String(r.lat ?? ''),
          lng: String(r.lng ?? ''),
          distance_km: String(r.distance_km),
          elevation_m: String(r.elevation_m),
          avg_pace: r.avg_pace ?? '',
          difficulty: r.difficulty,
          bike_types: r.bike_types,
          description: r.description ?? '',
          notes: r.notes ?? '',
          gpx_url: r.gpx_url ?? '',
          organizer: r.organizer,
          max_participants: String(r.max_participants),
          registration_open: r.registration_open,
          status: r.status,
          tags: r.tags.join(', '),
        })
      })
  }, [id, isNew])

  function set<K extends keyof typeof defaults>(key: K, value: (typeof defaults)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const effectiveSlug = slugTouched && form.slug ? slugify(form.slug) : slugify(form.title)

  async function upload(bucket: 'covers' | 'gpx', file: File | undefined) {
    if (!file) return
    setUploading(bucket)
    setError(null)
    try {
      const url = await adminUpload(bucket, file)
      setForm((f) => (bucket === 'covers' ? { ...f, cover_image_url: url } : { ...f, gpx_url: url }))
    } catch (e) {
      setError('Upload fehlgeschlagen: ' + (e as Error).message)
    } finally {
      setUploading(null)
    }
  }

  // Live-Vorschau: genau die Karte, die Teilnehmer später sehen
  const preview: Ride = useMemo(
    () => ({
      id: 'preview',
      title: form.title || 'Titel der Ausfahrt',
      slug: effectiveSlug || 'vorschau',
      cover_image_url: form.cover_image_url || null,
      starts_at: new Date(`${form.date}T${form.time || '00:00'}:00`).toISOString(),
      meeting_point: form.meeting_point || 'Treffpunkt',
      lat: Number(form.lat) || null,
      lng: Number(form.lng) || null,
      distance_km: Number(form.distance_km) || 0,
      elevation_m: Number(form.elevation_m) || 0,
      avg_pace: form.avg_pace || null,
      difficulty: form.difficulty as Ride['difficulty'],
      bike_types: form.bike_types,
      description: form.description || null,
      notes: form.notes || null,
      gpx_url: form.gpx_url || null,
      organizer: form.organizer,
      max_participants: Number(form.max_participants) || 1,
      registration_open: form.registration_open,
      status: form.status as Ride['status'],
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      created_at: new Date().toISOString(),
      confirmed_count: 0,
    }),
    [form, effectiveSlug],
  )

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await adminSaveRide(
        {
          title: form.title.trim(),
          slug: effectiveSlug,
          cover_image_url: form.cover_image_url || null,
          starts_at: new Date(`${form.date}T${form.time}:00`).toISOString(),
          meeting_point: form.meeting_point.trim(),
          lat: form.lat ? Number(form.lat) : null,
          lng: form.lng ? Number(form.lng) : null,
          distance_km: Number(form.distance_km),
          elevation_m: Number(form.elevation_m),
          avg_pace: form.avg_pace || null,
          difficulty: form.difficulty as Ride['difficulty'],
          bike_types: form.bike_types,
          description: form.description || null,
          notes: form.notes || null,
          gpx_url: form.gpx_url || null,
          organizer: form.organizer,
          max_participants: Number(form.max_participants),
          registration_open: form.registration_open,
          status: form.status as Ride['status'],
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        },
        isNew ? undefined : id,
      )
      navigate('/admin/rides')
    } catch (err) {
      const msg = (err as { code?: string; message: string }).code === '23505'
        ? 'Diese URL (Slug) wird schon von einer anderen Ausfahrt genutzt. Bitte ändere den Titel oder den Slug.'
        : 'Speichern fehlgeschlagen: ' + (err as Error).message
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_340px] items-start">
      <div className="space-y-6 min-w-0">
        <div>
          <h2 className="display not-italic text-2xl">
            {isNew ? 'Neue Ausfahrt anlegen' : 'Ausfahrt bearbeiten'}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Alles mit * ist Pflicht. Rechts siehst du live, wie die Ausfahrt später aussieht.
          </p>
        </div>

        <Section title="Basis" step="1">
          <Field label="Titel *" className="sm:col-span-2">
            <input
              required
              className="input"
              placeholder="z. B. Social Ride – Lauterberg Runde"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>
          <Field label="Beschreibung" className="sm:col-span-2" hint="Was erwartet die Teilnehmer? Strecke, Charakter, Einkehr …">
            <textarea
              rows={4}
              className="input"
              placeholder="Leicht hügelige Runde mit ein paar kurzen Anstiegen, ansonsten gut rollbare Straßen …"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>
          <Field label="URL (Slug)" className="sm:col-span-2" hint={`Die Ausfahrt wird erreichbar unter /rides/${effectiveSlug || '…'}`}>
            <input
              className="input"
              placeholder="wird automatisch aus dem Titel erzeugt"
              value={slugTouched ? form.slug : effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', e.target.value)
              }}
            />
          </Field>
        </Section>

        <Section title="Termin & Treffpunkt" step="2">
          <Field label="Datum *">
            <input type="date" required className="input" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
          <Field label="Startzeit *">
            <input type="time" required className="input" value={form.time} onChange={(e) => set('time', e.target.value)} />
          </Field>
          <Field label="Treffpunkt *" className="sm:col-span-2">
            <input required className="input" value={form.meeting_point} onChange={(e) => set('meeting_point', e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-2">
              {MEETING_POINTS.map((m) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, meeting_point: m.name, lat: String(m.lat), lng: String(m.lng) }))}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    form.meeting_point === m.name
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-muted border-line hover:border-ink hover:text-ink'
                  }`}
                >
                  {m.name.replace(', Coburg', '')}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Breitengrad" hint="Für den Marker auf der Karte">
            <input className="input" value={form.lat} onChange={(e) => set('lat', e.target.value)} />
          </Field>
          <Field label="Längengrad">
            <input className="input" value={form.lng} onChange={(e) => set('lng', e.target.value)} />
          </Field>
        </Section>

        <Section title="Strecke" step="3">
          <Field label="Distanz (km) *">
            <input type="number" step="0.1" min="0" required className="input" value={form.distance_km} onChange={(e) => set('distance_km', e.target.value)} />
          </Field>
          <Field label="Höhenmeter *">
            <input type="number" min="0" required className="input" value={form.elevation_m} onChange={(e) => set('elevation_m', e.target.value)} />
          </Field>
          <Field label="Ø Tempo">
            <input className="input" placeholder="18–20 km/h" value={form.avg_pace} onChange={(e) => set('avg_pace', e.target.value)} />
          </Field>
          <Field label="Level">
            <select className="input" value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
              {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Passende Bikes" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {Object.entries(BIKE_LABEL).map(([k, v]) => (
                <button
                  type="button"
                  key={k}
                  onClick={() =>
                    set('bike_types', form.bike_types.includes(k)
                      ? form.bike_types.filter((b) => b !== k)
                      : [...form.bike_types, k])
                  }
                  className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors cursor-pointer ${
                    form.bike_types.includes(k)
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-muted border-line hover:border-ink'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Wichtige Hinweise" className="sm:col-span-2" hint="Erscheint hervorgehoben auf der Detailseite">
            <textarea rows={3} className="input" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </Section>

        <Section title="Bilder & GPX" step="4">
          <Field label="Cover-Bild" hint="Ohne Bild wird automatisch eine Grafik im SRC-Look erzeugt.">
            <input type="file" accept="image/*" className="input !py-2.5" onChange={(e) => upload('covers', e.target.files?.[0])} />
            {uploading === 'covers' && <p className="mt-1 text-xs text-muted">Wird hochgeladen …</p>}
            {form.cover_image_url && (
              <button
                type="button"
                onClick={() => set('cover_image_url', '')}
                className="mt-2 text-xs font-semibold text-muted hover:text-red-600 cursor-pointer"
              >
                Bild entfernen
              </button>
            )}
          </Field>
          <Field label="GPX-Datei" hint="Zeichnet die Route auf der Karte ein.">
            <input type="file" accept=".gpx" className="input !py-2.5" onChange={(e) => upload('gpx', e.target.files?.[0])} />
            {uploading === 'gpx' && <p className="mt-1 text-xs text-muted">Wird hochgeladen …</p>}
            {form.gpx_url && (
              <p className="mt-1 text-xs text-muted truncate">✓ {form.gpx_url.split('/').pop()}</p>
            )}
          </Field>
        </Section>

        <Section title="Teilnahme" step="5">
          <Field label="Max. Teilnehmer *">
            <input type="number" min={1} required className="input" value={form.max_participants} onChange={(e) => set('max_participants', e.target.value)} />
          </Field>
          <Field label="Organisation">
            <input className="input" value={form.organizer} onChange={(e) => set('organizer', e.target.value)} />
          </Field>
          <Field label="Status">
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="upcoming">Bevorstehend</option>
              <option value="completed">Abgeschlossen</option>
              <option value="cancelled">Abgesagt</option>
            </select>
          </Field>
          <Field label="Tags" hint="Komma-getrennt, z. B. no-drop, feierabend">
            <input className="input" value={form.tags} onChange={(e) => set('tags', e.target.value)} />
          </Field>
          <Field label="" className="sm:col-span-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  form.registration_open ? 'bg-ink border-ink' : 'border-line bg-white group-hover:border-ink'
                }`}
              >
                {form.registration_open && (
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="#F5C400" strokeWidth="3">
                    <path d="M4 10.5 L8 14.5 L16 5.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <input type="checkbox" className="sr-only" checked={form.registration_open} onChange={(e) => set('registration_open', e.target.checked)} />
              <span className="text-sm">
                <b>Anmeldung geöffnet</b>
                <span className="block text-muted text-xs mt-0.5">
                  Nur wenn aktiv, können sich Teilnehmer eintragen.
                </span>
              </span>
            </label>
          </Field>
        </Section>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <div className="flex flex-wrap gap-3">
          <button disabled={busy || !form.title.trim()} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            {busy ? 'Speichern …' : isNew ? 'Ausfahrt veröffentlichen' : 'Änderungen speichern'}
          </button>
          <button type="button" onClick={() => navigate('/admin/rides')} className="btn-secondary">
            Abbrechen
          </button>
        </div>
      </div>

      {/* LIVE-VORSCHAU */}
      <aside className="lg:sticky lg:top-24 space-y-3">
        <p className="label !mb-0">Live-Vorschau</p>
        <div className="pointer-events-none">
          <RideCard ride={preview} />
        </div>
        <p className="text-xs text-muted">
          So erscheint die Ausfahrt auf der Startseite und in der Übersicht.
        </p>
      </aside>
    </form>
  )
}

function Section({ title, step, children }: { title: string; step: string; children: ReactNode }) {
  return (
    <section className="card p-6 md:p-7">
      <div className="flex items-center gap-3 mb-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-ink text-xs font-extrabold">
          {step}
        </span>
        <h3 className="display not-italic text-lg">{title}</h3>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function Field({
  label,
  hint,
  className = '',
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  )
}
