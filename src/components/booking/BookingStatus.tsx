import { Badge } from '@/components/ui/badge';
import { BookingStatus as BookingStatusType } from '@/types';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface BookingStatusProps {
  status: BookingStatusType;
  size?: 'sm' | 'default';
}

const BookingStatusBadge: React.FC<BookingStatusProps> = ({ status, size = 'default' }) => {
  const config = {
    PENDING: {
      icon: Clock,
      label: 'Pending',
      variant: 'secondary' as const,
    },
    CONFIRMED: {
      icon: CheckCircle,
      label: 'Confirmed',
      variant: 'default' as const,
    },
    FAILED: {
      icon: XCircle,
      label: 'Failed',
      variant: 'destructive' as const,
    },
  };

  const { icon: Icon, label, variant } = config[status];

  return (
    <Badge variant={variant} className={size === 'sm' ? 'text-xs' : ''}>
      <Icon className={size === 'sm' ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-1'} />
      {label}
    </Badge>
  );
};

export default BookingStatusBadge;
