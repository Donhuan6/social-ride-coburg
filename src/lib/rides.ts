import { supabase } from './supabase'
import type { Ride } from './types'

async function attachCounts(rides: Ride[]): Promise<Ride[]> {
  if (rides.length === 0) return rides
  const { data: counts } = await supabase
    .from('ride_participant_counts')
    .select('*')
    .in('ride_id', rides.map((r) => r.id))
  const map = new Map<string, number>((counts ?? []).map((c) => [c.ride_id, c.confirmed_count]))
  return rides.map((r) => ({ ...r, confirmed_count: map.get(r.id) ?? 0 }))
}

export async function fetchRides(opts?: { status?: string }): Promise<Ride[]> {
  let q = supabase.from('rides').select('*').order('starts_at', { ascending: true })
  if (opts?.status) q = q.eq('status', opts.status)
  const { data, error } = await q
  if (error) throw error
  return attachCounts((data ?? []) as Ride[])
}

export async function fetchRideBySlug(slug: string): Promise<Ride | null> {
  const { data, error } = await supabase.from('rides').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  if (!data) return null
  const [ride] = await attachCounts([data as Ride])
  return ride
}
