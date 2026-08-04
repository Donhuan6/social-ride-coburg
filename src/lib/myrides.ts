import { supabase } from './supabase'
import type { Registration, Ride } from './types'

export async function fetchMyRegistrations(userId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*, rides(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Registration[]
}

export async function fetchSavedRides(userId: string): Promise<Ride[]> {
  const { data, error } = await supabase
    .from('saved_rides')
    .select('rides(*)')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? []).map((d: { rides: unknown }) => d.rides as Ride).filter(Boolean)
}

export async function cancelRegistration(id: string) {
  const { error } = await supabase.from('registrations').update({ status: 'cancelled' }).eq('id', id)
  if (error) throw error
}
