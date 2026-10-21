create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null default ('OBI-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  idempotency_key text,
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  email text,
  phone text,
  address text not null default '',
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'completed', 'cancelled')),
  total_price numeric(12,2) not null default 0,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists order_number text;
alter table public.orders add column if not exists idempotency_key text;
alter table public.orders alter column user_id drop not null;
alter table public.orders alter column address set default '';

update public.orders
set order_number = 'OBI-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
where order_number is null;

alter table public.orders
  alter column order_number set default ('OBI-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)));
alter table public.orders alter column order_number set not null;

create unique index if not exists orders_order_number_uidx on public.orders (order_number);
create unique index if not exists orders_idempotency_key_uidx on public.orders (idempotency_key) where idempotency_key is not null;

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

drop policy if exists "Profiles insert own profile" on public.profiles;
drop policy if exists "Profiles update own profile" on public.profiles;
drop policy if exists "Admins can read all profiles" on public.profiles;
revoke insert, update on public.profiles from public, anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create policy "Profiles update own profile" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins can read all profiles" on public.profiles
for select to authenticated
using (public.is_admin());

alter table public.orders enable row level security;

drop policy if exists "Customers can insert their own orders" on public.orders;
drop policy if exists "Customers can view own orders" on public.orders;
drop policy if exists "Customers can update own orders" on public.orders;
drop policy if exists "Admins can manage all orders" on public.orders;

create policy "Customers can insert their own orders" on public.orders
for insert to authenticated
with check (user_id = auth.uid());

create policy "Customers can view own orders" on public.orders
for select to authenticated
using (user_id = auth.uid());

create policy "Admins can manage all orders" on public.orders
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage all order items" on public.order_items;
create policy "Admins can manage all order items" on public.order_items
for all to authenticated
using (public.is_admin())
with check (public.is_admin());
