alter table public.orders
  add column if not exists payment_option text;

update public.orders
set payment_option = 'cash'
where payment_option is null;

alter table public.orders
  alter column payment_option set default 'cash',
  alter column payment_option set not null;

alter table public.orders
  drop constraint if exists orders_payment_option_check;

alter table public.orders
  add constraint orders_payment_option_check
  check (payment_option in ('cash', 'gcash'));

notify pgrst, 'reload schema';
