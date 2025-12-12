export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface Show {
  id: string;
  name: string;
  start_time: string;
  total_seats: number;
  available_seats: number;
  created_at: string;
  updated_at: string;
}

export interface Seat {
  id: string;
  show_id: string;
  seat_number: number;
  is_booked: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  show_id: string;
  user_id: string;
  seat_ids: string[];
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  shows?: Show;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: import('@supabase/supabase-js').User | null;
  session: import('@supabase/supabase-js').Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export interface ShowsContextType {
  shows: Show[];
  isLoading: boolean;
  error: string | null;
  refetchShows: () => Promise<void>;
}

export interface BookingContextType {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  createBooking: (showId: string, seatIds: string[]) => Promise<{ success: boolean; bookingId?: string; status?: BookingStatus; error?: string }>;
  refetchBookings: () => Promise<void>;
}
