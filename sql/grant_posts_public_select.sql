-- Garantir que o papel `anon` (chave pública do Supabase no browser) consegue ler `posts`.
-- Sem isto, a policy RLS `anon_select_published_posts` pode existir mas o SELECT falha com "permission denied".
-- Executar no SQL Editor depois de sprint3_plan_features.sql (policy anónima).

grant usage on schema public to anon, authenticated;
grant select on table public.posts to anon, authenticated;
