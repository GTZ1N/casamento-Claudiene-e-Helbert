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

export async function listGuests() {
  if (!isSupabaseConfigured) return [];

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('guests')
    .select('id, full_name')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Confirms a batch of names at once (the modal lets a guest add their whole
// family in one submission). Duplicates — against the existing list or
// within the same batch — are filtered out client-side first for a fast,
// friendly message; the unique constraint in supabase/schema.sql is the
// real guard against a race between two simultaneous submissions.
export async function addGuests(names) {
  if (!isSupabaseConfigured) {
    throw new Error('A confirmação de presença ainda está sendo preparada. Volte em breve!');
  }

  if (!(await isRsvpOpen())) {
    throw new Error('A lista de confirmação de presença já está fechada.');
  }

  const cleanNames = names.map((name) => name.trim()).filter(Boolean);
  if (cleanNames.length === 0) {
    return { inserted: [], duplicates: [] };
  }

  const existing = await listGuests();
  const existingNormalized = new Set(existing.map((g) => normalizeName(g.full_name)));

  const duplicates = [];
  const toInsert = [];
  const seenInBatch = new Set();

  cleanNames.forEach((name) => {
    const normalized = normalizeName(name);
    if (existingNormalized.has(normalized) || seenInBatch.has(normalized)) {
      duplicates.push(name);
      return;
    }
    seenInBatch.add(normalized);
    toInsert.push({ full_name: name, full_name_normalized: normalized });
  });

  if (toInsert.length === 0) {
    return { inserted: [], duplicates };
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase.from('guests').insert(toInsert).select('id, full_name');

  if (error) {
    if (error.code === '23505') {
      throw new Error('Um dos nomes já consta na lista de convidados confirmados.');
    }
    throw error;
  }

  notifyGuestsChanged();
  return { inserted: data, duplicates };
}
