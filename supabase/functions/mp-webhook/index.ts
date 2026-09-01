// Recebe as notificações do Mercado Pago (configuradas via notification_url
// na preferência criada em create-mp-preference) e atualiza gift_orders com
// o status real do pagamento. Nunca confia no corpo da notificação em si —
// ele só diz "um pagamento mudou, vai lá conferir" — sempre busca o
// pagamento de volta na API do Mercado Pago antes de gravar qualquer coisa.

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('ok', { status: 200 });
  }

  const url = new URL(req.url);
  let paymentId = url.searchParams.get('data.id') || url.searchParams.get('id');

  if (!paymentId) {
    try {
      const body = await req.json();
      paymentId = body?.data?.id ?? null;
    } catch {
      // corpo vazio/inválido — nada a fazer, mas ainda respondemos 200 pro
      // Mercado Pago não ficar reenviando a mesma notificação sem parar.
    }
  }

  if (!paymentId) {
    return new Response('ok', { status: 200 });
  }

  const accessToken = Deno.env.get('MP_ACCESS_TOKEN');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!accessToken || !supabaseUrl || !serviceRoleKey) {
    console.error('missing MP_ACCESS_TOKEN / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    return new Response('ok', { status: 200 });
  }

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!paymentResponse.ok) {
    console.error('failed to fetch payment from mercado pago', await paymentResponse.text());
    return new Response('ok', { status: 200 });
  }

  const payment = await paymentResponse.json();
  const orderId = payment.external_reference;
  if (!orderId) {
    return new Response('ok', { status: 200 });
  }

  const status = payment.status === 'approved' ? 'approved'
    : payment.status === 'rejected' ? 'rejected'
    : 'pending';

  await fetch(`${supabaseUrl}/rest/v1/gift_orders?id=eq.${orderId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status,
      mp_payment_id: String(payment.id),
      updated_at: new Date().toISOString(),
    }),
  });

  return new Response('ok', { status: 200 });
});
