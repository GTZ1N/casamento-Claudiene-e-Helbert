import { getSupabase, isSupabaseConfigured } from './supabase';
import { isRsvpOpen } from './rsvpStatus';

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
    .select('id, full_name, phone')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Confirmação pública: nome e celular são obrigatórios e ambos precisam
// ser inéditos na lista. A checagem client-side dá uma mensagem específica
// (qual dos dois já existe); o unique index em phone_normalized no banco é
// o guarda real contra corrida entre dois envios simultâneos.
export async function confirmGuest(name, phone) {
  if (!isSupabaseConfigured) {
    throw new Error('A confirmação de presença ainda está sendo preparada. Volte em breve!');
  }

  if (!(await isRsvpOpen())) {
    throw new Error('A lista de confirmação de presença já está fechada.');
  }

  const cleanName = name.trim();
  const cleanPhone = phone.trim();
  const normalizedName = normalizeName(cleanName);
  const normalizedPhone = normalizePhone(cleanPhone);

  const supabase = await getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from('guests')
    .select('full_name_normalized, phone_normalized');
  if (fetchError) throw fetchError;

  if (existing.some((g) => g.full_name_normalized === normalizedName)) {
    throw new Error('Este nome já consta na lista de convidados confirmados.');
  }
  if (normalizedPhone && existing.some((g) => g.phone_normalized === normalizedPhone)) {
    throw new Error('Este número de celular já confirmou presença.');
  }

  const { data, error } = await supabase
    .from('guests')
    .insert({
      full_name: cleanName,
      full_name_normalized: normalizedName,
      phone: cleanPhone,
      phone_normalized: normalizedPhone,
    })
    .select('id, full_name')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Este nome ou celular já consta na lista de convidados confirmados.');
    }
    throw error;
  }

  notifyGuestsChanged();
  return data;
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
