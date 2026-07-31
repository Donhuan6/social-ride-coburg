import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const nav = [
  { to: '/dashboard', label: 'Übersicht', end: true, icon: '▦' },
  { to: '/dashboard/meine-rides', label: 'Meine Rides', icon: '➜' },
  { to: '/dashboard/gemerkt', label: 'Gemerkt', icon: '★' },
  { to: '/dashboard/profil', label: 'Profil', icon: '●' },
  { to: '/dashboard/einstellungen', label: 'Einstellungen', icon: '⚙' },
]

export function DashboardLayout() {
  const { session, loading, profile } = useAuth()

  if (loading) return <div className="mx-auto max-w-6xl px-5 py-20"><div className="card h-80 animate-pulse bg-line/40" /></div>
  if (!session) return <Navigate to="/login" replace />

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <p className="label">Dashboard</p>
      <h1 className="display not-italic text-3xl md:text-4xl">
        Hey {profile?.first_name || 'Rider'}
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr] items-start">
        <aside className="card p-2 lg:sticky lg:top-24">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                    isActive ? 'bg-ink text-white' : 'text-muted hover:bg-bg hover:text-ink'
                  }`
                }
              >
                <span className="text-accent text-xs">{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
