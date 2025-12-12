import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { useShows } from '@/contexts/ShowsContext';
import Layout from '@/components/layout/Layout';
import SeatGrid from '@/components/booking/SeatGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeSeats } from '@/hooks/useRealtimeSeats';
import { Show, Seat } from '@/types';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, Loader2, Radio, Ticket, Users } from 'lucide-react';

const Booking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createBooking } = useBooking();
  const { refetchShows } = useShows();
  const { toast } = useToast();

  const [show, setShow] = useState<Show | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle realtime seat updates
  const handleSeatUpdate = useCallback((updatedSeat: Seat) => {
    setSeats((prev) =>
      prev.map((seat) => (seat.id === updatedSeat.id ? updatedSeat : seat))
    );
    
    // Remove from selection if the seat was booked by someone else
    if (updatedSeat.is_booked) {
      setSelectedSeats((prev) => prev.filter((id) => id !== updatedSeat.id));
    }
  }, []);

  // Subscribe to realtime seat updates
  useRealtimeSeats({
    showId: id || '',
    onSeatUpdate: handleSeatUpdate,
  });

  const fetchShowAndSeats = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const [showResult, seatsResult] = await Promise.all([
        supabase.from('shows').select('*').eq('id', id).single(),
        supabase.from('seats').select('*').eq('show_id', id).order('seat_number'),
      ]);

      if (showResult.error) throw showResult.error;
      if (seatsResult.error) throw seatsResult.error;

      setShow(showResult.data as Show);
      setSeats(seatsResult.data as Seat[]);
    } catch (err) {
      console.error('Error fetching show:', err);
      setError(err instanceof Error ? err.message : 'Failed to load show');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShowAndSeats();
  }, [fetchShowAndSeats]);

  const handleSeatToggle = (seatId: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
  };

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to book seats.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (selectedSeats.length === 0) {
      toast({
        title: 'No seats selected',
        description: 'Please select at least one seat to book.',
        variant: 'destructive',
      });
      return;
    }

    setIsBooking(true);
    const result = await createBooking(id!, selectedSeats);
    setIsBooking(false);

    if (result.success) {
      toast({
        title: 'Booking confirmed!',
        description: `Successfully booked ${selectedSeats.length} seat(s).`,
      });
      await refetchShows();
      navigate('/my-bookings');
    } else {
      toast({
        title: 'Booking failed',
        description: result.error || 'Some seats may have been booked by another user.',
        variant: 'destructive',
      });
      // Refresh seats to show updated availability
      await fetchShowAndSeats();
      setSelectedSeats([]);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !show) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="border-2 border-destructive p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Failed to load show</h2>
            <p className="text-muted-foreground mb-4">{error || 'Show not found'}</p>
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shows
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const startDate = new Date(show.start_time);
  const selectedSeatNumbers = seats
    .filter((s) => selectedSeats.includes(s.id))
    .map((s) => s.seat_number)
    .sort((a, b) => a - b);

  return (
    <>
      <Helmet>
        <title>{show.name} - Book Tickets | TicketFlow</title>
        <meta
          name="description"
          content={`Book tickets for ${show.name} on ${format(startDate, 'MMMM d, yyyy')}`}
        />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shows
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold uppercase">{show.name}</h1>
            <Badge variant="outline" className="gap-1 animate-pulse">
              <Radio className="h-3 w-3 text-chart-2" />
              Live
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-8">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(startDate, 'EEEE, MMMM d, yyyy')}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(startDate, 'h:mm a')}
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {show.available_seats} seats available
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Seat Grid */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Select Your Seats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SeatGrid
                    seats={seats}
                    selectedSeats={selectedSeats}
                    onSeatToggle={handleSeatToggle}
                    disabled={isBooking}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary */}
            <div>
              <Card className="border-2 border-foreground sticky top-4">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-b-2 border-foreground pb-4">
                    <h3 className="font-bold uppercase">{show.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(startDate, 'MMM d, yyyy')} at {format(startDate, 'h:mm a')}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Selected Seats:</p>
                    {selectedSeats.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedSeatNumbers.map((num) => (
                          <span
                            key={num}
                            className="inline-flex items-center justify-center w-8 h-8 border-2 border-foreground bg-primary text-primary-foreground text-sm font-bold"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">No seats selected</p>
                    )}
                  </div>

                  <div className="border-t-2 border-foreground pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold">Total Seats:</span>
                      <span className="text-xl font-bold">{selectedSeats.length}</span>
                    </div>

                    {!user && (
                      <p className="text-sm text-muted-foreground mb-4 p-3 border-2 border-foreground bg-muted">
                        Please sign in to complete your booking.
                      </p>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleBooking}
                      disabled={selectedSeats.length === 0 || isBooking}
                    >
                      {isBooking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {user ? 'Confirm Booking' : 'Sign In to Book'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Booking;
