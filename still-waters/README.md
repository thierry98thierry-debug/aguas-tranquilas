# Águas Tranquilas — app de oração diária

App de recorrência (assinatura) feito em **Next.js + Supabase**, pronto pra subir no **GitHub** e deployar na **Vercel**. Inclui login por e-mail, vela de 24h, sequência, nível espiritual, conquistas, comunidade com aprovação, orações pessoais e o **webhook da Greenn** pra liberar/cortar acesso automaticamente.

> É a versão de produto do protótipo "Águas Tranquilas". Tudo em português — quando fechar o conteúdo, é só traduzir os textos.

---

## O que você vai precisar (3 contas grátis)
- **GitHub** (guardar o código)
- **Supabase** (banco de dados + login)
- **Vercel** (hospedar o site)

---

## Passo 1 — Supabase (banco + login)

1. Crie um projeto em **supabase.com** → New project. Guarde a senha do banco.
2. Menu **SQL Editor** → **New query** → cole TODO o conteúdo de `supabase/schema.sql` → **Run**. Isso cria as tabelas, as regras de segurança (RLS) e os gatilhos.
3. Menu **Project Settings → API**. Copie:
   - **Project URL** → vai em `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → vai em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secreta) → vai em `SUPABASE_SERVICE_ROLE_KEY`
4. Menu **Authentication → Providers → Email**: deixe **Email** ligado (o login é por link mágico, não precisa de senha). Pode desligar "Confirm email" se quiser que o primeiro acesso já entre.
5. Menu **Authentication → URL Configuration**:
   - **Site URL**: a URL do seu site na Vercel (ex.: `https://aguas.vercel.app`). Em teste local use `http://localhost:3000`.
   - **Redirect URLs**: adicione `https://SEU-SITE/app` e `http://localhost:3000/app`.

---

## Passo 2 — GitHub

1. Crie um repositório novo (pode ser privado).
2. Suba esta pasta. No terminal, dentro da pasta do projeto:
   ```bash
   git init
   git add .
   git commit -m "Águas Tranquilas"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
   git push -u origin main
   ```

---

## Passo 3 — Vercel (deploy)

1. Em **vercel.com** → **Add New → Project** → importe o repositório do GitHub.
2. Em **Environment Variables**, adicione (use os valores do Passo 1):
   | Nome | Valor |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | sua Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sua anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | sua service_role key |
   | `NEXT_PUBLIC_SITE_URL` | a URL final do site (ex.: `https://aguas.vercel.app`) |
   | `GREENN_WEBHOOK_SECRET` | um segredo que você inventa (senha forte) |
3. **Deploy**. Ao terminar, copie a URL do site e confirme que ela está igual em `NEXT_PUBLIC_SITE_URL` **e** no Site URL do Supabase (Passo 1.5). Se mudou, atualize e faça **Redeploy**.

---

## Passo 4 — Virar admin e liberar seu acesso

1. Abra o site, vá em **Entrar**, coloque seu e-mail e clique no link que chegar no e-mail.
2. Depois do primeiro login, volte no Supabase → **SQL Editor** e rode (troque pelo seu e-mail):
   ```sql
   update public.profiles set is_admin = true
     where id = (select id from auth.users where email = 'SEU-EMAIL@exemplo.com');

   insert into public.access (email, active, source)
     values ('SEU-EMAIL@exemplo.com', true, 'manual')
     on conflict (email) do update set active = true;
   ```
3. Recarregue o app. Você agora é admin (aparece o "Painel do admin" em Progresso, em `/admin`) e tem acesso liberado.

---

## Passo 5 — Webhook da Greenn (acesso automático)

A ideia: quando alguém compra, a Greenn avisa o seu site, que libera o acesso pelo e-mail. No reembolso/cancelamento, corta.

1. Na Greenn, procure **Webhooks / Postback / Notificações** (dentro do produto ou nas configurações da conta).
2. Aponte para:
   ```
   https://SEU-SITE/api/webhooks/greenn?token=SEU_SEGREDO
   ```
   (o `SEU_SEGREDO` é o mesmo valor de `GREENN_WEBHOOK_SECRET`).
3. Marque os eventos de **compra aprovada**, **reembolso** e **cancelamento de assinatura**.
4. O webhook já entende os campos de e-mail e status mais comuns. Se a Greenn mandar num formato diferente, me manda um exemplo do que ela envia (o "payload") que eu ajusto o arquivo `app/api/webhooks/greenn/route.js`.

> Teste: abrir `https://SEU-SITE/api/webhooks/greenn` no navegador deve responder `{"ok":true}`.
> Se a Greenn não tiver webhook, dá pra ligar por Zapier/Make pegando o e-mail de compra.

---

## Rodar no seu computador (opcional)

```bash
npm install
cp .env.example .env.local   # preencha com suas chaves
npm run dev                  # abre em http://localhost:3000
```

---

## Como editar o conteúdo
- **Orações do dia, níveis e conquistas:** `lib/prayers.js` (é só texto; adicione quantas orações quiser — o rodízio se ajusta sozinho).
- **Cores e visual:** `app/globals.css` (as cores ficam no bloco `:root` no topo).
- **Mural inicial de exemplo:** no fim do `supabase/schema.sql` (apague quando tiver gente real).

---

## Limitações honestas (pra não te pegar de surpresa)
- **Notificação com som no iPhone:** PWA (app salvo na tela inicial) tem som de push bem limitado no iPhone. Som próprio confiável só com app nativo na App Store. No Android funciona melhor.
- **Ícone do app na tela inicial:** falta você colocar os ícones. Gere um PNG 512×512 e um 192×192, ponha em `public/` e liste no `public/manifest.webmanifest` (campo `icons`).
- **O áudio da oração é maquete** (barra que anda). Pra virar real, suba os áudios (ex.: no Storage do Supabase) e troque o player na tela Hoje.
- **"Irmãos orando agora"** é um número simulado por enquanto. Dá pra ligar num contador real depois (Supabase Realtime).

---

## Estrutura das pastas
```
app/
  layout.js            cabeçalho, fontes
  page.js              redireciona para /app
  globals.css          todo o visual
  login/page.js        login por link mágico
  app/page.js          o app (Hoje, Comunidade, Orações, Progresso)
  admin/page.js        painel pra aprovar posts da comunidade
  api/webhooks/greenn/route.js   webhook da Greenn
lib/
  prayers.js           orações, níveis, conquistas
  date.js              funções de data
  supabaseClient.js    conexão no navegador
  supabaseAdmin.js     conexão de servidor (webhook)
supabase/
  schema.sql           banco + segurança (rode no Supabase)
```
