import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Show } from '@/types';
import { Calendar, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

interface ShowCardProps {
  show: Show;
}

const ShowCard: React.FC<ShowCardProps> = ({ show }) => {
  const startDate = new Date(show.start_time);
  const isAvailable = show.available_seats > 0;
  const availabilityPercentage = (show.available_seats / show.total_seats) * 100;

  const getAvailabilityColor = () => {
    if (availabilityPercentage > 50) return 'bg-chart-2';
    if (availabilityPercentage > 20) return 'bg-chart-4';
    return 'bg-destructive';
  };

  return (
    <Card className="border-2 border-foreground shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-bold uppercase">{show.name}</CardTitle>
          <Badge variant={isAvailable ? 'default' : 'destructive'} className="shrink-0">
            {isAvailable ? 'Available' : 'Sold Out'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          <span>{format(startDate, 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          <span>{format(startDate, 'h:mm a')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          <span>
            {show.available_seats} / {show.total_seats} seats available
          </span>
        </div>
        <div className="w-full bg-muted h-2 border border-foreground">
          <div
            className={`h-full ${getAvailabilityColor()} transition-all`}
            style={{ width: `${availabilityPercentage}%` }}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Link to={`/booking/${show.id}`} className="w-full">
          <Button className="w-full" disabled={!isAvailable}>
            {isAvailable ? 'Book Now' : 'Sold Out'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ShowCard;
