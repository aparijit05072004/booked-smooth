import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Show, ShowsContextType } from '@/types';
import { useRealtimeShows } from '@/hooks/useRealtimeShows';

const ShowsContext = createContext<ShowsContextType | undefined>(undefined);

export const useShows = () => {
  const context = useContext(ShowsContext);
  if (context === undefined) {
    throw new Error('useShows must be used within a ShowsProvider');
  }
  return context;
};

export const ShowsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShows = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('shows')
        .select('*')
        .order('start_time', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setShows(data as Show[]);
    } catch (err) {
      console.error('Error fetching shows:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch shows');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle realtime show updates
  const handleShowUpdate = useCallback((updatedShow: Show) => {
    setShows((prev) =>
      prev.map((show) => (show.id === updatedShow.id ? updatedShow : show))
    );
  }, []);

  const handleShowInsert = useCallback((newShow: Show) => {
    setShows((prev) => [...prev, newShow].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    ));
  }, []);

  // Subscribe to realtime updates
  useRealtimeShows({
    onShowUpdate: handleShowUpdate,
    onShowInsert: handleShowInsert,
  });

  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  const value: ShowsContextType = {
    shows,
    isLoading,
    error,
    refetchShows: fetchShows,
  };

  return <ShowsContext.Provider value={value}>{children}</ShowsContext.Provider>;
};
