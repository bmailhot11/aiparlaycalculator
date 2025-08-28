import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export default function MobileCarousel({ 
  children, 
  currentIndex, 
  onIndexChange, 
  autoRotate = true,
  autoRotateDelay = 6000 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);
  const itemWidth = 100; // Percentage width per item

  // Handle touch/mouse events
  const handleDragStart = (clientX) => {
    setIsDragging(true);
    setDragStart(clientX);
    setDragOffset(0);
  };

  const handleDragMove = (clientX) => {
    if (!isDragging) return;
    const offset = clientX - dragStart;
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Determine if drag was significant enough to change slides
    const threshold = 50; // pixels
    if (Math.abs(dragOffset) > threshold) {
      const direction = dragOffset > 0 ? -1 : 1; // Swipe left = next, swipe right = prev
      const newIndex = Math.max(0, Math.min(children.length - 1, currentIndex + direction));
      onIndexChange(newIndex);
    }
    
    setDragOffset(0);
    setDragStart(0);
  };

  // Touch events
  const handleTouchStart = (e) => {
    handleDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent scrolling
    handleDragMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse events (for testing on desktop)
  const handleMouseDown = (e) => {
    handleDragStart(e.clientX);
  };

  const handleMouseMove = (e) => {
    handleDragMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) handleDragEnd();
  };

  // Calculate transform
  const baseTransform = -currentIndex * itemWidth;
  const dragTransform = isDragging ? (dragOffset / (containerRef.current?.clientWidth || 300)) * itemWidth : 0;
  const totalTransform = baseTransform + dragTransform;

  return (
    <div className="relative overflow-hidden rounded-premium-lg">
      <motion.div
        ref={containerRef}
        className="flex transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(${totalTransform}%)`,
          width: `${children.length * 100}%`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="flex-shrink-0"
            style={{ width: `${100 / children.length}%` }}
          >
            {child}
          </div>
        ))}
      </motion.div>

      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs text-white">
            {dragOffset > 50 ? '← Previous' : dragOffset < -50 ? 'Next →' : 'Release to snap'}
          </div>
        </div>
      )}

      {/* Swipe hint (shows briefly on first load) */}
      <div className="absolute bottom-4 right-4 text-xs text-premium-text-muted opacity-60">
        👈 Swipe
      </div>
    </div>
  );
}