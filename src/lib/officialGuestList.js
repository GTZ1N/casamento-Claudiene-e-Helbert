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

// Each occurrence of a name on the official list is one confirmation slot
// (see confirm_guest_by_name in supabase/schema.sql). Before deleting a row,
// tells the caller whether removing it will drop capacity below the number
// of people who already confirmed under that name — so the admin UI can
// warn before the action is irreversible.
export async function describeRemovalImpact(id) {
  const [officialGuests, confirmedGuests] = await Promise.all([listOfficialGuests(), listGuests()]);
  const target = officialGuests.find((g) => g.id === id);
  if (!target) return { willExceedCapacity: false, isConfirmed: false };

  const remainingSlots =
    officialGuests.filter((g) => g.full_name_normalized === target.full_name_normalized).length - 1;
  const confirmedCount = confirmedGuests.filter(
    (g) => g.full_name_normalized === target.full_name_normalized,
  ).length;

  return {
    willExceedCapacity: confirmedCount > remainingSlots,
    isConfirmed: confirmedCount > 0,
  };
}

export async function deleteOfficialGuest(id) {
  const supabase = await getSupabase();

  const officialGuests = await listOfficialGuests();
  const target = officialGuests.find((g) => g.id === id);

  const { error } = await supabase.from('guest_list_official').delete().eq('id', id);
  if (error) throw error;

  if (target) {
    // Removing a slot can leave more people confirmed under this name than
    // there are official occurrences left — trim the most recent
    // confirmation(s) down to the new capacity so the numbers stay honest.
    const remainingSlots = officialGuests.filter(
      (g) => g.full_name_normalized === target.full_name_normalized,
    ).length - 1;

    // listGuests() is already ordered by created_at ascending, so the tail
    // of this filtered array is the most recently confirmed.
    const confirmedForName = (await listGuests()).filter(
      (g) => g.full_name_normalized === target.full_name_normalized,
    );

    const excess = confirmedForName.length - Math.max(remainingSlots, 0);
    if (excess > 0) {
      const idsToRemove = confirmedForName.slice(-excess).map((g) => g.id);
      const { error: trimError } = await supabase.from('guests').delete().in('id', idsToRemove);
      if (trimError) throw trimError;
    }
  }

  notifyOfficialGuestListChanged();
}

export async function getGuestListStats() {
  const [officialGuests, confirmedGuests, open] = await Promise.all([
    listOfficialGuests(),
    listGuests(),
    isRsvpOpen(),
  ]);

  // Total counts every row on the invite list (duplicates included, e.g.
  // two "Janaina" = 2), matching what's shown/edited in the admin list.
  // Confirmed counts how many of those slots are occupied, capped per name
  // at how many occurrences that name actually has (extra confirmations
  // beyond capacity shouldn't happen via confirm_guest_by_name, but admin
  // manual additions could in theory create more — cap keeps the math sane).
  const officialCountByName = new Map();
  for (const g of officialGuests) {
    officialCountByName.set(
      g.full_name_normalized,
      (officialCountByName.get(g.full_name_normalized) || 0) + 1,
    );
  }

  const confirmedCountByName = new Map();
  for (const g of confirmedGuests) {
    confirmedCountByName.set(
      g.full_name_normalized,
      (confirmedCountByName.get(g.full_name_normalized) || 0) + 1,
    );
  }

  const total = officialGuests.length;
  let confirmed = 0;
  for (const [name, capacity] of officialCountByName) {
    confirmed += Math.min(confirmedCountByName.get(name) || 0, capacity);
  }
  const pending = total - confirmed;
  const percent = total > 0 ? Math.round((confirmed / total) * 1000) / 10 : 0;

  return { total, confirmed, pending, percent, isOpen: open };
}
