'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Car } from 'lucide-react';
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

  useEffect(() => {
    if (navigator.geolocation) {
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
            <DataScreen availableData={availableData} />
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
              />
            ) : (
              <div className="h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="text-center"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <div className="w-32 h-32 mx-auto mb-6 gradient-primary rounded-3xl flex items-center justify-center shadow-elevated">
                    <Car className="w-16 h-16 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">لا توجد رحلة نشطة</h2>
                  <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                    روح لصفحة التجهيز واختار الأماكن اللي عايز تزورها النهاردة
                  </p>
                  <button
                    onClick={() => setActiveTab('plan')}
                    className="gradient-primary text-white px-8 py-4 rounded-full font-semibold shadow-elevated"
                  >
                    جهّز رحلتك
                  </button>
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
