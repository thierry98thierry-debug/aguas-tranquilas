"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { PRAYERS, LEVELS, BADGES, levelOf } from "../../lib/prayers";
import { dstr, addDays, epochDay, fmtShort } from "../../lib/date";

function initials(n) {
  n = (n || "").trim();
  if (!n) return "✧";
  const p = n.split(/\s+/);
  return (p[0][0] + (p[1] ? p[1][0] : "")).toUpperCase();
}
function ago(ts) {
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 60) return "agora";
  const m = Math.floor(s / 60);
  if (m < 60) return "há " + m + " min";
  const h = Math.floor(m / 60);
  if (h < 24) return "há " + h + " h";
  return "há " + Math.floor(h / 24) + " d";
}
function fmtTime(s) {
  return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
}

export default function AppPage() {
  const router = useRouter();
  const [phase, setPhase] = useState("loading"); // loading | noaccess | ready
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [prog, setProg] = useState(null);
  const [prayed, setPrayed] = useState([]);
  const [reflect, setReflect] = useState("");
  const [requests, setRequests] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("hoje");
  const [, setTick] = useState(0);
  const [praying, setPraying] = useState(137);
  const [reqInput, setReqInput] = useState("");
  const [commInput, setCommInput] = useState("");
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  const now = new Date();
  const today = dstr(now);
  const yest = dstr(addDays(now, -1));
  const prayer = PRAYERS[epochDay(now) % PRAYERS.length];

  useEffect(() => {
    let active = true;
    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        return;
      }
      if (!active) return;
      setUser(data.session.user);
      await loadAll(data.session.user);
    }
    boot();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/login");
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const a = setInterval(() => setTick((t) => t + 1), 60000);
    const b = setInterval(
      () =>
        setPraying((p) => {
          let n = p + Math.round((Math.random() - 0.45) * 4);
          if (n < 80) n = 80;
          if (n > 260) n = 260;
          return n;
        }),
      4000
    );
    return () => {
      clearInterval(a);
      clearInterval(b);
      clearInterval(timerRef.current);
    };
  }, []);

  async function loadAll(u) {
    let { data: prof } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
    if (!prof) {
      await supabase.from("profiles").upsert({ id: u.id });
      prof = { id: u.id, name: "", is_admin: false, reminder: "06:30" };
    }
    let { data: pg } = await supabase.from("progress").select("*").eq("user_id", u.id).maybeSingle();
    if (!pg) {
      await supabase.from("progress").upsert({ user_id: u.id });
      pg = { user_id: u.id, streak: 0, longest: 0, total: 0, last_prayed: null, candle_lit_at: null };
    }
    const { data: acc } = await supabase
      .from("access")
      .select("active")
      .eq("email", (u.email || "").toLowerCase())
      .maybeSingle();
    const allowed = prof.is_admin || (acc && acc.active);

    const { data: pd } = await supabase.from("prayed_days").select("day").eq("user_id", u.id);
    const { data: rf } = await supabase
      .from("reflections")
      .select("body")
      .eq("user_id", u.id)
      .eq("day", today)
      .maybeSingle();
    const { data: rq } = await supabase
      .from("prayer_requests")
      .select("*")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false });
    const { data: cp } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    const { data: am } = await supabase.from("community_amens").select("post_id");
    const amenSet = new Set((am || []).map((a) => a.post_id));

    setProfile(prof);
    setProg(pg);
    setPrayed((pd || []).map((x) => x.day));
    setReflect(rf?.body || "");
    setRequests(rq || []);
    setPosts((cp || []).map((p) => ({ ...p, amened: amenSet.has(p.id) })));
    setPhase(allowed ? "ready" : "noaccess");
  }

  // ----- ações -----
  async function markPrayed() {
    if (!prog || prog.last_prayed === today) return;
    const streak = prog.last_prayed === yest ? prog.streak + 1 : 1;
    const total = prog.total + 1;
    const longest = Math.max(prog.longest, streak);
    const candle = new Date().toISOString();
    setProg({ ...prog, streak, total, longest, last_prayed: today, candle_lit_at: candle });
    setPrayed((p) => (p.includes(today) ? p : [...p, today]));
    await supabase.from("progress").upsert({
      user_id: user.id,
      streak,
      longest,
      total,
      last_prayed: today,
      candle_lit_at: candle,
      updated_at: candle,
    });
    await supabase.from("prayed_days").upsert({ user_id: user.id, day: today });
  }
  async function saveReflect() {
    await supabase.from("reflections").upsert({ user_id: user.id, day: today, body: reflect });
  }
  async function saveName() {
    await supabase.from("profiles").update({ name: profile.name }).eq("id", user.id);
  }
  async function saveReminder(v) {
    setProfile({ ...profile, reminder: v });
    await supabase.from("profiles").update({ reminder: v }).eq("id", user.id);
  }
  async function addRequest() {
    const t = reqInput.trim();
    if (!t) return;
    const { data } = await supabase
      .from("prayer_requests")
      .insert({ user_id: user.id, body: t })
      .select()
      .single();
    if (data) setRequests((r) => [data, ...r]);
    setReqInput("");
  }
  async function markAnswered(id) {
    const at = new Date().toISOString();
    setRequests((r) => r.map((x) => (x.id === id ? { ...x, answered: true, answered_at: at } : x)));
    await supabase.from("prayer_requests").update({ answered: true, answered_at: at }).eq("id", id);
  }
  async function addPost() {
    const t = commInput.trim();
    if (!t) return;
    const { data, error } = await supabase
      .from("community_posts")
      .insert({ user_id: user.id, name: profile.name || "Anônimo", body: t })
      .select()
      .single();
    if (!error && data) {
      setPosts((p) => [{ ...data, amened: false }, ...p]);
      setCommInput("");
    }
  }
  async function toggleAmen(post) {
    const { data, error } = await supabase.rpc("toggle_amen", { p_post_id: post.id });
    if (!error && data && data[0]) {
      const { amens, amened } = data[0];
      setPosts((ps) => ps.map((x) => (x.id === post.id ? { ...x, amens, amened } : x)));
    }
  }
  function togglePlay() {
    if (playing) {
      clearInterval(timerRef.current);
      setPlaying(false);
    } else {
      setPlaying(true);
      timerRef.current = setInterval(() => {
        setCur((c) => {
          if (c + 1 >= 180) {
            clearInterval(timerRef.current);
            setPlaying(false);
            return 0;
          }
          return c + 1;
        });
      }, 200);
    }
  }
  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  // ----- telas simples -----
  if (phase === "loading") {
    return (
      <main className="screen">
        <div className="mark" />
        <p>Carregando…</p>
      </main>
    );
  }
  if (phase === "noaccess") {
    return (
      <main className="screen">
        <div className="mark" />
        <h1>Quase lá</h1>
        <p>
          Não encontramos uma assinatura ativa para <b>{user?.email}</b>. Se você
          acabou de assinar, aguarde alguns instantes e recarregue. Se usou outro
          e-mail na compra, entre com ele.
        </p>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          Já assinei, recarregar
        </button>
        <button className="btn-ghost" onClick={signOut}>
          Sair / trocar e-mail
        </button>
      </main>
    );
  }

  // ----- dados derivados -----
  const lvlIdx = levelOf(prog.total);
  const curLv = LEVELS[lvlIdx];
  const nextLv = LEVELS[lvlIdx + 1] || null;
  const prayedToday = prog.last_prayed === today;

  let candle = { out: true, level: 0, note: "Sua vela se apagou. Acenda-a orando hoje." };
  if (prog.candle_lit_at) {
    const hoursLeft = 24 - (Date.now() - new Date(prog.candle_lit_at).getTime()) / 3600000;
    if (hoursLeft > 0) {
      const h = Math.floor(hoursLeft);
      const m = Math.floor((hoursLeft - h) * 60);
      candle = {
        out: false,
        level: Math.max(0, Math.min(1, hoursLeft / 24)),
        note: null,
        h,
        m,
      };
    }
  }

  const hr = now.getHours();
  const greet = (hr < 12 ? "Bom dia" : hr < 18 ? "Boa tarde" : "Boa noite") + (profile.name ? ", " + profile.name : "");

  const activeReq = requests.filter((r) => !r.answered);
  const ansReq = requests.filter((r) => r.answered);

  return (
    <>
      <div className="app">
        <header className="head">
          <div className="brand">
            <span className="mark-s" />
            <b>Águas Tranquilas</b>
          </div>
          <div className="streakpill">
            <span>🔥</span>
            <b>{prog.streak}</b>
          </div>
        </header>

        {/* ---------- HOJE ---------- */}
        {tab === "hoje" && (
          <section>
            <div className="greet">{greet}</div>

            <div className={"altar" + (candle.out ? " out" : "")}>
              <div className="glow" />
              <div className="flame" />
              <div className="wick" />
              <div className="candle" style={{ height: 58 + candle.level * 72 + "px" }} />
            </div>
            <p className="candle-note">
              {candle.out ? (
                "Sua vela se apagou. Acenda-a orando hoje."
              ) : (
                <>
                  Sua vela se apaga em{" "}
                  <b>
                    {candle.h}h {String(candle.m).padStart(2, "0")}min
                  </b>
                </>
              )}
            </p>
            <div className="presence">
              <span className="dot" />
              <span>
                <b>{praying}</b> irmãos orando agora
              </span>
            </div>

            <div className="walk">
              <div className="k">Sua caminhada</div>
              <div className="big">Dia {prog.total}</div>
              <div className="lvl">{curLv.n}</div>
            </div>

            <div className="card">
              <span className="chip">{prayer.t}</span>
              <h2 className="ptitle">{prayer.h}</h2>
              <div className="listen">
                <button className="play" onClick={togglePlay} aria-label="Tocar a oração da manhã">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    {playing ? (
                      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                    ) : (
                      <path d="M8 5v14l11-7z" />
                    )}
                  </svg>
                </button>
                <div className="bar">
                  <div className="track">
                    <div className="fill" style={{ width: (cur / 180) * 100 + "%" }} />
                  </div>
                  <div className="t">
                    <span>{fmtTime(cur)}</span>
                    <span>3:00 · Pastor Samuel</span>
                  </div>
                </div>
              </div>
              <p className="prayer">{prayer.b}</p>
              <div className="verse">
                <p>“{prayer.v}”</p>
                <cite>{prayer.r}</cite>
              </div>
            </div>

            <div className="card reflect">
              <div className="label">Uma linha de gratidão hoje</div>
              <textarea
                rows={2}
                placeholder="Senhor, hoje sou grato por…"
                value={reflect}
                onChange={(e) => setReflect(e.target.value)}
                onBlur={saveReflect}
              />
            </div>

            <button className="done-btn" disabled={prayedToday} onClick={markPrayed}>
              {prayedToday ? "✓  Você orou hoje" : "Orei hoje"}
            </button>
            <p className="hint">
              {prayedToday
                ? "Vela acesa por 24 horas. Volte amanhã para mantê-la viva."
                : prog.streak > 0
                ? "Não quebre a sua sequência — " + prog.streak + " dias seguidos."
                : "Comece a sua caminhada hoje."}
            </p>
          </section>
        )}

        {/* ---------- COMUNIDADE ---------- */}
        {tab === "comm" && (
          <section>
            <div className="sectionhead">
              <h2>Mural de orações</h2>
            </div>
            <div className="comm-top">
              <span className="dot" />
              <span>
                <b>{praying}</b> irmãos orando agora · ore uns pelos outros
              </span>
            </div>
            <div className="addrow">
              <input
                type="text"
                placeholder="Compartilhe um pedido de oração…"
                maxLength={160}
                value={commInput}
                onChange={(e) => setCommInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPost()}
              />
              <button onClick={addPost}>Postar</button>
            </div>
            {posts.map((c) => (
              <div key={c.id} className={"c-item" + (c.user_id === user.id ? " c-mine" : "")}>
                <div className="who">
                  <span className="c-ava">{initials(c.name)}</span>
                  <span className="nm">{c.name}</span>
                  {c.status === "pending" && <span className="pending">em análise</span>}
                  <span className="ago">{ago(c.created_at)}</span>
                </div>
                <div className="txt">{c.body}</div>
                <button className={"amen" + (c.amened ? " on" : "")} onClick={() => toggleAmen(c)}>
                  🙏 Amém · <b>{c.amens}</b>
                </button>
              </div>
            ))}
          </section>
        )}

        {/* ---------- ORAÇÕES ---------- */}
        {tab === "oracoes" && (
          <section>
            <div className="sectionhead">
              <h2>Minhas orações</h2>
              <span className="muted">{activeReq.length ? activeReq.length + " em aberto" : ""}</span>
            </div>
            <div className="addrow">
              <input
                type="text"
                placeholder="Alguém ou algo por quem orar…"
                maxLength={120}
                value={reqInput}
                onChange={(e) => setReqInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRequest()}
              />
              <button onClick={addRequest}>Adicionar</button>
            </div>
            {activeReq.length === 0 && (
              <div className="empty">
                Nenhuma oração em aberto. Adicione uma acima — e espere o dia em que for respondida.
              </div>
            )}
            {activeReq.map((p) => (
              <div key={p.id} className="pray-item">
                <div className="top">
                  <div>
                    <div className="txt">{p.body}</div>
                    <div className="meta">Orando desde {fmtShort(dstr(new Date(p.created_at)))}</div>
                  </div>
                  <button className="answer" onClick={() => markAnswered(p.id)}>
                    Respondida
                  </button>
                </div>
              </div>
            ))}
            {ansReq.length > 0 && (
              <>
                <div className="sectionhead">
                  <h2>Respondidas</h2>
                  <span className="muted">{ansReq.length}</span>
                </div>
                {ansReq.map((p) => (
                  <div key={p.id} className="pray-item answered">
                    <div className="txt">
                      <span className="tick">✓</span>
                      {p.body}
                    </div>
                    <div className="meta">
                      Respondida em {fmtShort(dstr(new Date(p.answered_at || p.created_at)))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </section>
        )}

        {/* ---------- PROGRESSO ---------- */}
        {tab === "progresso" && (
          <section>
            <div className="profile">
              <div className="p-ava">{initials(profile.name)}</div>
              <div className="nameField">
                <input
                  type="text"
                  placeholder="Seu nome"
                  maxLength={24}
                  value={profile.name || ""}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  onBlur={saveName}
                  aria-label="Seu nome"
                />
                <div className="sub">Aparece na sua saudação e na comunidade.</div>
              </div>
            </div>

            <div className="levelcard">
              <div className="lv-top">
                <span className="lv-name">{curLv.n}</span>
                <span className="lv-next">
                  {nextLv ? nextLv.min - prog.total + " dias até " + nextLv.n : "Nível máximo — continue firme"}
                </span>
              </div>
              <div className="lv-track">
                <div
                  className="lv-fill"
                  style={{
                    width:
                      (nextLv
                        ? Math.min(1, (prog.total - curLv.min) / (nextLv.min - curLv.min))
                        : 1) *
                        100 +
                      "%",
                  }}
                />
              </div>
            </div>

            <div className="stats">
              <div className="stat">
                <b>{prog.streak}</b>
                <span>Sequência</span>
              </div>
              <div className="stat">
                <b>{prog.longest}</b>
                <span>Recorde</span>
              </div>
              <div className="stat">
                <b>{prog.total}</b>
                <span>Dias no total</span>
              </div>
            </div>

            <div className="sectionhead">
              <h2>Conquistas</h2>
            </div>
            <div className="badges">
              {BADGES.map((b) => {
                const on = prog.total >= b.d;
                return (
                  <div key={b.d} className={"badge" + (on ? "" : " locked")}>
                    <div className="ic">{b.e}</div>
                    <div className="bn">{b.n}</div>
                    <div className="bd">{on ? "Conquistado" : b.d + " dias"}</div>
                  </div>
                );
              })}
            </div>

            <Calendar prayed={prayed} today={today} />

            <div className="setting">
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Lembrete da manhã</div>
                <div className="s">Um toque suave para começar o dia em paz.</div>
              </div>
              <input
                type="time"
                value={profile.reminder || "06:30"}
                onChange={(e) => saveReminder(e.target.value)}
              />
            </div>

            {profile.is_admin && (
              <a className="setting" href="/admin" style={{ textDecoration: "none", color: "inherit" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Painel do admin</div>
                  <div className="s">Aprovar os pedidos da comunidade.</div>
                </div>
                <span style={{ color: "var(--gold)", fontWeight: 600 }}>Abrir →</span>
              </a>
            )}

            <button className="signout" onClick={signOut}>
              Sair
            </button>
          </section>
        )}
      </div>

      <nav className="nav">
        <div className="inner">
          <NavBtn id="hoje" tab={tab} setTab={setTab} label="Hoje" d="M12 3l9 7h-2v9h-5v-6H10v6H5v-9H3z" />
          <NavBtn
            id="comm"
            tab={tab}
            setTab={setTab}
            label="Comunidade"
            d="M21 12a8 8 0 01-11.3 7.3L3 21l1.7-6.7A8 8 0 1121 12z"
          />
          <NavBtn id="oracoes" tab={tab} setTab={setTab} label="Orações" d="M12 3c2 4 6 5 6 9a6 6 0 01-12 0c0-4 4-5 6-9z" />
          <NavBtn id="progresso" tab={tab} setTab={setTab} label="Progresso" d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" />
        </div>
      </nav>
    </>
  );
}

function NavBtn({ id, tab, setTab, label, d }) {
  return (
    <button
      className={tab === id ? "on" : ""}
      onClick={() => {
        setTab(id);
        window.scrollTo(0, 0);
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
      </svg>
      {label}
    </button>
  );
}

function Calendar({ prayed, today }) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(<div key={"b" + i} className="cell blank" />);
  for (let d = 1; d <= days; d++) {
    const ds = y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    let cls = "cell";
    if (prayed.includes(ds)) cls += " pray";
    if (ds === today) cls += " today";
    cells.push(
      <div key={ds} className={cls}>
        {d}
      </div>
    );
  }
  return (
    <div className="cal">
      <div className="mname">{now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</div>
      <div className="grid7">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={i} className="dow">
            {d}
          </div>
        ))}
      </div>
      <div className="grid7" style={{ marginTop: 6 }}>
        {cells}
      </div>
    </div>
  );
}
