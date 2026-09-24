create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null unique,
  method text not null default 'email',
  name text not null,
  password text not null,
  balance double precision not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.money_requests (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  name text not null,
  kind text not null check (kind in ('deposit','withdraw')),
  amount double precision not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  at timestamptz not null default now(),
  decided_at timestamptz,
  proof text,
  proof_name text,
  from_number text
);
create index if not exists money_requests_identifier_idx on public.money_requests (identifier);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  name text not null,
  sender text not null,
  text text not null,
  image text,
  at timestamptz not null default now()
);
create index if not exists support_messages_identifier_idx on public.support_messages (identifier);

create table if not exists public.pay_settings (
  id integer primary key default 1 check (id = 1),
  data jsonb not null
);
insert into public.pay_settings (id, data)
values (1, '{"methodName":"أورنج كاش","depositMethods":[{"name":"أورنج كاش","number":"01201838463"},{"name":"أورنج كاش","number":"01208895415"}],"taxNumber":"01208895415"}'::jsonb)
on conflict (id) do nothing;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  identifier text not null unique,
  amount double precision not null,
  return_amount double precision not null,
  duration_ms bigint not null,
  started_at bigint not null,
  tax double precision not null default 0,
  tax_paid boolean not null default false,
  tax_sender_number text,
  tax_proof_name text,
  tax_submitted_at timestamptz,
  credited boolean not null default false
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  title text not null,
  text text not null,
  at timestamptz not null default now(),
  seen boolean not null default false
);
create index if not exists notifications_identifier_idx on public.notifications (identifier);

grant all on public.accounts to service_role;
grant all on public.money_requests to service_role;
grant all on public.support_messages to service_role;
grant all on public.pay_settings to service_role;
grant all on public.subscriptions to service_role;
grant all on public.notifications to service_role;

alter table public.accounts enable row level security;
alter table public.money_requests enable row level security;
alter table public.support_messages enable row level security;
alter table public.pay_settings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;