import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper: Get public URL for a school photo
export function getPhotoUrl(path) {
  if (!path) return null
  const { data } = supabase.storage.from('school-photos').getPublicUrl(path)
  return data.publicUrl
}
