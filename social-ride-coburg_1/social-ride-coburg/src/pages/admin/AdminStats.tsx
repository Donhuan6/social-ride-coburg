import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Ride } from '../../lib/types'

interface RegLite {
  created_at: string
  ride_id: string
  status: string
}

export function AdminStats() {
  const [rides, setRides] = useState<Ride[]>([])
  const [regs, setRegs] = useState<RegLite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('rides').select('*'),
      supabase.from('registrations').select('created_at, ride_id, status'),
    ])
      .then(([r1, r2]) => {
        setRides((r1.data ?? []) as Ride[])
        setRegs((r2.data ?? []) as RegLite[])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="card h-64 animate-pulse bg-line/40" />

  const confirmed = regs.filter((r) => r.status === 'confirmed')

  // registrations per ISO week (last 8 weeks)
  const weeks: { label: string; count: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const start = new Date()
    start.setDate(start.getDate() - start.getDay() + 1 - i * 7)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    weeks.push({
      label: start.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      count: confirmed.filter((r) => {
        const t = new Date(r.created_at).getTime()
        return t >= start.getTime() && t < end.getTime()
      }).length,
    })
  }
  const maxWeek = Math.max(...weeks.map((w) => w.count), 1)

  const popular = rides
    .map((ride) => ({
      ride,
      count: confirmed.filter((r) => r.ride_id === ride.id).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const maxPop = Math.max(...popular.map((p) => p.count), 1)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Rides gesamt" value={String(rides.length)} />
        <Stat label="Bevorstehend" value={String(rides.filter((r) => r.status === 'upcoming').length)} />
        <Stat label="Anmeldungen" value={String(confirmed.length)} />
        <Stat
          label="Ø pro Ride"
          value={rides.length ? (confirmed.length / rides.length).toFixed(1) : '0'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="display not-italic text-lg">Anmeldungen · letzte 8 Wochen</h2>
          <div className="mt-6 flex items-end gap-2 h-40">
            {weeks.map((w) => (
              <div key={w.label} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-bold">{w.count || ''}</span>
                <div
                  className="w-full rounded-t-md bg-accent transition-all"
                  style={{ height: `${(w.count / maxWeek) * 100}%`, minHeight: w.count ? 6 : 2 }}
                />
                <span className="text-[10px] text-muted">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="display not-italic text-lg">Beliebteste Rides</h2>
          <div className="mt-6 space-y-4">
            {popular.map(({ ride, count }) => (
              <div key={ride.id}>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="truncate pr-4">{ride.title}</span>
                  <span>{count}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-line overflow-hidden">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${(count / maxPop) * 100}%` }} />
                </div>
              </div>
            ))}
            {popular.length === 0 && <p className="text-sm text-muted">Noch keine Daten.</p>}
          </div>
        </div>
      </div>
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
