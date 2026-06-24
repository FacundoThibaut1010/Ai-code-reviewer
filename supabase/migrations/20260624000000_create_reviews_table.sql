-- Create reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  repo_name text not null,
  repo_owner text not null,
  pr_number integer not null,
  pr_title text not null,
  pr_url text not null,
  review_content jsonb not null,
  score integer not null check (score >= 1 and score <= 10),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.reviews enable row level security;

-- Policies for RLS
create policy "Users can read their own reviews" on public.reviews
  for select using (auth.uid() = user_id);

create policy "Users can insert their own reviews" on public.reviews
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own reviews" on public.reviews
  for delete using (auth.uid() = user_id);

-- Create indexes for performance
create index if not exists reviews_user_id_idx on public.reviews(user_id);
create index if not exists reviews_repo_owner_repo_name_idx on public.reviews(repo_owner, repo_name);
create index if not exists reviews_created_at_idx on public.reviews(created_at desc);
