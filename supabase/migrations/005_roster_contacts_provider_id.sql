-- ============================================================
-- GameHub — Add provider/external id to roster_contacts
-- Run in Supabase SQL Editor.
-- ============================================================
--
-- RSVP writeback needs to address the correct TeamSnap member when a
-- parent RSVPs on behalf of their child. Store the provider-specific
-- member id per roster row so the writeback can resolve it without a
-- round-trip API search on every RSVP.

alter table roster_contacts add column if not exists provider_id text;
alter table roster_contacts add column if not exists external_id text;

create index if not exists roster_contacts_provider_ext_idx
  on roster_contacts(provider_id, external_id);
