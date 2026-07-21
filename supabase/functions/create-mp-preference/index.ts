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
  try {
    ({ giftId } = await req.json());
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

  const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'MP_ACCESS_TOKEN not configured' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

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

  return new Response(JSON.stringify({ initPoint: preference.init_point }), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
