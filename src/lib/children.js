import { getSupabase, isSupabaseConfigured } from './supabase';

export const MAX_CHILDREN_PER_GUEST = 5;

const listeners = new Set();

// Same module-level pub-sub as guests.js/rsvpStatus.js — lets the admin
// page and the public RSVP modal (unrelated trees) stay in sync.
export function subscribeChildren(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyChildrenChanged() {
  listeners.forEach((callback) => callback());
}

// Used by the admin page: every child plus the name of the guest who
// brought them, newest first.
export async function listAllChildren() {
  if (!isSupabaseConfigured) return [];

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('guest_children')
    .select('id, name, age, guest_id, guests(full_name)')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map((child) => ({
    id: child.id,
    name: child.name,
    age: child.age,
    guestId: child.guest_id,
    guestName: child.guests?.full_name ?? '—',
  }));
}

// Used right after a guest confirms their own presence, to attach the
// children they're bringing to that same submission.
export async function addChildrenForGuest(guestId, children) {
  const clean = children
    .map((child) => ({ name: child.name.trim(), age: child.age }))
    .filter((child) => child.name && Number.isInteger(child.age));

  if (clean.length === 0) return [];

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('guest_children')
    .insert(clean.map((child) => ({ guest_id: guestId, name: child.name, age: child.age })))
    .select('id, name, age, guest_id');

  if (error) throw error;
  notifyChildrenChanged();
  return data;
}

export async function addChildToGuest(guestId, name, age) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('O nome da criança não pode ficar vazio.');
  if (!Number.isInteger(age) || age < 0 || age > 12) {
    throw new Error('Idade inválida.');
  }

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('guest_children')
    .insert({ guest_id: guestId, name: cleanName, age })
    .select('id, name, age, guest_id')
    .single();

  if (error) throw error;
  notifyChildrenChanged();
  return data;
}

export async function updateChild(id, { name, age }) {
  const cleanName = name.trim();
  if (!cleanName) throw new Error('O nome da criança não pode ficar vazio.');
  if (!Number.isInteger(age) || age < 0 || age > 12) {
    throw new Error('Idade inválida.');
  }

  const supabase = await getSupabase();
  const { error } = await supabase
    .from('guest_children')
    .update({ name: cleanName, age })
    .eq('id', id);

  if (error) throw error;
  notifyChildrenChanged();
}

export async function deleteChild(id) {
  const supabase = await getSupabase();
  const { error } = await supabase.from('guest_children').delete().eq('id', id);
  if (error) throw error;
  notifyChildrenChanged();
}
