-- Выполни один раз в Supabase → SQL Editor

create table if not exists users (
  chat_id    bigint primary key,
  username   text,
  lang       text not null default 'ru',
  pro_until  timestamptz,
  created    timestamptz not null default now()
);

create table if not exists favs (
  id       bigserial primary key,
  chat_id  bigint not null,
  item_id  text not null,
  title    text, url text, source text,
  created  timestamptz not null default now(),
  unique (chat_id, item_id)
);

create table if not exists subs (
  chat_id bigint not null,
  topic   text not null,
  primary key (chat_id, topic)
);

create table if not exists seen (
  chat_id bigint not null,
  item_id text not null,
  primary key (chat_id, item_id)
);

create table if not exists queries (
  id      bigserial primary key,
  chat_id bigint,
  query   text,
  ts      timestamptz not null default now()
);
create index if not exists queries_ts_idx on queries (ts);

-- состояние поиска (пагинация) и ожидание чека
create table if not exists sessions (
  chat_id       bigint primary key,
  query         text,
  lang          text,
  results       jsonb,
  page          int not null default 0,
  await_receipt bigint,
  updated       timestamptz not null default now()
);

create table if not exists search_cache (
  key     text primary key,
  results jsonb not null,
  ts      timestamptz not null default now()
);

create table if not exists payments (
  id          bigserial primary key,
  chat_id     bigint not null,
  method      text not null,              -- 'crypto' | 'bank'
  amount      text,
  days        int not null,
  status      text not null default 'pending',  -- pending | paid | rejected
  invoice_id  bigint unique,              -- id инвойса CryptoBot
  created     timestamptz not null default now(),
  paid_at     timestamptz
);

create table if not exists digest_runs (
  chat_id  bigint primary key,
  last_run timestamptz not null
);

-- Доступ только с сервера (service_role обходит RLS)
alter table users        enable row level security;
alter table favs         enable row level security;
alter table subs         enable row level security;
alter table seen         enable row level security;
alter table queries      enable row level security;
alter table sessions     enable row level security;
alter table search_cache enable row level security;
alter table payments     enable row level security;
alter table digest_runs  enable row level security;
