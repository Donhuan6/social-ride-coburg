import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Registration, Ride } from '../../lib/types'
import { RIDE_STATUS_LABEL } from '../../lib/types'
import { formatDate, formatTime } from '../../lib/format'
import { EmptyState } from '../../components/EmptyState'
import { ParticipantTable } from '../../components/ParticipantTable'
import {
  adminDeleteRide,
  adminDuplicateRide,
  adminFetchRegistrations,
  adminSaveRide,
  exportCsv,
  mailtoParticipants,
} from '../../lib/admin'

export function AdminRides() {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [participantsFor, setParticipantsFor] = useState<Ride | null>(null)
  const [regs, setRegs] = useState<Registration[]>([])

  function load() {
    supabase
      .from('rides')
      .select('*')
      .order('starts_at', { ascending: false })
      .then(({ data }) => {
        setRides((data ?? []) as Ride[])
        setLoading(false)
      })
  }
  useEffect(load, [])

  async function toggleRegistration(ride: Ride) {
    await adminSaveRide({ registration_open: !ride.registration_open }, ride.id)
    load()
  }

  async function remove(ride: Ride) {
    if (!confirm(`„${ride.title}" wirklich löschen? Alle Anmeldungen gehen verloren.`)) return
    await adminDeleteRide(ride.id)
    load()
  }

  async function duplicate(ride: Ride) {
    await adminDuplicateRide(ride)
    load()
  }

  async function showParticipants(ride: Ride) {
    setParticipantsFor(ride)
    setRegs(await adminFetchRegistrations(ride.id))
  }

  if (loading) return <div className="card h-64 animate-pulse bg-line/40" />

  if (rides.length === 0)
    return (
      <EmptyState
        title="Noch keine Ausfahrten"
        text="Lege die erste Ausfahrt an – sie erscheint danach sofort auf der Startseite."
        action={<Link to="/admin/rides/neu" className="btn-primary">Erste Ausfahrt anlegen</Link>}
      />
    )

  return (
    <div>
      <div className="space-y-3">
        {rides.map((ride) => (
          <div key={ride.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/rides/${ride.slug}`} className="font-bold hover:underline underline-offset-4">
                    {ride.title}
                  </Link>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      ride.status === 'upcoming'
                        ? 'bg-accent text-ink'
                        : ride.status === 'completed'
                          ? 'bg-bg text-muted border border-line'
                          : 'bg-ink text-white'
                    }`}
                  >
                    {RIDE_STATUS_LABEL[ride.status]}
                  </span>
                  {!ride.registration_open && ride.status === 'upcoming' && (
                    <span className="rounded-full bg-bg border border-line px-2.5 py-0.5 text-[11px] font-bold text-muted">
                      Anmeldung zu
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted mt-0.5">
                  {formatDate(ride.starts_at)} · {formatTime(ride.starts_at)} Uhr · {Number(ride.distance_km)} km ·{' '}
                  {ride.meeting_point}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <ActionBtn onClick={() => showParticipants(ride)}>Teilnehmer</ActionBtn>
                <Link to={`/admin/rides/${ride.id}`} className="rounded-full border border-line px-3.5 py-1.5 font-semibold hover:border-ink transition-colors">
                  Bearbeiten
                </Link>
                <ActionBtn onClick={() => duplicate(ride)}>Duplizieren</ActionBtn>
                <ActionBtn onClick={() => toggleRegistration(ride)}>
                  {ride.registration_open ? 'Anm. schließen' : 'Anm. öffnen'}
                </ActionBtn>
                <button
                  onClick={() => remove(ride)}
                  className="rounded-full border border-line px-3.5 py-1.5 font-semibold text-red-600 hover:border-red-600 transition-colors cursor-pointer"
                >
                  Löschen
                </button>
              </div>
            </div>

            {participantsFor?.id === ride.id && (
              <div className="mt-4 rounded-xl bg-bg border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-sm">
                    {regs.filter((r) => r.status === 'confirmed').length} von {ride.max_participants} Plätzen belegt
                  </p>
                  <div className="flex gap-2">
                    <ActionBtn onClick={() => exportCsv(regs, ride.title)}>CSV exportieren</ActionBtn>
                    <a
                      href={mailtoParticipants(regs, `Social Ride Coburg – ${ride.title}`)}
                      className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold hover:border-ink transition-colors"
                    >
                      E-Mail an alle
                    </a>
                    <ActionBtn onClick={() => setParticipantsFor(null)}>Schließen</ActionBtn>
                  </div>
                </div>
                <div className="mt-3">
                  <ParticipantTable regs={regs} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold hover:border-ink transition-colors cursor-pointer"
    >
      {children}
    </button>
  )
}
