-- Sprint Variants 06 — ligação lead -> publicação + escolha estruturada.

alter table public.leads
  add column if not exists post_id uuid,
  add column if not exists post_choice jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_post_id_fkey'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_post_id_fkey
      foreign key (post_id)
      references public.posts (id)
      on delete set null;
  end if;
end $$;

create index if not exists leads_post_id_idx on public.leads (post_id);
create index if not exists leads_post_choice_gin_idx on public.leads using gin (post_choice);

comment on column public.leads.post_id is 'FK opcional para a publicação de origem do lead.';
comment on column public.leads.post_choice is 'Snapshot JSONB da escolha de variantes (hotel/extras/voo + total calculado).';
