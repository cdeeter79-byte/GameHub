-- ============================================================
-- GameHub — Seed Data (Development Only)
-- ============================================================
-- WARNING: Do not run in production. For local dev only.

-- Note: auth.users rows must be created via Supabase Auth (not seeded directly).
-- These seeds use a placeholder user ID. Replace with a real user ID from
-- your local Supabase auth.users table after creating a dev account.

-- Placeholder user ID — replace with your local dev user ID
do $$
declare
  dev_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  child1_id   uuid := uuid_generate_v4();
  child2_id   uuid := uuid_generate_v4();
  team1_id    uuid := uuid_generate_v4();
  team2_id    uuid := uuid_generate_v4();
  event1_id   uuid := uuid_generate_v4();
  event2_id   uuid := uuid_generate_v4();
  event3_id   uuid := uuid_generate_v4();
begin

  -- Parent profile
  insert into parent_profiles (user_id) values (dev_user_id)
  on conflict (user_id) do nothing;

  -- Children
  insert into child_profiles (id, parent_user_id, first_name, last_name, birth_date, age_band, sport)
  values
    (child1_id, dev_user_id, 'Emma', 'Smith', '2015-03-14', 'UNDER_13', 'SOCCER'),
    (child2_id, dev_user_id, 'Liam', 'Smith', '2012-09-22', 'TEEN_13_17', 'HOCKEY')
  on conflict (id) do nothing;

  -- Teams
  insert into teams (id, name, sport, season, age_group, provider_id, external_id, created_by)
  values
    (team1_id, 'Springfield FC U10G', 'SOCCER', '2025 Spring', 'U10 Girls', 'teamsnap', 'demo-ts-001', dev_user_id),
    (team2_id, 'Capitals U13', 'HOCKEY', '2024-25 Season', 'U13', 'sportsengine', 'demo-se-001', dev_user_id)
  on conflict (provider_id, external_id) do nothing;

  -- Team memberships
  insert into team_members (team_id, user_id, role)
  values
    (team1_id, dev_user_id, 'PARENT'),
    (team2_id, dev_user_id, 'PARENT')
  on conflict (team_id, user_id) do nothing;

  -- Roster entries
  insert into roster_entries (team_id, child_profile_id, jersey_number, role)
  values
    (team1_id, child1_id, '7', 'PLAYER'),
    (team2_id, child2_id, '14', 'PLAYER')
  on conflict (team_id, child_profile_id) do nothing;

  -- Events
  insert into events (id, title, type, sport, team_id, team_name, child_profile_id, child_name,
    provider_id, external_id, start_at, end_at, location, opponent, sync_status, is_canceled)
  values
    (
      event1_id, 'vs. Riverside FC', 'GAME', 'SOCCER', team1_id, 'Springfield FC U10G',
      child1_id, 'Emma Smith', 'teamsnap', 'demo-ts-evt-001',
      now() + interval '2 days' + interval '10 hours',
      now() + interval '2 days' + interval '12 hours',
      '{"name":"Riverside Community Park","address":"100 Park Ave","city":"Springfield","state":"IL","country":"US"}'::jsonb,
      'Riverside FC', 'SUCCESS', false
    ),
    (
      event2_id, 'Practice', 'PRACTICE', 'SOCCER', team1_id, 'Springfield FC U10G',
      child1_id, 'Emma Smith', 'teamsnap', 'demo-ts-evt-002',
      now() + interval '4 days' + interval '17 hours',
      now() + interval '4 days' + interval '18 hours 30 minutes',
      '{"name":"Springfield Soccer Complex","address":"55 Athletic Dr","city":"Springfield","state":"IL","country":"US"}'::jsonb,
      null, 'SUCCESS', false
    ),
    (
      event3_id, 'Game vs. North Stars', 'GAME', 'HOCKEY', team2_id, 'Capitals U13',
      child2_id, 'Liam Smith', 'sportsengine', 'demo-se-evt-001',
      now() + interval '5 days' + interval '19 hours',
      now() + interval '5 days' + interval '20 hours 30 minutes',
      '{"name":"Centennial Ice Arena","address":"200 Hockey Way","city":"Springfield","state":"IL","country":"US"}'::jsonb,
      'North Stars', 'SUCCESS', false
    )
  on conflict (provider_id, external_id) do nothing;

  -- Default notification preferences
  insert into notification_preferences (user_id, type, enabled, advance_minutes)
  values
    (dev_user_id, 'UPCOMING_GAME', true, 120),
    (dev_user_id, 'UPCOMING_PRACTICE', true, 60),
    (dev_user_id, 'RSVP_NEEDED', true, null),
    (dev_user_id, 'EVENT_CHANGED', true, null),
    (dev_user_id, 'UNREAD_MESSAGE', true, null),
    (dev_user_id, 'DIGEST', true, null)
  on conflict (user_id, type) do nothing;

  -- Subscription state (free tier)
  insert into subscription_states (user_id, plan, status)
  values (dev_user_id, 'free', 'ACTIVE')
  on conflict (user_id) do nothing;

end $$;
