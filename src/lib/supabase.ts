import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cpbadvkgajzpxojvhfdv.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_sNnT_Ufvk2zDrRc6A1b0Xw_Ho1Wd94L';

export const supabase = createClient(supabaseUrl, supabaseKey);
