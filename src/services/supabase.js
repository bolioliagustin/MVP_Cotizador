import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Check if Supabase is configured and connected
 */
export async function checkSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('quotes').select('count');
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet (expected)
            console.error('Supabase connection error:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Supabase connection failed:', error);
        return false;
    }
}
