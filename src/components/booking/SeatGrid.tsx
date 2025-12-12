import { useEffect, useRef, useCallback } from 'react';
import { Seat } from '@/types';
import { cn } from '@/lib/utils';

interface SeatGridProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatToggle: (seatId: string) => void;
  disabled?: boolean;
}

const SeatGrid: React.FC<SeatGridProps> = ({ seats, selectedSeats, onSeatToggle, disabled }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const getSeatStatus = (seat: Seat) => {
    if (seat.is_booked) return 'booked';
    if (selectedSeats.includes(seat.id)) return 'selected';
    return 'available';
  };

  const handleSeatClick = useCallback(
    (seat: Seat) => {
      if (disabled || seat.is_booked) return;
      onSeatToggle(seat.id);
    },
    [disabled, onSeatToggle]
  );

  // Direct DOM manipulation for seat highlighting
  useEffect(() => {
    if (!gridRef.current) return;

    const seatElements = gridRef.current.querySelectorAll('[data-seat-id]');
    seatElements.forEach((el) => {
      const seatId = el.getAttribute('data-seat-id');
      const isSelected = seatId && selectedSeats.includes(seatId);
      
      if (isSelected) {
        el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      } else {
        el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }
    });

    return () => {
      seatElements.forEach((el) => {
        el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      });
    };
  }, [selectedSeats]);

  // Calculate grid columns based on seat count
  const columns = Math.min(10, Math.ceil(Math.sqrt(seats.length)));

  return (
    <div className="space-y-6">
      {/* Screen indicator */}
      <div className="relative">
        <div className="w-full h-2 bg-foreground mb-2" />
        <p className="text-center text-sm text-muted-foreground uppercase tracking-widest">
          Screen / Stage
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-foreground bg-background" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-foreground bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-muted-foreground bg-muted" />
          <span>Booked</span>
        </div>
      </div>

      {/* Seat grid */}
      <div
        ref={gridRef}
        className="grid gap-2 justify-center"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {seats
          .sort((a, b) => a.seat_number - b.seat_number)
          .map((seat) => {
            const status = getSeatStatus(seat);
            return (
              <button
                key={seat.id}
                data-seat-id={seat.id}
                onClick={() => handleSeatClick(seat)}
                disabled={disabled || seat.is_booked}
                className={cn(
                  'w-10 h-10 border-2 flex items-center justify-center text-xs font-bold transition-all',
                  status === 'available' &&
                    'border-foreground bg-background hover:bg-accent cursor-pointer',
                  status === 'selected' &&
                    'border-foreground bg-primary text-primary-foreground cursor-pointer',
                  status === 'booked' &&
                    'border-muted-foreground bg-muted text-muted-foreground cursor-not-allowed',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
                aria-label={`Seat ${seat.seat_number} - ${status}`}
              >
                {seat.seat_number}
              </button>
            );
          })}
      </div>
    </div>
  );
};

export default SeatGrid;
