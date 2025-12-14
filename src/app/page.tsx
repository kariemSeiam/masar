'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Car, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { Place, Visit, VisitOutcome, CITIES } from '@/lib/types';
import { mockPlaces, mockVisits } from '@/lib/store';
import { BottomNav } from '@/components/BottomNav';
import { DataScreen } from '@/components/screens/DataScreen';
import { PlanScreen } from '@/components/screens/PlanScreen';
import { JourneyScreen } from '@/components/screens/JourneyScreen';
import { HistoryScreen } from '@/components/screens/HistoryScreen';
import { BottomSheetProvider } from '@/lib/bottom-sheet-context';

type TabId = 'data' | 'plan' | 'journey' | 'history';

export default function MasarApp() {
  const [activeTab, setActiveTab] = useState<TabId>('plan');
  const [places, setPlaces] = useState<Place[]>(mockPlaces);
  const [visits, setVisits] = useState<Visit[]>(mockVisits);
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>({
    lat: 30.5877,
    lng: 31.5020,
  });
  
  const [isJourneyActive, setIsJourneyActive] = useState(false);
  const [journeyIndex, setJourneyIndex] = useState(0);
  const [isJourneyComplete, setIsJourneyComplete] = useState(false);
  const [planViewMode, setPlanViewMode] = useState<'map' | 'list'>('map');
  const [journeyStats, setJourneyStats] = useState({
    visited: 0,
    postponed: 0,
    closed: 0,
    duration: '0 ساعة',
  });
  const [journeyStartTime, setJourneyStartTime] = useState<Date | null>(null);
  const [initialMapFilters, setInitialMapFilters] = useState<{
    placeType?: string;
    governorates?: string[];
    cities?: string[];
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setUserLocation({ lat: 30.5877, lng: 31.5020 });
        }
      );
    }
  }, []);

  // Clear initial map filters after they've been applied (when tab changes to plan)
  useEffect(() => {
    if (activeTab === 'plan' && initialMapFilters) {
      // Clear filters after a short delay to allow PlanScreen to apply them
      const timer = setTimeout(() => {
        setInitialMapFilters(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, initialMapFilters]);

  const handleTogglePlace = useCallback((place: Place) => {
    setSelectedPlaces((prev) => {
      const isSelected = prev.some((p) => p.id === place.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== place.id);
      }
      return [...prev, place];
    });
  }, []);

  const handleStartJourney = useCallback(() => {
    if (selectedPlaces.length > 0) {
      setIsJourneyActive(true);
      setJourneyIndex(0);
      setIsJourneyComplete(false);
      setJourneyStartTime(new Date());
      setJourneyStats({ visited: 0, postponed: 0, closed: 0, duration: '0 ساعة' });
      setActiveTab('journey');
    } else if (isJourneyActive) {
      setActiveTab('journey');
    }
  }, [selectedPlaces.length, isJourneyActive]);

  const handleCheckIn = useCallback(
    (outcome: VisitOutcome, notes: string, rating?: number) => {
      const currentPlace = selectedPlaces[journeyIndex];
      
      const newVisit: Visit = {
        id: `v${Date.now()}`,
        placeId: currentPlace.id,
        placeName: currentPlace.name,
        date: new Date(),
        checkInTime: new Date(),
        outcome,
        notes,
        rating,
      };
      
      setVisits((prev) => [...prev, newVisit]);
      
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === currentPlace.id
            ? { ...p, status: outcome === 'visited' ? 'visited' : outcome }
            : p
        )
      );
      
      setJourneyStats((prev) => ({
        ...prev,
        [outcome === 'not_found' ? 'closed' : outcome]:
          prev[outcome === 'not_found' ? 'closed' : outcome] + 1,
      }));
      
      if (journeyIndex < selectedPlaces.length - 1) {
        setJourneyIndex((prev) => prev + 1);
      } else {
        const endTime = new Date();
        const durationMs = journeyStartTime
          ? endTime.getTime() - journeyStartTime.getTime()
          : 0;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        setJourneyStats((prev) => ({
          ...prev,
          duration: hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`,
        }));
        setIsJourneyComplete(true);
        setIsJourneyActive(false);
      }
    },
    [journeyIndex, selectedPlaces, journeyStartTime]
  );

  const handleSkip = useCallback(() => {
    if (journeyIndex < selectedPlaces.length - 1) {
      setJourneyIndex((prev) => prev + 1);
    } else {
      // Last place skipped - complete the journey
      const endTime = new Date();
      const durationMs = journeyStartTime
        ? endTime.getTime() - journeyStartTime.getTime()
        : 0;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setJourneyStats((prev) => ({
        ...prev,
        duration: hours > 0 ? `${hours} ساعة ${minutes} دقيقة` : `${minutes} دقيقة`,
      }));
      setIsJourneyComplete(true);
      setIsJourneyActive(false);
    }
  }, [journeyIndex, selectedPlaces.length, journeyStartTime]);

  const handleCompleteJourney = useCallback(() => {
    setIsJourneyActive(false);
    setIsJourneyComplete(false);
    setSelectedPlaces([]);
    setJourneyIndex(0);
    setActiveTab('history');
  }, []);

  const handleAddNote = useCallback((placeId: string, note: string) => {
    const place = places.find((p) => p.id === placeId);
    if (!place) return;

    const newVisit: Visit = {
      id: `v${Date.now()}`,
      placeId: place.id,
      placeName: place.name,
      date: new Date(),
      checkInTime: new Date(),
      outcome: 'visited',
      notes: note,
      isManualNote: true, // Mark as manually added note
    };

    setVisits((prev) => [...prev, newVisit]);
  }, [places]);

  const handleDeleteNote = useCallback((visitId: string) => {
    setVisits((prev) => prev.filter((v) => v.id !== visitId));
  }, []);

  const handleAddNewPlace = useCallback((newPlace: Omit<Place, 'id' | 'createdAt'>) => {
    const place: Place = {
      ...newPlace,
      id: `p${Date.now()}`,
      createdAt: new Date(),
    };
    
    // Add to places list
    setPlaces((prev) => [...prev, place]);
    
    // Replace current place in journey with the new place
    setSelectedPlaces((prev) => {
      const newPlaces = [...prev];
      newPlaces[journeyIndex] = place; // Replace current place
      return newPlaces;
    });
    // Keep same journeyIndex - the new place is now at current position
  }, [journeyIndex]);

  const availableData = useMemo(() => {
    const dataMap = new Map<string, { count: number; cities: Set<string>; governorates: Set<string> }>();
    
    places.forEach((place) => {
      if (!dataMap.has(place.type)) {
        dataMap.set(place.type, { count: 0, cities: new Set(), governorates: new Set() });
      }
      const data = dataMap.get(place.type)!;
      data.count++;
      
      // Add city
      if (place.city) {
        data.cities.add(place.city);
      }
      
      // Add governorate
      if (place.governorate) {
        data.governorates.add(place.governorate);
      } else if (place.city) {
        // If governorate is not set, try to find it from CITIES mapping
        for (const [gov, govCities] of Object.entries(CITIES)) {
          if (govCities.includes(place.city)) {
            data.governorates.add(gov);
            break;
          }
        }
      }
    });
    
    return Array.from(dataMap.entries()).map(([type, { count, cities, governorates }]) => ({
      type,
      count,
      cities: Array.from(cities),
      governorates: Array.from(governorates),
    })).filter((d) => d.count > 0);
  }, [places]);

  return (
    <BottomSheetProvider>
      <div className="min-h-screen bg-background">
        <AnimatePresence mode="wait">
        {activeTab === 'data' && (
          <motion.div
            key="data"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ willChange: 'transform, opacity' }}
          >
            <DataScreen 
              availableData={availableData}
              onAddToMap={(type, cities, governorates) => {
                setInitialMapFilters({
                  placeType: type,
                  cities: cities,
                  governorates: governorates,
                });
                setActiveTab('plan');
              }}
            />
          </motion.div>
        )}

        {activeTab === 'plan' && (
          <motion.div
            key="plan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="h-screen"
            style={{ willChange: 'opacity' }}
          >
            <PlanScreen
              places={places}
              selectedPlaces={selectedPlaces}
              onTogglePlace={handleTogglePlace}
              userLocation={userLocation}
              onPlaceSelect={setSelectedPlace}
              selectedPlace={selectedPlace}
              isJourneyActive={isJourneyActive}
              visits={visits}
              onViewModeChange={setPlanViewMode}
              availableData={availableData}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              initialPlaceType={initialMapFilters?.placeType}
              initialGovernorates={initialMapFilters?.governorates}
              initialCities={initialMapFilters?.cities}
            />
          </motion.div>
        )}

        {activeTab === 'journey' && (
          <motion.div
            key="journey"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="h-screen"
            style={{ willChange: 'opacity' }}
          >
            {isJourneyActive ? (
              <JourneyScreen
                places={selectedPlaces}
                currentIndex={journeyIndex}
                userLocation={userLocation}
                onCheckIn={handleCheckIn}
                onSkip={handleSkip}
                onComplete={handleCompleteJourney}
                isComplete={isJourneyComplete}
                stats={journeyStats}
                visits={visits}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                onAddNewPlace={handleAddNewPlace}
              />
            ) : (
              <div className="h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
                {/* Decorative background elements */}
                <motion.div
                  className="absolute top-20 left-10 w-2 h-2 rounded-full bg-primary/20"
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute top-32 right-16 w-3 h-3 rounded-full bg-primary/15"
                  animate={{
                    y: [0, 15, 0],
                    opacity: [0.2, 0.5, 0.2],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                />
                <motion.div
                  className="absolute bottom-32 left-20 w-2.5 h-2.5 rounded-full bg-primary/25"
                  animate={{
                    y: [0, -15, 0],
                    opacity: [0.3, 0.7, 0.3],
                    scale: [1, 1.4, 1],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                />

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
                  className="text-center max-w-sm mx-auto relative z-10 flex flex-col items-center"
                  style={{ willChange: 'transform, opacity' }}
                >
                  {/* Main icon with floating animation */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                    animate={{ 
                      scale: 1, 
                      opacity: 1, 
                      rotate: 0,
                      y: [0, -8, 0],
                    }}
                    transition={{ 
                      delay: 0.1, 
                      duration: 0.4, 
                      ease: [0.2, 0, 0, 1],
                      y: {
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                    }}
                    className="relative mx-auto mb-8 flex items-center justify-center"
                    style={{ width: '112px', height: '112px' }}
                  >
                    <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center backdrop-blur-sm border border-primary/10 shadow-[0_8px_32px_rgba(74,144,217,0.15)] absolute inset-0">
                      <Car className="w-14 h-14 text-primary" strokeWidth={1.5} />
                    </div>
                  </motion.div>

   

                  <motion.h2
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.4, ease: 'easeOut' }}
                    className="text-2xl font-bold mb-4 text-foreground"
                  >
                    لا توجد رحلة نشطة
                  </motion.h2>
                  
                  <motion.p
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.4, ease: 'easeOut' }}
                    className="text-base text-muted-foreground mb-10 leading-relaxed px-4"
                  >
                    روح لصفحة التجهيز واختار الأماكن اللي عايز تزورها النهاردة
                  </motion.p>
                  
                  <motion.button
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.45, duration: 0.4, ease: 'easeOut' }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab('plan')}
                    className="group relative gradient-primary text-white px-8 py-4 rounded-2xl font-semibold text-base shadow-[0_8px_24px_rgba(74,144,217,0.4)] hover:shadow-[0_12px_32px_rgba(74,144,217,0.5)] transition-all flex items-center gap-2 mx-auto"
                  >
                    <span>جهّز رحلتك</span>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
                    </motion.div>
                  </motion.button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ willChange: 'transform, opacity' }}
          >
            <HistoryScreen 
              visits={visits} 
              onNavigateToPlan={() => setActiveTab('plan')}
              places={places}
              onPlaceSelect={setSelectedPlace}
              userLocation={userLocation}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onTogglePlace={handleTogglePlace}
            />
          </motion.div>
        )}
      </AnimatePresence>

        {activeTab !== 'history' && !(activeTab === 'plan' && planViewMode === 'list') && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onStartJourney={handleStartJourney}
            canStartJourney={selectedPlaces.length > 0}
            isJourneyActive={isJourneyActive}
            planViewMode={planViewMode}
            selectedPlacesCount={selectedPlaces.length}
            onOpenSelectedPlaces={() => {
              if (typeof window !== 'undefined' && (window as any).openSelectedPlacesSheet) {
                (window as any).openSelectedPlacesSheet();
              }
            }}
          />
        )}
      </div>
    </BottomSheetProvider>
  );
}
