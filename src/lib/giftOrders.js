import { getSupabase, isSupabaseConfigured } from './supabase';

export async function listGiftOrders() {
  if (!isSupabaseConfigured) return [];

  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('gift_orders')
    .select('id, gift_name, price, giver_name, giver_message, status, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
