-- Drop existing policies if they exist
drop policy if exists "Allow all operations on colaboradores" on public.colaboradores;
drop policy if exists "Allow all operations on chamadas" on public.chamadas;

-- Drop existing tables to recreate them fresh
drop table if exists public.chamadas cascade;
drop table if exists public.colaboradores cascade;

-- Drop and recreate function
drop function if exists public.update_updated_at_column() cascade;

-- Enable required extension for UUIDs
create extension if not exists "pgcrypto";

-- Helper function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- colaboradores table
create table public.colaboradores (
  id uuid primary key default gen_random_uuid(),
  matricula text not null,
  colaborador text not null,
  status text not null default 'ativo',
  cargo text,
  setor text,
  subsetor text,
  lideranca text,
  turno text,
  sabado_trabalho text,
  horario_almoco time without time zone,
  horario_cafe time without time zone,
  admissao date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- chamadas table
create table public.chamadas (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores(id) on delete cascade,
  data date not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (colaborador_id, data)
);

-- Enable RLS
alter table public.colaboradores enable row level security;
alter table public.chamadas enable row level security;

-- Open policies (public access) since the app has no auth yet
create policy "Allow all operations on colaboradores"
  on public.colaboradores
  for all
  using (true)
  with check (true);

create policy "Allow all operations on chamadas"
  on public.chamadas
  for all
  using (true)
  with check (true);

-- Triggers to maintain updated_at
create trigger trg_colaboradores_updated
before update on public.colaboradores
for each row execute function public.update_updated_at_column();

create trigger trg_chamadas_updated
before update on public.chamadas
for each row execute function public.update_updated_at_column();