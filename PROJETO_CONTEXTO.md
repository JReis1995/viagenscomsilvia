# Viagens com Sílvia — contexto do projeto (para novo chat)

## Stack

- **Next.js** 16 (App Router), **React** 19, **TypeScript**
- **Tailwind CSS** v4 (`@theme` em `app/globals.css`)
- **Supabase** (Auth + Postgres + RLS)
- **Resend** (email boas-vindas no registo de lead)
- **Framer Motion** (animações na landing)
- **Zod** (validação API leads)

## Estrutura relevante

```
app/
  (marketing)/     → landing pública (/, /login)
  (client)/conta/  → área do cliente (/conta); login unificado em /login (URLs /conta/entrar e /conta/registar redireccionam)
  (dashboard)/crm/ → CRM só consultora (/crm)
  api/leads/       → POST lead + Resend
  auth/callback/   → OAuth / código Supabase
components/marketing/ → LuxuryHero, ExperienceFeed, FeaturedPublicationVideo, ConsultoraSection, TravelQuiz
lib/supabase/      → client (browser), server (cookies), public-server (anon insert/select)
lib/posts/         → fetchPublishedPosts()
lib/site/social.ts → URLs Instagram, retrato, poster vídeo, imagem hero
proxy.ts           → auth refresh + proteção /crm (Next 16: ex-middleware)
types/post.ts
PROJETO_CONTEXTO.md (este ficheiro)
```

## Variáveis de ambiente (`.env.local`)

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente público + API leads |
| `RESEND_API_KEY` | Envio de emails |
| `RESEND_FROM` | Remetente verificado |
| `NEXT_PUBLIC_CONSULTORA_PORTRAIT_URL` | URL **direta** da foto (ex. Supabase Storage) — **não** usar `instagram.com/p/...` como imagem |
| `NEXT_PUBLIC_FEATURED_VIDEO_POSTER_URL` | Miniatura do vídeo em destaque (zona publicações) |
| `NEXT_PUBLIC_HERO_TRAVEL_IMAGE_URL` | Imagem full-bleed do hero (default: Unsplash mar turquesa) |
| `NEXT_PUBLIC_INSTAGRAM_PHOTO_POST_URL` | Post foto (default já definido em código) |
| `NEXT_PUBLIC_INSTAGRAM_VIDEO_POST_URL` | Post vídeo / Reels (default já definido em código) |
| `SUPABASE_SERVICE_ROLE_KEY` | Só servidor — cron follow-up (ignora RLS); **nunca** expor ao cliente |
| `CRON_SECRET` | Segredo `Authorization: Bearer` para `GET /api/cron/follow-up` (Vercel Cron) |
| `FOLLOWUP_LEAD_MIN_DAYS` | Opcional — dias mínimos após `data_pedido` antes do 1.º lembrete (default `3`) |
| `CONSULTORA_EMAIL` | Email da Sílvia (Auth), igual a `consultora_email` em `configuracoes_globais`; só este utilizador acede a `/crm`. Vários emails: separar por vírgula. |

## Sprints (pedido cliente + CMS)

**Sprint 1 (este ciclo — concluído no código):** área `/conta` (registo/login cliente), RLS em `leads` + tabela `lead_client_updates`, CRM e API de orçamento só para `CONSULTORA_EMAIL`, redes Instagram/TikTok no site, mensagens do cliente visíveis no Kanban.

**Sprint 2 (seguinte — não iniciado aqui):** CMS no CRM para `posts` (CRUD, agendamento, posição no site), edição de textos/hero e outros blocos, máximo controlo editorial possível.

## O que já está feito (resumo)

1. **Sprint 1:** tema lagoon/sand/coral, layouts marketing + CRM, Supabase Auth, `proxy.ts`, login email/password.
2. **Sprint 2:** quiz multi-step, `POST /api/leads`, insert `leads`, email Resend, honeypot.
3. **Landing evoluída:** hero imersivo com imagem de viagem + animação; feed `posts` (bento); bloco **vídeo em destaque** na secção de publicações (link Instagram); secção **A tua consultora** com texto primeiro e **retrato à direita** (desktop); quiz no final; `revalidate = 60` na home.
4. **Sprint 3–4 (CRM):** Kanban por estado; modal de orçamento PDF + Resend; quiz visível no CRM.
5. **Sprint 5:** `GET /api/cron/follow-up` (cron diário Vercel `vercel.json`), email de lembrete para leads em **Nova Lead** sem `data_envio_orcamento`, com `auto_followup` e `global_auto_followup`; coluna `data_ultimo_followup` (ficheiro `sql/add_lead_data_ultimo_followup.sql`).
6. **Sprint 1 (portal cliente):** rotas `app/(client)/conta/*`, `sql/sprint1_client_portal_rls.sql` (substitui políticas `authenticated_*` em `leads` por acesso consultora vs dono do email), ícones redes no footer do marketing.

## O que falta (roadmap sugerido)

- **Sprint 2 (CMS):** ver secção «Sprints» acima.
- **Realtime opcional** no Kanban de leads.
- **CMS (detalhe):** quando fores à Sprint 2: CRUD `posts` no `/crm` (criar/editar/agendar `data_publicacao`, `status`), upload **Supabase Storage**, posição/ordem na página, textos editáveis (hero, secções).
  - Opcional: campos em `configuracoes_globais` para copy global (em vez de só `.env`).
- **Agendamento + email massivo** (pedido futuro): fila de campanhas, respeito RGPD, utilizadores com “login” — ainda não modelado na BD.

## Sprint variantes — Fase 1 (base de dados + fetch)

- Novas migrações SQL em `sql/`:
  - `sprint_variants_01_posts_extend.sql`
  - `sprint_variants_02_post_hotels.sql`
  - `sprint_variants_03_post_hotel_media.sql`
  - `sprint_variants_04_post_extras.sql`
  - `sprint_variants_05_post_flight_options.sql`
  - `sprint_variants_06_leads_post_choice.sql`
- `posts` passa a incluir `slug`, `preco_base_eur` e `has_variants` (mantendo compatibilidade com `preco_desde`).
- Novas tabelas relacionais para variantes: `post_hotels`, `post_hotel_media`, `post_extras`, `post_flight_options`.
- `leads` passa a suportar `post_id` (FK opcional) e `post_choice` (jsonb de escolha/snapshot).
- Tipos/fetch atualizados para suportar detalhe de publicação por slug:
  - `lib/posts/post-variants-types.ts`
  - `lib/posts/fetch-publicacao-by-slug.ts`
  - `lib/posts/fetch-published.ts` mantém fallback para schemas antigos.

---

## SQL executado no Supabase (referência única)

### Extensão

```sql
create extension if not exists "pgcrypto";
```

### Tabela `leads`

```sql
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  vibe text,
  companhia text,
  destino_sonho text,
  orcamento_estimado text,
  status text not null default 'Nova Lead',
  data_pedido timestamptz not null default now(),
  data_envio_orcamento timestamptz,
  auto_followup boolean not null default true,
  detalhes_proposta jsonb
);

create index if not exists leads_data_pedido_idx on public.leads (data_pedido desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_email_idx on public.leads (lower(email));

alter table public.leads enable row level security;

create policy "anon_insert_leads"
  on public.leads for insert to anon
  with check (true);

create policy "authenticated_select_leads"
  on public.leads for select to authenticated using (true);

create policy "authenticated_update_leads"
  on public.leads for update to authenticated using (true) with check (true);

create policy "authenticated_delete_leads"
  on public.leads for delete to authenticated using (true);
```

**Sprint 5 — coluna extra (executar se ainda não existir):** ver `sql/add_lead_data_ultimo_followup.sql` (`data_ultimo_followup`).

### Tabela `configuracoes_globais`

```sql
create table public.configuracoes_globais (
  id uuid primary key default gen_random_uuid(),
  global_auto_followup boolean not null default true,
  consultora_email text
);

alter table public.configuracoes_globais enable row level security;

create policy "authenticated_select_config"
  on public.configuracoes_globais for select to authenticated using (true);

create policy "authenticated_insert_config"
  on public.configuracoes_globais for insert to authenticated with check (true);

create policy "authenticated_update_config"
  on public.configuracoes_globais for update to authenticated using (true) with check (true);

create policy "authenticated_delete_config"
  on public.configuracoes_globais for delete to authenticated using (true);

-- Exemplo de linha singleton (ajusta email e id se usares constraint de uma linha):
insert into public.configuracoes_globais (id, global_auto_followup, consultora_email)
values ('00000000-0000-0000-0000-000000000001', true, 'silvia@exemplo.com')
on conflict (id) do nothing;
```

### Tabela `posts` (feed da landing)

```sql
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  titulo text not null,
  descricao text,
  media_url text not null,
  preco_desde text,
  link_cta text,
  status boolean not null default true,
  data_publicacao timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_tipo_check check (
    tipo in ('promocao', 'video', 'inspiracao')
  )
);

create index if not exists posts_feed_idx
  on public.posts (data_publicacao desc) where status = true;

create index if not exists posts_tipo_idx on public.posts (tipo);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

create policy "anon_select_published_posts"
  on public.posts for select to anon
  using (status = true and data_publicacao <= now());

create policy "authenticated_select_all_posts"
  on public.posts for select to authenticated using (true);

create policy "authenticated_insert_posts"
  on public.posts for insert to authenticated with check (true);

create policy "authenticated_update_posts"
  on public.posts for update to authenticated using (true) with check (true);

create policy "authenticated_delete_posts"
  on public.posts for delete to authenticated using (true);

grant select on table public.posts to anon;
grant select, insert, update, delete on table public.posts to authenticated;
```

*(Se ainda não aplicaste `grant` nas outras tabelas, confirma na consola Supabase as permissões habituais do projeto.)*

---

## Links úteis (Instagram — conteúdo real da Sílvia)

- Foto: `https://www.instagram.com/p/DOegj5PjRjg/`
- Vídeo: `https://www.instagram.com/p/DQXPeKeDaaI/`

Estes URLs abrem no browser; para **`<img src>`** usa ficheiro alojado (Storage) ou `NEXT_PUBLIC_FEATURED_VIDEO_POSTER_URL` / `NEXT_PUBLIC_CONSULTORA_PORTRAIT_URL`.

---

*Última actualização: contexto alinhado ao código no repositório `codigo`.*
