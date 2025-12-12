import { useState, useRef, useCallback, useEffect } from 'react';

interface UsePinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
}

interface Position {
  x: number;
  y: number;
}

interface UsePinchZoomReturn {
  scale: number;
  position: Position;
  containerRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  isDragging: boolean;
}

export const usePinchZoom = ({
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1,
}: UsePinchZoomOptions = {}): UsePinchZoomReturn => {
  const [scale, setScale] = useState(initialScale);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<Position | null>(null);
  const lastPosition = useRef<Position>({ x: 0, y: 0 });
  const touchStartPosition = useRef<Position | null>(null);

  const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touch1: React.Touch, touch2: React.Touch): Position => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  });

  const clampScale = useCallback((newScale: number) => {
    return Math.min(Math.max(newScale, minScale), maxScale);
  }, [minScale, maxScale]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture start
      lastTouchDistance.current = getDistance(e.touches[0], e.touches[1]);
      lastTouchCenter.current = getCenter(e.touches[0], e.touches[1]);
      setIsDragging(false);
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan gesture start (only when zoomed)
      touchStartPosition.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
      lastPosition.current = position;
      setIsDragging(true);
    }
  }, [scale, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      // Pinch gesture
      e.preventDefault();
      const newDistance = getDistance(e.touches[0], e.touches[1]);
      const scaleDelta = newDistance / lastTouchDistance.current;
      const newScale = clampScale(scale * scaleDelta);
      
      setScale(newScale);
      lastTouchDistance.current = newDistance;
      
      // Adjust position to zoom toward center of pinch
      const center = getCenter(e.touches[0], e.touches[1]);
      if (lastTouchCenter.current) {
        const dx = center.x - lastTouchCenter.current.x;
        const dy = center.y - lastTouchCenter.current.y;
        setPosition((prev) => ({
          x: prev.x + dx,
          y: prev.y + dy,
        }));
      }
      lastTouchCenter.current = center;
    } else if (e.touches.length === 1 && isDragging && touchStartPosition.current) {
      // Pan gesture
      const newX = e.touches[0].clientX - touchStartPosition.current.x;
      const newY = e.touches[0].clientY - touchStartPosition.current.y;
      setPosition({ x: newX, y: newY });
    }
  }, [scale, isDragging, clampScale]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
    touchStartPosition.current = null;
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleDelta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = clampScale(scale * scaleDelta);
    setScale(newScale);
  }, [scale, clampScale]);

  const zoomIn = useCallback(() => {
    setScale((prev) => clampScale(prev * 1.25));
  }, [clampScale]);

  const zoomOut = useCallback(() => {
    setScale((prev) => clampScale(prev * 0.8));
  }, [clampScale]);

  const resetZoom = useCallback(() => {
    setScale(initialScale);
    setPosition({ x: 0, y: 0 });
  }, [initialScale]);

  // Reset position when scale returns to 1
  useEffect(() => {
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  return {
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
  };
};
