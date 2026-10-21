create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('OBI-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  idempotency_key text unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  email text,
  phone text,
  address text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'completed', 'cancelled')),
  total_price numeric(12,2) not null default 0,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  item_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    'customer'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        phone = excluded.phone;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke insert, update on public.profiles from public, anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "Profiles view own profile" on public.profiles
for select using (auth.uid() = id);

create policy "Profiles update own profile" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Admins can read all profiles" on public.profiles
for select using (public.is_admin());

create policy "Customers can insert their own orders" on public.orders
for insert with check (user_id = auth.uid());

create policy "Customers can view own orders" on public.orders
for select using (user_id = auth.uid());

create policy "Admins can manage all orders" on public.orders
for all using (public.is_admin())
with check (public.is_admin());

create policy "Customers can insert own order items" on public.order_items
for insert with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

create policy "Customers can view own order items" on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

create policy "Admins can manage all order items" on public.order_items
for all using (public.is_admin())
with check (public.is_admin());

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_orders_updated_at on public.orders;
create trigger update_orders_updated_at
before update on public.orders
for each row execute procedure public.update_updated_at();

-- Promote one admin account by email.
-- Replace the email below before running this.
-- update public.profiles
-- set role = 'admin'
-- where email = 'admin@yourdomain.com';

select 'Supabase schema ready. Replace the admin email in the final SQL before using it in production.' as status;
