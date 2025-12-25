-- Create the storage bucket 'event-covers' if it doesn't exist
insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do nothing;

-- Set up RLS policies for the bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'event-covers' );

create policy "Authenticated User Upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'event-covers' AND auth.uid() = owner );

create policy "Authenticated User Update"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'event-covers' AND auth.uid() = owner );

create policy "Authenticated User Delete"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'event-covers' AND auth.uid() = owner );
