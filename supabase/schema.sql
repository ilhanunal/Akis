-- Akış veritabanı. Supabase → SQL Editor → New query içine yapıştırıp Run'a basın. Tekrar çalıştırmak güvenlidir.

-- Görevler, sayfalar, alışkanlıklar ve ilerleme geçmişi tek tabloda, JSON olarak durur.
create table if not exists public.items (
  id text primary key,
  workspace text not null check (workspace in ('ilhan', 'sedef', 'ortak')),
  kind text not null check (kind in ('task', 'page', 'habit', 'event')),
  data jsonb not null,
  client_id text,
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now()
);

create index if not exists items_workspace_idx on public.items (workspace);

create or replace function public.touch_item() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;

drop trigger if exists items_touch on public.items;
create trigger items_touch before update on public.items
  for each row execute function public.touch_item();

-- Yalnızca bu iki hesap okuyup yazabilir. E-postalar src/lib/cloud/config.ts ile aynı olmalı.
create or replace function public.is_member() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') in ('ilhan@akis-planla.netlify.app', 'sedef@akis-planla.netlify.app')
$$;

alter table public.items enable row level security;

drop policy if exists "members read" on public.items;
drop policy if exists "members write" on public.items;
drop policy if exists "members update" on public.items;
drop policy if exists "members delete" on public.items;
create policy "members read" on public.items for select to authenticated using (public.is_member());
create policy "members write" on public.items for insert to authenticated with check (public.is_member());
create policy "members update" on public.items for update to authenticated using (public.is_member()) with check (public.is_member());
create policy "members delete" on public.items for delete to authenticated using (public.is_member());

-- Birinin yaptığı değişiklik diğerinin ekranına anında düşsün.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'items'
  ) then
    alter publication supabase_realtime add table public.items;
  end if;
end $$;
