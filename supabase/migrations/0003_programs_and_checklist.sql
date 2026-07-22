-- Replaces the fixed `track` enum with a dynamic `programs` table, and replaces the
-- single "current stage" model with a per-recruit checklist of tasks.

create table programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sort_order int not null default 0,
  sheet_sync_enabled boolean not null default false,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table programs enable row level security;

create policy programs_select_all on programs for select using (true);
create policy programs_insert_leadership on programs for insert
  with check (public.current_role_name() = 'leadership');
create policy programs_update_leadership on programs for update
  using (public.current_role_name() = 'leadership')
  with check (public.current_role_name() = 'leadership');
create policy programs_delete_leadership on programs for delete
  using (public.current_role_name() = 'leadership');

insert into programs (name, description, sort_order, sheet_sync_enabled, is_default) values
  ('Team', 'Team recruiting track', 1, true, true),
  ('ROA/Newbuild USA', 'ROA / Newbuild USA track', 2, false, false),
  ('Mastermind', 'Mastermind track', 3, false, false);

-- stages: add program_id + checklist fields, backfill, drop track
alter table stages add column program_id uuid references programs(id);
alter table stages add column description text;
alter table stages add column required boolean not null default true;
alter table stages add column days_to_complete int;

update stages set program_id = (select id from programs where name = 'Team') where track = 'team';
update stages set program_id = (select id from programs where name = 'ROA/Newbuild USA') where track = 'roa_newbuild';
update stages set program_id = (select id from programs where name = 'Mastermind') where track = 'mastermind';

alter table stages alter column program_id set not null;
alter table stages drop column track;
alter table stages add constraint stages_program_sort_order_key unique (program_id, sort_order);
create index stages_program_idx on stages (program_id);

-- recruits: add program_id, backfill, drop track + stage_id
alter table recruits add column program_id uuid references programs(id);

update recruits set program_id = (select id from programs where name = 'Team') where track = 'team';
update recruits set program_id = (select id from programs where name = 'ROA/Newbuild USA') where track = 'roa_newbuild';
update recruits set program_id = (select id from programs where name = 'Mastermind') where track = 'mastermind';

alter table recruits alter column program_id set not null;
alter table recruits drop column track;
alter table recruits drop column stage_id;
create index recruits_program_idx on recruits (program_id);

-- templates: add program_id + sort_order, backfill, drop track
alter table templates add column program_id uuid references programs(id);
alter table templates add column sort_order int not null default 0;

update templates set program_id = (select id from programs where name = 'Team') where track = 'team';
update templates set program_id = (select id from programs where name = 'ROA/Newbuild USA') where track = 'roa_newbuild';
update templates set program_id = (select id from programs where name = 'Mastermind') where track = 'mastermind';

alter table templates alter column program_id set not null;
alter table templates drop column track;
create index templates_program_idx on templates (program_id);

drop type track;

-- per-recruit checklist completion; absence of a row = not completed
create table recruit_checklist_items (
  id uuid primary key default gen_random_uuid(),
  recruit_id uuid not null references recruits(id) on delete cascade,
  stage_id uuid not null references stages(id) on delete cascade,
  completed_at timestamptz not null default now(),
  completed_by text,
  unique (recruit_id, stage_id)
);

create index recruit_checklist_items_recruit_idx on recruit_checklist_items (recruit_id);

alter table recruit_checklist_items enable row level security;

create policy checklist_select on recruit_checklist_items for select
  using (
    exists (
      select 1 from recruits r
      where r.id = recruit_checklist_items.recruit_id
        and (
          public.current_role_name() = 'leadership'
          or r.assigned_va_id = public.current_clerk_user_id()
        )
    )
  );
create policy checklist_insert on recruit_checklist_items for insert
  with check (
    exists (
      select 1 from recruits r
      where r.id = recruit_checklist_items.recruit_id
        and (
          public.current_role_name() = 'leadership'
          or r.assigned_va_id = public.current_clerk_user_id()
        )
    )
  );
create policy checklist_update on recruit_checklist_items for update
  using (
    exists (
      select 1 from recruits r
      where r.id = recruit_checklist_items.recruit_id
        and (
          public.current_role_name() = 'leadership'
          or r.assigned_va_id = public.current_clerk_user_id()
        )
    )
  );
create policy checklist_delete on recruit_checklist_items for delete
  using (
    exists (
      select 1 from recruits r
      where r.id = recruit_checklist_items.recruit_id
        and (
          public.current_role_name() = 'leadership'
          or r.assigned_va_id = public.current_clerk_user_id()
        )
    )
  );

-- replaces move_recruit_stage: toggles one checklist item and recomputes onboarded_at
drop function if exists public.move_recruit_stage(uuid, uuid, text);

create or replace function public.toggle_checklist_item(
  p_recruit_id uuid,
  p_stage_id uuid,
  p_completed boolean,
  p_actor_id text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_program_id uuid;
  v_stage_name text;
  v_required_total int;
  v_required_done int;
begin
  select program_id into v_program_id from public.recruits where id = p_recruit_id;
  select name into v_stage_name from public.stages where id = p_stage_id;

  if p_completed then
    insert into public.recruit_checklist_items (recruit_id, stage_id, completed_at, completed_by)
    values (p_recruit_id, p_stage_id, now(), p_actor_id)
    on conflict (recruit_id, stage_id)
    do update set completed_at = now(), completed_by = p_actor_id;

    insert into public.activity_log (recruit_id, actor_id, action, detail)
    values (
      p_recruit_id, p_actor_id, 'checklist_item_completed',
      jsonb_build_object('stage_id', p_stage_id, 'stage_name', v_stage_name)
    );
  else
    delete from public.recruit_checklist_items
    where recruit_id = p_recruit_id and stage_id = p_stage_id;

    insert into public.activity_log (recruit_id, actor_id, action, detail)
    values (
      p_recruit_id, p_actor_id, 'checklist_item_unchecked',
      jsonb_build_object('stage_id', p_stage_id, 'stage_name', v_stage_name)
    );
  end if;

  select count(*) into v_required_total
  from public.stages
  where program_id = v_program_id and required = true;

  select count(*) into v_required_done
  from public.stages s
  join public.recruit_checklist_items ci
    on ci.stage_id = s.id and ci.recruit_id = p_recruit_id
  where s.program_id = v_program_id and s.required = true;

  update public.recruits
  set onboarded_at = case
    when v_required_total > 0 and v_required_done >= v_required_total
      then coalesce(onboarded_at, now())
    else null
  end
  where id = p_recruit_id;
end;
$$;

-- template reordering, mirrors swap_stage_order
create or replace function public.swap_template_order(p_template_a uuid, p_template_b uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_order_a int;
  v_order_b int;
begin
  select sort_order into v_order_a from public.templates where id = p_template_a;
  select sort_order into v_order_b from public.templates where id = p_template_b;

  update public.templates set sort_order = v_order_b where id = p_template_a;
  update public.templates set sort_order = v_order_a where id = p_template_b;
end;
$$;

-- program is the new leadership-gated field (was track)
create or replace function public.enforce_recruit_leadership_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.current_role_name() <> 'leadership' then
    if NEW.assigned_va_id is distinct from OLD.assigned_va_id
      or NEW.program_id is distinct from OLD.program_id then
      raise exception 'Only leadership can reassign a recruit or change its program';
    end if;
  end if;
  return NEW;
end;
$$;
