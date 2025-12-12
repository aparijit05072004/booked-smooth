import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Seat } from '@/types';
import { cn } from '@/lib/utils';
import { usePinchZoom } from '@/hooks/usePinchZoom';
import { Button } from '@/components/ui/button';
import { Minus, Plus, RotateCcw, Move } from 'lucide-react';

interface SeatGridProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatToggle: (seatId: string) => void;
  disabled?: boolean;
}

interface MiniMapProps {
  seats: Seat[];
  selectedSeats: string[];
  columns: number;
  scale: number;
  position: { x: number; y: number };
  containerSize: { width: number; height: number };
  onNavigate: (x: number, y: number) => void;
}

const MiniMap: React.FC<MiniMapProps> = ({
  seats,
  selectedSeats,
  columns,
  scale,
  position,
  containerSize,
  onNavigate,
}) => {
  const miniMapRef = useRef<HTMLDivElement>(null);
  const rows = Math.ceil(seats.length / columns);
  
  // Calculate viewport rectangle
  const viewportWidth = containerSize.width > 0 ? (100 / scale) : 100;
  const viewportHeight = containerSize.height > 0 ? (100 / scale) : 100;
  
  // Calculate position as percentage (inverted because position is negative when panning)
  const viewportX = 50 - (position.x / (containerSize.width || 1)) * 100 / scale - viewportWidth / 2;
  const viewportY = 50 - (position.y / (containerSize.height || 1)) * 100 / scale - viewportHeight / 2;

  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!miniMapRef.current) return;
    const rect = miniMapRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Convert click position to pan coordinates
    const newX = ((50 - clickX) / 100) * containerSize.width * scale;
    const newY = ((50 - clickY) / 100) * containerSize.height * scale;
    onNavigate(newX, newY);
  };

  return (
    <div className="absolute bottom-2 right-2 z-10 border-2 border-foreground bg-background/95 p-1 shadow-lg">
      <div className="text-[8px] text-muted-foreground text-center mb-0.5 uppercase tracking-wider">
        Mini Map
      </div>
      <div
        ref={miniMapRef}
        className="relative cursor-crosshair"
        style={{ width: '100px', height: `${(rows / columns) * 100}px`, maxHeight: '80px' }}
        onClick={handleMiniMapClick}
      >
        {/* Seat dots */}
        <div
          className="grid gap-px w-full h-full"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {seats
            .sort((a, b) => a.seat_number - b.seat_number)
            .map((seat) => {
              const isSelected = selectedSeats.includes(seat.id);
              return (
                <div
                  key={seat.id}
                  className={cn(
                    'w-full h-full min-w-[4px] min-h-[4px]',
                    seat.is_booked && 'bg-muted-foreground/50',
                    !seat.is_booked && !isSelected && 'bg-foreground/30',
                    isSelected && 'bg-primary'
                  )}
                />
              );
            })}
        </div>
        
        {/* Viewport indicator */}
        <div
          className="absolute border-2 border-primary bg-primary/20 pointer-events-none"
          style={{
            left: `${Math.max(0, Math.min(100 - viewportWidth, viewportX))}%`,
            top: `${Math.max(0, Math.min(100 - viewportHeight, viewportY))}%`,
            width: `${Math.min(100, viewportWidth)}%`,
            height: `${Math.min(100, viewportHeight)}%`,
          }}
        />
      </div>
    </div>
  );
};

const SeatGrid: React.FC<SeatGridProps> = ({ seats, selectedSeats, onSeatToggle, disabled }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const {
    scale,
    position,
    containerRef,
    contentRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
    zoomIn,
    zoomOut,
    resetZoom,
    isDragging,
    setPosition,
  } = usePinchZoom({ minScale: 0.5, maxScale: 3, initialScale: 1 });

  const getSeatStatus = (seat: Seat) => {
    if (seat.is_booked) return 'booked';
    if (selectedSeats.includes(seat.id)) return 'selected';
    return 'available';
  };

  const handleSeatClick = useCallback(
    (seat: Seat, e: React.MouseEvent | React.TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
        return;
      }
      if (disabled || seat.is_booked) return;
      onSeatToggle(seat.id);
    },
    [disabled, onSeatToggle, isDragging]
  );

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

  const seatCount = seats.length;
  const columns = useMemo(() => {
    if (seatCount <= 20) return Math.min(5, seatCount);
    if (seatCount <= 40) return 8;
    return 10;
  }, [seatCount]);

  const getSeatSize = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 'w-8 h-8 text-[10px]';
    }
    return 'w-10 h-10 text-xs';
  };

  const containerSize = useMemo(() => {
    if (containerRef.current) {
      return {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      };
    }
    return { width: 300, height: 200 };
  }, [containerRef, scale]);

  const handleMiniMapNavigate = useCallback((x: number, y: number) => {
    setPosition({ x, y });
  }, [setPosition]);

  const showMiniMap = scale > 1.2;

  return (
    <div className="space-y-4">
      {/* Screen indicator */}
      <div className="relative">
        <div className="w-full h-2 bg-foreground mb-2" />
        <p className="text-center text-xs sm:text-sm text-muted-foreground uppercase tracking-widest">
          Screen / Stage
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-foreground bg-background" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-foreground bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-muted-foreground bg-muted" />
          <span>Booked</span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={zoomOut}
          className="h-8 w-8 p-0"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground w-12 text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={zoomIn}
          className="h-8 w-8 p-0"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetZoom}
          className="h-8 px-2 gap-1"
          aria-label="Reset zoom"
        >
          <RotateCcw className="h-3 w-3" />
          <span className="text-xs">Reset</span>
        </Button>
      </div>

      {/* Touch hint for mobile */}
      {scale > 1 && (
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Move className="h-3 w-3" />
          <span>Drag to pan when zoomed</span>
        </div>
      )}

      {/* Pinch hint for mobile */}
      <p className="text-center text-xs text-muted-foreground sm:hidden">
        Pinch to zoom • Tap to select
      </p>

      {/* Seat grid with zoom/pan */}
      <div
        ref={containerRef}
        className="relative overflow-hidden border-2 border-foreground bg-secondary/30 touch-none"
        style={{ minHeight: '200px' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div
          ref={contentRef}
          className={cn(
            'p-4 transition-transform duration-100',
            isDragging && 'cursor-grabbing'
          )}
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'center center',
          }}
        >
          <div
            ref={gridRef}
            className="grid gap-1.5 sm:gap-2 justify-center mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              maxWidth: `${columns * 48}px`
            }}
          >
            {seats
              .sort((a, b) => a.seat_number - b.seat_number)
              .map((seat) => {
                const status = getSeatStatus(seat);
                return (
                  <button
                    key={seat.id}
                    data-seat-id={seat.id}
                    onClick={(e) => handleSeatClick(seat, e)}
                    onTouchEnd={(e) => {
                      if (!isDragging) {
                        handleSeatClick(seat, e);
                      }
                    }}
                    disabled={disabled || seat.is_booked}
                    className={cn(
                      getSeatSize(),
                      'border-2 flex items-center justify-center font-bold transition-all select-none',
                      status === 'available' &&
                        'border-foreground bg-background hover:bg-accent active:scale-95 cursor-pointer',
                      status === 'selected' &&
                        'border-foreground bg-primary text-primary-foreground cursor-pointer active:scale-95',
                      status === 'booked' &&
                        'border-muted-foreground bg-muted text-muted-foreground cursor-not-allowed opacity-60',
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

        {/* Mini Map - shows when zoomed in */}
        {showMiniMap && (
          <MiniMap
            seats={seats}
            selectedSeats={selectedSeats}
            columns={columns}
            scale={scale}
            position={position}
            containerSize={containerSize}
            onNavigate={handleMiniMapNavigate}
          />
        )}
      </div>

      {/* Selected count for mobile */}
      {selectedSeats.length > 0 && (
        <div className="sm:hidden text-center p-2 border-2 border-foreground bg-primary text-primary-foreground font-bold">
          {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};

export default SeatGrid;
