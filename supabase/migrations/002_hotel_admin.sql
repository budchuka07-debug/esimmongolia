-- Hotel admin booking channel — extend travel_requests
-- Apply after schema.sql

alter table travel_requests drop constraint if exists travel_requests_status_check;

alter table travel_requests add column if not exists city_id text;
alter table travel_requests add column if not exists hotel_official_name text;
alter table travel_requests add column if not exists hotel_id text;
alter table travel_requests add column if not exists room_type text;
alter table travel_requests add column if not exists check_in date;
alter table travel_requests add column if not exists check_out date;
alter table travel_requests add column if not exists guest_count int;
alter table travel_requests add column if not exists selected_item text;
alter table travel_requests add column if not exists supplier_internal jsonb;
alter table travel_requests add column if not exists availability_status text
  check (availability_status in ('pending','available','sold_out'));
alter table travel_requests add column if not exists internal_notes text;
alter table travel_requests add column if not exists voucher_url text;
alter table travel_requests add column if not exists voucher_sent_at timestamptz;
alter table travel_requests add column if not exists last_checked_at timestamptz;

alter table travel_requests add constraint travel_requests_status_check
  check (status in (
    'new','quoted','awaiting_payment','paid','processing',
    'booked','completed','cancelled','sold_out'
  ));

create index if not exists idx_travel_requests_city on travel_requests(city_id);
create index if not exists idx_travel_requests_hotel on travel_requests(hotel_id);
