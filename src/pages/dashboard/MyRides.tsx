import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { cancelRegistration, fetchMyRegistrations } from '../../lib/myrides'
import type { Registration } from '../../lib/types'
import { CANCEL_CUTOFF_HOURS } from '../../lib/types'
import { formatDate, formatTime, isPast } from '../../lib/format'
import { EmptyState } from '../../components/EmptyState'

export function MyRides() {
  const { session } = useAuth()
  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    if (session)
      fetchMyRegistrations(session.user.id)
        .then(setRegs)
        .finally(() => setLoading(false))
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [session])

  async function cancel(reg: Registration) {
    if (!confirm('Anmeldung wirklich stornieren?')) return
    await cancelRegistration(reg.id)
    load()
  }

  if (loading) return <div className="card h-64 animate-pulse bg-line/40" />
  if (regs.length === 0)
    return (
      <EmptyState
        title="Noch keine Rides"
        text="Sobald du dich für einen Ride anmeldest, taucht er hier auf."
        action={<Link to="/rides" className="btn-primary">Rides entdecken</Link>}
      />
    )

  return (
    <div className="space-y-3">
      {regs.map((r) => {
        const ride = r.rides
        if (!ride) return null
        const past = isPast(ride.starts_at)
        const status =
          r.status === 'cancelled'
            ? { label: 'Storniert', cls: 'bg-bg text-muted border-line' }
            : ride.status === 'cancelled'
              ? { label: 'Ride abgesagt', cls: 'bg-ink text-white border-ink' }
              : past || ride.status === 'completed'
                ? { label: 'Abgeschlossen', cls: 'bg-bg text-ink border-line' }
                : { label: 'Bevorstehend', cls: 'bg-accent text-ink border-accent' }
        const cancellable =
          r.status === 'confirmed' &&
          ride.status === 'upcoming' &&
          new Date(ride.starts_at).getTime() - Date.now() > CANCEL_CUTOFF_HOURS * 3600_000

        return (
          <div key={r.id} className="card p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <Link to={`/rides/${ride.slug}`} className="font-bold hover:underline underline-offset-4">
                {ride.title}
              </Link>
              <p className="text-sm text-muted">
                {formatDate(ride.starts_at)} · {formatTime(ride.starts_at)} Uhr · {Number(ride.distance_km)} km
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full border px-3 py-1 text-xs font-bold ${status.cls}`}>
                {status.label}
              </span>
              {cancellable && (
                <button
                  onClick={() => cancel(r)}
                  className="text-sm font-semibold text-muted hover:text-red-600 transition-colors cursor-pointer"
                >
                  Stornieren
                </button>
              )}
            </div>
          </div>
        )
      })}
      <p className="text-xs text-muted pt-2">
        Stornierung bis {CANCEL_CUTOFF_HOURS} Stunden vor dem Start möglich.
      </p>
    </div>
  )
}
