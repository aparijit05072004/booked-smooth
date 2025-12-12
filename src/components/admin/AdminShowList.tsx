import { useShows } from '@/contexts/ShowsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Calendar, Clock, Users, List } from 'lucide-react';

const AdminShowList = () => {
  const { shows, isLoading, error } = useShows();

  if (isLoading) {
    return (
      <Card className="border-2 border-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            All Shows
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border-2 border-foreground p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-destructive">
        <CardContent className="p-6 text-center text-destructive">
          Failed to load shows: {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-foreground">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          All Shows ({shows.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shows.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No shows created yet. Create your first show above.
          </p>
        ) : (
          <div className="space-y-4">
            {shows.map((show) => {
              const startDate = new Date(show.start_time);
              const isAvailable = show.available_seats > 0;
              const bookedSeats = show.total_seats - show.available_seats;

              return (
                <div
                  key={show.id}
                  className="border-2 border-foreground p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold uppercase">{show.name}</h3>
                    <Badge variant={isAvailable ? 'default' : 'destructive'}>
                      {isAvailable ? 'Available' : 'Sold Out'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(startDate, 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(startDate, 'h:mm a')}
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                      <Users className="h-3 w-3" />
                      {bookedSeats} booked / {show.total_seats} total
                    </div>
                  </div>
                  <div className="w-full bg-muted h-2 border border-foreground">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${(bookedSeats / show.total_seats) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminShowList;
