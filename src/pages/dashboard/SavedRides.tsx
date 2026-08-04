import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchSavedRides } from '../../lib/myrides'
import type { Ride } from '../../lib/types'
import { RideCard } from '../../components/RideCard'
import { EmptyState } from '../../components/EmptyState'

export function SavedRides() {
  const { session } = useAuth()
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session)
      fetchSavedRides(session.user.id)
        .then(setRides)
        .finally(() => setLoading(false))
  }, [session])

  if (loading) return <div className="card h-64 animate-pulse bg-line/40" />
  if (rides.length === 0)
    return (
      <EmptyState
        title="Nichts gemerkt"
        text="Merke dir Rides über den ☆-Button auf der Ride-Seite."
        action={<Link to="/rides" className="btn-primary">Rides entdecken</Link>}
      />
    )

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {rides.map((r, i) => (
        <RideCard key={r.id} ride={r} index={i} />
      ))}
    </div>
  )
}
