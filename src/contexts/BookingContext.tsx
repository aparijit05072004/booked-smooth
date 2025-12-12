import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Booking, BookingContextType, BookingStatus } from '@/types';
import { useAuth } from './AuthContext';

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) {
      setBookings([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*, shows(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setBookings(data as Booking[]);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = async (showId: string, seatIds: string[]) => {
    if (!user) {
      return { success: false, error: 'You must be logged in to book seats' };
    }

    try {
      const { data, error: bookError } = await supabase
        .rpc('book_seats', {
          p_show_id: showId,
          p_user_id: user.id,
          p_seat_ids: seatIds,
        });

      if (bookError) {
        throw bookError;
      }

      const result = data?.[0];
      
      if (!result) {
        throw new Error('No booking result returned');
      }

      await fetchBookings();

      return {
        success: result.status === 'CONFIRMED',
        bookingId: result.booking_id,
        status: result.status as BookingStatus,
        error: result.status === 'FAILED' ? 'Some seats were already booked' : undefined,
      };
    } catch (err) {
      console.error('Error creating booking:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create booking',
      };
    }
  };

  const value: BookingContextType = {
    bookings,
    isLoading,
    error,
    createBooking,
    refetchBookings: fetchBookings,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};
