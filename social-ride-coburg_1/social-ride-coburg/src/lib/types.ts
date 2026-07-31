export type Difficulty = 'easy' | 'medium' | 'hard'
export type RideStatus = 'upcoming' | 'completed' | 'cancelled'
export type RegistrationStatus = 'confirmed' | 'cancelled'

export interface Ride {
  id: string
  title: string
  slug: string
  cover_image_url: string | null
  starts_at: string
  meeting_point: string
  lat: number | null
  lng: number | null
  distance_km: number
  elevation_m: number
  avg_pace: string | null
  difficulty: Difficulty
  bike_types: string[]
  description: string | null
  notes: string | null
  gpx_url: string | null
  organizer: string
  max_participants: number
  registration_open: boolean
  status: RideStatus
  tags: string[]
  created_at: string
  confirmed_count?: number
}

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  bike_type: string | null
  experience: string | null
  phone: string | null
  emergency_contact: string | null
  instagram: string | null
  is_admin: boolean
  created_at: string
}

export interface Registration {
  id: string
  ride_id: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  emergency_contact: string | null
  status: RegistrationStatus
  created_at: string
  rides?: Ride
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Locker',
  medium: 'Sportlich',
  hard: 'Anspruchsvoll',
}

export const BIKE_LABEL: Record<string, string> = {
  road: 'Rennrad',
  gravel: 'Gravel',
  mtb: 'MTB',
  city: 'City',
  other: 'Sonstiges',
}

export const RIDE_STATUS_LABEL: Record<RideStatus, string> = {
  upcoming: 'Bevorstehend',
  completed: 'Abgeschlossen',
  cancelled: 'Abgesagt',
}

/** Hours before start until which a participant can cancel */
export const CANCEL_CUTOFF_HOURS = 2
