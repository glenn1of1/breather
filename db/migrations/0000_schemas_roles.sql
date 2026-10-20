-- Breather: two-schema privacy wall (PRD PRV-1, spec §5).
-- intake   = row-level data, SE Health side. Only the app writer (postgres, DATABASE_URL) reads it.
-- employer = aggregates only, already N-suppressed. Role `dashboard` (DASHBOARD_DATABASE_URL)
--            can only SELECT here, and has no access to intake.
-- Run with: npm run db:migrate (uses DATABASE_URL). Idempotent: safe to run again.

create schema if not exists intake;
create schema if not exists employer;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'dashboard') then create role dashboard login; end if;
end $$;

-- ---------- employer schema (aggregates) ----------
create table if not exists employer.employers (
  id            text primary key,
  slug          text not null unique,
  survey_token  text not null unique,
  name          text not null,
  headcount     int  not null,
  config        jsonb not null
);

create table if not exists employer.weekly_snapshot (
  employer_id  text not null references employer.employers(id) on delete cascade,
  week         int  not null check (week between 1 and 13),
  payload      jsonb not null,          -- DashboardSnapshot (lib/contracts.ts)
  computed_at  timestamptz not null default now(),
  primary key (employer_id, week)
);

create table if not exists employer.themes (
  employer_id        text not null references employer.employers(id) on delete cascade,
  theme              text not null,
  participant_count  int  not null,
  quotes             jsonb not null default '[]',
  primary key (employer_id, theme)
);

create table if not exists employer.pii_cache (
  quote_hash    text primary key,
  contains_pii  boolean not null,
  checked_at    timestamptz not null default now()
);

create table if not exists employer.verdict_cache (
  employer_id  text not null,
  scenario     text not null,
  inputs_hash  text not null,
  result       jsonb not null,
  primary key (employer_id, scenario, inputs_hash)
);

-- ---------- intake schema (row-level, SE Health side) ----------
create table if not exists intake.claims (
  claim_no         text primary key,
  employer_id      text not null,
  submitted_at     timestamptz not null default now(),
  pilot_week       int not null check (pilot_week between 1 and 13),
  answers          jsonb not null,      -- SurveyAnswers without q12Contact
  eligible         boolean not null,
  came_close       boolean not null,
  priority         int,
  status_snapshot  text not null,       -- what the caregiver saw at submit
  contact          text                 -- optional Q12, SE Health only
);
create index if not exists claims_employer_week on intake.claims (employer_id, pilot_week, submitted_at);

create table if not exists intake.checkins (
  claim_no    text not null references intake.claims(claim_no) on delete cascade,
  pilot_week  int not null,
  q6 int, q9 text, q10 int, q11 int,
  primary key (claim_no, pilot_week)
);

create table if not exists intake.usage_events (
  id            bigint generated always as identity primary key,
  claim_no      text not null references intake.claims(claim_no) on delete cascade,
  pilot_week    int not null,
  hours         numeric(5,2) not null,
  service_type  text not null check (service_type in ('household','companionship','personal_care','other'))
);
create index if not exists usage_claim_week on intake.usage_events (claim_no, pilot_week);

create table if not exists intake.drop_outs (
  claim_no    text primary key references intake.claims(claim_no) on delete cascade,
  pilot_week  int not null
);

create table if not exists intake.transcripts (
  id       text primary key,
  session  text not null,
  text     text not null
);

-- ---------- grants ----------
-- The app writer is `postgres`, which owns both schemas, so it needs no grants.
revoke all on schema intake from public, dashboard;
revoke all on all tables in schema intake from public, dashboard;
revoke all on schema employer from public;

grant usage on schema employer to dashboard;
grant select on all tables in schema employer to dashboard;
alter default privileges in schema employer grant select on tables to dashboard;
-- dashboard gets NOTHING on intake. Proof: npm run db:prove-wall
