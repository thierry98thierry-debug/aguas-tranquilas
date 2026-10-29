import { NextResponse } from "next/server";
import { adminClient } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Teste rápido no navegador: /api/webhooks/greenn  -> deve responder "ok"
export async function GET() {
  return NextResponse.json({ ok: true });
}

// A Greenn chama esta URL em cada evento de venda/assinatura.
// Configure na Greenn:  https://SEU-SITE/api/webhooks/greenn?token=SEU_SEGREDO
export async function POST(req) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || req.headers.get("x-webhook-token");
  if (!process.env.GREENN_WEBHOOK_SECRET || token !== process.env.GREENN_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body = {};
  try {
    body = await req.json();
  } catch (e) {
    try {
      const form = await req.formData();
      body = Object.fromEntries(form.entries());
    } catch (e2) {
      body = {};
    }
  }

  // ---- achar o e-mail do comprador (a Greenn pode mandar em campos diferentes) ----
  const email =
    body.email ||
    body.buyer_email ||
    body.client_email ||
    body?.client?.email ||
    body?.customer?.email ||
    body?.buyer?.email ||
    body?.data?.email ||
    body?.data?.client?.email ||
    null;

  // ---- descobrir se é pra ATIVAR ou DESATIVAR ----
  const raw = (
    body.event ||
    body.type ||
    body.status ||
    body.sale_status ||
    body?.data?.status ||
    body?.data?.event ||
    ""
  )
    .toString()
    .toLowerCase();

  let active = null; // null = evento que não mexe no acesso
  if (/refund|charge|cancel|expir|dispute|chargeback|reembols/.test(raw)) active = false;
  else if (/approv|paid|active|complet|aprovad|pago|ativ/.test(raw)) active = true;

  if (!email || active === null) {
    // Recebido, mas sem e-mail ou evento que não precisa agir. Responde 200 pra Greenn não repetir.
    return NextResponse.json({ ok: true, ignored: true, raw });
  }

  const supa = adminClient();
  const { error } = await supa
    .from("access")
    .upsert(
      { email: String(email).toLowerCase(), active, source: "greenn:" + raw, updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, email, active });
}
