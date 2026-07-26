import { getSupabase, isSupabaseConfigured } from './supabase';
import { setRsvpOpen } from './rsvpStatus';
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

// Confirmação pública: o convidado só digita o nome. Nomes duplicados na
// lista oficial (ex. duas "Janaina" convidadas por grupos diferentes) têm
// uma VAGA de confirmação cada — a primeira pessoa a digitar "Janaina"
// ocupa a vaga 1, a segunda ocupa a vaga 2, só a terceira tentativa recebe
// "já confirmado". Toda a lógica (achar na lista oficial + checar vagas
// livres + inserir) roda atomicamente dentro da função de banco
// confirm_guest_by_name (supabase/schema.sql), com um advisory lock por
// nome normalizado — assim duas confirmações simultâneas do mesmo nome não
// estouram as vagas disponíveis.
export async function confirmGuestByName(name) {
  if (!isSupabaseConfigured) {
    throw rsvpError(
      'CLOSED',
      'A confirmação de presença ainda está sendo preparada. Volte em breve!',
    );
  }

  const cleanName = name.trim();
  const supabase = await getSupabase();

  const { data, error } = await supabase.rpc('confirm_guest_by_name', { p_name: cleanName });

  if (error) {
    const reason = error.message || '';
    if (reason.includes('CLOSED')) {
      throw rsvpError('CLOSED', 'A lista de confirmação de presença já está fechada.');
    }
    if (reason.includes('NOT_FOUND')) {
      throw rsvpError('NOT_FOUND', 'Pessoa não encontrada.');
    }
    if (reason.includes('ALREADY_CONFIRMED')) {
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
