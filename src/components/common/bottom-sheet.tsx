'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBottomSheet } from '@/contexts/BottomSheetContext';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string | React.ReactNode;
  headerSubtitle?: React.ReactNode;
  showCloseButton?: boolean;
  headerActions?: React.ReactNode;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  enableDrag?: boolean;
  enableBackdropDismiss?: boolean;
  backdropClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  maxHeight?: number | string;
  minHeight?: number | string;
  autoSize?: boolean;
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
  headerSubtitle,
  showCloseButton = true,
  headerActions,
  snapPoints = DEFAULT_SNAP_POINTS,
  defaultSnapPoint = 0,
  enableDrag = true,
  enableBackdropDismiss = true,
  backdropClassName,
  contentClassName,
  headerClassName,
  maxHeight = '95vh',
  minHeight = '200px',
  autoSize = false,
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
  const [instantUpdate, setInstantUpdate] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [windowHeight, setWindowHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight;
    }
    return 1080;
  });
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Measure content and header heights for auto-sizing
  // Pause measurements during drag to prevent interference
  useEffect(() => {
    if (!isOpen || !autoSize || isDragging) return;

    const measureHeights = () => {
      // Don't measure if currently dragging
      if (isDragging) return;
      
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        setContentHeight(height);
      }
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        setHeaderHeight(height);
      }
    };

    // Initial measurement
    measureHeights();

    // Use ResizeObserver for dynamic content changes
    const resizeObserver = new ResizeObserver(() => {
      // Skip measurements during drag
      if (!isDragging) {
        measureHeights();
      }
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    // Also measure on a slight delay to catch async content
    const timeoutId = setTimeout(() => {
      if (!isDragging) {
        measureHeights();
      }
    }, 100);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeoutId);
    };
  }, [isOpen, autoSize, children, isDragging]);

  // Use height instead of y position - height of 0 means closed, positive means open
  const height = useMotionValue(0);
  const springHeight = useSpring(height, springConfig);
  
  // Track if this is the initial open (for animation) vs content change (instant)
  const isInitialOpen = useRef(true);
  // Use ref to track dragging state for more reliable checks
  const isDraggingRef = useRef(false);
  
  // Track drag offset to convert to height changes
  const dragY = useMotionValue(0);

  // Calculate auto-size height
  const autoSizeHeight = useMemo(() => {
    if (!autoSize) return null;
    const maxHeightValue = typeof maxHeight === 'string' 
      ? (maxHeight.includes('vh') ? (parseFloat(maxHeight) / 100) * windowHeight : parseFloat(maxHeight))
      : maxHeight;
    const minHeightValue = typeof minHeight === 'string'
      ? (minHeight.includes('vh') ? (parseFloat(minHeight) / 100) * windowHeight : parseFloat(minHeight))
      : minHeight;
    
    // Add padding for drag handle if enabled
    const dragHandleHeight = enableDrag ? 24 : 0;
    const totalContentHeight = contentHeight + headerHeight + dragHandleHeight;
    
    // If content exceeds maxHeight, use maxHeight (content will be scrollable)
    // Otherwise, use the calculated height
    if (totalContentHeight > maxHeightValue) {
      return maxHeightValue;
    }
    
    return Math.max(minHeightValue, totalContentHeight);
  }, [autoSize, contentHeight, headerHeight, maxHeight, minHeight, windowHeight, enableDrag]);

  // Determine if content exceeds viewport and needs scrolling
  const contentExceedsViewport = useMemo(() => {
    if (!autoSize || autoSizeHeight === null) return false;
    const maxHeightValue = typeof maxHeight === 'string' 
      ? (maxHeight.includes('vh') ? (parseFloat(maxHeight) / 100) * windowHeight : parseFloat(maxHeight))
      : maxHeight;
    const totalContentHeight = contentHeight + headerHeight + (enableDrag ? 24 : 0);
    return totalContentHeight > maxHeightValue;
  }, [autoSize, autoSizeHeight, contentHeight, headerHeight, maxHeight, windowHeight, enableDrag]);

  const snapPositions = useMemo(() => {
    if (autoSize && autoSizeHeight !== null) {
      // For auto-size, use the calculated height and full screen
      // Always include full screen as the maximum snap point
      const maxSnapHeight = windowHeight * 0.95;
      // Ensure we have at least two snap points: auto-size and full screen
      return [autoSizeHeight, maxSnapHeight];
    }
    const positions = snapPoints.map((point) => {
      return point <= 1 ? windowHeight * point : point;
    });
    // Add full screen as the last snap point if not already there
    const maxPosition = Math.max(...positions);
    if (maxPosition < windowHeight * 0.95) {
      positions.push(windowHeight * 0.95);
    }
    return positions;
  }, [snapPoints, windowHeight, autoSize, autoSizeHeight]);
  
  // Check if we're at the full screen snap point (last index)
  const isFullScreen = useMemo(() => {
    if (!isOpen) return false;
    return currentSnapIndex === snapPositions.length - 1 && 
           snapPositions[snapPositions.length - 1] >= windowHeight * 0.9;
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
      isInitialOpen.current = true;
      isDraggingRef.current = false; // Reset drag ref
      // Animate to target height
      const timeoutId = setTimeout(() => {
        // If content exceeds viewport and autoSize is enabled, use first snap point (which is maxHeight)
        const targetSnapIndex = (autoSize && contentExceedsViewport) ? 0 : defaultSnapPoint;
        const targetHeight = snapPositions[targetSnapIndex] || snapPositions[0] || windowHeight * 0.5;
        height.set(targetHeight);
        setCurrentSnapIndex(targetSnapIndex);
        // Mark initial open as complete after animation starts
        setTimeout(() => {
          isInitialOpen.current = false;
        }, 300);
      }, 10);
      
      return () => clearTimeout(timeoutId);
    } else {
      height.set(0);
      isInitialOpen.current = true;
      isDraggingRef.current = false;
    }
  }, [isOpen, height, defaultSnapPoint, snapPositions, windowHeight, autoSize, contentExceedsViewport]);

  // Update height when auto-size height changes (instant update, no animation)
  // Completely disabled during drag to prevent interference
  useEffect(() => {
    // Double check: use both state and ref to ensure we're not dragging
    if (isOpen && autoSize && autoSizeHeight !== null && !isDragging && !isDraggingRef.current && !isInitialOpen.current) {
      const targetHeight = snapPositions[defaultSnapPoint] || snapPositions[0];
      const currentHeight = height.get();
      // Only update if there's any difference (even 1px) for instant response
      if (Math.abs(currentHeight - targetHeight) > 0.5) {
        // Set both values immediately for instant update (no animation)
        height.set(targetHeight);
        springHeight.set(targetHeight);
        // Use instant update mode to bypass spring animation
        setInstantUpdate(true);
        // Keep instant mode active briefly to ensure smooth transition
        const timeoutId = setTimeout(() => {
          setInstantUpdate(false);
        }, 50);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isOpen, autoSize, autoSizeHeight, snapPositions, defaultSnapPoint, height, springHeight, isDragging]);

  // Calculate height from base height + drag offset
  // During drag, this makes the sheet follow the hand smoothly without spring interference
  const draggedHeight = useTransform(
    [height, dragY],
    ([baseHeight, drag]: number[]) => {
      // Allow dragging up to full screen (95vh) regardless of auto-size constraints
      const maxDragHeight = windowHeight * 0.95;
      const minDragHeight = 0;
      const newHeight = baseHeight - drag; // Drag down (positive) reduces height
      // Clamp to valid range but allow going beyond auto-size height
      return Math.max(minDragHeight, Math.min(newHeight, maxDragHeight));
    }
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const velocity = info.velocity.y;
      const offset = info.offset.y;
      const currentHeightValue = height.get() - dragY.get();
      dragY.set(0); // Reset drag offset

      // Determine target snap point based on drag
      let targetSnapIndex = currentSnapIndex;
      let targetHeight = snapPositions[currentSnapIndex];

      // Dragging down (positive offset) - reduce height or close
      if (offset > dragThreshold || velocity > 500) {
        if (currentSnapIndex === 0 && closeOnDragDown) {
          setIsDragging(false);
          onClose();
          return;
        }
        targetSnapIndex = Math.max(0, currentSnapIndex - 1);
        targetHeight = snapPositions[targetSnapIndex];
      }
      // Dragging up (negative offset) - increase height or go full screen
      else if (offset < -dragThreshold || velocity < -500) {
        // If close to full screen, go to full screen
        if (currentHeightValue >= windowHeight * 0.8) {
          targetSnapIndex = snapPositions.length - 1;
          targetHeight = windowHeight * 0.95;
        } else {
          targetSnapIndex = Math.min(snapPositions.length - 1, currentSnapIndex + 1);
          targetHeight = snapPositions[targetSnapIndex];
        }
      }
      // Snap to nearest (including full screen if close enough)
      else {
        if (currentHeightValue >= windowHeight * 0.8) {
          targetSnapIndex = snapPositions.length - 1;
          targetHeight = windowHeight * 0.95;
        } else {
          const distances = snapPositions.map((pos) => Math.abs(pos - currentHeightValue));
          targetSnapIndex = distances.indexOf(Math.min(...distances));
          targetHeight = snapPositions[targetSnapIndex];
        }
      }

      // If auto-sizing is enabled, check if we should adjust to auto-size height after drag
      // Only apply auto-size when snapping to the default (first) snap point
      if (autoSize && autoSizeHeight !== null && targetSnapIndex === defaultSnapPoint) {
        // Always use auto-size height when snapping to default point
        targetHeight = autoSizeHeight;
      }

      // Set the target height and update state
      height.set(targetHeight);
      setCurrentSnapIndex(targetSnapIndex);
      onSnapPointChange?.(targetSnapIndex);
      
      // Mark dragging as false after a brief delay to allow smooth transition
      // Update both state and ref
      requestAnimationFrame(() => {
        setIsDragging(false);
        isDraggingRef.current = false;
      });
    },
    [height, dragY, snapPositions, currentSnapIndex, dragThreshold, closeOnDragDown, onClose, onSnapPointChange, windowHeight, autoSize, autoSizeHeight, defaultSnapPoint]
  );

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    isDraggingRef.current = true;
    dragY.set(0); // Reset drag offset
    // Disable instant update during drag to prevent interference
    setInstantUpdate(false);
  }, [dragY]);
  
  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Convert drag offset to height change (dragging down reduces height)
    // This makes the sheet follow the hand smoothly
    dragY.set(info.offset.y);
  }, [dragY]);

  useEffect(() => {
    if (!isDragging && isOpen) {
      const targetHeight = snapPositions[currentSnapIndex];
      height.set(targetHeight);
    }
  }, [currentSnapIndex, snapPositions, height, isDragging, isOpen]);

  // Use dragged height when dragging, otherwise use spring height
  // When in instant update mode, use direct height value to bypass spring animation
  const currentHeight = isDragging 
    ? draggedHeight 
    : (instantUpdate ? height : springHeight);
  
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
              'fixed inset-0 z-[9999] pointer-events-auto',
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
            dragDirectionLock={true}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            initial={{ height: 0 }}
            exit={{ height: 0 }}
            transition={instantUpdate ? { duration: 0, ease: 'linear' } : { type: 'spring', ...springConfig }}
            className="fixed bottom-0 left-0 right-0 z-[10000] pointer-events-auto"
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

              {(title || showCloseButton || headerActions || headerSubtitle) && (
                <motion.div
                  ref={headerRef}
                  className={cn(
                    'flex items-center justify-between px-6 py-5 border-b border-border/50 shrink-0 bg-card',
                    isFullScreen && 'sticky top-0 z-10',
                    headerClassName
                  )}
                  style={{
                    position: isFullScreen ? 'sticky' : 'relative',
                    top: isFullScreen ? 0 : 'auto',
                  }}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    {title && (
                      <h2 className="font-bold text-lg text-foreground leading-tight">
                        {typeof title === 'string' ? title : title}
                      </h2>
                    )}
                    {headerSubtitle && (
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        {headerSubtitle}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {headerActions}
                    {showCloseButton && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors shrink-0"
                        aria-label="إغلاق"
                      >
                        <X className="w-4 h-4 text-foreground" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}

              <div
                ref={contentRef}
                className={cn(
                  'flex-1 overflow-y-auto overscroll-contain scrollbar-hide',
                  !title && !showCloseButton && enableDrag && 'pt-4',
                  (title || showCloseButton || headerActions || headerSubtitle) && 'pt-0',
                  isFullScreen && 'overflow-y-auto'
                )}
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  minHeight: 0,
                  maxHeight: isFullScreen ? 'calc(100vh - var(--header-height, 0px))' : '100%',
                  height: isFullScreen ? 'auto' : '100%',
                  overflowY: (autoSize && !contentExceedsViewport && !isFullScreen) ? 'visible' : 'auto',
                }}
              >
                {contentClassName?.includes('p-0') ? (
                  <div 
                    className={cn(
                      'safe-area-bottom',
                      (title || showCloseButton || headerActions || headerSubtitle) && 'pt-6'
                    )}
                    style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
                  >
                    {children}
                  </div>
                ) : (
                  <div className={cn(
                    'px-6 pb-8 safe-area-bottom',
                    (title || showCloseButton || headerActions || headerSubtitle) && 'pt-6'
                  )}>
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
