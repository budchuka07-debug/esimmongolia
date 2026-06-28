-- eSIM Mongolia — demo seed (run after schema.sql on esimmongolia project)
-- Idempotent: uses ON CONFLICT DO NOTHING where possible

-- Countries
insert into esm_countries (iso_code, slug, name_mn, name_en, name_local, flag_emoji, currency, is_featured, active, sort_order)
values
  ('MN', 'mongolia', 'Монгол', 'Mongolia', 'Mongolia', '🇲🇳', 'MNT', false, true, 0),
  ('CN', 'china', 'Хятад', 'China', '中国', '🇨🇳', 'CNY', true, true, 1),
  ('TH', 'thailand', 'Тайланд', 'Thailand', 'ประเทศไทย', '🇹🇭', 'THB', true, true, 2),
  ('VN', 'vietnam', 'Вьетнам', 'Vietnam', 'Việt Nam', '🇻🇳', 'VND', true, true, 3),
  ('JP', 'japan', 'Япон', 'Japan', '日本', '🇯🇵', 'JPY', true, true, 4),
  ('KR', 'korea', 'Солонгос', 'South Korea', '대한민국', '🇰🇷', 'KRW', true, true, 5)
on conflict (iso_code) do nothing;

-- Cities (China + UB)
insert into esm_cities (country_id, slug, name_mn, name_en, name_local, aliases, airport_codes, lat, lng, hero_image, transport_mn, budget_hint_mn, map_url, route_url, popular, active, sort_order)
select c.id, v.slug, v.name_mn, v.name_en, v.name_local, v.aliases::jsonb, v.airport_codes::jsonb, v.lat, v.lng, v.hero_image, v.transport_mn, v.budget_hint_mn, v.map_url, v.route_url, v.popular, true, v.sort_order
from esm_countries c
cross join (values
  ('beijing', 'Бээжин', 'Beijing', '北京', '["Бээжин","Peking","PEK"]', '["PEK","PKX"]', 39.9042, 116.4074, '/images/routes/china/forbidden-city.jpg', 'Метро + Didi', '~800–1500 юань/өдөр', 'https://maps.google.com/?q=Beijing', '/beijing-route.html', true, 1),
  ('shanghai', 'Шанхай', 'Shanghai', '上海', '["Шанхай","PVG"]', '["PVG","SHA"]', 31.2304, 121.4737, '/images/routes/china/shanghai-bund.jpg', 'Метро + Alipay', '~900–1600 юань/өдөр', 'https://maps.google.com/?q=Shanghai', '/shanghai-route.html', true, 2),
  ('hohhot', 'Хөх хот', 'Hohhot', '呼和浩特', '["Hohhot","HET"]', '["HET"]', 40.8424, 111.7519, '/images/routes/china/hohhot.jpg', 'Галт тэрэг + такси', '~400–800 юань/өдөр', 'https://maps.google.com/?q=Hohhot', '/hohhot-route.html', true, 3),
  ('guangzhou', 'Гуанжоу', 'Guangzhou', '广州', '["Guangzhou","CAN"]', '["CAN"]', 23.1291, 113.2644, '/images/routes/china/canton-tower.jpg', 'Метро', '~700–1200 юань/өдөр', 'https://maps.google.com/?q=Guangzhou', '/china-route.html', true, 4),
  ('erenhot', 'Эрээн', 'Erenhot', '二连浩特', '["Erenhot","Erlian"]', '[]', 43.653, 111.976, '/images/routes/china/erenhot.jpg', 'Автобус + галт тэрэг', '~300–600 юань/өдөр', 'https://maps.google.com/?q=Erenhot', '/china-route.html', false, 5)
) as v(slug, name_mn, name_en, name_local, aliases, airport_codes, lat, lng, hero_image, transport_mn, budget_hint_mn, map_url, route_url, popular, sort_order)
where c.iso_code = 'CN'
on conflict (country_id, slug) do nothing;

insert into esm_cities (country_id, slug, name_mn, name_en, name_local, aliases, airport_codes, popular, active, sort_order)
select c.id, 'ulanbaatar', 'Улаанбаатар', 'Ulaanbaatar', 'Ulaanbaatar', '["UB","UBN"]'::jsonb, '["UBN","CHINGGIS"]'::jsonb, true, true, 0
from esm_countries c where c.iso_code = 'MN'
on conflict (country_id, slug) do nothing;

insert into esm_cities (country_id, slug, name_mn, name_en, name_local, aliases, airport_codes, popular, active, sort_order)
select c.id, 'bangkok', 'Бангкок', 'Bangkok', 'กรุงเทพ', '["Bangkok","BKK"]'::jsonb, '["BKK","DMK"]'::jsonb, true, true, 1
from esm_countries c where c.iso_code = 'TH'
on conflict (country_id, slug) do nothing;

insert into esm_cities (country_id, slug, name_mn, name_en, name_local, aliases, airport_codes, popular, active, sort_order)
select c.id, 'da_nang', 'Дананг', 'Da Nang', 'Đà Nẵng', '["Da Nang","DAD"]'::jsonb, '["DAD"]'::jsonb, true, true, 1
from esm_countries c where c.iso_code = 'VN'
on conflict (country_id, slug) do nothing;

-- Hotels
insert into esm_hotels (country_id, city_id, official_name, name_mn_optional, stars, district, area_name, address, latitude, longitude, description_mn, cover_image, images, amenities, nearby_metro, final_price_mnt, active)
select co.id, ci.id, h.official_name, h.name_mn, h.stars, h.district, h.area_name, h.address, h.lat, h.lng, h.description_mn, h.cover_image, h.images::jsonb, h.amenities::jsonb, h.metro, h.price_mnt, true
from (values
  ('beijing', 'Beijing Grand Hotel', 'Бээжин их буудал', 5, 'Dongcheng', 'Wangfujing', 'Wangfujing St', 39.9142, 116.4174, 'Төв байрлал, метрон ойрхон 5 одтой буудал.', '/images/hotels/exterior-03.jpg', '["/images/hotels/lobby-03.jpg"]', '["wifi","breakfast","gym","metro_nearby"]', 'Wangfujing Station', 485000),
  ('shanghai', 'Shanghai Bund View Hotel', 'Шанхай Bund буудал', 4, 'Huangpu', 'The Bund', 'Nanjing Rd', 31.2397, 121.4900, 'The Bund харагдац, метро ойр.', '/images/hotels/exterior-01.jpg', '["/images/hotels/lobby-01.jpg"]', '["wifi","breakfast","metro_nearby"]', 'East Nanjing Road', 520000),
  ('hohhot', 'Hohhot Central Hotel', 'Хөх хот төв буудал', 4, 'Xincheng', 'City Center', 'Xinhua Square', 40.810, 111.652, 'Хөх хотын төв, галт тэрэгний буудал ойр.', '/images/hotels/exterior-02.jpg', '["/images/hotels/lobby-02.jpg"]', '["wifi","breakfast"]', 'Hohhot Station', 320000),
  ('shanghai', 'Pudong Metro Hotel', 'Pudong метро буудал', 3, 'Pudong', 'Lujiazui', 'Century Ave', 31.235, 121.505, 'Lujiazui skyline ойр, метро 3 мин.', '/images/hotels/exterior-04.jpg', '[]', '["wifi","metro_nearby"]', 'Lujiazui', 385000),
  ('beijing', 'Beijing Capital Inn', 'Capital Inn', 3, 'Chaoyang', 'Sanlitun', 'Sanlitun Rd', 39.936, 116.455, 'Залуусын district, метро ойр.', '/images/hotels/exterior-05.jpg', '[]', '["wifi"]', 'Tuanjiehu', 295000)
) as h(city_slug, official_name, name_mn, stars, district, area_name, address, lat, lng, description_mn, cover_image, images, amenities, metro, price_mnt)
join esm_cities ci on ci.slug = h.city_slug
join esm_countries co on co.id = ci.country_id;

-- Flights
insert into esm_flights (from_city_id, to_city_id, transfer_city_id, airline, route_type, departure_time, arrival_time, duration, baggage_note_mn, final_price_mnt, data_confidence, active)
select f.from_id, f.to_id, f.transfer_id, f.airline, f.route_type, f.dep, f.arr, f.dur, f.bag, f.price, f.conf, true
from (
  select (select id from esm_cities where slug='ulanbaatar') as from_id,
         (select id from esm_cities where slug='beijing') as to_id,
         null::uuid as transfer_id,
         'MIAT'::text as airline, 'direct'::text as route_type,
         '08:30'::text as dep, '10:45'::text as arr, '2ц 15мин'::text as dur,
         '23kg багтаамж'::text as bag, 1850000 as price, 'high'::text as conf
  union all
  select (select id from esm_cities where slug='ulanbaatar'),
         (select id from esm_cities where slug='shanghai'),
         (select id from esm_cities where slug='beijing'),
         'Air China', 'transfer', '06:00', '14:30', '8ц 30мин', '20kg багтаамж', 2100000, 'medium'
) f;

-- Transport routes
insert into esm_transport_routes (transport_type, route_category, from_city_id, to_city_id, train_no, duration, price_cny_min, price_cny_max, class_prices, final_price_mnt_from, source_name, source_url, data_confidence, active)
select 'train', 'direct', (select id from esm_cities where slug='beijing'), (select id from esm_cities where slug='shanghai'),
  'G1', '4ц 28мин', 553, 933, '{"second_class":553,"first_class":933,"business_class":1748}'::jsonb, 185000, '12306', 'https://www.12306.cn', 'high', true
union all
select 'train', 'direct', (select id from esm_cities where slug='hohhot'), (select id from esm_cities where slug='beijing'),
  'D6752', '2ц 15мин', 187, 281, '{"second_class":187,"first_class":281,"hard_seat":128}'::jsonb, 95000, '12306', 'https://www.12306.cn', 'medium', true
union all
select 'bus', 'direct', (select id from esm_cities where slug='erenhot'), (select id from esm_cities where slug='beijing'),
  null, '8–10 цаг', 180, 280, '{}'::jsonb, 120000, 'Erenhot station', '', 'estimated', true;

-- Attractions
insert into esm_attractions (city_id, name_mn, name_en, description_mn, original_price, currency, final_price_mnt, active, sort_order)
select ci.id, a.name_mn, a.name_en, a.desc_mn, a.price, 'CNY', a.price_mnt, true, a.ord
from esm_cities ci
join (values
  ('shanghai', 'Shanghai Disneyland', 'Disneyland', '1 өдрийн тасалбар — урьдчилж захиалах', 499, 270000, 1),
  ('shanghai', 'The Bund walking tour', 'The Bund', 'Guided evening tour', 120, 65000, 2),
  ('beijing', 'Great Wall (Mutianyu)', 'Great Wall', 'Тээвэр + хоол багтсан', 280, 152000, 1),
  ('beijing', 'Forbidden City ticket', 'Forbidden City', 'Өдрийн тасалбар', 60, 33000, 2),
  ('hohhot', 'Grassland day tour', 'Grassland', '1 өдрийн аялал', 350, 190000, 1)
) as a(city_slug, name_mn, name_en, desc_mn, price, price_mnt, ord) on ci.slug = a.city_slug;
