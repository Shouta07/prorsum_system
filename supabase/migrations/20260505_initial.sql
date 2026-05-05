-- ENUMS
create type user_role as enum ('member', 'trainer', 'admin');
create type checkin_type as enum ('personal', 'self');
create type avatar_state as enum ('normal', 'lonely', 'celebrating');
create type feedback_type as enum ('comment', 'like');

-- PROFILES
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role user_role not null default 'member',
  display_name text not null,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 'member');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- MEMBERS
create table members (
  user_id uuid primary key references profiles on delete cascade,
  current_xp int not null default 0,
  current_level int not null default 1,
  joined_at timestamptz not null default now()
);

create or replace function handle_member_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'member' then
    insert into members (user_id) values (new.id) on conflict (user_id) do nothing;
  end if;
  return new;
end; $$;

create trigger on_profile_member_role
  after insert or update of role on profiles
  for each row execute function handle_member_role();

-- AVATARS
create table avatars (
  member_id uuid primary key references members on delete cascade,
  name text not null,
  hatched_at timestamptz not null default now(),
  current_skin text not null default 'level-1',
  state avatar_state not null default 'normal'
);

-- CHECK-INS
create table check_ins (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members on delete cascade,
  date date not null default current_date,
  type checkin_type not null,
  points_awarded int not null,
  created_at timestamptz not null default now(),
  unique(member_id, date, type)
);
create index idx_checkins_member_date on check_ins(member_id, date desc);

-- WEIGHTS
create table weights (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members on delete cascade,
  date date not null default current_date,
  weight_kg numeric(5,2) not null,
  created_at timestamptz not null default now(),
  unique(member_id, date)
);
create index idx_weights_member_date on weights(member_id, date desc);

-- TRAININGS
create table trainings (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members on delete cascade,
  date date not null default current_date,
  content text not null,
  duration_min int not null,
  created_at timestamptz not null default now()
);
create index idx_trainings_member_date on trainings(member_id, date desc);

-- FEEDBACKS
create table feedbacks (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references trainings on delete cascade,
  trainer_id uuid not null references profiles,
  type feedback_type not null default 'comment',
  content text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_feedbacks_training on feedbacks(training_id);

-- STREAKS
create table streaks (
  member_id uuid primary key references members on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_activity_date date
);

-- BADGES
create table badges (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members on delete cascade,
  badge_type text not null,
  earned_at timestamptz not null default now(),
  unique(member_id, badge_type)
);

-- POINT SETTINGS
create table point_settings (
  id int primary key default 1,
  personal_points int not null default 10,
  self_points int not null default 3,
  weight_log_points int not null default 1,
  training_log_points int not null default 2,
  trainer_like_bonus int not null default 5,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into point_settings (id) values (1);

-- LEVEL THRESHOLDS
create table level_thresholds (
  level int primary key,
  xp_required int not null,
  skin_id text not null
);
insert into level_thresholds values
  (1, 0, 'level-1'), (2, 30, 'level-2'), (3, 80, 'level-3'),
  (4, 160, 'level-4'), (5, 280, 'level-5'), (6, 450, 'level-6'),
  (7, 680, 'level-7'), (8, 980, 'level-8'), (9, 1360, 'level-9'),
  (10, 1830, 'level-10');

-- XP加算共通関数
create or replace function award_xp(p_member_id uuid, p_points int)
returns void language plpgsql security definer set search_path = public as $$
declare v_new_xp int; v_new_level int; v_new_skin text;
begin
  update members set current_xp = current_xp + p_points
    where user_id = p_member_id returning current_xp into v_new_xp;
  select level, skin_id into v_new_level, v_new_skin
    from level_thresholds where xp_required <= v_new_xp
    order by level desc limit 1;
  update members set current_level = v_new_level
    where user_id = p_member_id and current_level <> v_new_level;
  update avatars set current_skin = v_new_skin
    where member_id = p_member_id and current_skin <> v_new_skin;
end; $$;

-- check_ins: ポイント決定 trigger（before）
create or replace function trg_checkin_set_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_settings point_settings%rowtype;
begin
  select * into v_settings from point_settings where id = 1;
  new.points_awarded := case when new.type = 'personal'
    then v_settings.personal_points else v_settings.self_points end;
  return new;
end; $$;

create trigger trg_checkin_before
  before insert on check_ins
  for each row execute function trg_checkin_set_points();

-- check_ins: XPとストリーク更新 trigger（after）
create or replace function trg_checkin_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform award_xp(new.member_id, new.points_awarded);
  insert into streaks (member_id, current_streak, longest_streak, last_activity_date)
    values (new.member_id, 1, 1, new.date)
    on conflict (member_id) do update set
      current_streak = case
        when streaks.last_activity_date = new.date - interval '1 day' then streaks.current_streak + 1
        when streaks.last_activity_date = new.date then streaks.current_streak
        else 1 end,
      longest_streak = greatest(streaks.longest_streak, case
        when streaks.last_activity_date = new.date - interval '1 day' then streaks.current_streak + 1
        else 1 end),
      last_activity_date = new.date;
  update avatars set state = 'normal'
    where member_id = new.member_id and state = 'lonely';
  return new;
end; $$;

create trigger trg_checkin_after
  after insert on check_ins
  for each row execute function trg_checkin_after_insert();

-- weights: XP加算
create or replace function trg_weight_award_xp()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_points int;
begin
  select weight_log_points into v_points from point_settings where id = 1;
  perform award_xp(new.member_id, v_points);
  return new;
end; $$;

create trigger trg_weight_after
  after insert on weights
  for each row execute function trg_weight_award_xp();

-- trainings: XP加算
create or replace function trg_training_award_xp()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_points int;
begin
  select training_log_points into v_points from point_settings where id = 1;
  perform award_xp(new.member_id, v_points);
  return new;
end; $$;

create trigger trg_training_after
  after insert on trainings
  for each row execute function trg_training_award_xp();

-- feedbacks (like): ボーナス
create or replace function trg_feedback_like_bonus()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_member_id uuid; v_bonus int;
begin
  if new.type = 'like' then
    select member_id into v_member_id from trainings where id = new.training_id;
    select trainer_like_bonus into v_bonus from point_settings where id = 1;
    perform award_xp(v_member_id, v_bonus);
  end if;
  return new;
end; $$;

create trigger trg_feedback_after
  after insert on feedbacks
  for each row execute function trg_feedback_like_bonus();

-- ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table members enable row level security;
alter table avatars enable row level security;
alter table check_ins enable row level security;
alter table weights enable row level security;
alter table trainings enable row level security;
alter table feedbacks enable row level security;
alter table streaks enable row level security;
alter table badges enable row level security;
alter table point_settings enable row level security;
alter table level_thresholds enable row level security;

create or replace function current_role_value()
returns user_role language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create policy "profiles: self select" on profiles for select using (id = auth.uid());
create policy "profiles: trainer/admin select all" on profiles for select
  using (current_role_value() in ('trainer', 'admin'));
create policy "profiles: self update" on profiles for update using (id = auth.uid());

create policy "members: self all" on members for all using (user_id = auth.uid());
create policy "members: trainer/admin select" on members for select
  using (current_role_value() in ('trainer', 'admin'));

create policy "avatars: self all" on avatars for all using (member_id = auth.uid());
create policy "avatars: trainer/admin select" on avatars for select
  using (current_role_value() in ('trainer', 'admin'));

create policy "checkins: self all" on check_ins for all using (member_id = auth.uid());
create policy "checkins: trainer/admin select" on check_ins for select
  using (current_role_value() in ('trainer', 'admin'));

create policy "weights: self all" on weights for all using (member_id = auth.uid());
create policy "weights: trainer/admin select" on weights for select
  using (current_role_value() in ('trainer', 'admin'));

create policy "trainings: self all" on trainings for all using (member_id = auth.uid());
create policy "trainings: trainer/admin select" on trainings for select
  using (current_role_value() in ('trainer', 'admin'));

create policy "feedbacks: member select" on feedbacks for select using (
  exists (select 1 from trainings t where t.id = training_id and t.member_id = auth.uid()));
create policy "feedbacks: trainer/admin all" on feedbacks for all
  using (current_role_value() in ('trainer', 'admin'));
create policy "feedbacks: member mark read" on feedbacks for update using (
  exists (select 1 from trainings t where t.id = training_id and t.member_id = auth.uid()));

create policy "streaks: self select" on streaks for select using (member_id = auth.uid());
create policy "streaks: trainer/admin select" on streaks for select
  using (current_role_value() in ('trainer', 'admin'));

create policy "badges: self select" on badges for select using (member_id = auth.uid());
create policy "badges: trainer/admin select" on badges for select
  using (current_role_value() in ('trainer', 'admin'));

create policy "point_settings: read all" on point_settings for select using (true);
create policy "point_settings: admin update" on point_settings for update
  using (current_role_value() = 'admin');

create policy "level_thresholds: read all" on level_thresholds for select using (true);
