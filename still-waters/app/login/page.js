"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    // Se já estiver logado, vai direto pro app
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/app");
    });
  }, [router]);

  async function sendLink(e) {
    e.preventDefault();
    setErr("");
    const mail = email.trim().toLowerCase();
    if (!mail) return;
    setBusy(true);
    const site =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const { error } = await supabase.auth.signInWithOtp({
      email: mail,
      options: { emailRedirectTo: site + "/app" },
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setSent(true);
  }

  return (
    <main className="screen">
      <div className="mark" />
      <h1>Águas Tranquilas</h1>
      {sent ? (
        <>
          <p>
            Enviamos um link de acesso para <b>{email}</b>. Abra seu e-mail e
            toque no link para entrar.
          </p>
          <button className="btn-ghost" onClick={() => setSent(false)}>
            Usar outro e-mail
          </button>
        </>
      ) : (
        <form onSubmit={sendLink} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p>Entre com o e-mail que você usou na compra.</p>
          <input
            className="field"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="btn-primary" disabled={busy}>
            {busy ? "Enviando…" : "Entrar"}
          </button>
          {err ? <p style={{ color: "#c0392b" }}>{err}</p> : null}
        </form>
      )}
    </main>
  );
}
