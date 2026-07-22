import { getSupabase, isSupabaseConfigured } from './supabase';

const listeners = new Set();

// Same module-level pub-sub pattern as guests.js: the admin toggle on
// ConfirmedGuestsSection and the public GuestModal are unrelated trees,
// so this lets a toggle tell any open modal to refetch without prop-drilling.
export function subscribeRsvpStatus(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyRsvpStatusChanged() {
  listeners.forEach((callback) => callback());
}

export async function isRsvpOpen() {
  if (!isSupabaseConfigured) return true;

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('rsvp_settings')
    .select('is_open')
    .eq('id', 1)
    .single();

  if (error) throw error;
  return data.is_open;
}

export async function setRsvpOpen(open) {
  if (!isSupabaseConfigured) {
    throw new Error('A confirmação de presença ainda está sendo preparada. Volte em breve!');
  }

  const supabase = await getSupabase();
  const { error } = await supabase.from('rsvp_settings').update({ is_open: open }).eq('id', 1);
  if (error) throw error;

  notifyRsvpStatusChanged();
}
