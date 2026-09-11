create table if not exists user_prefs (
  user_id text primary key,
  roundtable_briefing_seen boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists api_keys (
  id serial primary key,
  user_id text not null,
  provider_id text not null,
  secret text not null,
  last4 text not null,
  created_at timestamptz not null default now(),
  unique (user_id, provider_id)
);
create index if not exists api_keys_user_id_idx on api_keys (user_id);

create table if not exists tables (
  id serial primary key,
  user_id text not null,
  title text not null default 'Untitled session',
  prompt text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tables_user_id_idx on tables (user_id);

create table if not exists seats (
  id serial primary key,
  table_id integer not null references tables(id) on delete cascade,
  user_id text not null,
  provider_id text not null,
  role text not null,
  sort_order integer not null default 0
);

create table if not exists turns (
  id serial primary key,
  table_id integer not null references tables(id) on delete cascade,
  user_id text not null,
  provider_id text not null,
  role text not null,
  round integer not null default 1,
  content text not null default '',
  error text,
  created_at timestamptz not null default now()
);
create index if not exists turns_table_id_idx on turns (table_id);
