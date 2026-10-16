-- 先备份，在 Supabase SQL Editor 中执行；本脚本不删除既有回忆或照片。
begin;

alter table public.memories add column if not exists photo_urls jsonb not null default '[]'::jsonb;
alter table public.memories add column if not exists deleted_at timestamptz;
alter table public.memories alter column photo_url drop not null;
alter table public.memories enable row level security;
drop policy if exists journal_owner_guard on public.memories;
create policy journal_owner_guard on public.memories as restrictive for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists journal_owner_access on public.memories;
create policy journal_owner_access on public.memories for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.memories from anon;
grant select,insert,update,delete on public.memories to authenticated;

create table if not exists public.couple_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 1 and 80),
 start_date date, avatar_path text
);
create table if not exists public.journal_plans (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 160), plan_date date,
 budget numeric check (budget is null or budget >= 0), checklist jsonb not null default '[]'::jsonb,
 notes text not null default '', completed boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.anniversaries (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 100), date date not null,
 annual boolean not null default true, created_at timestamptz not null default now()
);
do $$ declare tbl text; begin
 foreach tbl in array array['couple_profiles','journal_plans','anniversaries'] loop
  execute format('alter table public.%I enable row level security', tbl);
  execute format('revoke all on public.%I from anon', tbl);
  execute format('grant select,insert,update,delete on public.%I to authenticated', tbl);
  execute format('drop policy if exists journal_owner_access on public.%I', tbl);
  execute format('create policy journal_owner_access on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', tbl);
  execute format('drop policy if exists journal_owner_guard on public.%I', tbl);
  execute format('create policy journal_owner_guard on public.%I as restrictive for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', tbl);
 end loop;
end $$;
create index if not exists journal_plans_user_idx on public.journal_plans(user_id);
create index if not exists anniversaries_user_idx on public.anniversaries(user_id);
create index if not exists memories_user_deleted_idx on public.memories(user_id,deleted_at);

-- Restrictive policies prevent pre-existing broad permissive policies from leaking logs.
do $$ begin
 if to_regclass('public.audit_logs') is not null then
  alter table public.audit_logs enable row level security;
  revoke all on public.audit_logs from anon;
  revoke update,delete on public.audit_logs from authenticated;
  grant select,insert on public.audit_logs to authenticated;
  drop policy if exists journal_audit_owner_guard on public.audit_logs;
  create policy journal_audit_owner_guard on public.audit_logs as restrictive for all to authenticated
   using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
 end if;
end $$;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('journal-media','journal-media',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists journal_media_access on storage.objects;
create policy journal_media_access on storage.objects for all to authenticated
using (bucket_id='journal-media' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='journal-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- Constrain only our new bucket, leaving policies for other application buckets intact.
drop policy if exists journal_media_guard on storage.objects;
create policy journal_media_guard on storage.objects as restrictive for all to authenticated
using (bucket_id<>'journal-media' or (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id<>'journal-media' or (storage.foldername(name))[1]=(select auth.uid())::text);

commit;

-- 核验（必须用两个测试账号做真实隔离验证，SQL Editor 通常以管理身份绕过 RLS）：
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_policies where tablename in ('memories','couple_profiles','journal_plans','anniversaries','audit_logs','objects');
