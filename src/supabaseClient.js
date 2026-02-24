import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zcidprxvtsnqzfulaafz.supabase.co'
const supabaseKey = 'sb_publishable_NDNFx8gssw92w-EaXO5dPQ_-gdl6Kh5'

export const supabase = createClient(supabaseUrl, supabaseKey)