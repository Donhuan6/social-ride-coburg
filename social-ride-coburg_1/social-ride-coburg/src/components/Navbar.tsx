import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Logo } from './Logo'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/rides', label: 'Rides' },
  { to: '/#community', label: 'Community' },
]

export function Navbar() {
  const { session, profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-bg/80 border-b border-line">
      <nav className="mx-auto max-w-6xl px-5 h-20 flex items-center justify-between">
        <Link to="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className="text-sm font-semibold text-muted hover:text-ink transition-colors"
            >
              {l.label}
            </NavLink>
          ))}
          {session ? (
            <div className="flex items-center gap-3">
              {profile?.is_admin && (
                <Link to="/admin" className="text-sm font-semibold text-muted hover:text-ink transition-colors">
                  Admin
                </Link>
              )}
              <Link to="/dashboard" className="btn-secondary !py-2">
                Dashboard
              </Link>
              <button
                onClick={async () => {
                  await signOut()
                  navigate('/')
                }}
                className="text-sm font-semibold text-muted hover:text-ink transition-colors cursor-pointer"
              >
                Abmelden
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-semibold text-muted hover:text-ink transition-colors">
                Anmelden
              </Link>
              <Link to="/register" className="btn-primary !py-2">
                Mitglied werden
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden p-2 -mr-2 cursor-pointer"
          onClick={() => setOpen(!open)}
          aria-label="Menü"
        >
          <div className="w-5 space-y-1.5">
            <span className={`block h-0.5 bg-ink transition-transform ${open ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 bg-ink transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 bg-ink transition-transform ${open ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-t border-line bg-white"
          >
            <div className="px-5 py-4 flex flex-col gap-4">
              <Link to="/rides" onClick={() => setOpen(false)} className="font-semibold">
                Rides
              </Link>
              {session ? (
                <>
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="font-semibold">
                    Dashboard
                  </Link>
                  {profile?.is_admin && (
                    <Link to="/admin" onClick={() => setOpen(false)} className="font-semibold">
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      await signOut()
                      setOpen(false)
                      navigate('/')
                    }}
                    className="text-left font-semibold text-muted cursor-pointer"
                  >
                    Abmelden
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="font-semibold">
                    Anmelden
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn-primary w-full">
                    Mitglied werden
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
