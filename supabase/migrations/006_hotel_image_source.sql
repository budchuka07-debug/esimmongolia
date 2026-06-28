-- Hotel image source tracking (placeholder vs official Cloudinary uploads)

alter table esm_hotels add column if not exists image_source text not null default 'placeholder'
  check (image_source in ('placeholder', 'official'));

comment on column esm_hotels.image_source is 'placeholder = MVP Cloudinary stock; official = real hotel upload';
