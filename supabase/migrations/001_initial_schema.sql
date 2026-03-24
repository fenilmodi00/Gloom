-- Enable UUID
create extension if not exists "uuid-ossp";

-- Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar_url text,
  body_photo_url text,
  skin_tone text,
  style_tags text[] default '{}',
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users own their profile"
  on profiles for all using (auth.uid() = id);

-- Wardrobe Items
create table wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  image_url text not null,
  cutout_url text,
  category text not null
    check (category in ('tops','bottoms','fullbody','outerwear','shoes','bags','accessories')),
  sub_category text,
  colors text[] default '{}',
  style_tags text[] default '{}',
  occasion_tags text[] default '{}',
  fabric_guess text,
  created_at timestamptz default now()
);
alter table wardrobe_items enable row level security;
create policy "Users own their wardrobe"
  on wardrobe_items for all using (auth.uid() = user_id);
create index on wardrobe_items(user_id, category);

-- Outfits
create table outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  item_ids uuid[] default '{}',
  occasion text,
  vibe text,
  color_reasoning text,
  ai_score float default 0.0,
  cover_image_url text,
  created_at timestamptz default now()
);
alter table outfits enable row level security;
create policy "Users own their outfits"
  on outfits for all using (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public)
  values ('wardrobe-images', 'wardrobe-images', true);
create policy "Users upload their own images"
  on storage.objects for insert
  with check (auth.uid()::text = (storage.foldername(name))[1]);
create policy "Public read wardrobe images"
  on storage.objects for select using (bucket_id = 'wardrobe-images');
