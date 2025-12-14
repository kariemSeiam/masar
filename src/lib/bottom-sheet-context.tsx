'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface BottomSheetContextType {
  isAnyBottomSheetOpen: boolean;
  registerBottomSheet: () => () => void;
}

const BottomSheetContext = createContext<BottomSheetContextType | undefined>(undefined);

export function BottomSheetProvider({ children }: { children: ReactNode }) {
  const [openCount, setOpenCount] = useState(0);

  const registerBottomSheet = useCallback(() => {
    setOpenCount((prev) => prev + 1);
    return () => {
      setOpenCount((prev) => Math.max(0, prev - 1));
    };
  }, []);

  const isAnyBottomSheetOpen = openCount > 0;

  useEffect(() => {
    if (isAnyBottomSheetOpen && typeof window !== 'undefined') {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isAnyBottomSheetOpen]);

  return (
    <BottomSheetContext.Provider value={{ isAnyBottomSheetOpen, registerBottomSheet }}>
      {children}
    </BottomSheetContext.Provider>
  );
}

export function useBottomSheet() {
  const context = useContext(BottomSheetContext);
  if (context === undefined) {
    throw new Error('useBottomSheet must be used within a BottomSheetProvider');
  }
  return context;
}

