import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Registration, Ride } from '../../lib/types'
import { formatDate, formatTime, isPast } from '../../lib/format'
import { EmptyState } from '../../components/EmptyState'
import { ParticipantTable } from '../../components/ParticipantTable'
import { adminFetchAllRegistrations, exportCsv, exportCsvGrouped, mailtoParticipants } from '../../lib/admin'

type Scope = 'upcoming' | 'past' | 'all'

const SCOPE_LABEL: Record<Scope, string> = {
  upcoming: 'Bevorstehend',
  past: 'Vergangen',
  all: 'Alle',
}

export function AdminParticipants() {
  const [rides, setRides] = useState<Ride[]>([])
  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<Scope>('upcoming')
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.from('rides').select('*').order('starts_at', { ascending: true }),
      adminFetchAllRegistrations(),
    ])
      .then(([ridesRes, regsData]) => {
        if (!active) return
        if (ridesRes.error) throw ridesRes.error
        setRides((ridesRes.data ?? []) as Ride[])
        setRegs(regsData)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setError('Die Teilnehmerdaten konnten nicht geladen werden.')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const needle = query.trim().toLowerCase()

  const groups = useMemo(() => {
    const byRide = new Map<string, Registration[]>()
    for (const r of regs) {
      const list = byRide.get(r.ride_id)
      if (list) list.push(r)
      else byRide.set(r.ride_id, [r])
    }

    return rides
      .filter((ride) => {
        if (scope === 'upcoming') return !isPast(ride.starts_at) && ride.status !== 'cancelled'
        if (scope === 'past') return isPast(ride.starts_at) || ride.status === 'cancelled'
        return true
      })
      .map((ride) => {
        const all = byRide.get(ride.id) ?? []
        const matching = needle
          ? all.filter((r) =>
              `${r.first_name} ${r.last_name} ${r.email} ${r.phone ?? ''}`.toLowerCase().includes(needle),
            )
          : all
        return {
          ride,
          regs: matching,
          confirmed: all.filter((r) => r.status === 'confirmed').length,
          hits: matching.length,
        }
      })
      .filter((g) => !needle || g.hits > 0)
      .sort((a, b) =>
        scope === 'past'
          ? new Date(b.ride.starts_at).getTime() - new Date(a.ride.starts_at).getTime()
          : new Date(a.ride.starts_at).getTime() - new Date(b.ride.starts_at).getTime(),
      )
  }, [rides, regs, scope, needle])

  const totals = useMemo(() => {
    const visible = groups.flatMap((g) => g.regs)
    const confirmed = visible.filter((r) => r.status === 'confirmed')
    return {
      rides: groups.length,
      confirmed: confirmed.length,
      cancelled: visible.length - confirmed.length,
      guests: confirmed.filter((r) => !r.user_id).length,
    }
  }, [groups])

  if (loading) return <div className="card h-64 animate-pulse bg-line/40" />

  if (error)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
    )

  return (
    <div className="space-y-6">
      {/* Kopfzeile: Kennzahlen */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ausfahrten" value={totals.rides} />
        <Stat label="Angemeldet" value={totals.confirmed} />
        <Stat label="Storniert" value={totals.cancelled} />
        <Stat label="davon Gäste" value={totals.guests} hint="Anmeldungen ohne Konto" />
      </div>

      {/* Filterleiste */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex gap-1 card !rounded-full p-1">
          {(Object.keys(SCOPE_LABEL) as Scope[]).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
                scope === s ? 'bg-ink text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {SCOPE_LABEL[s]}
            </button>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input !w-64"
            placeholder="Name, E-Mail oder Telefon suchen …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {groups.length > 0 && (
            <button
              onClick={() => exportCsvGrouped(groups.map((g) => ({ ride: g.ride, regs: g.regs })))}
              className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold hover:border-ink transition-colors cursor-pointer"
            >
              Alles als CSV
            </button>
          )}
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title={needle ? 'Keine Treffer' : 'Keine Anmeldungen'}
          text={
            needle
              ? `Für „${query}" gibt es in diesem Zeitraum keine Anmeldung.`
              : 'Sobald sich jemand für eine Ausfahrt anmeldet, erscheint die Person hier.'
          }
          action={
            needle ? (
              <button onClick={() => setQuery('')} className="btn-primary">Suche zurücksetzen</button>
            ) : (
              <Link to="/admin/rides" className="btn-primary">Zu den Ausfahrten</Link>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {groups.map(({ ride, regs: list, confirmed }) => {
            const isCollapsed = collapsed[ride.id]
            const pct = Math.min((confirmed / Math.max(ride.max_participants, 1)) * 100, 100)
            return (
              <div key={ride.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/rides/${ride.slug}`}
                        className="font-bold hover:underline underline-offset-4"
                      >
                        {ride.title}
                      </Link>
                      {ride.status === 'cancelled' && (
                        <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-bold text-white">
                          Abgesagt
                        </span>
                      )}
                      {!ride.registration_open && ride.status === 'upcoming' && (
                        <span className="rounded-full border border-line bg-bg px-2.5 py-0.5 text-[11px] font-bold text-muted">
                          Anmeldung zu
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {formatDate(ride.starts_at)} · {formatTime(ride.starts_at)} Uhr · {ride.meeting_point}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold tabular-nums">
                      {confirmed} / {ride.max_participants} Plätze
                    </span>
                    <button
                      onClick={() => exportCsv(list, ride.title)}
                      className="rounded-full border border-line bg-white px-3.5 py-1.5 font-semibold hover:border-ink transition-colors cursor-pointer"
                    >
                      CSV
                    </button>
                    <a
                      href={mailtoParticipants(list, `Social Ride Coburg – ${ride.title}`)}
                      className="rounded-full border border-line bg-white px-3.5 py-1.5 font-semibold hover:border-ink transition-colors"
                    >
                      E-Mail an alle
                    </a>
                    <button
                      onClick={() => setCollapsed({ ...collapsed, [ride.id]: !isCollapsed })}
                      className="rounded-full border border-line bg-white px-3.5 py-1.5 font-semibold hover:border-ink transition-colors cursor-pointer"
                    >
                      {isCollapsed ? 'Liste zeigen' : 'Einklappen'}
                    </button>
                  </div>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                </div>

                {!isCollapsed && (
                  <div className="mt-4 rounded-xl border border-line bg-bg p-4">
                    <ParticipantTable regs={list} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="label !mb-1">{label}</p>
      <p className="display not-italic text-3xl tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}
