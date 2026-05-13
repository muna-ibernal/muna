-- ============================================================
-- Muna — Row Level Security (RLS)
-- ============================================================
-- Ejecutar después de schema.sql.
-- ============================================================

-- ============================================================
-- PROFILES
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_delete_self" on public.profiles;
create policy "profiles_delete_self" on public.profiles
  for delete using (auth.uid() = id);

-- ============================================================
-- DIRECTORY
-- ============================================================
alter table public.directory_items enable row level security;

drop policy if exists "directory_select_all" on public.directory_items;
create policy "directory_select_all" on public.directory_items
  for select using (true);

drop policy if exists "directory_insert_auth" on public.directory_items;
create policy "directory_insert_auth" on public.directory_items
  for insert with check (auth.uid() is not null);

drop policy if exists "directory_update_owner" on public.directory_items;
create policy "directory_update_owner" on public.directory_items
  for update using (auth.uid() = owner_user_id or auth.uid() = claimed_by_user_id);

drop policy if exists "directory_delete_owner" on public.directory_items;
create policy "directory_delete_owner" on public.directory_items
  for delete using (auth.uid() = owner_user_id);

-- ============================================================
-- PRODUCTS
-- ============================================================
alter table public.products enable row level security;

drop policy if exists "products_select_all" on public.products;
create policy "products_select_all" on public.products for select using (true);

drop policy if exists "products_insert_auth" on public.products;
create policy "products_insert_auth" on public.products
  for insert with check (auth.uid() is not null);

drop policy if exists "products_update_owner" on public.products;
create policy "products_update_owner" on public.products
  for update using (auth.uid() = owner_user_id);

drop policy if exists "products_delete_owner" on public.products;
create policy "products_delete_owner" on public.products
  for delete using (auth.uid() = owner_user_id);

-- ============================================================
-- COMMUNITY
-- ============================================================
alter table public.community_items enable row level security;

drop policy if exists "community_select_all" on public.community_items;
create policy "community_select_all" on public.community_items for select using (true);

drop policy if exists "community_insert_auth" on public.community_items;
create policy "community_insert_auth" on public.community_items
  for insert with check (auth.uid() is not null);

drop policy if exists "community_update_owner" on public.community_items;
create policy "community_update_owner" on public.community_items
  for update using (auth.uid() = owner_user_id);

drop policy if exists "community_delete_owner" on public.community_items;
create policy "community_delete_owner" on public.community_items
  for delete using (auth.uid() = owner_user_id);

-- ============================================================
-- EVENTS
-- ============================================================
alter table public.events enable row level security;

drop policy if exists "events_select_all" on public.events;
create policy "events_select_all" on public.events for select using (true);

drop policy if exists "events_insert_auth" on public.events;
create policy "events_insert_auth" on public.events
  for insert with check (auth.uid() is not null);

drop policy if exists "events_update_owner" on public.events;
create policy "events_update_owner" on public.events
  for update using (auth.uid() = owner_user_id);

drop policy if exists "events_delete_owner" on public.events;
create policy "events_delete_owner" on public.events
  for delete using (auth.uid() = owner_user_id);

-- ============================================================
-- SECONDHAND
-- ============================================================
alter table public.secondhand_items enable row level security;

drop policy if exists "secondhand_select_all" on public.secondhand_items;
create policy "secondhand_select_all" on public.secondhand_items for select using (true);

drop policy if exists "secondhand_insert_auth" on public.secondhand_items;
create policy "secondhand_insert_auth" on public.secondhand_items
  for insert with check (auth.uid() is not null);

drop policy if exists "secondhand_update_owner" on public.secondhand_items;
create policy "secondhand_update_owner" on public.secondhand_items
  for update using (auth.uid() = owner_user_id);

drop policy if exists "secondhand_delete_owner" on public.secondhand_items;
create policy "secondhand_delete_owner" on public.secondhand_items
  for delete using (auth.uid() = owner_user_id);

-- ============================================================
-- REVIEWS
-- ============================================================
alter table public.reviews enable row level security;

drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews for select using (true);

drop policy if exists "reviews_insert_self" on public.reviews;
create policy "reviews_insert_self" on public.reviews
  for insert with check (auth.uid() = reviewer_user_id);

drop policy if exists "reviews_update_self" on public.reviews;
create policy "reviews_update_self" on public.reviews
  for update using (auth.uid() = reviewer_user_id);

drop policy if exists "reviews_delete_self" on public.reviews;
create policy "reviews_delete_self" on public.reviews
  for delete using (auth.uid() = reviewer_user_id);

-- ============================================================
-- FAVORITES
-- ============================================================
alter table public.favorites enable row level security;

drop policy if exists "favorites_select_self" on public.favorites;
create policy "favorites_select_self" on public.favorites
  for select using (auth.uid() = user_id);

drop policy if exists "favorites_insert_self" on public.favorites;
create policy "favorites_insert_self" on public.favorites
  for insert with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_self" on public.favorites;
create policy "favorites_delete_self" on public.favorites
  for delete using (auth.uid() = user_id);

-- ============================================================
-- COMMENTS
-- ============================================================
alter table public.comments enable row level security;

drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments for select using (true);

drop policy if exists "comments_insert_self" on public.comments;
create policy "comments_insert_self" on public.comments
  for insert with check (auth.uid() = author_user_id);

drop policy if exists "comments_delete_self" on public.comments;
create policy "comments_delete_self" on public.comments
  for delete using (auth.uid() = author_user_id);

-- ============================================================
-- CONVERSATIONS + MESSAGES
-- ============================================================
alter table public.conversations enable row level security;

drop policy if exists "conv_select_participant" on public.conversations;
create policy "conv_select_participant" on public.conversations
  for select using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "conv_insert_participant" on public.conversations;
create policy "conv_insert_participant" on public.conversations
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "conv_update_participant" on public.conversations;
create policy "conv_update_participant" on public.conversations
  for update using (auth.uid() = user_a or auth.uid() = user_b);

alter table public.messages enable row level security;

drop policy if exists "msg_select_participant" on public.messages;
create policy "msg_select_participant" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (auth.uid() = c.user_a or auth.uid() = c.user_b)
    )
  );

drop policy if exists "msg_insert_participant" on public.messages;
create policy "msg_insert_participant" on public.messages
  for insert with check (
    auth.uid() = sender_user_id and
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (auth.uid() = c.user_a or auth.uid() = c.user_b)
    )
  );

-- ============================================================
-- SUGGESTIONS
-- ============================================================
alter table public.suggestions enable row level security;

drop policy if exists "suggestions_insert_anyone" on public.suggestions;
create policy "suggestions_insert_anyone" on public.suggestions
  for insert with check (true);

drop policy if exists "suggestions_select_self" on public.suggestions;
create policy "suggestions_select_self" on public.suggestions
  for select using (auth.uid() = reporter_user_id);
