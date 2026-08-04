import type { Ride } from '../lib/types'

/**
 * Deterministic premium cover art for rides without a photo.
 * Dark asphalt gradient + yellow route line, in SRC branding.
 */
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function CoverArt({ ride, className = '' }: { ride: Ride; className?: string }) {
  if (ride.cover_image_url) {
    return (
      <img
        src={ride.cover_image_url}
        alt={ride.title}
        className={`w-full h-full object-cover ${className}`}
        loading="lazy"
      />
    )
  }
  const h = hash(ride.slug)
  const y1 = 20 + (h % 40)
  const y2 = 80 - (h % 35)
  const y3 = 30 + ((h >> 4) % 40)
  const route = `M -10 ${y1} C 60 ${y2}, 120 ${y1 - 10}, 180 ${y3} S 280 ${y2}, 330 ${y1}`
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      className={`w-full h-full ${className}`}
      role="img"
      aria-label={ride.title}
    >
      <defs>
        <linearGradient id={`g-${ride.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#111111" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#g-${ride.id})`} />
      <g opacity="0.08" stroke="#ffffff" strokeWidth="0.6">
        {Array.from({ length: 7 }).map((_, i) => (
          <path
            key={i}
            d={`M ${-20 + i * 55} 200 C ${10 + i * 50} ${120 - (h + i * 17) % 60}, ${40 + i * 55} ${150 - (h + i * 29) % 80}, ${70 + i * 52} -20`}
            fill="none"
          />
        ))}
      </g>
      <path d={route} fill="none" stroke="#000" strokeWidth="9" opacity="0.5" strokeLinecap="round" />
      <path d={route} fill="none" stroke="#F5C400" strokeWidth="5" strokeLinecap="round" />
      <circle cx={310 - (h % 30)} cy={y1 + 1} r="6" fill="#F5C400" />
      <circle cx={310 - (h % 30)} cy={y1 + 1} r="2.5" fill="#111" />
      <text
        x="16"
        y="166"
        fill="#F5C400"
        fontFamily="Archivo, sans-serif"
        fontStyle="italic"
        fontWeight="900"
        fontSize="13"
        letterSpacing="1"
      >
        SRC //
      </text>
    </svg>
  )
}
