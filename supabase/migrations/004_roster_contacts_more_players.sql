-- ============================================================
-- GameHub — Roster Contacts + More Test Players + Event Coords
-- Run in Supabase SQL Editor.
-- ============================================================

-- ── New table: roster_contacts ────────────────────────────────────────────────
-- Stores per-player parent/guardian contact info for a team roster.
-- Does NOT require players to have a GameHub account (child_profile_id is optional).

create table if not exists roster_contacts (
  id                  uuid primary key default uuid_generate_v4(),
  team_id             uuid not null references teams(id) on delete cascade,
  -- Player info
  player_first_name   text not null,
  player_last_name    text not null,
  jersey_number       text,
  position            text,
  role                member_role not null default 'PLAYER',
  -- Primary parent/guardian
  parent_name         text,
  parent_relationship text,   -- e.g. 'Mom', 'Dad', 'Guardian'
  parent_phone        text,
  parent_email        text,
  -- Secondary parent/guardian (optional)
  parent2_name        text,
  parent2_relationship text,
  parent2_phone       text,
  parent2_email       text,
  -- Optional link to an actual GameHub child profile
  child_profile_id    uuid references child_profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  unique(team_id, player_first_name, player_last_name)
);

create index if not exists roster_contacts_team_idx on roster_contacts(team_id);
create index if not exists roster_contacts_child_idx on roster_contacts(child_profile_id);

alter table roster_contacts enable row level security;

-- Team members can view contacts for teams they belong to
drop policy if exists "team members can view roster contacts" on roster_contacts;
create policy "team members can view roster contacts"
  on roster_contacts for select
  using (
    team_id in (
      select team_id from team_members where user_id = auth.uid()
    )
  );

-- ── Seed roster contact data ──────────────────────────────────────────────────

do $$
declare
  v_user_id    uuid;
  v_child1_id  uuid;
  v_child2_id  uuid;
  v_team1_id   uuid;
  v_team2_id   uuid;
  v_team3_id   uuid;
begin

  -- Look up test user
  select id into v_user_id
    from auth.users
   where email = 'cdeeter79@gmail.com'
   limit 1;

  if v_user_id is null then
    raise exception 'User not found. Update the email and try again.';
  end if;

  -- Get existing child IDs
  select id into v_child1_id from child_profiles
   where parent_user_id = v_user_id and first_name = 'Emma' limit 1;

  select id into v_child2_id from child_profiles
   where parent_user_id = v_user_id and first_name = 'Liam' limit 1;

  -- Get team IDs
  select id into v_team1_id from teams where external_id = 'ts-team-1001' limit 1;
  select id into v_team2_id from teams where external_id = 'se-team-2001' limit 1;
  select id into v_team3_id from teams where external_id = 'ts-team-1002' limit 1;

  -- ── Blue Lightning FC (Soccer, U12) – 10 total players ─────────────────────

  -- Emma Test (the logged-in user's child — link to child_profile)
  insert into roster_contacts (
    team_id, player_first_name, player_last_name, jersey_number, position, role,
    parent_name, parent_relationship, parent_phone, parent_email,
    parent2_name, parent2_relationship, parent2_phone, parent2_email,
    child_profile_id
  ) values (
    v_team1_id, 'Emma', 'Test', '7', 'Midfielder', 'PLAYER',
    'Alex Test', 'Mom', '(555) 867-5309', 'cdeeter79@gmail.com',
    null, null, null, null,
    v_child1_id
  ) on conflict (team_id, player_first_name, player_last_name) do nothing;

  -- Additional Blue Lightning FC players
  insert into roster_contacts (
    team_id, player_first_name, player_last_name, jersey_number, position, role,
    parent_name, parent_relationship, parent_phone, parent_email,
    parent2_name, parent2_relationship, parent2_phone, parent2_email
  ) values
    (v_team1_id, 'Sophie', 'Williams',  '3',  'Forward',    'PLAYER',
     'Karen Williams',  'Mom', '(555) 234-5678', 'kwilliams@email.com',
     'Derek Williams',  'Dad', '(555) 234-5679', 'dwilliams@email.com'),

    (v_team1_id, 'Ava',    'Johnson',   '5',  'Goalkeeper', 'PLAYER',
     'Michelle Johnson','Mom', '(555) 345-6789', 'mjohnson@email.com',
     null, null, null, null),

    (v_team1_id, 'Mia',    'Garcia',    '10', 'Forward',    'PLAYER',
     'Rosa Garcia',     'Mom', '(555) 456-7890', 'rgarcia@email.com',
     'Luis Garcia',     'Dad', '(555) 456-7891', 'lgarcia@email.com'),

    (v_team1_id, 'Olivia', 'Martinez',  '14', 'Midfielder', 'PLAYER',
     'Sandra Martinez', 'Mom', '(555) 567-8901', 'smartinez@email.com',
     null, null, null, null),

    (v_team1_id, 'Chloe',  'Davis',     '8',  'Defender',   'PLAYER',
     'Beth Davis',      'Mom', '(555) 678-9012', 'bdavis@email.com',
     'Tom Davis',       'Dad', '(555) 678-9013', 'tdavis@email.com'),

    (v_team1_id, 'Lily',   'Chen',      '2',  'Defender',   'PLAYER',
     'Lisa Chen',       'Mom', '(555) 789-0123', 'lchen@email.com',
     null, null, null, null),

    (v_team1_id, 'Zoe',    'Thompson',  '11', 'Midfielder', 'PLAYER',
     'Rachel Thompson', 'Mom', '(555) 890-1234', 'rthompson@email.com',
     'Mark Thompson',   'Dad', '(555) 890-1235', 'mthompson@email.com'),

    (v_team1_id, 'Hannah', 'Anderson',  '17', 'Forward',    'PLAYER',
     'Julie Anderson',  'Mom', '(555) 901-2345', 'janderson@email.com',
     'Greg Anderson',   'Dad', '(555) 901-2346', 'ganderson@email.com'),

    (v_team1_id, 'Grace',  'Wilson',    '9',  'Defender',   'PLAYER',
     'Pam Wilson',      'Mom', '(555) 012-3456', 'pwilson@email.com',
     null, null, null, null)
  on conflict (team_id, player_first_name, player_last_name) do nothing;

  -- ── Westside Warriors (Basketball, U12) – 10 total players ─────────────────

  -- Liam Test (logged-in user's child)
  insert into roster_contacts (
    team_id, player_first_name, player_last_name, jersey_number, position, role,
    parent_name, parent_relationship, parent_phone, parent_email,
    child_profile_id
  ) values (
    v_team2_id, 'Liam', 'Test', '23', 'Guard', 'PLAYER',
    'Alex Test', 'Mom', '(555) 867-5309', 'cdeeter79@gmail.com',
    v_child2_id
  ) on conflict (team_id, player_first_name, player_last_name) do nothing;

  insert into roster_contacts (
    team_id, player_first_name, player_last_name, jersey_number, position, role,
    parent_name, parent_relationship, parent_phone, parent_email,
    parent2_name, parent2_relationship, parent2_phone, parent2_email
  ) values
    (v_team2_id, 'Noah',   'Brown',    '12', 'Forward',  'PLAYER',
     'Denise Brown',   'Mom', '(555) 111-2222', 'dbrown@email.com',
     'James Brown',    'Dad', '(555) 111-2223', 'jbrown@email.com'),

    (v_team2_id, 'Ethan',  'Jackson',  '5',  'Center',   'PLAYER',
     'Angela Jackson', 'Mom', '(555) 222-3333', 'ajackson@email.com',
     null, null, null, null),

    (v_team2_id, 'Mason',  'White',    '33', 'Guard',    'PLAYER',
     'Donna White',    'Mom', '(555) 333-4444', 'dwhite@email.com',
     'Steve White',    'Dad', '(555) 333-4445', 'swhite@email.com'),

    (v_team2_id, 'Logan',  'Harris',   '0',  'Forward',  'PLAYER',
     'Cindy Harris',   'Mom', '(555) 444-5555', 'charris@email.com',
     null, null, null, null),

    (v_team2_id, 'Lucas',  'Clark',    '21', 'Guard',    'PLAYER',
     'Nina Clark',     'Mom', '(555) 555-6666', 'nclark@email.com',
     'Eddie Clark',    'Dad', '(555) 555-6667', 'eclark@email.com'),

    (v_team2_id, 'Aiden',  'Lewis',    '15', 'Center',   'PLAYER',
     'Terri Lewis',    'Mom', '(555) 666-7777', 'tlewis@email.com',
     null, null, null, null),

    (v_team2_id, 'Jackson','Robinson', '4',  'Forward',  'PLAYER',
     'Carmen Robinson','Mom', '(555) 777-8888', 'crobinson@email.com',
     'Victor Robinson','Dad', '(555) 777-8889', 'vrobinson@email.com'),

    (v_team2_id, 'Owen',   'Walker',   '8',  'Guard',    'PLAYER',
     'Gail Walker',    'Mom', '(555) 888-9999', 'gwalker@email.com',
     null, null, null, null),

    (v_team2_id, 'Carter', 'Hall',     '30', 'Center',   'PLAYER',
     'Brenda Hall',    'Mom', '(555) 999-0000', 'bhall@email.com',
     'Ray Hall',       'Dad', '(555) 999-0001', 'rhall@email.com')
  on conflict (team_id, player_first_name, player_last_name) do nothing;

  -- ── Riverside Rockets (Soccer, U10) – 8 players ─────────────────────────────

  -- Emma Test also plays on this team
  insert into roster_contacts (
    team_id, player_first_name, player_last_name, jersey_number, position, role,
    parent_name, parent_relationship, parent_phone, parent_email,
    child_profile_id
  ) values (
    v_team3_id, 'Emma', 'Test', '7', 'Forward', 'PLAYER',
    'Alex Test', 'Mom', '(555) 867-5309', 'cdeeter79@gmail.com',
    v_child1_id
  ) on conflict (team_id, player_first_name, player_last_name) do nothing;

  insert into roster_contacts (
    team_id, player_first_name, player_last_name, jersey_number, position, role,
    parent_name, parent_relationship, parent_phone, parent_email,
    parent2_name, parent2_relationship, parent2_phone, parent2_email
  ) values
    (v_team3_id, 'Ella',   'Moore',   '4',  'Midfielder', 'PLAYER',
     'Janet Moore',    'Mom', '(555) 121-3434', 'jmoore@email.com',
     null, null, null, null),

    (v_team3_id, 'Aria',   'Taylor',  '6',  'Goalkeeper', 'PLAYER',
     'Bonnie Taylor',  'Mom', '(555) 232-4545', 'btaylor@email.com',
     'Frank Taylor',   'Dad', '(555) 232-4546', 'ftaylor@email.com'),

    (v_team3_id, 'Nora',   'Lee',     '9',  'Defender',   'PLAYER',
     'Helen Lee',      'Mom', '(555) 343-5656', 'hlee@email.com',
     null, null, null, null),

    (v_team3_id, 'Riley',  'King',    '11', 'Forward',    'PLAYER',
     'Patty King',     'Mom', '(555) 454-6767', 'pking@email.com',
     'Roger King',     'Dad', '(555) 454-6768', 'rking@email.com'),

    (v_team3_id, 'Luna',   'Scott',   '2',  'Midfielder', 'PLAYER',
     'Vicki Scott',    'Mom', '(555) 565-7878', 'vscott@email.com',
     null, null, null, null),

    (v_team3_id, 'Hazel',  'Green',   '13', 'Defender',   'PLAYER',
     'Wanda Green',    'Mom', '(555) 676-8989', 'wgreen@email.com',
     'Carl Green',     'Dad', '(555) 676-8990', 'cgreen@email.com'),

    (v_team3_id, 'Stella', 'Adams',   '18', 'Defender',   'PLAYER',
     'Paula Adams',    'Mom', '(555) 787-9090', 'padams@email.com',
     null, null, null, null)
  on conflict (team_id, player_first_name, player_last_name) do nothing;

  -- ── Update events with lat/lng coordinates ────────────────────────────────

  -- Blue Lightning FC vs. Red Storm → Riverside Sports Complex, Springfield IL
  update events
    set location = location || '{"lat": 39.7992, "lng": -89.6493}'::jsonb
  where provider_id = 'teamsnap' and external_id = 'ts-ev-1001'
    and location->>'lat' is null;

  -- Blue Lightning FC Practice → Lincoln Park Field 3, Springfield IL
  update events
    set location = location || '{"lat": 39.7825, "lng": -89.6441}'::jsonb
  where provider_id = 'teamsnap' and external_id = 'ts-ev-1002'
    and location->>'lat' is null;

  -- Westside Warriors vs. Eagles → Westside Community Gym, Springfield IL
  update events
    set location = location || '{"lat": 39.7956, "lng": -89.6801}'::jsonb
  where provider_id = 'sportsengine' and external_id = 'se-ev-2001'
    and location->>'lat' is null;

  -- Spring Classic Tournament → Metro Soccer Park, Springfield IL
  update events
    set location = location || '{"lat": 39.8105, "lng": -89.6502}'::jsonb
  where provider_id = 'teamsnap' and external_id = 'ts-ev-1003'
    and location->>'lat' is null;

  -- Westside Warriors Practice → Westside Community Gym, Springfield IL
  update events
    set location = location || '{"lat": 39.7956, "lng": -89.6801}'::jsonb
  where provider_id = 'sportsengine' and external_id = 'se-ev-2002'
    and location->>'lat' is null;

  -- End-of-Season Team Meeting → Riverside Sports Complex Lobby, Springfield IL
  update events
    set location = location || '{"lat": 39.7992, "lng": -89.6493}'::jsonb
  where provider_id = 'teamsnap' and external_id = 'ts-ev-1004'
    and location->>'lat' is null;

  raise notice 'Migration 004 applied successfully.';

end $$;
