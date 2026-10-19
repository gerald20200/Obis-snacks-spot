import { createClient } from '@supabase/supabase-js'

// Your Supabase Project Credentials
const supabaseUrl = 'https://ouriduvcnenodechrgau.supabase.co'
const supabaseAnonKey = 'sb_publishable_xFRY5RTHxaBzjtcuaw_y3Q_9NoDmTWd'

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Optional: Test log to confirm initialization in the browser console
console.log('Supabase client initialized successfully!')
