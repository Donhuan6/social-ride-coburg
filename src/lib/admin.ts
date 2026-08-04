import { supabase } from './supabase'
import type { Registration, Ride } from './types'
import { slugify } from './format'

export async function adminFetchRegistrations(rideId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('ride_id', rideId)
    .order('created_at')
  if (error) throw error
  return (data ?? []) as Registration[]
}

/** Alle Anmeldungen über alle Ausfahrten hinweg – Basis für die Teilnehmer-Übersicht. */
export async function adminFetchAllRegistrations(): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
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

/**
 * Schützt vor CSV-Injection: Beginnt ein Zellwert mit =, +, -, @ oder einem
 * Steuerzeichen, könnte Excel/LibreOffice ihn als Formel ausführen. Ein
 * vorangestelltes Apostroph zwingt das Programm, den Wert als Text zu behandeln.
 * Betrifft z. B. selbst gewählte Namen wie "=HYPERLINK(...)".
 */
function csvSafe(value: string): string {
  const s = String(value)
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows
    .map((row) => row.map((c) => `"${csvSafe(c).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

const CSV_HEADER = [
  'Vorname',
  'Nachname',
  'E-Mail',
  'Telefon',
  'Notfallkontakt',
  'Konto',
  'Status',
  'Angemeldet am',
]

function csvRow(r: Registration): string[] {
  return [
    r.first_name,
    r.last_name,
    r.email,
    r.phone ?? '',
    r.emergency_contact ?? '',
    r.user_id ? 'Registriert' : 'Gast',
    r.status === 'confirmed' ? 'Bestätigt' : 'Storniert',
    new Date(r.created_at).toLocaleString('de-DE'),
  ]
}

export function exportCsv(regs: Registration[], rideTitle: string) {
  downloadCsv([CSV_HEADER, ...regs.map(csvRow)], `teilnehmer-${slugify(rideTitle)}.csv`)
}

/** Export über mehrere Ausfahrten hinweg – mit Ausfahrt als erster Spalte. */
export function exportCsvGrouped(groups: { ride: Ride; regs: Registration[] }[]) {
  const rows: string[][] = [['Ausfahrt', 'Datum', ...CSV_HEADER]]
  for (const { ride, regs } of groups) {
    const date = new Date(ride.starts_at).toLocaleString('de-DE')
    for (const r of regs) rows.push([ride.title, date, ...csvRow(r)])
  }
  downloadCsv(rows, `teilnehmer-alle-ausfahrten-${new Date().toISOString().slice(0, 10)}.csv`)
}

export function mailtoParticipants(regs: Registration[], subject: string): string {
  const emails = regs.filter((r) => r.status === 'confirmed').map((r) => r.email)
  return `mailto:?bcc=${emails.join(',')}&subject=${encodeURIComponent(subject)}`
}
