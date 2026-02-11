-- Stabilize RLS policies for profile and content access
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select using (true);

drop policy if exists streams_select on streams;
create policy streams_select on streams for select using (true);

drop policy if exists community_groups_select on community_groups;
create policy community_groups_select on community_groups for select using (true);

drop policy if exists community_events_select on community_events;
create policy community_events_select on community_events for select using (true);
