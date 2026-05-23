import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper: Get public URL for a school photo
export function getPhotoUrl(path) {
    if (!path) return null
    // Support direct URLs (e.g. from external sources)
  if (path.startsWith('http://') || path.startsWith('https://')) return path
    const { data } = supabase.storage.from('school-photos').getPublicUrl(path)
    return data.publicUrl
}
