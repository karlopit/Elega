alter table public.orders
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6);

alter table public.orders
  drop constraint if exists orders_latitude_range,
  drop constraint if exists orders_longitude_range,
  drop constraint if exists orders_coordinates_pair;

alter table public.orders
  add constraint orders_latitude_range check (latitude is null or latitude between -90 and 90),
  add constraint orders_longitude_range check (longitude is null or longitude between -180 and 180),
  add constraint orders_coordinates_pair check ((latitude is null) = (longitude is null));
