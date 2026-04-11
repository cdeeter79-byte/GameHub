-- ============================================================
-- GameHub — Initial Schema Migration
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- for text search

-- ─── Enums ────────────────────────────────────────────────────────────────────

create type sport_type as enum (
  'SOCCER','BASKETBALL','BASEBALL','SOFTBALL','LACROSSE',
  'HOCKEY','FOOTBALL','VOLLEYBALL','TENNIS','SWIMMING','OTHER'
);

create type age_band as enum ('UNDER_13','TEEN_13_17','ADULT_18_PLUS');

create type event_type as enum (
  'GAME','PRACTICE','TOURNAMENT','TOURNAMENT_GAME','MEETING','VOLUNTEER','OTHER'
);

create type rsvp_status as enum ('ATTENDING','NOT_ATTENDING','MAYBE','PENDING');

create type sync_status as enum ('PENDING','IN_PROGRESS','SUCCESS','FAILED','PARTIAL');

create type member_role as enum ('PARENT','PLAYER','COACH','MANAGER','ADMIN');

create type subscription_status as enum ('ACTIVE','TRIALING','PAST_DUE','CANCELED','PAUSED');

create type conflict_resolution as enum ('SOURCE_WINS','LOCAL_WINS','MANUAL');

create type notification_type as enum (
  'UPCOMING_GAME','UPCOMING_PRACTICE','RSVP_NEEDED','EVENT_CHANGED',
  'SYNC_MISMATCH','UNREAD_MESSAGE','DIGEST'
);

-- ─── User Profiles ────────────────────────────────────────────────────────────

-- Parent profiles (one per auth user)
create table parent_profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  phone         text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Child profiles (owned by a parent user)
create table child_profiles (
  id              uuid primary key default uuid_generate_v4(),
  parent_user_id  uuid not null references auth.users(id) on delete cascade,
  first_name      text not null,
  last_name       text not null,
  birth_date      date,
  age_band        age_band not null default 'UNDER_13',
  sport           sport_type,
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index child_profiles_parent_idx on child_profiles(parent_user_id);

-- Consent records (parental consent for child data)
create table consent_records (
  id               uuid primary key default uuid_generate_v4(),
  parent_user_id   uuid not null references auth.users(id) on delete cascade,
  child_profile_id uuid references child_profiles(id) on delete cascade,
  consent_type     text not null,   -- e.g. 'child_profile_creation', 'data_processing'
  granted          boolean not null,
  granted_at       timestamptz not null default now(),
  ip_address       inet,
  user_agent       text
);

-- ─── Providers ────────────────────────────────────────────────────────────────

create table provider_accounts (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  provider_id    text not null,     -- 'teamsnap' | 'sportsengine' | etc.
  auth_strategy  text not null,     -- 'oauth2' | 'api_key' | 'ics_url' | etc.
  access_token   text,              -- stored encrypted via Supabase Vault in prod
  refresh_token  text,
  expires_at     timestamptz,
  metadata       jsonb default '{}',
  connected_at   timestamptz not null default now(),
  last_sync_at   timestamptz,
  unique(user_id, provider_id)
);

create index provider_accounts_user_idx on provider_accounts(user_id);

-- ─── Teams ────────────────────────────────────────────────────────────────────

create table teams (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  sport           sport_type not null,
  season          text,
  age_group       text,
  logo_url        text,
  provider_id     text,
  external_id     text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(provider_id, external_id)
);

-- Team members (user → team relationship)
create table team_members (
  id         uuid primary key default uuid_generate_v4(),
  team_id    uuid not null references teams(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       member_role not null default 'PARENT',
  joined_at  timestamptz not null default now(),
  unique(team_id, user_id)
);

create index team_members_user_idx on team_members(user_id);
create index team_members_team_idx on team_members(team_id);

-- Roster entries (child → team)
create table roster_entries (
  id              uuid primary key default uuid_generate_v4(),
  team_id         uuid not null references teams(id) on delete cascade,
  child_profile_id uuid not null references child_profiles(id) on delete cascade,
  jersey_number   text,
  position        text,
  role            member_role not null default 'PLAYER',
  created_at      timestamptz not null default now(),
  unique(team_id, child_profile_id)
);

-- ─── Events ───────────────────────────────────────────────────────────────────

create table events (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  type              event_type not null,
  sport             sport_type,
  team_id           uuid references teams(id) on delete set null,
  team_name         text,
  child_profile_id  uuid references child_profiles(id) on delete set null,
  child_name        text,
  provider_id       text,
  external_id       text,
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  location          jsonb,           -- { name, address, city, state, zip, country, lat, lng }
  opponent          text,
  tournament_id     text,
  tournament_name   text,
  notes             text,
  sync_status       sync_status not null default 'PENDING',
  is_canceled       boolean not null default false,
  is_rescheduled    boolean not null default false,
  source_updated_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(provider_id, external_id)
);

create index events_team_idx on events(team_id);
create index events_child_idx on events(child_profile_id);
create index events_start_at_idx on events(start_at);
create index events_provider_idx on events(provider_id, external_id);

-- Attendance / RSVP
create table attendances (
  id                  uuid primary key default uuid_generate_v4(),
  event_id            uuid not null references events(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  child_profile_id    uuid references child_profiles(id) on delete set null,
  status              rsvp_status not null default 'PENDING',
  local_intent        rsvp_status,   -- what user set in GameHub (may differ from source)
  wrote_back          boolean not null default false,
  mismatch_detected   boolean not null default false,
  resolved_at         timestamptz,
  resolution          conflict_resolution,
  updated_at          timestamptz not null default now(),
  unique(event_id, user_id, child_profile_id)
);

create index attendances_event_idx on attendances(event_id);
create index attendances_user_idx on attendances(user_id);

-- ─── Messaging ────────────────────────────────────────────────────────────────

create table message_threads (
  id               uuid primary key default uuid_generate_v4(),
  team_id          uuid references teams(id) on delete cascade,
  provider_id      text,
  external_id      text,
  title            text,
  last_message_at  timestamptz,
  is_read_only     boolean not null default false,
  created_at       timestamptz not null default now()
);

create table messages (
  id                uuid primary key default uuid_generate_v4(),
  thread_id         uuid not null references message_threads(id) on delete cascade,
  sender_name       text not null,
  sender_avatar_url text,
  body              text not null,
  attachments       jsonb default '[]',
  sent_at           timestamptz not null,
  is_outbound       boolean not null default false,
  provider_id       text,
  created_at        timestamptz not null default now()
);

create index messages_thread_idx on messages(thread_id);
create index messages_sent_at_idx on messages(sent_at desc);

-- ─── Sync Jobs ────────────────────────────────────────────────────────────────

create table sync_jobs (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  provider_id      text not null,
  status           sync_status not null default 'PENDING',
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  error            text,
  entities_synced  int default 0,
  next_sync_at     timestamptz
);

create index sync_jobs_user_idx on sync_jobs(user_id, provider_id);

create table sync_conflicts (
  id            uuid primary key default uuid_generate_v4(),
  sync_job_id   uuid not null references sync_jobs(id) on delete cascade,
  entity_type   text not null,
  entity_id     text not null,
  local_value   jsonb,
  source_value  jsonb,
  resolution    conflict_resolution not null,
  resolved_at   timestamptz not null default now(),
  notes         text
);

-- ─── Notifications ────────────────────────────────────────────────────────────

create table notification_preferences (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  type             notification_type not null,
  enabled          boolean not null default true,
  advance_minutes  int,
  unique(user_id, type)
);

-- ─── Subscriptions ────────────────────────────────────────────────────────────

-- Parent premium state (synced from RevenueCat via webhook)
create table subscription_states (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  plan                   text not null default 'free',  -- 'free' | 'premium'
  status                 subscription_status not null default 'ACTIVE',
  expires_at             timestamptz,
  revenue_cat_customer_id text,
  entitlements           jsonb default '[]',
  updated_at             timestamptz not null default now()
);

-- Manager plans (Stripe)
create table manager_plans (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  tier_id                 text not null,
  team_limit              int not null default 1,
  status                  subscription_status not null default 'ACTIVE',
  stripe_customer_id      text,
  stripe_subscription_id  text,
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create table managed_teams (
  id              uuid primary key default uuid_generate_v4(),
  manager_user_id uuid not null references auth.users(id) on delete cascade,
  team_id         uuid not null references teams(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique(manager_user_id, team_id)
);

-- ─── Audit Log ────────────────────────────────────────────────────────────────

create table audit_logs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    text,
  before_value jsonb,
  after_value  jsonb,
  timestamp    timestamptz not null default now(),
  ip_address   inet
);

create index audit_logs_user_idx on audit_logs(user_id);
create index audit_logs_timestamp_idx on audit_logs(timestamp desc);

-- ─── Updated-at triggers ──────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger parent_profiles_updated_at before update on parent_profiles
  for each row execute function update_updated_at();
create trigger child_profiles_updated_at before update on child_profiles
  for each row execute function update_updated_at();
create trigger teams_updated_at before update on teams
  for each row execute function update_updated_at();
create trigger events_updated_at before update on events
  for each row execute function update_updated_at();
create trigger attendances_updated_at before update on attendances
  for each row execute function update_updated_at();
create trigger subscription_states_updated_at before update on subscription_states
  for each row execute function update_updated_at();
create trigger manager_plans_updated_at before update on manager_plans
  for each row execute function update_updated_at();
