'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBottomSheet } from '@/lib/bottom-sheet-context';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  enableDrag?: boolean;
  enableBackdropDismiss?: boolean;
  backdropClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  maxHeight?: number | string;
  minHeight?: number | string;
  onSnapPointChange?: (index: number) => void;
  closeOnDragDown?: boolean;
  dragThreshold?: number;
  springConfig?: {
    damping?: number;
    stiffness?: number;
  };
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const DEFAULT_SPRING_CONFIG = {
  damping: 30,
  stiffness: 300,
};

const DEFAULT_SNAP_POINTS = [0.5, 0.9];

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  snapPoints = DEFAULT_SNAP_POINTS,
  defaultSnapPoint = 0,
  enableDrag = true,
  enableBackdropDismiss = true,
  backdropClassName,
  contentClassName,
  headerClassName,
  maxHeight = '95vh',
  minHeight = '200px',
  onSnapPointChange,
  closeOnDragDown = true,
  dragThreshold = 80,
  springConfig = DEFAULT_SPRING_CONFIG,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: BottomSheetProps) {
  const { registerBottomSheet } = useBottomSheet();
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
  
  // Use height instead of y position - height of 0 means closed, positive means open
  const height = useMotionValue(0);
  const springHeight = useSpring(height, springConfig);
  
  // Track drag offset to convert to height changes
  const dragY = useMotionValue(0);

  const snapPositions = useMemo(() => {
    const positions = snapPoints.map((point) => {
      return point <= 1 ? windowHeight * point : point;
    });
    // Add full screen as the last snap point if not already there
    const maxPosition = Math.max(...positions);
    if (maxPosition < windowHeight * 0.95) {
      positions.push(windowHeight);
    }
    return positions;
  }, [snapPoints, windowHeight]);
  
  // Check if we're at the full screen snap point (last index)
  const isFullScreen = useMemo(() => {
    if (!isOpen) return false;
    return currentSnapIndex === snapPositions.length - 1 && 
           snapPositions[snapPositions.length - 1] >= windowHeight * 0.95;
  }, [isOpen, currentSnapIndex, snapPositions, windowHeight]);

  useEffect(() => {
    if (isOpen) {
      const unregister = registerBottomSheet();
      return unregister;
    }
  }, [isOpen, registerBottomSheet]);

  useEffect(() => {
    if (isOpen) {
      // Start with height 0 (closed at bottom)
      height.set(0);
      // Animate to target height
      const timeoutId = setTimeout(() => {
        const targetHeight = snapPositions[defaultSnapPoint] || snapPositions[0] || windowHeight * 0.5;
        height.set(targetHeight);
        setCurrentSnapIndex(defaultSnapPoint);
      }, 10);
      
      return () => clearTimeout(timeoutId);
    } else {
      height.set(0);
    }
  }, [isOpen, height, defaultSnapPoint, snapPositions, windowHeight]);

  // Calculate height from base height + drag offset
  const draggedHeight = useTransform(
    [springHeight, dragY],
    ([baseHeight, drag]: number[]) => {
      const maxHeight = Math.max(...snapPositions);
      const newHeight = baseHeight - drag; // Drag down (positive) reduces height
      return Math.max(0, Math.min(newHeight, maxHeight));
    }
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      const velocity = info.velocity.y;
      const offset = info.offset.y;
      const currentHeightValue = height.get() - dragY.get();
      dragY.set(0); // Reset drag offset

      // Dragging down (positive offset) - reduce height or close
      if (offset > dragThreshold || velocity > 500) {
        if (currentSnapIndex === 0 && closeOnDragDown) {
          onClose();
          return;
        }
        const newIndex = Math.max(0, currentSnapIndex - 1);
        const newHeight = snapPositions[newIndex];
        height.set(newHeight);
        setCurrentSnapIndex(newIndex);
        onSnapPointChange?.(newIndex);
        return;
      }

      // Dragging up (negative offset) - increase height or go full screen
      if (offset < -dragThreshold || velocity < -500) {
        // If close to full screen, go to full screen
        if (currentHeightValue >= windowHeight * 0.8) {
          const fullScreenIndex = snapPositions.length - 1;
          height.set(windowHeight);
          setCurrentSnapIndex(fullScreenIndex);
          onSnapPointChange?.(fullScreenIndex);
          return;
        }
        const newIndex = Math.min(snapPositions.length - 1, currentSnapIndex + 1);
        const newHeight = snapPositions[newIndex];
        height.set(newHeight);
        setCurrentSnapIndex(newIndex);
        onSnapPointChange?.(newIndex);
        return;
      }

      // Snap to nearest (including full screen if close enough)
      if (currentHeightValue >= windowHeight * 0.8) {
        const fullScreenIndex = snapPositions.length - 1;
        height.set(windowHeight);
        setCurrentSnapIndex(fullScreenIndex);
        onSnapPointChange?.(fullScreenIndex);
        return;
      }

      const distances = snapPositions.map((pos) => Math.abs(pos - currentHeightValue));
      const nearestIndex = distances.indexOf(Math.min(...distances));
      const nearestHeight = snapPositions[nearestIndex];
      height.set(nearestHeight);
      setCurrentSnapIndex(nearestIndex);
      onSnapPointChange?.(nearestIndex);
    },
    [height, dragY, snapPositions, currentSnapIndex, dragThreshold, closeOnDragDown, onClose, onSnapPointChange, windowHeight]
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    dragY.set(0); // Reset drag offset
  }, [dragY]);
  
  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Convert drag offset to height change (dragging down reduces height)
    dragY.set(info.offset.y);
  }, [dragY]);

  useEffect(() => {
    if (!isDragging && isOpen) {
      const targetHeight = snapPositions[currentSnapIndex];
      height.set(targetHeight);
    }
  }, [currentSnapIndex, snapPositions, height, isDragging, isOpen]);

  // Use dragged height when dragging, otherwise use spring height
  const currentHeight = isDragging ? draggedHeight : springHeight;
  
  // Track full screen state - use the existing isFullScreen from useMemo
  // It's already calculated based on current height and doesn't cause re-renders

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.32, 0.72, 0, 1],
              delay: 0.05
            }}
            className={cn(
              'fixed inset-0 z-40 pointer-events-auto',
              'bg-black/40 dark:bg-black/60',
              'backdrop-blur-sm',
              backdropClassName
            )}
            onClick={enableBackdropDismiss ? onClose : undefined}
            aria-hidden="true"
          />

          <motion.div
            ref={containerRef}
            drag={enableDrag ? 'y' : false}
            dragElastic={0}
            dragMomentum={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            initial={{ height: 0 }}
            exit={{ height: 0 }}
            transition={{ type: 'spring', ...springConfig }}
            className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto"
            style={{ 
              height: currentHeight,
              maxHeight: typeof maxHeight === 'string' ? maxHeight : `${maxHeight}px`,
              y: 0, // Prevent visual movement, only change height
            }}
            role="dialog"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-modal="true"
          >
            <motion.div
              className={cn(
                'bg-card border-t border-border/50 rounded-t-3xl shadow-elevated overflow-hidden flex flex-col h-full',
                'transition-all duration-200',
                isFullScreen && 'rounded-t-none',
                contentClassName
              )}
              style={{
                minHeight: typeof minHeight === 'string' ? minHeight : `${minHeight}px`,
              }}
            >
              {enableDrag && (
                <motion.div
                  className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-4 mb-2 cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
                  whileTap={{ scale: 0.95 }}
                  onTap={() => {
                    const nextIndex = (currentSnapIndex + 1) % snapPositions.length;
                    const targetHeight = snapPositions[nextIndex];
                    setCurrentSnapIndex(nextIndex);
                    height.set(targetHeight);
                    onSnapPointChange?.(nextIndex);
                  }}
                />
              )}

              {(title || showCloseButton) && (
                <motion.div
                  className={cn(
                    'flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0 bg-card',
                    isFullScreen && 'sticky top-0 z-10',
                    headerClassName
                  )}
                  style={{
                    position: isFullScreen ? 'sticky' : 'relative',
                    top: isFullScreen ? 0 : 'auto',
                  }}
                >
                  {title && (
                    <h2 className="font-bold text-xl text-foreground">{title}</h2>
                  )}
                  {showCloseButton && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onClose}
                      className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors shrink-0"
                      aria-label="إغلاق"
                    >
                      <X className="w-5 h-5 text-foreground" />
                    </motion.button>
                  )}
                </motion.div>
              )}

              <div
                className={cn(
                  'flex-1 overflow-y-auto overscroll-contain scrollbar-hide',
                  !title && !showCloseButton && enableDrag && 'pt-4',
                  isFullScreen && 'overflow-y-auto'
                )}
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  minHeight: 0,
                  maxHeight: isFullScreen ? 'calc(100vh - var(--header-height, 0px))' : '100%',
                  height: isFullScreen ? 'auto' : '100%',
                }}
              >
                {contentClassName?.includes('p-0') ? (
                  children
                ) : (
                  <div className="px-6 pb-6">
                    {children}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

