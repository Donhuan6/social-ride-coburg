import { Link, NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function AdminLayout() {
  const { session, profile, loading } = useAuth()

  if (loading)
    return (
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="card h-80 animate-pulse bg-line/40" />
      </div>
    )
  if (!session) return <Navigate to="/login" replace />
  if (!profile?.is_admin)
    return (
      <div className="mx-auto max-w-3xl px-5 py-32 text-center">
        <h1 className="display not-italic text-3xl">Kein Zugriff</h1>
        <p className="mt-2 text-muted">
          Dieser Bereich ist dem Orga-Team vorbehalten. Wenn du Ausfahrten verwalten möchtest,
          melde dich beim Team.
        </p>
        <Link to="/dashboard" className="btn-primary mt-6">Zum Dashboard</Link>
      </div>
    )

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Admin</p>
          <h1 className="display not-italic text-3xl md:text-4xl">Orga-Bereich</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <nav className="flex gap-1 card !rounded-full p-1">
            <Tab to="/admin" end label="Statistiken" />
            <Tab to="/admin/rides" label="Ausfahrten" />
            <Tab to="/admin/teilnehmer" label="Teilnehmer" />
          </nav>
          <Link to="/admin/rides/neu" className="btn-accent !py-2.5">
            + Neue Ausfahrt
          </Link>
        </div>
      </div>
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  )
}

function Tab({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
          isActive ? 'bg-ink text-white' : 'text-muted hover:text-ink'
        }`
      }
    >
      {label}
    </NavLink>
  )
}
