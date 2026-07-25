import { getSupabase, isSupabaseConfigured } from './supabase';
import { isRsvpOpen, setRsvpOpen } from './rsvpStatus';
import { getGuestListStats } from './officialGuestList';

const listeners = new Set();

// FooterSection's modal and ConfirmedGuestsSection are siblings with no
// shared parent state — a tiny pub-sub (same pattern as lenis-instance.js's
// module-level singleton) lets a successful confirmation tell the public
// list to refetch without prop-drilling through App.jsx.
export function subscribeGuests(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyGuestsChanged() {
  listeners.forEach((callback) => callback());
}

export function normalizeName(name) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

// Compares only the last 8 digits so "31995448631" (DDD + 9º dígito),
// "995448631" (sem DDD) and "95448631" (sem DDD nem 9º dígito) são
// reconhecidos como o mesmo celular, não importa como a pessoa digitou.
export function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-8) || null;
}

export async function listGuests() {
  if (!isSupabaseConfigured) return [];

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('guests')
    .select('id, full_name, full_name_normalized, phone')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

function rsvpError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// Confirmação pública: o convidado só digita o nome, que precisa bater
// (após normalização) com alguém na lista oficial (guest_list_official) e
// ainda não ter confirmado. O unique em guests.full_name_normalized é quem
// garante, mesmo sob corrida entre dois envios simultâneos, que nomes
// duplicados na lista oficial (ex. duas "Janaina") só geram UMA confirmação.
export async function confirmGuestByName(name) {
  if (!isSupabaseConfigured) {
    throw rsvpError(
      'CLOSED',
      'A confirmação de presença ainda está sendo preparada. Volte em breve!',
    );
  }

  if (!(await isRsvpOpen())) {
    throw rsvpError('CLOSED', 'A lista de confirmação de presença já está fechada.');
  }

  const cleanName = name.trim();
  const normalizedName = normalizeName(cleanName);

  const supabase = await getSupabase();

  const { data: officialMatches, error: officialError } = await supabase
    .from('guest_list_official')
    .select('id')
    .eq('full_name_normalized', normalizedName)
    .limit(1);
  if (officialError) throw officialError;
  if (!officialMatches || officialMatches.length === 0) {
    throw rsvpError('NOT_FOUND', 'Pessoa não encontrada.');
  }

  const { data: existingConfirmation, error: existingError } = await supabase
    .from('guests')
    .select('id')
    .eq('full_name_normalized', normalizedName)
    .limit(1);
  if (existingError) throw existingError;
  if (existingConfirmation && existingConfirmation.length > 0) {
    throw rsvpError(
      'ALREADY_CONFIRMED',
      'Sua presença já está confirmada, te aguardamos lá!',
    );
  }

  const { data, error } = await supabase
    .from('guests')
    .insert({ full_name: cleanName, full_name_normalized: normalizedName })
    .select('id, full_name')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw rsvpError('ALREADY_CONFIRMED', 'Sua presença já está confirmada, te aguardamos lá!');
    }
    throw error;
  }

  notifyGuestsChanged();
  await closeRsvpIfEveryoneConfirmed();
  return data;
}

// After each confirmation, if every unique name on the official list is now
// confirmed, close public RSVP automatically (the admin can still reopen it
// manually from the ADM page — setRsvpOpen there is untouched).
async function closeRsvpIfEveryoneConfirmed() {
  const { confirmed, total, isOpen } = await getGuestListStats();
  if (total > 0 && confirmed >= total && isOpen) {
    await setRsvpOpen(false);
  }
}

// Admin-only additions (from the private /lista-ch-confirmados page) skip
// the isRsvpOpen() gate above — the bride can still add a guest by hand
// even while public confirmations are closed. Phone is optional here since
// it's the bride typing, not the anti-penetra check.
export async function adminAddGuest(name) {
  if (!isSupabaseConfigured) {
    throw new Error('A confirmação de presença ainda está sendo preparada. Volte em breve!');
  }

  const cleanName = name.trim();
  if (!cleanName) return null;

  const normalized = normalizeName(cleanName);
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('guests')
    .insert({ full_name: cleanName, full_name_normalized: normalized })
    .select('id, full_name')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Esse nome já consta na lista.');
    }
    throw error;
  }

  notifyGuestsChanged();
  return data;
}

export async function updateGuest(id, { name, phone }) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('O nome não pode ficar vazio.');

  const supabase = await getSupabase();
  const { error } = await supabase
    .from('guests')
    .update({
      full_name: cleanName,
      full_name_normalized: normalizeName(cleanName),
      phone: phone?.trim() || null,
      phone_normalized: phone?.trim() ? normalizePhone(phone) : null,
    })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      throw new Error('Esse nome ou celular já consta na lista.');
    }
    throw error;
  }

  notifyGuestsChanged();
}

export async function deleteGuest(id) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('guests').delete().eq('id', id);
  if (error) throw error;

  notifyGuestsChanged();
}
