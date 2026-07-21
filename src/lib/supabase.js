const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let clientPromise = null;

// @supabase/supabase-js is a sizeable dependency for a page most visitors
// will never need it on (only guests who open the RSVP modal do) — load it
// lazily so it lands in its own chunk instead of bloating the main bundle.
export function getSupabase() {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(supabaseUrl, supabaseAnonKey),
    );
  }
  return clientPromise;
}
