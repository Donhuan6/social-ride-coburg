import { createClient } from '@supabase/supabase-js'

// Fallbacks, falls keine .env vorhanden ist (z. B. nach dem Entpacken unter Windows).
// Der Publishable Key ist öffentlich und darf im Frontend stehen –
// die Sicherheit kommt von Row Level Security in der Datenbank.
const url = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://ocsaxywbynglytpdlipq.supabase.co'
const key =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_9XIYXjlfWsne5ZTkuGAETw_Zq01NWXl'

export const supabase = createClient(url, key)
