-- Enable realtime for seats table
ALTER TABLE public.seats REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seats;

-- Enable realtime for shows table (for available_seats updates)
ALTER TABLE public.shows REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shows;