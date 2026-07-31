import { Link } from 'react-router-dom'
import { LogoMark } from './Logo'

export function Footer() {
  return (
    <footer className="border-t border-line bg-white mt-24">
      <div className="mx-auto max-w-6xl px-5 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <LogoMark className="h-12 text-ink" />
          <p className="mt-3 text-sm text-muted max-w-xs">
            Community-Rides für alle Level. Gemeinsam fahren, neue Leute kennenlernen, Spaß auf dem
            Rad.
          </p>
        </div>
        <div>
          <p className="label">Entdecken</p>
          <ul className="space-y-2 text-sm font-medium">
            <li><Link to="/rides" className="hover:text-accent-hover transition-colors">Alle Rides</Link></li>
            <li><Link to="/register" className="hover:text-accent-hover transition-colors">Mitglied werden</Link></li>
            <li><Link to="/login" className="hover:text-accent-hover transition-colors">Anmelden</Link></li>
          </ul>
        </div>
        <div>
          <p className="label">Rechtliches</p>
          <ul className="space-y-2 text-sm font-medium">
            <li><Link to="/impressum" className="hover:text-accent-hover transition-colors">Impressum</Link></li>
            <li><Link to="/datenschutz" className="hover:text-accent-hover transition-colors">Datenschutz</Link></li>
            <li><Link to="/haftungsausschluss" className="hover:text-accent-hover transition-colors">Haftungsausschluss</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>© {new Date().getFullYear()} Social Ride Coburg</span>
          <span className="display not-italic text-[10px] tracking-widest">RIDE TOGETHER //</span>
        </div>
      </div>
    </footer>
  )
}
