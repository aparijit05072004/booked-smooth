import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Show } from '@/types';

interface UseRealtimeShowsOptions {
  onShowUpdate: (updatedShow: Show) => void;
  onShowInsert?: (newShow: Show) => void;
}

export const useRealtimeShows = ({ onShowUpdate, onShowInsert }: UseRealtimeShowsOptions) => {
  const handleShowChange = useCallback(
    (payload: { new: Show; old?: Show; eventType: string }) => {
      console.log('Realtime show update:', payload);
      
      if (payload.eventType === 'UPDATE') {
        onShowUpdate(payload.new);
      } else if (payload.eventType === 'INSERT' && onShowInsert) {
        onShowInsert(payload.new);
      }
    },
    [onShowUpdate, onShowInsert]
  );

  useEffect(() => {
    console.log('Setting up realtime subscription for shows');

    const channel = supabase
      .channel('shows-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shows',
        },
        (payload) => {
          handleShowChange({
            new: payload.new as Show,
            old: payload.old as Show,
            eventType: payload.eventType,
          });
        }
      )
      .subscribe((status) => {
        console.log('Shows realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up shows realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [handleShowChange]);
};
