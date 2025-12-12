-- Create enum for booking status
CREATE TYPE public.booking_status AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- Create shows/trips table
CREATE TABLE public.shows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_seats INTEGER NOT NULL CHECK (total_seats > 0),
  available_seats INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT available_seats_valid CHECK (available_seats >= 0 AND available_seats <= total_seats)
);

-- Create seats table for tracking individual seats
CREATE TABLE public.seats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(show_id, seat_number)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  seat_ids UUID[] NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Shows policies (public read, admin write)
CREATE POLICY "Anyone can view shows" ON public.shows FOR SELECT USING (true);
CREATE POLICY "Admins can insert shows" ON public.shows FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update shows" ON public.shows FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Seats policies (public read, system manages)
CREATE POLICY "Anyone can view seats" ON public.seats FOR SELECT USING (true);
CREATE POLICY "Admins can insert seats" ON public.seats FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Authenticated users can update seats" ON public.seats FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Bookings policies
CREATE POLICY "Users can view their bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Profiles policies
CREATE POLICY "Users can view their profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for timestamp updates
CREATE TRIGGER update_shows_updated_at
  BEFORE UPDATE ON public.shows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to book seats with concurrency handling using row-level locking
CREATE OR REPLACE FUNCTION public.book_seats(
  p_show_id UUID,
  p_user_id UUID,
  p_seat_ids UUID[]
)
RETURNS TABLE(booking_id UUID, status public.booking_status)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_booking_id UUID;
  v_locked_count INTEGER;
  v_seat_count INTEGER;
BEGIN
  -- Get the count of seats to book
  v_seat_count := array_length(p_seat_ids, 1);
  
  -- Lock the seats for update (prevents race conditions)
  SELECT COUNT(*) INTO v_locked_count
  FROM public.seats s
  WHERE s.id = ANY(p_seat_ids)
    AND s.show_id = p_show_id
    AND s.is_booked = false
  FOR UPDATE SKIP LOCKED;
  
  -- Check if all requested seats are available
  IF v_locked_count < v_seat_count THEN
    -- Some seats already booked, return failed status
    INSERT INTO public.bookings (show_id, user_id, seat_ids, status, expires_at)
    VALUES (p_show_id, p_user_id, p_seat_ids, 'FAILED', NULL)
    RETURNING id INTO v_booking_id;
    
    RETURN QUERY SELECT v_booking_id, 'FAILED'::public.booking_status;
    RETURN;
  END IF;
  
  -- Mark seats as booked
  UPDATE public.seats
  SET is_booked = true
  WHERE id = ANY(p_seat_ids)
    AND show_id = p_show_id;
  
  -- Update available seats count
  UPDATE public.shows
  SET available_seats = available_seats - v_seat_count
  WHERE id = p_show_id;
  
  -- Create confirmed booking
  INSERT INTO public.bookings (show_id, user_id, seat_ids, status)
  VALUES (p_show_id, p_user_id, p_seat_ids, 'CONFIRMED')
  RETURNING id INTO v_booking_id;
  
  RETURN QUERY SELECT v_booking_id, 'CONFIRMED'::public.booking_status;
END;
$$;

-- Function to create a show with seats
CREATE OR REPLACE FUNCTION public.create_show_with_seats(
  p_name TEXT,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_total_seats INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_show_id UUID;
  i INTEGER;
BEGIN
  -- Create the show
  INSERT INTO public.shows (name, start_time, total_seats, available_seats)
  VALUES (p_name, p_start_time, p_total_seats, p_total_seats)
  RETURNING id INTO v_show_id;
  
  -- Create seats for the show
  FOR i IN 1..p_total_seats LOOP
    INSERT INTO public.seats (show_id, seat_number)
    VALUES (v_show_id, i);
  END LOOP;
  
  RETURN v_show_id;
END;
$$;

-- Function to expire pending bookings after 2 minutes
CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  FOR v_booking IN 
    SELECT id, show_id, seat_ids
    FROM public.bookings
    WHERE status = 'PENDING'
      AND created_at < NOW() - INTERVAL '2 minutes'
  LOOP
    -- Mark booking as failed
    UPDATE public.bookings
    SET status = 'FAILED'
    WHERE id = v_booking.id;
    
    -- Release the seats
    UPDATE public.seats
    SET is_booked = false
    WHERE id = ANY(v_booking.seat_ids);
    
    -- Update available seats count
    UPDATE public.shows
    SET available_seats = available_seats + array_length(v_booking.seat_ids, 1)
    WHERE id = v_booking.show_id;
  END LOOP;
END;
$$;