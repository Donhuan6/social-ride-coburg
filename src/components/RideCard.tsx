import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Ride } from '../lib/types'
import { DIFFICULTY_LABEL } from '../lib/types'
import { formatDate, formatTime } from '../lib/format'
import { CoverArt } from './CoverArt'

export function RideCard({ ride, index = 0 }: { ride: Ride; index?: number }) {
  const count = ride.confirmed_count ?? 0
  const full = count >= ride.max_participants
  const closed = !ride.registration_open || ride.status !== 'upcoming'

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4) }}
    >
      <Link
        to={`/rides/${ride.slug}`}
        className="card block overflow-hidden group hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] transition-all duration-300"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-ink">
          <div className="absolute inset-0 group-hover:scale-[1.04] transition-transform duration-500">
            <CoverArt ride={ride} />
          </div>
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="rounded-full bg-white/95 backdrop-blur px-3 py-1 text-xs font-bold">
              {DIFFICULTY_LABEL[ride.difficulty]}
            </span>
            {ride.status === 'cancelled' && (
              <span className="rounded-full bg-ink text-white px-3 py-1 text-xs font-bold">Abgesagt</span>
            )}
          </div>
          <div className="absolute bottom-3 right-3 rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-ink">
            {formatDate(ride.starts_at)} · {formatTime(ride.starts_at)}
          </div>
        </div>

        <div className="p-5">
          <h3 className="display not-italic text-lg leading-tight group-hover:text-ink">
            {ride.title}
          </h3>
          <p className="mt-1 text-sm text-muted flex items-center gap-1.5">
            <PinIcon /> {ride.meeting_point}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip">{Number(ride.distance_km)} km</span>
            <span className="chip">{ride.elevation_m} hm</span>
            {ride.avg_pace && <span className="chip">{ride.avg_pace}</span>}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs font-semibold text-muted">
              <span className={full ? 'text-ink' : 'text-ink'}>{count}</span>/{ride.max_participants}{' '}
              Plätze belegt
              <div className="mt-1 h-1 w-28 rounded-full bg-line overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min((count / ride.max_participants) * 100, 100)}%` }}
                />
              </div>
            </div>
            <span
              className={`text-sm font-bold ${closed || full ? 'text-muted' : 'text-ink group-hover:underline underline-offset-4'}`}
            >
              {ride.status !== 'upcoming' ? '—' : full ? 'Ausgebucht' : closed ? 'Geschlossen' : 'Mitfahren →'}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
      <path
        fillRule="evenodd"
        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
        clipRule="evenodd"
      />
    </svg>
  )
}
