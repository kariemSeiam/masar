'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { SkipForward, Flag, Navigation, Phone, MessageCircle, MapPin, Ruler, Clock, Copy, Check } from 'lucide-react';
import { Place, VisitOutcome } from '@/lib/types';

const MapView = dynamic(
  () => import('@/components/MapView').then((mod) => ({ default: mod.MapView })),
  {
    ssr: false,
    loading: () => <div className="relative w-full h-full overflow-hidden bg-muted animate-pulse" />
  }
);
import { CheckInModal } from '@/components/CheckInModal';
import { JourneyComplete } from '@/components/JourneyComplete';
import { PlaceDetailsSheet } from '@/components/PlaceDetailsSheet';
import { Button } from '@/components/ui/button';
import { getPlaceIcon, calculateDistance, formatDistance, formatDuration } from '@/lib/store';
import { Visit } from '@/lib/types';

interface JourneyScreenProps {
  places: Place[];
  currentIndex: number;
  userLocation: { lat: number; lng: number } | null;
  onCheckIn: (outcome: VisitOutcome, notes: string, rating?: number) => void;
  onSkip: () => void;
  onComplete: () => void;
  isComplete: boolean;
  stats: {
    visited: number;
    postponed: number;
    closed: number;
    duration: string;
  };
  visits?: Visit[];
  onAddNote?: (placeId: string, note: string) => void;
  onDeleteNote?: (visitId: string) => void;
  onAddNewPlace?: (place: Omit<Place, 'id' | 'createdAt'>) => void;
}

export function JourneyScreen({
  places,
  currentIndex,
  userLocation,
  onCheckIn,
  onSkip,
  onComplete,
  isComplete,
  stats,
  visits = [],
  onAddNote,
  onDeleteNote,
  onAddNewPlace,
}: JourneyScreenProps) {
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentPlace = places[currentIndex];

  const distance = useMemo(() => {
    if (!userLocation || !currentPlace) return null;
    return calculateDistance(userLocation.lat, userLocation.lng, currentPlace.lat, currentPlace.lng);
  }, [userLocation, currentPlace]);

  const estimatedTime = useMemo(() => {
    return distance ? Math.round(distance * 3) : null;
  }, [distance]);

  const handleOpenInMaps = () => {
    if (!currentPlace) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${currentPlace.lat},${currentPlace.lng}`,
      '_blank'
    );
  };

  const handleCall = () => {
    if (!currentPlace?.phone) return;
    window.open(`tel:${currentPlace.phone}`, '_blank');
  };

  const handleWhatsApp = () => {
    if (!currentPlace?.phone) return;
    const phone = currentPlace.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/2${phone}`, '_blank');
  };


  const handleCheckInSubmit = (outcome: VisitOutcome, notes: string, rating?: number) => {
    onCheckIn(outcome, notes, rating);
    setIsCheckInOpen(false);
  };

  if (isComplete) {
    return (
      <JourneyComplete
        stats={stats}
        onViewDetails={() => {}}
        onGoHome={onComplete}
      />
    );
  }

  if (!currentPlace) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>لا توجد أماكن في الرحلة</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col relative">
      <motion.div
        className="absolute inset-0 bottom-0"
      >
        <MapView
          places={places}
          selectedPlace={currentPlace}
          onPlaceSelect={() => {}}
          journeyPlaces={places}
          userLocation={userLocation}
          isJourneyMode
          currentTargetIndex={currentIndex}
        />
      </motion.div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl z-10"
      >
        <motion.button
          onClick={handleOpenInMaps}
          className="absolute start-4 -top-18 z-9999 h-14 w-14 rounded-full flex items-center justify-center font-semibold text-white transition-all bg-primary shadow-[0_8px_24px_rgba(74,144,217,0.4),0_4px_12px_rgba(74,144,217,0.3)] hover:shadow-[0_12px_32px_rgba(74,144,217,0.5),0_6px_16px_rgba(74,144,217,0.4)] hover:bg-primary/95 active:scale-95"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="متابعة الرحلة"
        >
          <Navigation className="w-6 h-6 text-white" strokeWidth={2.5} />
        </motion.button>

        <motion.button
          onClick={() => setIsCheckInOpen(true)}
          className="absolute end-4 -top-18 z-9999 h-14 px-5 rounded-full flex items-center gap-2.5 font-semibold text-white transition-all bg-green-500 shadow-[0_8px_24px_rgba(34,197,89,0.4),0_4px_12px_rgba(34,197,89,0.3)] hover:shadow-[0_12px_32px_rgba(34,197,89,0.5),0_6px_16px_rgba(34,197,89,0.4)] hover:bg-green-600 active:scale-95"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Flag className="w-5 h-5 text-white shrink-0" strokeWidth={2.5} />
          <span className="text-base whitespace-nowrap">وصلت؟</span>
        </motion.button>
        <div className="px-6 pt-6 pb-8 safe-area-bottom">
          <div className="space-y-4">
            {/* Station Info and Skip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">المحطة</span>
                <span className="font-bold text-lg text-primary">
                  {currentIndex + 1} من {places.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-muted-foreground"
              >
                <span>تخطي</span>
                <SkipForward className="w-4 h-4 ms-1 rotate-180" />
              </Button>
            </div>

            {/* Progress Bar */}
            {places.length > 1 && (
              <div className="flex gap-1 -mx-1">
                {places.map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 rounded-full flex-1"
                    animate={{
                      backgroundColor: i < currentIndex 
                        ? 'var(--masar-green)' 
                        : i === currentIndex 
                          ? 'var(--primary)' 
                          : 'var(--muted)',
                    }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </div>
            )}

            {/* Place Info with Chips */}
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setIsDetailsOpen(true)}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shrink-0">
                {getPlaceIcon(currentPlace.type, 'w-6 h-6', 'primary')}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-foreground truncate mb-1">{currentPlace.name}</h3>
                {currentPlace.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 shrink-0 text-[#4A90D9]" />
                    <p className="text-sm text-muted-foreground">
                      {currentPlace.phone.replace(/[^0-9]/g, '')}
                    </p>
                    <div className="relative shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await navigator.clipboard.writeText(currentPlace.phone?.replace(/[^0-9]/g, '') || '');
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          } catch (err) {
                            console.error('Failed to copy:', err);
                          }
                        }}
                        className="p-1 hover:bg-muted/50 rounded-md transition-colors"
                        title="نسخ الرقم"
                      >
                        <AnimatePresence mode="wait">
                          {copied ? (
                            <motion.div
                              key="check"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-center"
                            >
                              <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="copy"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex items-center justify-center"
                            >
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {distance && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/20">
                    <Ruler className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {formatDistance(distance)}
                    </span>
                  </div>
                )}
                {estimatedTime && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/20">
                    <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                      {estimatedTime} د.ق
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 justify-between pt-1">
              {currentPlace.address ? (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <MapPin className="w-4 h-4 shrink-0 text-[#4A90D9]" />
                  <p className="text-sm text-muted-foreground truncate">{currentPlace.address}</p>
                </div>
              ) : (
                <div className="flex-1" />
              )}
              <div className="flex items-center gap-2 shrink-0">
                <motion.button
                  onClick={handleOpenInMaps}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                  title="فتح في خرائط جوجل"
                >
                  <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
                </motion.button>
                {currentPlace.phone && (
                  <>
                    <motion.button
                      onClick={handleWhatsApp}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 rounded-full bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center transition-colors"
                      title="واتساب"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </motion.button>
                    <motion.button
                      onClick={handleCall}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 rounded-full bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
                      title="اتصال"
                    >
                      <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <CheckInModal
        place={currentPlace}
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSubmit={handleCheckInSubmit}
        onAddNewPlace={onAddNewPlace}
        userLocation={userLocation}
      />

      <PlaceDetailsSheet
        place={currentPlace}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        userLocation={userLocation}
        visits={visits}
        isInJourney={true}
        onAddNote={onAddNote ? (note: string) => onAddNote(currentPlace.id, note) : undefined}
        onDeleteNote={onDeleteNote}
      />
    </div>
  );
}
