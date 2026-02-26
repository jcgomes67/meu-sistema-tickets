import { createClient } from '@supabase/supabase-js'

// Substitui as tuas linhas 3 e 4 por estas:
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY


export const supabase = createClient(supabaseUrl, supabaseKey)

