import { createClient } from '@supabase/supabase-js'

// Substitui as tuas linhas 3 e 4 por estas:
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

