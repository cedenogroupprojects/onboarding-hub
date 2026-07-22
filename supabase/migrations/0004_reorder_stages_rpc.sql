-- Bulk drag-to-reorder for a program's checklist. Two-pass (negative placeholders, then
-- final values) so the mid-statement uniqueness check on (program_id, sort_order) never
-- collides while rows are being reassigned.
create or replace function public.reorder_stages(p_program_id uuid, p_ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.stages
  set sort_order = -1 * t.ord
  from unnest(p_ordered_ids) with ordinality as t(id, ord)
  where public.stages.id = t.id and public.stages.program_id = p_program_id;

  update public.stages
  set sort_order = t.ord
  from unnest(p_ordered_ids) with ordinality as t(id, ord)
  where public.stages.id = t.id and public.stages.program_id = p_program_id;
end;
$$;
