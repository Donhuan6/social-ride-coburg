import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { Ride } from '../lib/types'

const srcIcon = L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#111;border:3px solid #F5C400;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 24],
})

async function loadGpxTrack(url: string): Promise<[number, number][]> {
  const res = await fetch(url)
  const text = await res.text()
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  const pts = Array.from(doc.querySelectorAll('trkpt, rtept'))
  return pts
    .map((p) => [Number(p.getAttribute('lat')), Number(p.getAttribute('lon'))] as [number, number])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b))
}

export function RideMap({ ride }: { ride: Ride }) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const center: [number, number] = [ride.lat ?? 50.258, ride.lng ?? 10.964]
    const map = L.map(ref.current, { scrollWheelZoom: false }).setView(center, 12)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)

    if (ride.lat && ride.lng) {
      L.marker([ride.lat, ride.lng], { icon: srcIcon })
        .addTo(map)
        .bindPopup(`<b>Treffpunkt</b><br>${ride.meeting_point}`)
    }

    if (ride.gpx_url) {
      loadGpxTrack(ride.gpx_url)
        .then((track) => {
          if (track.length > 1) {
            const line = L.polyline(track, { color: '#F5C400', weight: 5, opacity: 0.95 })
            L.polyline(track, { color: '#111', weight: 8, opacity: 0.35 }).addTo(map)
            line.addTo(map)
            map.fitBounds(line.getBounds(), { padding: [24, 24] })
          }
        })
        .catch(() => {})
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [ride])

  return <div ref={ref} className="h-80 md:h-96 w-full rounded-[18px] overflow-hidden border border-line z-0" />
}
