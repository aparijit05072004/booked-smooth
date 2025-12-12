import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import Layout from '@/components/layout/Layout';
import BookingStatusBadge from '@/components/booking/BookingStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, Ticket, Users } from 'lucide-react';

const MyBookings = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { bookings, isLoading, error } = useBooking();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Bookings - TicketFlow</title>
        <meta name="description" content="View and manage your ticket bookings." />
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

          <h1 className="text-3xl font-bold uppercase mb-8 flex items-center gap-3">
            <Ticket className="h-8 w-8" />
            My Bookings
          </h1>

          {error && (
            <div className="border-2 border-destructive p-4 mb-6 text-destructive">
              {error}
            </div>
          )}

          {bookings.length === 0 ? (
            <Card className="border-2 border-foreground">
              <CardContent className="p-8 text-center">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-bold mb-2">No bookings yet</h2>
                <p className="text-muted-foreground mb-4">
                  You haven't made any bookings yet. Browse available shows to get started.
                </p>
                <Link to="/">
                  <Button>Browse Shows</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const show = booking.shows;
                const startDate = show ? new Date(show.start_time) : null;

                return (
                  <Card key={booking.id} className="border-2 border-foreground">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg uppercase">
                          {show?.name || 'Unknown Show'}
                        </CardTitle>
                        <BookingStatusBadge status={booking.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2 text-sm">
                          {startDate && (
                            <>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{format(startDate, 'h:mm a')}</span>
                              </div>
                            </>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.seat_ids.length} seat(s)</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Booking ID:</p>
                          <code className="text-xs bg-muted px-2 py-1 border border-foreground">
                            {booking.id.slice(0, 8)}
                          </code>
                          <p className="text-sm text-muted-foreground mt-2">
                            Booked on {format(new Date(booking.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default MyBookings;
