-- Onboarding/Offboarding Hub schema
-- Auth model: Clerk is the identity provider (native Clerk <> Supabase third-party auth
-- integration). RLS reads the Clerk user id from auth.jwt()->>'sub' and the role from
-- auth.jwt()->'public_metadata'->>'role' ('va' | 'leadership'), which Clerk includes in
-- the session token once "role" is added to the session token's public metadata claim.

create type track as enum ('team', 'roa_newbuild', 'mastermind');
create type recruit_source as enum ('manual', 'ghl', 'stripe');

create table stages (
  id uuid primary key default gen_random_uuid(),
  track track not null,
  name text not null,
  sort_order int not null,
  created_at timestamptz not null default now(),
  unique (track, sort_order)
);

create table recruits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  track track not null,
  stage_id uuid not null references stages(id),
  assigned_va_id text,
  source recruit_source not null default 'manual',
  ghl_contact_id text unique,
  stripe_customer_id text,
  zoom_meeting_link text,
  payment_status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  onboarded_at timestamptz
);

create index recruits_track_idx on recruits (track);
create index recruits_stage_idx on recruits (stage_id);
create index recruits_assigned_va_idx on recruits (assigned_va_id);

create table templates (
  id uuid primary key default gen_random_uuid(),
  track track not null,
  stage_id uuid references stages(id),
  name text not null,
  subject text not null,
  body text not null,
  created_by text,
  updated_at timestamptz not null default now()
);

create index templates_track_idx on templates (track);

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  recruit_id uuid not null references recruits(id) on delete cascade,
  actor_id text,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_recruit_idx on activity_log (recruit_id);

-- Helpers reading Clerk claims out of the Supabase JWT
create or replace function public.current_clerk_user_id()
returns text
language sql stable
as $$
  select nullif(auth.jwt()->>'sub', '')
$$;

create or replace function public.current_role_name()
returns text
language sql stable
as $$
  select coalesce(auth.jwt()->'public_metadata'->>'role', auth.jwt()->>'role')
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_recruits_updated_at
  before update on recruits
  for each row execute function public.set_updated_at();

create trigger trg_templates_updated_at
  before update on templates
  for each row execute function public.set_updated_at();

-- VAs can move recruits through stages and edit notes, but only leadership can reassign
-- the owning VA or move a recruit between tracks.
create or replace function public.enforce_recruit_leadership_fields()
returns trigger
language plpgsql
as $$
begin
  if public.current_role_name() <> 'leadership' then
    if NEW.assigned_va_id is distinct from OLD.assigned_va_id
      or NEW.track is distinct from OLD.track then
      raise exception 'Only leadership can reassign a recruit or change its track';
    end if;
  end if;
  return NEW;
end;
$$;

create trigger trg_recruit_leadership_fields
  before update on recruits
  for each row execute function public.enforce_recruit_leadership_fields();

alter table stages enable row level security;
alter table recruits enable row level security;
alter table templates enable row level security;
alter table activity_log enable row level security;

-- stages: both roles read, only leadership edits
create policy stages_select_all on stages for select using (true);
create policy stages_insert_leadership on stages for insert
  with check (public.current_role_name() = 'leadership');
create policy stages_update_leadership on stages for update
  using (public.current_role_name() = 'leadership')
  with check (public.current_role_name() = 'leadership');
create policy stages_delete_leadership on stages for delete
  using (public.current_role_name() = 'leadership');

-- recruits: leadership sees everything, VA sees only their assigned recruits
create policy recruits_select on recruits for select
  using (
    public.current_role_name() = 'leadership'
    or assigned_va_id = public.current_clerk_user_id()
  );
create policy recruits_insert on recruits for insert
  with check (
    public.current_role_name() = 'leadership'
    or assigned_va_id = public.current_clerk_user_id()
  );
create policy recruits_update on recruits for update
  using (
    public.current_role_name() = 'leadership'
    or assigned_va_id = public.current_clerk_user_id()
  )
  with check (
    public.current_role_name() = 'leadership'
    or assigned_va_id = public.current_clerk_user_id()
  );
create policy recruits_delete on recruits for delete
  using (public.current_role_name() = 'leadership');

-- templates: both roles read, only leadership writes
create policy templates_select_all on templates for select using (true);
create policy templates_insert_leadership on templates for insert
  with check (public.current_role_name() = 'leadership');
create policy templates_update_leadership on templates for update
  using (public.current_role_name() = 'leadership')
  with check (public.current_role_name() = 'leadership');
create policy templates_delete_leadership on templates for delete
  using (public.current_role_name() = 'leadership');

-- activity_log: immutable audit trail, visibility follows the parent recruit
create policy activity_log_select on activity_log for select
  using (
    exists (
      select 1 from recruits r
      where r.id = activity_log.recruit_id
        and (
          public.current_role_name() = 'leadership'
          or r.assigned_va_id = public.current_clerk_user_id()
        )
    )
  );
create policy activity_log_insert on activity_log for insert
  with check (
    exists (
      select 1 from recruits r
      where r.id = activity_log.recruit_id
        and (
          public.current_role_name() = 'leadership'
          or r.assigned_va_id = public.current_clerk_user_id()
        )
    )
  );
