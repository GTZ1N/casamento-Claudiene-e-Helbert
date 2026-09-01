import { GIFTS_CATALOG } from './gifts-catalog.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  let giftId: string | undefined;
  let giverName: string | undefined;
  let giverMessage: string | undefined;
  try {
    ({ giftId, giverName, giverMessage } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json body' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const gift = giftId ? GIFTS_CATALOG[giftId] : undefined;
  if (!gift) {
    return new Response(JSON.stringify({ error: 'unknown giftId' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const cleanGiverName = giverName?.trim();
  if (!cleanGiverName) {
    return new Response(JSON.stringify({ error: 'giverName is required' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'MP_ACCESS_TOKEN not configured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'supabase service credentials not configured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Grava o pedido ANTES de criar a preferência, com a service role (a
  // policy de insert em gift_orders é intencionalmente fechada pro cliente
  // anon — só esta função grava). O id vira o external_reference que o
  // mp-webhook usa pra achar de volta esta linha quando o pagamento cair.
  const orderInsertResponse = await fetch(`${supabaseUrl}/rest/v1/gift_orders`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      gift_id: giftId,
      gift_name: gift.name,
      price: gift.price,
      giver_name: cleanGiverName,
      giver_message: giverMessage?.trim() || null,
    }),
  });

  if (!orderInsertResponse.ok) {
    const detail = await orderInsertResponse.text();
    return new Response(JSON.stringify({ error: 'failed to record gift order', detail }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const [order] = await orderInsertResponse.json();

  const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';

  const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          id: giftId,
          title: gift.name,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: gift.price,
        },
      ],
      back_urls: {
        success: `${siteUrl}/presentes?status=sucesso`,
        pending: `${siteUrl}/presentes?status=pendente`,
        failure: `${siteUrl}/presentes?status=falha`,
      },
      auto_return: 'approved',
      statement_descriptor: 'CASAMENTO C&H',
      external_reference: order.id,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
    }),
  });

  if (!mpResponse.ok) {
    const detail = await mpResponse.text();
    return new Response(JSON.stringify({ error: 'mercado pago request failed', detail }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const preference = await mpResponse.json();

  // Guarda o id da preferência pra referência/debug — não é usado pelo
  // webhook (que casa por external_reference), então uma falha aqui não é
  // crítica; só loga e segue.
  await fetch(`${supabaseUrl}/rest/v1/gift_orders?id=eq.${order.id}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mp_preference_id: preference.id }),
  }).catch((err) => console.error('failed to store mp_preference_id', err));

  return new Response(JSON.stringify({ initPoint: preference.init_point }), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
