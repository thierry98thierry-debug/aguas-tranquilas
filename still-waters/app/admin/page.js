"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Admin() {
  const router = useRouter();
  const [phase, setPhase] = useState("loading"); // loading | denied | ready
  const [pending, setPending] = useState([]);

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (!prof || !prof.is_admin) {
        setPhase("denied");
        return;
      }
      await load();
      setPhase("ready");
    }
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const { data } = await supabase
      .from("community_posts")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setPending(data || []);
  }
  async function decide(id, status) {
    setPending((p) => p.filter((x) => x.id !== id));
    await supabase.from("community_posts").update({ status }).eq("id", id);
  }

  if (phase === "loading")
    return (
      <main className="screen">
        <div className="mark" />
        <p>Carregando…</p>
      </main>
    );
  if (phase === "denied")
    return (
      <main className="screen">
        <div className="mark" />
        <h1>Acesso restrito</h1>
        <p>Esta área é só para administradores.</p>
        <a className="btn-ghost" href="/app">
          Voltar ao app
        </a>
      </main>
    );

  return (
    <main className="admin-wrap">
      <h1>Moderação da comunidade</h1>
      <p className="muted" style={{ marginBottom: 18 }}>
        {pending.length
          ? pending.length + " pedido(s) aguardando aprovação."
          : "Nada para aprovar agora. 🙏"}
      </p>
      {pending.map((p) => (
        <div key={p.id} className="admin-row">
          <div style={{ fontWeight: 600 }}>
            {p.name}{" "}
            <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>
              · {new Date(p.created_at).toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="txt">{p.body}</div>
          <div className="acts">
            <button className="btn-ok" onClick={() => decide(p.id, "approved")}>
              Aprovar
            </button>
            <button className="btn-no" onClick={() => decide(p.id, "rejected")}>
              Recusar
            </button>
          </div>
        </div>
      ))}
      <a className="btn-ghost" href="/app">
        ← Voltar ao app
      </a>
    </main>
  );
}
