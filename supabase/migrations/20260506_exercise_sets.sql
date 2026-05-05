-- exercise_sets: structured exercise records attached to a training
create table exercise_sets (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings on delete cascade,
  exercise_name text not null,
  weight_kg numeric(6,2),
  reps int,
  sets int default 1,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_exercise_sets_training on exercise_sets(training_id);

alter table exercise_sets enable row level security;

create policy "exercise_sets: select own" on exercise_sets for select using (
  exists (select 1 from trainings t where t.id = training_id and t.member_id = auth.uid()));
create policy "exercise_sets: insert own" on exercise_sets for insert with check (
  exists (select 1 from trainings t where t.id = training_id and t.member_id = auth.uid()));
create policy "exercise_sets: update own" on exercise_sets for update using (
  exists (select 1 from trainings t where t.id = training_id and t.member_id = auth.uid()));
create policy "exercise_sets: delete own" on exercise_sets for delete using (
  exists (select 1 from trainings t where t.id = training_id and t.member_id = auth.uid()));
create policy "exercise_sets: trainer/admin all" on exercise_sets for all
  using (current_role_value() in ('trainer', 'admin'));

-- Allow trainer/admin to insert/update/delete trainings on behalf of members
create policy "trainings: trainer/admin write" on trainings for all
  using (current_role_value() in ('trainer', 'admin'));
