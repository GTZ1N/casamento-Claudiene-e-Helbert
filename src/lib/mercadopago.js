import { getSupabase } from './supabase';

export async function createGiftPaymentLink(giftId, giverName, giverMessage) {
  const supabase = await getSupabase();
  if (!supabase) throw new Error('Supabase não configurado');

  const { data, error } = await supabase.functions.invoke('create-mp-preference', {
    body: { giftId, giverName, giverMessage },
  });

  if (error) throw error;
  return data.initPoint;
}
