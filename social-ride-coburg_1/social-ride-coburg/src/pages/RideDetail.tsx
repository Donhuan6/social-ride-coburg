import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Ride } from '../lib/types'
import { BIKE_LABEL, DIFFICULTY_LABEL } from '../lib/types'
import { fetchRideBySlug } from '../lib/rides'
import { formatDateLong, formatTime } from '../lib/format'
import { CoverArt } from '../components/CoverArt'
import { RideMap } from '../components/RideMap'
import { JoinModal } from '../components/JoinModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function RideDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { session } = useAuth()
  const [ride, setRide] = useState<Ride | null | undefined>(undefined)
  const [modal, setModal] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = useCallback(() => {
    if (slug) fetchRideBySlug(slug).then(setRide)
  }, [slug])

  useEffect(load, [load])

  useEffect(() => {
    if (session && ride) {
      supabase
        .from('saved_rides')
        .select('ride_id')
        .eq('ride_id', ride.id)
        .eq('user_id', session.user.id)
        .maybeSingle()
        .then(({ data }) => setSaved(!!data))
    }
  }, [session, ride])

  if (ride === undefined)
    return <div className="mx-auto max-w-5xl px-5 py-20"><div className="card h-96 animate-pulse bg-line/40" /></div>
  if (ride === null)
    return (
      <div className="mx-auto max-w-5xl px-5 py-32 text-center">
        <h1 className="display not-italic text-3xl">Ride nicht gefunden</h1>
        <Link to="/rides" className="btn-primary mt-6">Zu allen Rides</Link>
      </div>
    )

  const count = ride.confirmed_count ?? 0
  const full = count >= ride.max_participants
  const joinable = ride.status === 'upcoming' && ride.registration_open && !full

  async function toggleSave() {
    if (!session || !ride) return
    if (saved) {
      await supabase.from('saved_rides').delete().eq('ride_id', ride.id).eq('user_id', session.user.id)
      setSaved(false)
    } else {
      await supabase.from('saved_rides').insert({ ride_id: ride.id, user_id: session.user.id })
      setSaved(true)
    }
  }

  return (
    <div>
      {/* HERO */}
      <div className="relative h-72 md:h-[420px] bg-ink overflow-hidden">
        <CoverArt ride={ride} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-5xl px-5 pb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-ink">
                  {DIFFICULTY_LABEL[ride.difficulty]}
                </span>
                {ride.tags.map((t) => (
                  <span key={t} className="rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-bold text-white">
                    #{t}
                  </span>
                ))}
              </div>
              <h1 className="display mt-3 text-3xl md:text-5xl text-white leading-tight">{ride.title}</h1>
              <p className="mt-2 text-white/80 text-sm md:text-base">
                {formatDateLong(ride.starts_at)} · {formatTime(ride.starts_at)} Uhr · {ride.meeting_point}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* MAIN */}
        <div className="space-y-8 min-w-0">
          <section className="card p-6 md:p-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
            <Fact label="Distanz" value={`${Number(ride.distance_km)} km`} />
            <Fact label="Höhenmeter" value={`${ride.elevation_m} hm`} />
            <Fact label="Ø Tempo" value={ride.avg_pace ?? '–'} />
            <Fact label="Level" value={DIFFICULTY_LABEL[ride.difficulty]} />
          </section>

          <section>
            <h2 className="display not-italic text-xl mb-4">Route</h2>
            <RideMap ride={ride} />
            {!ride.gpx_url && (
              <p className="mt-2 text-xs text-muted">GPX-Track folgt – Treffpunkt ist markiert.</p>
            )}
          </section>

          {ride.description && (
            <section className="card p-6 md:p-8">
              <h2 className="display not-italic text-xl mb-3">Beschreibung</h2>
              <p className="whitespace-pre-line text-ink/80 leading-relaxed">{ride.description}</p>
            </section>
          )}

          {ride.notes && (
            <section className="rounded-[18px] border border-accent bg-accent/10 p-6">
              <h2 className="display not-italic text-base mb-2">Wichtige Hinweise</h2>
              <p className="whitespace-pre-line text-sm text-ink/80">{ride.notes}</p>
            </section>
          )}
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="card p-6">
            <InfoRow label="Datum" value={formatDateLong(ride.starts_at)} />
            <InfoRow label="Startzeit" value={`${formatTime(ride.starts_at)} Uhr`} />
            <InfoRow label="Treffpunkt" value={ride.meeting_point} />
            <InfoRow label="Bikes" value={ride.bike_types.map((b) => BIKE_LABEL[b] ?? b).join(' · ')} />
            <InfoRow label="Organisation" value={ride.organizer} />

            <div className="mt-5 pt-5 border-t border-line">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Teilnehmer</span>
                <span>
                  {count}/{ride.max_participants}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-line overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${Math.min((count / ride.max_participants) * 100, 100)}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setModal(true)}
              disabled={!joinable}
              className="btn-primary mt-6 w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {ride.status === 'cancelled'
                ? 'Ride abgesagt'
                : ride.status === 'completed'
                  ? 'Ride beendet'
                  : full
                    ? 'Ausgebucht'
                    : !ride.registration_open
                      ? 'Anmeldung geschlossen'
                      : session
                        ? 'Jetzt mitfahren'
                        : 'Anmelden & mitfahren'}
            </button>
            {joinable && !session && (
              <p className="mt-2 text-center text-xs text-muted">
                Kostenloses Konto nötig – dauert eine Minute.
              </p>
            )}

            {session && (
              <button onClick={toggleSave} className="btn-secondary mt-2 w-full">
                {saved ? '★ Gemerkt' : '☆ Merken'}
              </button>
            )}
            {ride.gpx_url && (
              <a href={ride.gpx_url} download className="btn-secondary mt-2 w-full">
                GPX herunterladen
              </a>
            )}
          </div>

          <div className="rounded-[18px] bg-ink text-white p-6">
            <p className="display text-accent text-xs tracking-widest">No Drop Ride //</p>
            <p className="mt-2 text-sm text-white/75">
              Wir fahren gemeinsam los und kommen gemeinsam an. Niemand bleibt zurück.
            </p>
          </div>
        </aside>
      </div>

      <JoinModal ride={ride} open={modal} onClose={() => setModal(false)} onJoined={load} />
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label !mb-0.5">{label}</p>
      <p className="display not-italic text-xl md:text-2xl">{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2 flex items-start justify-between gap-4 text-sm">
      <span className="text-muted font-medium shrink-0">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  )
}
