import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Ride } from '../lib/types'
import { fetchRides } from '../lib/rides'
import { RideCard } from '../components/RideCard'
import { LogoMark } from '../components/Logo'

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
}

export function Landing() {
  const [rides, setRides] = useState<Ride[]>([])

  useEffect(() => {
    fetchRides({ status: 'upcoming' }).then((r) => setRides(r.slice(0, 3))).catch(() => {})
  }, [])

  const next = rides[0]

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-white">
        <HeroVideo />
        <div className="relative mx-auto max-w-6xl px-5 pt-24 pb-28 md:pt-36 md:pb-40 min-h-[560px] md:min-h-[640px] flex flex-col justify-center">
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6 }}
            className="display not-italic text-xs tracking-[0.3em] text-accent"
          >
            Social Ride Coburg //
          </motion.p>
          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="display mt-5 text-5xl md:text-7xl leading-[0.95]"
          >
            Ride Together.
            <br />
            <span className="text-accent">Explore Coburg.</span>
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-md text-lg text-white/70"
          >
            Community-Rides für alle Level. No Drop, kein Stress – einfach gemeinsam fahren.
          </motion.p>
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Link
              to={next ? `/rides/${next.slug}` : '/rides'}
              className="btn-accent !px-8 !py-4 !text-base"
            >
              Zum nächsten Ride
            </Link>
            <Link
              to="/rides"
              className="btn !px-8 !py-4 !text-base border border-white/25 text-white hover:bg-white hover:text-ink"
            >
              Alle Rides ansehen
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 flex flex-wrap gap-x-10 gap-y-4 text-sm text-white/60"
          >
            <span><b className="text-white">No Drop</b> · niemand bleibt zurück</span>
            <span><b className="text-white">Gravel / Road / MTB</b> willkommen</span>
            <span><b className="text-white">Alle Levels</b> · kostenlos dabei</span>
          </motion.div>
        </div>
      </section>

      {/* UPCOMING */}
      <section className="mx-auto max-w-6xl px-5 py-20" id="rides">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="label">Nächste Termine</p>
            <h2 className="display not-italic text-3xl md:text-4xl">Kommende Rides</h2>
          </div>
          <Link to="/rides" className="hidden sm:block text-sm font-bold hover:underline underline-offset-4">
            Alle ansehen →
          </Link>
        </div>

        {rides.length === 0 ? (
          <div className="card mt-8 p-12 text-center text-muted">
            Gerade sind keine Rides geplant – schau bald wieder vorbei.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rides.map((r, i) => (
              <RideCard key={r.id} ride={r} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* COMMUNITY */}
      <section id="community" className="mx-auto max-w-6xl px-5 py-10">
        <div className="card overflow-hidden md:grid md:grid-cols-2">
          <div className="p-8 md:p-12">
            <p className="label">Community</p>
            <h2 className="display not-italic text-3xl leading-tight">
              Gemeinsam fahren.
              <br />
              Neue Leute kennenlernen.
            </h2>
            <p className="mt-4 text-muted">
              Social Ride Coburg ist keine Rennserie, sondern eine offene Community. Lockeres
              Tempo, entspannte Abschnitte und immer ein Grund zum Quatschen – auf dem Rad und
              danach.
            </p>
            <div className="mt-6 flex gap-3">
              <Link to="/register" className="btn-primary">Mitglied werden</Link>
            </div>
          </div>
          <div className="relative bg-accent flex items-center justify-center p-12 min-h-56">
            <LogoMark className="h-32 text-ink" />
            <span className="absolute bottom-4 right-6 display text-ink/70 text-xs tracking-widest">
              EST. COBURG
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

/**
 * Hero-Hintergrund: Community-Video im Loop, stummgeschaltet.
 * Fällt automatisch auf das Standbild zurück, wenn das Video nicht abspielt
 * oder der Nutzer reduzierte Bewegung eingestellt hat.
 */
function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduce(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduce
}

function HeroVideo() {
  const reduceMotion = usePrefersReducedMotion()
  const [failed, setFailed] = useState(false)
  const showVideo = !reduceMotion && !failed

  return (
    <div className="absolute inset-0 overflow-hidden bg-ink" aria-hidden="true">
      {/* Unscharfe Füllung – nimmt die Farben der Aufnahme auf, statt flachem Schwarz */}
      <img
        src="/hero-poster.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover scale-125 blur-3xl brightness-[0.5] saturate-150"
      />

      {/* Das eigentliche Video: mobil vollflächig, ab Tablet rechts weich eingeblendet */}
      <div className="hero-video absolute inset-0 md:left-auto md:right-0 md:w-[62%] lg:w-[58%]">
        <img
          src="/hero-poster.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[50%_52%]"
        />
        {showVideo && (
          <video
            className="absolute inset-0 h-full w-full object-cover object-[50%_52%]"
            poster="/hero-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setFailed(true)}
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
        )}
      </div>

      {/* Abdunkeln für lesbaren Text – mobil von oben, ab Tablet von links */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/45 to-ink/70 md:bg-gradient-to-r md:from-ink/95 md:via-ink/65 md:to-ink/15" />
      <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-ink/30" />
    </div>
  )
}
