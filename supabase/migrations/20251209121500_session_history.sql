-- Create session_history table
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  session_token text, 
  login_at timestamptz default now() not null,
  logout_at timestamptz,
  device_info text,
  ip_address text,
  location text,
  browser text,
  os text
);

-- RLS
alter table public.session_history enable row level security;

create policy "Users can view their own session history"
  on public.session_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own session history"
  on public.session_history for insert
  with check (auth.uid() = user_id);

-- Optional: Allow admins to view all (if using role based access)
-- create policy "Admins can view all session history" ...
