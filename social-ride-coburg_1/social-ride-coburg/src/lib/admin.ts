import { supabase } from './supabase'
import type { Registration, Ride } from './types'
import { slugify } from './format'

/** Alle Anmeldungen über alle Ausfahrten hinweg – für die Teilnehmer-Übersicht. */
export async function adminFetchAllRegistrations(): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*, rides(id, title, slug, starts_at, status, max_participants)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Registration[]
}

export async function adminFetchRegistrations(rideId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('ride_id', rideId)
    .order('created_at')
  if (error) throw error
  return (data ?? []) as Registration[]
}

export async function adminSaveRide(ride: Partial<Ride>, id?: string): Promise<Ride> {
  if (id) {
    const { data, error } = await supabase.from('rides').update(ride).eq('id', id).select().single()
    if (error) throw error
    return data as Ride
  }
  const { data, error } = await supabase.from('rides').insert(ride).select().single()
  if (error) throw error
  return data as Ride
}

export async function adminDeleteRide(id: string) {
  const { error } = await supabase.from('rides').delete().eq('id', id)
  if (error) throw error
}

export async function adminDuplicateRide(ride: Ride): Promise<Ride> {
  const copy: Partial<Ride> = {
    title: ride.title + ' (Kopie)',
    slug: slugify(ride.slug) + '-kopie-' + Math.random().toString(36).slice(2, 6),
    cover_image_url: ride.cover_image_url,
    starts_at: ride.starts_at,
    meeting_point: ride.meeting_point,
    lat: ride.lat,
    lng: ride.lng,
    distance_km: ride.distance_km,
    elevation_m: ride.elevation_m,
    avg_pace: ride.avg_pace,
    difficulty: ride.difficulty,
    bike_types: ride.bike_types,
    description: ride.description,
    notes: ride.notes,
    gpx_url: ride.gpx_url,
    organizer: ride.organizer,
    max_participants: ride.max_participants,
    registration_open: false,
    status: 'upcoming',
    tags: ride.tags,
  }
  return adminSaveRide(copy)
}

export async function adminUpload(bucket: 'covers' | 'gpx', file: File): Promise<string> {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const { error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export function exportCsv(regs: Registration[], rideTitle: string, withRide = false) {
  const head = ['Vorname', 'Nachname', 'E-Mail', 'Telefon', 'Notfallkontakt', 'Konto', 'Status', 'Angemeldet am']
  const rows = [
    withRide ? ['Ausfahrt', 'Termin', ...head] : head,
    ...regs.map((r) => {
      const base = [
        r.first_name,
        r.last_name,
        r.email,
        r.phone ?? '',
        r.emergency_contact ?? '',
        r.user_id ? 'ja' : 'nein (Gast)',
        r.status === 'confirmed' ? 'Bestätigt' : 'Storniert',
        new Date(r.created_at).toLocaleString('de-DE'),
      ]
      return withRide
        ? [
            r.rides?.title ?? '',
            r.rides?.starts_at ? new Date(r.rides.starts_at).toLocaleString('de-DE') : '',
            ...base,
          ]
        : base
    }),
  ]
  const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `teilnehmer-${slugify(rideTitle)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function mailtoParticipants(regs: Registration[], subject: string): string {
  const emails = regs.filter((r) => r.status === 'confirmed').map((r) => r.email)
  return `mailto:?bcc=${emails.join(',')}&subject=${encodeURIComponent(subject)}`
}
