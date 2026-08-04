import { useEffect, useMemo, useState } from 'react'
import type { Ride, Difficulty } from '../lib/types'
import { DIFFICULTY_LABEL } from '../lib/types'
import { fetchRides } from '../lib/rides'
import { RideCard } from '../components/RideCard'

export function Rides() {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [diff, setDiff] = useState<Difficulty | 'all'>('all')
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    fetchRides()
      .then(setRides)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = rides.filter((r) => (showPast ? r.status !== 'upcoming' : r.status === 'upcoming'))
    if (diff !== 'all') list = list.filter((r) => r.difficulty === diff)
    if (showPast) list = [...list].reverse()
    return list
  }, [rides, diff, showPast])

  return (
    <div className="mx-auto max-w-6xl px-5 py-14">
      <p className="label">Termine</p>
      <h1 className="display not-italic text-4xl md:text-5xl">Rides</h1>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDiff(d)}
            className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors cursor-pointer ${
              diff === d
                ? 'bg-ink text-white border-ink'
                : 'bg-white text-muted border-line hover:border-ink hover:text-ink'
            }`}
          >
            {d === 'all' ? 'Alle' : DIFFICULTY_LABEL[d]}
          </button>
        ))}
        <span className="mx-2 h-6 w-px bg-line" />
        <button
          onClick={() => setShowPast(!showPast)}
          className={`rounded-full px-4 py-2 text-sm font-semibold border transition-colors cursor-pointer ${
            showPast
              ? 'bg-accent text-ink border-accent'
              : 'bg-white text-muted border-line hover:border-ink hover:text-ink'
          }`}
        >
          Vergangene Rides
        </button>
      </div>

      {loading ? (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-80 animate-pulse bg-line/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card mt-10 p-16 text-center">
          <p className="display not-italic text-xl">Nichts gefunden</p>
          <p className="mt-2 text-muted text-sm">
            Für diese Auswahl gibt es aktuell keine Rides.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r, i) => (
            <RideCard key={r.id} ride={r} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
