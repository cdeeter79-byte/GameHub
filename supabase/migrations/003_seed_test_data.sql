-- ============================================================
-- GameHub — Test Data Seed
-- Run in Supabase SQL Editor AFTER creating your test account.
-- Replace the email below with your test account's email.
-- ============================================================

do $$
declare
  v_user_id   uuid;
  v_child1_id uuid;
  v_child2_id uuid;
  v_team1_id  uuid;
  v_team2_id  uuid;
  v_team3_id  uuid;
  v_event1_id uuid;
  v_event2_id uuid;
  v_event3_id uuid;
  v_event4_id uuid;
  v_event5_id uuid;
  v_event6_id uuid;
  v_thread1_id uuid;
  v_thread2_id uuid;
  v_thread3_id uuid;
begin

  -- ── Look up the test user by email ──────────────────────────────────────
  -- CHANGE THIS to your test account email
  select id into v_user_id
    from auth.users
   where email = 'cdeeter79@gmail.com'
   limit 1;

  if v_user_id is null then
    raise exception 'User not found. Update the email in this script and try again.';
  end if;

  -- ── Parent profile ───────────────────────────────────────────────────────
  insert into parent_profiles (user_id, phone)
    values (v_user_id, '555-867-5309')
    on conflict (user_id) do nothing;

  -- ── Children ─────────────────────────────────────────────────────────────
  v_child1_id := gen_random_uuid();
  v_child2_id := gen_random_uuid();

  insert into child_profiles (id, parent_user_id, first_name, last_name, age_band, sport)
    values
      (v_child1_id, v_user_id, 'Emma',  'Test', 'UNDER_13', 'SOCCER'),
      (v_child2_id, v_user_id, 'Liam',  'Test', 'UNDER_13', 'BASKETBALL')
    on conflict do nothing;

  -- ── Teams ─────────────────────────────────────────────────────────────────
  v_team1_id := gen_random_uuid();
  v_team2_id := gen_random_uuid();
  v_team3_id := gen_random_uuid();

  insert into teams (id, name, sport, season, age_group, provider_id, external_id, created_by)
    values
      (v_team1_id, 'Blue Lightning FC',   'SOCCER',     'Spring 2026', 'U12', 'teamsnap',     'ts-team-1001', v_user_id),
      (v_team2_id, 'Westside Warriors',   'BASKETBALL', 'Spring 2026', 'U12', 'sportsengine', 'se-team-2001', v_user_id),
      (v_team3_id, 'Riverside Rockets',   'SOCCER',     'Spring 2026', 'U10', 'teamsnap',     'ts-team-1002', v_user_id)
    on conflict (provider_id, external_id) do nothing;

  -- Team members
  insert into team_members (team_id, user_id, role)
    values
      (v_team1_id, v_user_id, 'PARENT'),
      (v_team2_id, v_user_id, 'PARENT'),
      (v_team3_id, v_user_id, 'PARENT')
    on conflict (team_id, user_id) do nothing;

  -- Roster
  insert into roster_entries (team_id, child_profile_id, jersey_number, position, role)
    values
      (v_team1_id, v_child1_id, '7',  'Midfielder', 'PLAYER'),
      (v_team2_id, v_child2_id, '23', 'Guard',      'PLAYER'),
      (v_team3_id, v_child1_id, '7',  'Forward',    'PLAYER')
    on conflict (team_id, child_profile_id) do nothing;

  -- ── Provider accounts ─────────────────────────────────────────────────────
  insert into provider_accounts (user_id, provider_id, auth_strategy, metadata)
    values
      (v_user_id, 'teamsnap',     'oauth2',  '{"email":"test@example.com","display_name":"Test Parent"}'),
      (v_user_id, 'sportsengine', 'oauth2',  '{"email":"test@example.com","display_name":"Test Parent"}')
    on conflict (user_id, provider_id) do nothing;

  -- ── Events (upcoming from now) ────────────────────────────────────────────
  v_event1_id := gen_random_uuid();
  v_event2_id := gen_random_uuid();
  v_event3_id := gen_random_uuid();
  v_event4_id := gen_random_uuid();
  v_event5_id := gen_random_uuid();
  v_event6_id := gen_random_uuid();

  insert into events (id, title, type, sport, team_id, team_name, child_profile_id, child_name, provider_id, external_id, start_at, end_at, location, opponent, sync_status)
    values
      -- Soccer game tomorrow
      (v_event1_id,
       'Blue Lightning FC vs. Red Storm',
       'GAME', 'SOCCER',
       v_team1_id, 'Blue Lightning FC',
       v_child1_id, 'Emma',
       'teamsnap', 'ts-ev-1001',
       now() + interval '1 day' + interval '10 hours',
       now() + interval '1 day' + interval '11 hours 30 minutes',
       '{"name":"Riverside Sports Complex","address":"1200 Riverside Dr","city":"Springfield","state":"IL","zip":"62701"}',
       'Red Storm SC', 'SUCCESS'),

      -- Soccer practice in 2 days
      (v_event2_id,
       'Blue Lightning FC Practice',
       'PRACTICE', 'SOCCER',
       v_team1_id, 'Blue Lightning FC',
       v_child1_id, 'Emma',
       'teamsnap', 'ts-ev-1002',
       now() + interval '2 days' + interval '17 hours',
       now() + interval '2 days' + interval '18 hours 30 minutes',
       '{"name":"Lincoln Park Field 3","address":"400 Lincoln Park Blvd","city":"Springfield","state":"IL","zip":"62702"}',
       null, 'SUCCESS'),

      -- Basketball game in 3 days
      (v_event3_id,
       'Westside Warriors vs. Eagles',
       'GAME', 'BASKETBALL',
       v_team2_id, 'Westside Warriors',
       v_child2_id, 'Liam',
       'sportsengine', 'se-ev-2001',
       now() + interval '3 days' + interval '13 hours',
       now() + interval '3 days' + interval '14 hours 30 minutes',
       '{"name":"Westside Community Gym","address":"820 Oak Ave","city":"Springfield","state":"IL","zip":"62704"}',
       'Eagles Elite', 'SUCCESS'),

      -- Soccer tournament in 5 days
      (v_event4_id,
       'Spring Classic Tournament – Game 1',
       'TOURNAMENT_GAME', 'SOCCER',
       v_team1_id, 'Blue Lightning FC',
       v_child1_id, 'Emma',
       'teamsnap', 'ts-ev-1003',
       now() + interval '5 days' + interval '9 hours',
       now() + interval '5 days' + interval '10 hours',
       '{"name":"Metro Soccer Park","address":"3300 Stadium Rd","city":"Springfield","state":"IL","zip":"62703"}',
       'TBD', 'SUCCESS'),

      -- Basketball practice in 4 days
      (v_event5_id,
       'Westside Warriors Practice',
       'PRACTICE', 'BASKETBALL',
       v_team2_id, 'Westside Warriors',
       v_child2_id, 'Liam',
       'sportsengine', 'se-ev-2002',
       now() + interval '4 days' + interval '16 hours',
       now() + interval '4 days' + interval '17 hours',
       '{"name":"Westside Community Gym","address":"820 Oak Ave","city":"Springfield","state":"IL","zip":"62704"}',
       null, 'SUCCESS'),

      -- Team meeting next week
      (v_event6_id,
       'End-of-Season Team Meeting',
       'MEETING', 'SOCCER',
       v_team1_id, 'Blue Lightning FC',
       v_child1_id, 'Emma',
       'teamsnap', 'ts-ev-1004',
       now() + interval '8 days' + interval '18 hours',
       now() + interval '8 days' + interval '19 hours',
       '{"name":"Riverside Sports Complex – Lobby","address":"1200 Riverside Dr","city":"Springfield","state":"IL","zip":"62701"}',
       null, 'SUCCESS')

    on conflict (provider_id, external_id) do nothing;

  -- ── Attendances (RSVP) ────────────────────────────────────────────────────
  insert into attendances (event_id, user_id, child_profile_id, status, local_intent, wrote_back)
    values
      (v_event1_id, v_user_id, v_child1_id, 'ATTENDING',     'ATTENDING',     true),
      (v_event2_id, v_user_id, v_child1_id, 'ATTENDING',     'ATTENDING',     true),
      (v_event3_id, v_user_id, v_child2_id, 'MAYBE',         'MAYBE',         true),
      (v_event4_id, v_user_id, v_child1_id, 'PENDING',       null,            false),
      (v_event5_id, v_user_id, v_child2_id, 'ATTENDING',     'ATTENDING',     true),
      (v_event6_id, v_user_id, v_child1_id, 'NOT_ATTENDING', 'NOT_ATTENDING', true)
    on conflict (event_id, user_id, child_profile_id) do nothing;

  -- ── Message threads ───────────────────────────────────────────────────────
  v_thread1_id := gen_random_uuid();
  v_thread2_id := gen_random_uuid();
  v_thread3_id := gen_random_uuid();

  insert into message_threads (id, team_id, provider_id, external_id, title, last_message_at, is_read_only)
    values
      (v_thread1_id, v_team1_id, 'teamsnap',     'ts-thread-1', 'Blue Lightning FC – Team Chat',      now() - interval '2 hours',  false),
      (v_thread2_id, v_team2_id, 'sportsengine', 'se-thread-1', 'Westside Warriors – Announcements',  now() - interval '1 day',    true),
      (v_thread3_id, v_team1_id, 'teamsnap',     'ts-thread-2', 'Blue Lightning FC – Coaches Corner', now() - interval '3 days',   true)
    on conflict do nothing;

  -- Messages
  insert into messages (thread_id, sender_name, body, sent_at, is_outbound, provider_id)
    values
      -- Thread 1
      (v_thread1_id, 'Coach Sarah',   'Great practice today, everyone! Remember we have a game Saturday at 10am. Please RSVP if you haven''t yet!', now() - interval '2 hours',    false, 'teamsnap'),
      (v_thread1_id, 'Mike Johnson',  'My daughter will be there! Looking forward to it.',                                                            now() - interval '1 hour 45 minutes', false, 'teamsnap'),
      (v_thread1_id, 'Coach Sarah',   'Also, please bring your blue jerseys. We''re the home team.',                                                   now() - interval '1 hour 30 minutes', false, 'teamsnap'),
      (v_thread1_id, 'Lisa Chen',     'Will there be parking on the north side? Last time it was full.',                                               now() - interval '2 hours 15 minutes', false, 'teamsnap'),
      (v_thread1_id, 'Coach Sarah',   'Yes! North lot opens at 9am.',                                                                                  now() - interval '2 hours',            false, 'teamsnap'),

      -- Thread 2
      (v_thread2_id, 'Coach Marcus',  'Game time changed to 1:00 PM this Saturday. Please update your schedules!',                                     now() - interval '1 day',              false, 'sportsengine'),
      (v_thread2_id, 'Coach Marcus',  'Reminder: bring water and a healthy snack. Hot dogs available at the concession stand.',                         now() - interval '1 day 2 hours',      false, 'sportsengine'),

      -- Thread 3
      (v_thread3_id, 'Coach Sarah',   'Tournament brackets are posted! We play Red Storm in our first game Sunday at 9am.',                             now() - interval '3 days',             false, 'teamsnap'),
      (v_thread3_id, 'Asst. Coach T', 'Great draw. Red Storm had a rough season, this is a good matchup for us.',                                       now() - interval '2 days 20 hours',    false, 'teamsnap')
    on conflict do nothing;

  raise notice 'Seed data created successfully for user %', v_user_id;

end $$;
