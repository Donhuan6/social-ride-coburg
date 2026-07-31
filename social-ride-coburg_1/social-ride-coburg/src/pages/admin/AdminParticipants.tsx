import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Registration } from '../../lib/types'
import { adminFetchAllRegistrations, exportCsv, mailtoParticipants } from '../../lib/admin'
import { formatDate, formatTime } from '../../lib/format'
import { EmptyState } from '../../components/EmptyState'

type StatusFilter = 'confirmed' | 'cancelled' | 'all'
type TimeFilter = 'upcoming' | 'past' | 'all'

export function AdminParticipants() {
  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [rideId, setRideId] = useState<'all' | string>('all')
  const [status, setStatus] = useState<StatusFilter>('confirmed')
  const [time, setTime] = useState<TimeFilter>('upcoming')

  useEffect(() => {
    adminFetchAllRegistrations()
      .then(setRegs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  /** Ausfahrten für das Auswahlfeld, nach Termin sortiert */
  const rides = useMemo(() => {
    const map = new Map<string, { id: string; title: string; starts_at: string }>()
    regs.forEach((r) => {
      if (r.rides) map.set(r.rides.id, { id: r.rides.id, title: r.rides.title, starts_at: r.rides.starts_at })
    })
    return [...map.values()].sort((a, b) => b.starts_at.localeCompare(a.starts_at))
  }, [regs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const now = Date.now()
    return regs.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (rideId !== 'all' && r.rides?.id !== rideId) return false
      if (time !== 'all' && r.rides) {
        const isUpcoming = new Date(r.rides.starts_at).getTime() >= now && r.rides.status === 'upcoming'
        if (time === 'upcoming' && !isUpcoming) return false
        if (time === 'past' && isUpcoming) return false
      }
      if (!q) return true
      return [r.first_name, r.last_name, r.email, r.phone ?? '', r.rides?.title ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [regs, search, rideId, status, time])

  /** Nach Ausfahrt gruppiert, damit auf einen Blick klar ist, wer bei welchem Ride dabei ist */
  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; slug: string; starts_at: string; max: number; items: Registration[] }>()
    filtered.forEach((r) => {
      const key = r.rides?.id ?? 'ohne'
      if (!map.has(key)) {
        map.set(key, {
          title: r.rides?.title ?? 'Gelöschte Ausfahrt',
          slug: r.rides?.slug ?? '',
          starts_at: r.rides?.starts_at ?? '',
          max: r.rides?.max_participants ?? 0,
          items: [],
        })
      }
      map.get(key)!.items.push(r)
    })
    return [...map.entries()]
      .map(([id, g]) => ({ id, ...g }))
      .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
  }, [filtered])

  const guests = filtered.filter((r) => !r.user_id).length

  if (loading) return <div className="card h-64 animate-pulse bg-line/40" />
  if (error)
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        Teilnehmer konnten nicht geladen werden: {error}
      </div>
    )
  if (regs.length === 0)
    return (
      <EmptyState
        title="Noch keine Anmeldungen"
        text="Sobald sich jemand für eine Ausfahrt anmeldet, erscheint er hier."
        action={<Link to="/admin/rides" className="btn-primary">Zu den Ausfahrten</Link>}
      />
    )

  return (
    <div className="space-y-6">
      {/* FILTER */}
      <div className="card p-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto]">
          <div>
            <label className="label">Suche</label>
            <input
              className="input"
              placeholder="Name, E-Mail, Telefon oder Ausfahrt …"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Ausfahrt</label>
            <select className="input md:w-56" value={rideId} onChange={(e) => setRideId(e.target.value)}>
              <option value="all">Alle Ausfahrten</option>
              {rides.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Zeitraum</label>
            <select className="input md:w-40" value={time} onChange={(e) => setTime(e.target.value as TimeFilter)}>
              <option value="upcoming">Bevorstehend</option>
              <option value="past">Vergangen</option>
              <option value="all">Alle</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input md:w-40" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}>
              <option value="confirmed">Bestätigt</option>
              <option value="cancelled">Storniert</option>
              <option value="all">Alle</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-sm text-muted">
            <b className="text-ink">{filtered.length}</b>{' '}
            {filtered.length === 1 ? 'Anmeldung' : 'Anmeldungen'}
            {guests > 0 && <> · davon {guests} ohne Konto</>}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportCsv(filtered, 'alle-teilnehmer', true)}
              className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold hover:border-ink transition-colors cursor-pointer"
            >
              CSV exportieren
            </button>
            <a
              href={mailtoParticipants(filtered, 'Social Ride Coburg')}
              className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold hover:border-ink transition-colors"
            >
              E-Mail an Auswahl
            </a>
          </div>
        </div>
      </div>

      {/* LISTE, NACH AUSFAHRT GRUPPIERT */}
      {grouped.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="display not-italic text-lg">Nichts gefunden</p>
          <p className="mt-1 text-sm text-muted">Für diese Auswahl gibt es keine Anmeldungen.</p>
        </div>
      ) : (
        grouped.map((g) => (
          <section key={g.id} className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
              <div>
                {g.slug ? (
                  <Link to={`/rides/${g.slug}`} className="display not-italic text-lg hover:underline underline-offset-4">
                    {g.title}
                  </Link>
                ) : (
                  <p className="display not-italic text-lg">{g.title}</p>
                )}
                {g.starts_at && (
                  <p className="text-sm text-muted">
                    {formatDate(g.starts_at)} · {formatTime(g.starts_at)} Uhr
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="chip">
                  {g.items.filter((r) => r.status === 'confirmed').length}
                  {g.max ? ` / ${g.max}` : ''} Teilnehmer
                </span>
                <button
                  onClick={() => exportCsv(g.items, g.title)}
                  className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold hover:border-ink transition-colors cursor-pointer"
                >
                  CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted bg-bg">
                    <th className="py-2.5 px-5">Name</th>
                    <th className="py-2.5 px-3">E-Mail</th>
                    <th className="py-2.5 px-3">Telefon</th>
                    <th className="py-2.5 px-3">Notfallkontakt</th>
                    <th className="py-2.5 px-3">Angemeldet</th>
                    <th className="py-2.5 px-5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((r) => (
                    <tr key={r.id} className="border-t border-line align-top">
                      <td className="py-2.5 px-5 font-semibold whitespace-nowrap">
                        {r.first_name} {r.last_name}
                        {!r.user_id && (
                          <span
                            className="ml-2 rounded-full bg-bg border border-line px-2 py-0.5 text-[10px] font-bold text-muted"
                            title="Vor der Konto-Pflicht als Gast angemeldet"
                          >
                            Gast
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <a href={`mailto:${r.email}`} className="hover:underline underline-offset-2">
                          {r.email}
                        </a>
                      </td>
                      <td className="py-2.5 px-3">{r.phone || '–'}</td>
                      <td className="py-2.5 px-3">{r.emergency_contact || '–'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-muted">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="py-2.5 px-5">
                        {r.status === 'confirmed' ? (
                          <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-ink">
                            Bestätigt
                          </span>
                        ) : (
                          <span className="rounded-full bg-bg border border-line px-2.5 py-0.5 text-[11px] font-bold text-muted">
                            Storniert
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  )
}
