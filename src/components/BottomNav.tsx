'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Database, MapPin, History, Navigation, Rocket } from 'lucide-react';
import { useBottomSheet } from '@/lib/bottom-sheet-context';

type TabId = 'data' | 'plan' | 'journey' | 'history';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onStartJourney: () => void;
  canStartJourney: boolean;
  isJourneyActive: boolean;
  planViewMode?: 'map' | 'list';
  selectedPlacesCount?: number;
  onOpenSelectedPlaces?: () => void;
}

export function BottomNav({
  activeTab,
  onTabChange,
  onStartJourney,
  canStartJourney,
  isJourneyActive,
  planViewMode = 'list',
  selectedPlacesCount = 0,
  onOpenSelectedPlaces,
}: BottomNavProps) {
  const { isAnyBottomSheetOpen } = useBottomSheet();
  const tabs: { id: TabId; label: string; icon: typeof Database }[] = [
    { id: 'data', label: 'البيانات', icon: Database },
    { id: 'plan', label: 'التجهيز', icon: MapPin },
    { id: 'journey', label: 'الرحلة', icon: Navigation },
    { id: 'history', label: 'السجل', icon: History },
  ];
  const showStartButton = activeTab !== 'data' && (activeTab !== 'plan' || (activeTab === 'plan' && planViewMode === 'map'));

  return (
    <>
      <AnimatePresence>
        {!isAnyBottomSheetOpen && !isJourneyActive && (
          <motion.div
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="relative max-w-md mx-auto px-3 pb-3">
              {showStartButton && (
                <motion.button
                  onClick={onStartJourney}
                  disabled={!canStartJourney}
                  className={`absolute start-3 bottom-full mb-2.5 z-10 h-12 px-5 rounded-full flex items-center gap-2 font-semibold text-sm transition-all pointer-events-auto ${
                    canStartJourney
                      ? 'bg-primary text-white hover:bg-primary/95 active:scale-95'
                      : 'glass text-muted-foreground cursor-not-allowed shadow-soft'
                  }`}
                  whileHover={canStartJourney ? { scale: 1.02, y: -2 } : {}}
                  whileTap={canStartJourney ? { scale: 0.98 } : {}}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <Rocket className={`w-4 h-4 ${canStartJourney ? 'text-white' : ''}`} strokeWidth={canStartJourney ? 2.5 : 2} />
                  <span>ابدأ الرحلة</span>
                </motion.button>
              )}

              {selectedPlacesCount > 0 && onOpenSelectedPlaces && activeTab !== 'history' && activeTab !== 'data' && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  onClick={onOpenSelectedPlaces}
                  className="absolute end-3 bottom-full mb-2.5 z-10 h-12 px-5 rounded-full glass flex items-center gap-2 font-semibold text-sm transition-all pointer-events-auto shadow-elevated hover:bg-card/90 active:scale-95"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <MapPin className="w-4 h-4" />
                  <span>المحددة</span>
                  <span className="bg-primary text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {selectedPlacesCount}
                  </span>
                </motion.button>
              )}

              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="relative rounded-3xl overflow-hidden pointer-events-auto glass border border-border/50 shadow-elevated"
                style={{ willChange: 'transform, opacity' }}
              >
                <nav className="relative flex justify-around items-center px-2 py-2.5">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] rounded-xl transition-all duration-200 group"
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTabIndicator"
                            className="absolute inset-0 bg-accent dark:bg-accent/80 rounded-xl"
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                              damping: 30,
                            }}
                            style={{ willChange: 'transform' }}
                          />
                        )}
                        <div className="relative z-10 flex flex-col items-center gap-1">
                          <div className="relative">
                            <Icon
                              className={`w-4 h-4 transition-all duration-200 ${
                                isActive
                                  ? 'text-primary'
                                  : 'text-muted-foreground group-hover:text-foreground'
                              }`}
                              strokeWidth={isActive ? 2.5 : 2}
                            />
                            {isActive && (
                              <motion.div
                                initial={false}
                                animate={{
                                  scale: [1, 1.3, 1],
                                  opacity: [0.3, 0, 0.3],
                                }}
                                transition={{
                                  duration: 0.8,
                                  repeat: Infinity,
                                  repeatDelay: 2.5,
                                }}
                                className="absolute inset-0 bg-primary/20 rounded-full -z-10"
                                style={{ transform: 'scale(1.5)' }}
                              />
                            )}
                          </div>
                          <span
                            className={`text-[10px] leading-tight transition-all duration-200 ${
                              isActive
                                ? 'text-primary font-semibold'
                                : 'text-muted-foreground font-medium group-hover:text-foreground'
                            }`}
                          >
                            {tab.label}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </nav>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
