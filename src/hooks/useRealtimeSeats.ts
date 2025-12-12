import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Seat } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface UseRealtimeSeatsOptions {
  showId: string;
  onSeatUpdate: (updatedSeat: Seat) => void;
  onSeatsRefresh?: () => void;
}

export const useRealtimeSeats = ({ showId, onSeatUpdate, onSeatsRefresh }: UseRealtimeSeatsOptions) => {
  const { toast } = useToast();

  const handleSeatChange = useCallback(
    (payload: { new: Seat; old: Seat; eventType: string }) => {
      console.log('Realtime seat update:', payload);
      
      if (payload.eventType === 'UPDATE' && payload.new.show_id === showId) {
        const oldSeat = payload.old;
        const newSeat = payload.new;
        
        // Notify if a seat was just booked by someone else
        if (!oldSeat.is_booked && newSeat.is_booked) {
          toast({
            title: 'Seat just booked',
            description: `Seat ${newSeat.seat_number} was booked by another user.`,
            variant: 'destructive',
          });
        }
        
        onSeatUpdate(newSeat);
      }
    },
    [showId, onSeatUpdate, toast]
  );

  useEffect(() => {
    if (!showId) return;

    console.log('Setting up realtime subscription for show:', showId);

    const channel = supabase
      .channel(`seats-${showId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `show_id=eq.${showId}`,
        },
        (payload) => {
          handleSeatChange({
            new: payload.new as Seat,
            old: payload.old as Seat,
            eventType: payload.eventType,
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [showId, handleSeatChange]);
};
