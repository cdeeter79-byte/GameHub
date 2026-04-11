-- ============================================================
-- GameHub — Row-Level Security Policies
-- ============================================================
-- Principle: users only access their own data.
-- Children's data: only parent (via parent_user_id) can access.
-- Team data: visible to all team members; write restricted to managers/admins.

-- Enable RLS on all tables
alter table parent_profiles        enable row level security;
alter table child_profiles         enable row level security;
alter table consent_records        enable row level security;
alter table provider_accounts      enable row level security;
alter table teams                  enable row level security;
alter table team_members           enable row level security;
alter table roster_entries         enable row level security;
alter table events                 enable row level security;
alter table attendances            enable row level security;
alter table message_threads        enable row level security;
alter table messages               enable row level security;
alter table sync_jobs              enable row level security;
alter table sync_conflicts         enable row level security;
alter table notification_preferences enable row level security;
alter table subscription_states    enable row level security;
alter table manager_plans          enable row level security;
alter table managed_teams          enable row level security;
alter table audit_logs             enable row level security;

-- ─── Parent Profiles ─────────────────────────────────────────────────────────

create policy "Users can view and update their own profile"
  on parent_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Child Profiles ───────────────────────────────────────────────────────────

create policy "Parents can manage their own children"
  on child_profiles for all
  using (auth.uid() = parent_user_id)
  with check (auth.uid() = parent_user_id);

-- ─── Consent Records ─────────────────────────────────────────────────────────

create policy "Parents can view their consent records"
  on consent_records for select
  using (auth.uid() = parent_user_id);

create policy "Parents can insert consent records"
  on consent_records for insert
  with check (auth.uid() = parent_user_id);

-- ─── Provider Accounts ───────────────────────────────────────────────────────

create policy "Users can manage their own provider accounts"
  on provider_accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Teams ───────────────────────────────────────────────────────────────────

-- Any authenticated user can view teams they are a member of
create policy "Team members can view teams"
  on teams for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = teams.id
        and team_members.user_id = auth.uid()
    )
  );

-- Managers and admins can update their teams
create policy "Managers can update teams"
  on teams for update
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = teams.id
        and team_members.user_id = auth.uid()
        and team_members.role in ('MANAGER', 'ADMIN', 'COACH')
    )
  );

-- Authenticated users can create teams
create policy "Authenticated users can create teams"
  on teams for insert
  with check (auth.uid() = created_by);

-- ─── Team Members ────────────────────────────────────────────────────────────

create policy "Team members can see each other"
  on team_members for select
  using (
    exists (
      select 1 from team_members tm2
      where tm2.team_id = team_members.team_id
        and tm2.user_id = auth.uid()
    )
  );

create policy "Managers can add/remove team members"
  on team_members for all
  using (
    exists (
      select 1 from team_members tm2
      where tm2.team_id = team_members.team_id
        and tm2.user_id = auth.uid()
        and tm2.role in ('MANAGER', 'ADMIN')
    )
  );

create policy "Users can join teams (insert themselves)"
  on team_members for insert
  with check (auth.uid() = user_id);

-- ─── Roster Entries ──────────────────────────────────────────────────────────

create policy "Team members can view roster"
  on roster_entries for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = roster_entries.team_id
        and team_members.user_id = auth.uid()
    )
  );

create policy "Managers can manage roster"
  on roster_entries for all
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = roster_entries.team_id
        and team_members.user_id = auth.uid()
        and team_members.role in ('MANAGER', 'ADMIN', 'COACH')
    )
  );

-- Parents can add their own children to rosters
create policy "Parents can roster their children"
  on roster_entries for insert
  with check (
    exists (
      select 1 from child_profiles
      where child_profiles.id = roster_entries.child_profile_id
        and child_profiles.parent_user_id = auth.uid()
    )
  );

-- ─── Events ──────────────────────────────────────────────────────────────────

create policy "Team members can view events"
  on events for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = events.team_id
        and team_members.user_id = auth.uid()
    )
    or
    exists (
      select 1 from child_profiles
      where child_profiles.id = events.child_profile_id
        and child_profiles.parent_user_id = auth.uid()
    )
  );

create policy "Managers can create/update events"
  on events for insert
  with check (
    exists (
      select 1 from team_members
      where team_members.team_id = events.team_id
        and team_members.user_id = auth.uid()
        and team_members.role in ('MANAGER', 'ADMIN', 'COACH')
    )
  );

create policy "Managers can update events"
  on events for update
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = events.team_id
        and team_members.user_id = auth.uid()
        and team_members.role in ('MANAGER', 'ADMIN', 'COACH')
    )
  );

-- ─── Attendances ─────────────────────────────────────────────────────────────

create policy "Users can view and manage their own RSVP"
  on attendances for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Team managers can view all RSVPs for their events"
  on attendances for select
  using (
    exists (
      select 1 from events
      join team_members on team_members.team_id = events.team_id
      where events.id = attendances.event_id
        and team_members.user_id = auth.uid()
        and team_members.role in ('MANAGER', 'ADMIN', 'COACH')
    )
  );

-- ─── Messages ────────────────────────────────────────────────────────────────

create policy "Team members can view message threads"
  on message_threads for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = message_threads.team_id
        and team_members.user_id = auth.uid()
    )
  );

create policy "Team members can view messages in their threads"
  on messages for select
  using (
    exists (
      select 1 from message_threads
      join team_members on team_members.team_id = message_threads.team_id
      where message_threads.id = messages.thread_id
        and team_members.user_id = auth.uid()
    )
  );

create policy "Team members can send messages"
  on messages for insert
  with check (
    exists (
      select 1 from message_threads
      join team_members on team_members.team_id = message_threads.team_id
      where message_threads.id = messages.thread_id
        and team_members.user_id = auth.uid()
        and not message_threads.is_read_only
    )
  );

-- ─── Sync & Subscriptions ────────────────────────────────────────────────────

create policy "Users can view their own sync jobs"
  on sync_jobs for select
  using (auth.uid() = user_id);

create policy "Users can view their notification preferences"
  on notification_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view their subscription state"
  on subscription_states for select
  using (auth.uid() = user_id);

create policy "Users can view their manager plan"
  on manager_plans for select
  using (auth.uid() = user_id);

create policy "Users can view their managed teams"
  on managed_teams for select
  using (auth.uid() = manager_user_id);

-- Audit logs: users can view their own logs only
create policy "Users can view their own audit log"
  on audit_logs for select
  using (auth.uid() = user_id);
