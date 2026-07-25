import { getSupabase, isSupabaseConfigured } from './supabase';
import { normalizeName, listGuests } from './guests';
import { isRsvpOpen } from './rsvpStatus';

const listeners = new Set();

// Same module-level pub-sub pattern as guests.js/rsvpStatus.js: the admin
// list-management UI and the public GuestModal are unrelated trees.
export function subscribeOfficialGuestList(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyOfficialGuestListChanged() {
  listeners.forEach((callback) => callback());
}

export async function listOfficialGuests() {
  if (!isSupabaseConfigured) return [];

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('guest_list_official')
    .select('id, full_name, full_name_normalized')
    .order('full_name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function adminAddOfficialGuest(name) {
  const cleanName = name.trim();
  if (!cleanName) return null;

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('guest_list_official')
    .insert({ full_name: cleanName, full_name_normalized: normalizeName(cleanName) })
    .select('id, full_name, full_name_normalized')
    .single();

  if (error) throw error;

  notifyOfficialGuestListChanged();
  return data;
}

export async function updateOfficialGuest(id, name) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('O nome não pode ficar vazio.');

  const supabase = await getSupabase();
  const { error } = await supabase
    .from('guest_list_official')
    .update({ full_name: cleanName, full_name_normalized: normalizeName(cleanName) })
    .eq('id', id);

  if (error) throw error;

  notifyOfficialGuestListChanged();
}

// Before deleting a row, tells the caller whether this is the last
// occurrence of that name in the official list and whether that identity
// already has a confirmation — so the admin UI can warn before the action
// is irreversible.
export async function describeRemovalImpact(id) {
  const [officialGuests, confirmedGuests] = await Promise.all([listOfficialGuests(), listGuests()]);
  const target = officialGuests.find((g) => g.id === id);
  if (!target) return { isLastOccurrence: false, isConfirmed: false };

  const isLastOccurrence =
    officialGuests.filter((g) => g.full_name_normalized === target.full_name_normalized).length === 1;
  const isConfirmed = confirmedGuests.some(
    (g) => g.full_name_normalized === target.full_name_normalized,
  );

  return { isLastOccurrence, isConfirmed };
}

export async function deleteOfficialGuest(id) {
  const supabase = await getSupabase();

  const officialGuests = await listOfficialGuests();
  const target = officialGuests.find((g) => g.id === id);
  const isLastOccurrence =
    !!target &&
    officialGuests.filter((g) => g.full_name_normalized === target.full_name_normalized).length === 1;

  const { error } = await supabase.from('guest_list_official').delete().eq('id', id);
  if (error) throw error;

  // The removed name no longer has an official identity backing it — clean
  // up the matching confirmation too, so it can't be counted or shown as
  // confirmed with nothing on the invite list to justify it.
  if (isLastOccurrence) {
    const { error: confirmedDeleteError } = await supabase
      .from('guests')
      .delete()
      .eq('full_name_normalized', target.full_name_normalized);
    if (confirmedDeleteError) throw confirmedDeleteError;
  }

  notifyOfficialGuestListChanged();
}

export async function getGuestListStats() {
  const [officialGuests, confirmedGuests, open] = await Promise.all([
    listOfficialGuests(),
    listGuests(),
    isRsvpOpen(),
  ]);

  const uniqueNames = new Set(officialGuests.map((g) => g.full_name_normalized));
  const confirmedNames = new Set(confirmedGuests.map((g) => g.full_name_normalized));

  const total = uniqueNames.size;
  const confirmed = [...uniqueNames].filter((name) => confirmedNames.has(name)).length;
  const pending = total - confirmed;
  const percent = total > 0 ? Math.round((confirmed / total) * 1000) / 10 : 0;

  return { total, confirmed, pending, percent, isOpen: open };
}
