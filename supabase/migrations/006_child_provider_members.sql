-- ============================================================
-- GameHub — Child ↔ Provider Member Links
-- Run in Supabase SQL Editor.
-- ============================================================
--
-- Direct link between a child_profile and the provider-specific member it
-- represents on a given team. Replaces name-matching as the source of truth
-- for "which TeamSnap member is this child?" so RSVPs always address the
-- correct person, and renames/typos never silently break the link.
--
-- One child can be on many teams (each with a distinct external_member_id)
-- and on multiple providers — so the junction is per-(child, team).

create table if not exists child_provider_members (
  id                  uuid primary key default uuid_generate_v4(),
  child_profile_id    uuid not null references child_profiles(id) on delete cascade,
  team_id             uuid not null references teams(id) on delete cascade,
  provider_id         text not null,
  external_member_id  text not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique(provider_id, external_member_id),
  unique(child_profile_id, team_id)
);

create index if not exists child_provider_members_child_idx
  on child_provider_members(child_profile_id);
create index if not exists child_provider_members_team_idx
  on child_provider_members(team_id);

alter table child_provider_members enable row level security;

drop policy if exists "parents view own child provider links" on child_provider_members;
create policy "parents view own child provider links"
  on child_provider_members for select
  using (
    child_profile_id in (
      select id from child_profiles where parent_user_id = auth.uid()
    )
  );

-- ── Tombstone so a dismissed member isn't re-created on the next sync ─────────
create table if not exists dismissed_provider_members (
  user_id             uuid not null references auth.users(id) on delete cascade,
  provider_id         text not null,
  external_member_id  text not null,
  dismissed_at        timestamptz not null default now(),
  primary key(user_id, provider_id, external_member_id)
);

alter table dismissed_provider_members enable row level security;

drop policy if exists "users manage own dismissed members" on dismissed_provider_members;
create policy "users manage own dismissed members"
  on dismissed_provider_members for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── Backfill from existing roster_contacts links ─────────────────────────────
-- Any roster_contacts row already matched to a child seeds the new table.
insert into child_provider_members (child_profile_id, team_id, provider_id, external_member_id)
select child_profile_id, team_id, provider_id, external_id
from roster_contacts
where child_profile_id is not null
  and provider_id is not null
  and external_id is not null
on conflict (provider_id, external_member_id) do nothing;
