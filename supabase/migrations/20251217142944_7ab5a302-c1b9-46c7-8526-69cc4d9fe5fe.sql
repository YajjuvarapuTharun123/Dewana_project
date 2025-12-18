-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  host_names TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  venue_name TEXT,
  venue_address TEXT,
  venue_lat DECIMAL,
  venue_lng DECIMAL,
  parking_notes TEXT,
  dress_code TEXT,
  cover_image_url TEXT,
  design_template TEXT DEFAULT 'minimal',
  theme_color TEXT DEFAULT '#FF6B35',
  gallery_link TEXT,
  youtube_link TEXT,
  instagram_handle TEXT,
  facebook_link TEXT,
  twitter_handle TEXT,
  custom_social_links JSONB DEFAULT '[]'::jsonb,
  rsvp_enabled BOOLEAN DEFAULT true,
  rsvp_deadline TIMESTAMP WITH TIME ZONE,
  allow_plus_ones BOOLEAN DEFAULT true,
  collect_meal_prefs BOOLEAN DEFAULT true,
  custom_questions JSONB DEFAULT '[]'::jsonb,
  qr_code_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'past')),
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Users can view their own events" ON public.events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published events" ON public.events
  FOR SELECT USING (status = 'published');

CREATE POLICY "Users can insert their own events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON public.events
  FOR DELETE USING (auth.uid() = user_id);

-- Create sub_events table
CREATE TABLE public.sub_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location_name TEXT,
  location_address TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sub_events
ALTER TABLE public.sub_events ENABLE ROW LEVEL SECURITY;

-- Sub events policies
CREATE POLICY "Users can manage sub_events for their events" ON public.sub_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = sub_events.event_id AND events.user_id = auth.uid())
  );

CREATE POLICY "Anyone can view sub_events for published events" ON public.sub_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = sub_events.event_id AND events.status = 'published')
  );

-- Create rsvps table
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  guest_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('yes', 'no', 'maybe', 'pending')),
  num_guests INTEGER DEFAULT 1,
  meal_preferences TEXT[],
  custom_responses JSONB DEFAULT '{}'::jsonb,
  message TEXT,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rsvps
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- RSVP policies
CREATE POLICY "Event owners can view all RSVPs" ON public.rsvps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = rsvps.event_id AND events.user_id = auth.uid())
  );

CREATE POLICY "Anyone can submit RSVP to published events" ON public.rsvps
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = rsvps.event_id AND events.status = 'published')
  );

CREATE POLICY "Event owners can update RSVPs" ON public.rsvps
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = rsvps.event_id AND events.user_id = auth.uid())
  );

-- Create event_views table for analytics
CREATE TABLE public.event_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  referrer TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on event_views
ALTER TABLE public.event_views ENABLE ROW LEVEL SECURITY;

-- Event views policies
CREATE POLICY "Event owners can view analytics" ON public.event_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_views.event_id AND events.user_id = auth.uid())
  );

CREATE POLICY "Anyone can log views for published events" ON public.event_views
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = event_views.event_id AND events.status = 'published')
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (new.id, new.raw_user_meta_data ->> 'name');
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate unique slug
CREATE OR REPLACE FUNCTION public.generate_unique_slug(event_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(event_name, '[^a-zA-Z0-9]', '-', 'g'));
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.events WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;