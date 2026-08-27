alter table house_orders add column if not exists paid boolean not null default false;
alter table house_orders add column if not exists paid_at timestamptz;
