import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchMyRegistrations } from '../../lib/myrides'
import type { Registration } from '../../lib/types'
import { formatDate, formatTime, isPast } from '../../lib/format'
import { EmptyState } from '../../components/EmptyState'

export function DashboardHome() {
  const { session, profile } = useAuth()
  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session)
      fetchMyRegistrations(session.user.id)
        .then(setRegs)
        .finally(() => setLoading(false))
  }, [session])

  const confirmed = regs.filter((r) => r.status === 'confirmed' && r.rides)
  const upcoming = confirmed.filter((r) => r.rides!.status === 'upcoming' && !isPast(r.rides!.starts_at))
  const past = confirmed.filter((r) => r.rides!.status === 'completed' || isPast(r.rides!.starts_at))
  const totalKm = past.reduce((s, r) => s + Number(r.rides?.distance_km ?? 0), 0)
  const totalHm = past.reduce((s, r) => s + (r.rides?.elevation_m ?? 0), 0)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Gefahrene Rides" value={String(past.length)} />
        <Stat label="Kilometer" value={`${totalKm}`} />
        <Stat label="Höhenmeter" value={`${totalHm}`} />
        <Stat
          label="Dabei seit"
          value={
            profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })
              : '–'
          }
        />
      </div>

      <section>
        <h2 className="display not-italic text-xl mb-4">Deine nächsten Rides</h2>
        {loading ? (
          <div className="card h-32 animate-pulse bg-line/40" />
        ) : upcoming.length === 0 ? (
          <EmptyState
            title="Noch nichts geplant"
            text="Du bist aktuell für keinen Ride angemeldet."
            action={<Link to="/rides" className="btn-primary">Rides entdecken</Link>}
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map((r) => (
              <Link
                key={r.id}
                to={`/rides/${r.rides!.slug}`}
                className="card flex items-center justify-between gap-4 p-5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] transition-all"
              >
                <div className="min-w-0">
                  <p className="font-bold truncate">{r.rides!.title}</p>
                  <p className="text-sm text-muted">
                    {formatDate(r.rides!.starts_at)} · {formatTime(r.rides!.starts_at)} Uhr · {r.rides!.meeting_point}
                  </p>
                </div>
                <span className="chip shrink-0 !bg-accent !border-accent">Angemeldet</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="display not-italic text-2xl md:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
    </div>
  )
}
