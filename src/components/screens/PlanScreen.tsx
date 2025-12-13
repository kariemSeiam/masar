'use client';

import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Map as MapIcon, Filter, X, Minus, GripVertical, MapPin, Circle, CheckCircle, Clock, ChevronDownIcon, Search, Check, Navigation, Target, Locate, Building2, Phone, Globe, CheckSquare, Square, Tag } from 'lucide-react';
import { Place, PlaceStatus, GOVERNORATES, CITIES, STATUS_COLORS, Visit, PLACE_TYPES, PlaceType } from '@/lib/types';
import { MapView } from '@/components/MapView';
import { PlaceCard } from '@/components/PlaceCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BottomSheet } from '@/components/bottom-sheet';
import { calculateDistance } from '@/lib/store';

interface PlanScreenProps {
  places: Place[];
  selectedPlaces: Place[];
  onTogglePlace: (place: Place) => void;
  userLocation: { lat: number; lng: number } | null;
  onPlaceSelect: (place: Place | null) => void;
  selectedPlace: Place | null;
  isJourneyActive?: boolean;
  visits?: Visit[];
  onViewModeChange?: (viewMode: 'map' | 'list') => void;
  availableData?: { type: string; count: number; cities?: string[]; governorates?: string[] }[];
}

const statusFilters: { id: PlaceStatus | 'all'; label: string; icon: typeof MapPin }[] = [
  { id: 'all', label: 'الكل', icon: MapPin },
  { id: 'new', label: 'جديد', icon: Circle },
  { id: 'postponed', label: 'مؤجل', icon: Clock },
  { id: 'visited', label: 'تمت الزيارة', icon: CheckCircle },
];

// Helper function to convert hex to rgba with opacity
const hexToRgba = (hex: string, opacity: number = 0.15): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export function PlanScreen({
  places,
  selectedPlaces,
  onTogglePlace,
  userLocation,
  onPlaceSelect,
  selectedPlace,
  isJourneyActive = false,
  visits = [],
  onViewModeChange,
  availableData = [],
}: PlanScreenProps) {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  useEffect(() => {
    onViewModeChange?.(viewMode);
  }, [viewMode, onViewModeChange]);
  const [statusFilter, setStatusFilter] = useState<PlaceStatus | 'all'>('all');
  const [governorates, setGovernorates] = useState<string[]>(['الشرقية']);
  const [cities, setCities] = useState<string[]>(['الزقازيق']);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [showLocationSelectors, setShowLocationSelectors] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [showRadiusControl, setShowRadiusControl] = useState(false);
  const [radiusMin, setRadiusMin] = useState<number>(0);
  const [radiusMax, setRadiusMax] = useState<number>(2.5);
  
  useEffect(() => {
    // Expose function to open bottom sheet from BottomNav
    if (typeof window !== 'undefined') {
      (window as any).openSelectedPlacesSheet = () => setIsBottomSheetOpen(true);
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).openSelectedPlacesSheet;
      }
    };
  }, []);
  const [governorateSearch, setGovernorateSearch] = useState<string>('');
  const [citySearch, setCitySearch] = useState<string>('');
  const [hasPhoneFilter, setHasPhoneFilter] = useState<boolean>(false);
  const [hasWebsiteFilter, setHasWebsiteFilter] = useState<boolean>(false);
  const [selectedPlaceTypes, setSelectedPlaceTypes] = useState<PlaceType[]>([]);
  const [showTypeSelector, setShowTypeSelector] = useState<boolean>(false);

  const selectedPlaceIds = useMemo(() => {
    return new Set(selectedPlaces.map(p => p.id));
  }, [selectedPlaces]);

  const placeNotesCount = useMemo(() => {
    const counts = new Map<string, number>();
    visits.forEach((visit) => {
      if (visit.notes && visit.notes.trim()) {
        counts.set(visit.placeId, (counts.get(visit.placeId) || 0) + 1);
      }
    });
    return counts;
  }, [visits]);

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      if (statusFilter !== 'all' && place.status !== statusFilter) return false;
      if (governorates.length > 0 && !governorates.includes(place.governorate)) return false;
      if (cities.length > 0 && !cities.includes(place.city)) return false;
      
      // Filter by radius if radius is set and user location is available
      if (radiusKm !== null && radiusKm > 0 && userLocation) {
        const distance = calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng);
        if (distance > radiusKm) return false;
      }
      
      // Filter by phone
      if (hasPhoneFilter && !place.phone) return false;
      
      // Filter by website
      if (hasWebsiteFilter && !place.website) return false;
      
      // Filter by place type
      if (selectedPlaceTypes.length > 0 && !selectedPlaceTypes.includes(place.type)) return false;
      
      return true;
    });
  }, [places, statusFilter, governorates, cities, radiusKm, userLocation, hasPhoneFilter, hasWebsiteFilter, selectedPlaceTypes]);

  const areAllFilteredPlacesSelected = useMemo(() => {
    if (filteredPlaces.length === 0) return false;
    return filteredPlaces.every(place => selectedPlaceIds.has(place.id));
  }, [filteredPlaces, selectedPlaceIds]);

  const availableCities = useMemo(() => {
    const allCities: string[] = [];
    governorates.forEach((gov) => {
      const govCities = CITIES[gov] || [];
      allCities.push(...govCities);
    });
    return Array.from(new Set(allCities));
  }, [governorates]);

  const filteredGovernorates = useMemo(() => {
    if (!governorateSearch) return GOVERNORATES;
    return GOVERNORATES.filter(gov => 
      gov.toLowerCase().includes(governorateSearch.toLowerCase()) ||
      gov.includes(governorateSearch)
    );
  }, [governorateSearch]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return availableCities;
    return availableCities.filter(city => 
      city.toLowerCase().includes(citySearch.toLowerCase()) ||
      city.includes(citySearch)
    );
  }, [citySearch, availableCities]);

  return (
    <div className="h-screen flex flex-col">
      {viewMode === 'map' ? (
        <>
          <div className="flex-1 relative">
            <MapView
              places={filteredPlaces}
              selectedPlace={selectedPlace}
              onPlaceSelect={onPlaceSelect}
              journeyPlaces={selectedPlaces}
              userLocation={userLocation}
              onLocationEdit={() => setShowLocationSelectors(true)}
              selectedGovernorates={governorates}
              selectedCities={cities}
              radiusKm={radiusKm}
              availableData={availableData}
              onPlaceTypeChange={(placeType) => {
                // Handle place type change if needed
              }}
              onGovernoratesChange={(newGovernorates) => {
                setGovernorates(newGovernorates);
              }}
              onCitiesChange={(newCities) => {
                setCities(newCities);
              }}
            />

            <motion.div
              animate={{ top: showLocationSelectors ? '8.5rem' : '5rem' }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute end-4 start-4 z-10"
              style={{ willChange: 'top' }}
            >
              <div 
                className="flex flex-nowrap gap-2 overflow-x-auto py-2 scrollbar-hide"
                style={{ 
                  paddingInlineStart: '0',
                  paddingInlineEnd: '1rem',
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth',
                  touchAction: 'pan-x',
                  overscrollBehaviorX: 'contain'
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  e.currentTarget.scrollLeft += e.deltaY;
                }}
              >
                {statusFilters.map((filter) => {
                  const Icon = filter.icon;
                  const isSelected = statusFilter === filter.id;
                  const statusColor = filter.id === 'all' 
                    ? '#4A90D9' // App primary color for "all"
                    : STATUS_COLORS[filter.id as PlaceStatus];
                  
                  return (
                    <motion.button
                      key={filter.id}
                      whileTap={{ scale: 0.96 }}
                      whileHover={!isSelected ? { scale: 1.02 } : {}}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      onClick={() => setStatusFilter(filter.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-all ${
                        isSelected
                          ? 'text-white'
                          : 'text-muted-foreground hover:bg-primary/20'
                      }`}
                      style={isSelected ? { 
                        backgroundColor: statusColor,
                        willChange: 'transform'
                      } : { 
                        backgroundColor: hexToRgba(statusColor, 0.15),
                        willChange: 'transform'
                      }}
                    >
                      <Icon
                        className={`w-3 h-3 ${isSelected ? 'text-white' : ''}`}
                        style={!isSelected ? { color: statusColor } : undefined}
                        strokeWidth={isSelected ? 2.5 : 2}
                      />
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : ''}`} style={!isSelected ? { color: statusColor } : undefined}>{filter.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <AnimatePresence>
              {showLocationSelectors && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-20 end-4 start-4 z-10"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <div className="flex gap-2 mt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="glass border-0 h-10 rounded-xl flex-1 px-3 text-sm text-right flex items-center justify-between gap-2 hover:bg-card/90 transition-colors">
                          <span className="text-muted-foreground">
                            {governorates.length === 0 
                              ? 'المحافظة' 
                              : governorates.length === 1 
                                ? governorates[0] 
                                : `${governorates.length} محافظة`}
                          </span>
                          <ChevronDownIcon className="w-4 h-4 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-2" align="start">
                        <div className="mb-2">
                          <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="ابحث..."
                              value={governorateSearch}
                              onChange={(e) => setGovernorateSearch(e.target.value)}
                              className="w-full pr-9 pl-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                              dir="rtl"
                            />
                          </div>
                        </div>
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {filteredGovernorates.length > 0 ? (
                            filteredGovernorates.map((gov) => (
                              <label
                                key={gov}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                              >
                                <Checkbox
                                  checked={governorates.includes(gov)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setGovernorates([...governorates, gov]);
                                    } else {
                                      setGovernorates(governorates.filter(g => g !== gov));
                                    }
                                  }}
                                />
                                <span className="text-sm">{gov}</span>
                              </label>
                            ))
                          ) : (
                            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                              لا توجد نتائج
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="glass border-0 h-10 rounded-xl flex-1 px-3 text-sm text-right flex items-center justify-between gap-2 hover:bg-card/90 transition-colors">
                          <span className="text-muted-foreground">
                            {cities.length === 0 
                              ? 'المدينة' 
                              : cities.length === 1 
                                ? cities[0] 
                                : `${cities.length} مدينة`}
                          </span>
                          <ChevronDownIcon className="w-4 h-4 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-(--radix-popover-trigger-width) p-2" align="start">
                        <div className="mb-2">
                          <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="ابحث..."
                              value={citySearch}
                              onChange={(e) => setCitySearch(e.target.value)}
                              className="w-full pr-9 pl-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                              dir="rtl"
                            />
                          </div>
                        </div>
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {filteredCities.length > 0 ? (
                            filteredCities.map((c) => (
                              <label
                                key={c}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                              >
                                <Checkbox
                                  checked={cities.includes(c)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setCities([...cities, c]);
                                    } else {
                                      setCities(cities.filter(city => city !== c));
                                    }
                                  }}
                                />
                                <span className="text-sm">{c}</span>
                              </label>
                            ))
                          ) : (
                            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                              لا توجد نتائج
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <button
                      onClick={() => setShowLocationSelectors(false)}
                      className="w-10 h-10 bg-[#22C55E] dark:bg-[#16A34A] rounded-xl flex items-center justify-center hover:bg-[#16A34A] dark:hover:bg-[#15803D] transition-all shadow-elevated hover:scale-105 active:scale-95 ring-2 ring-green-500/20 dark:ring-green-400/20"
                    >
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!selectedPlace && (
                <>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    onClick={() => setViewMode('list')}
                    className="fixed start-3 bottom-[148px] w-12 h-12 glass rounded-full flex items-center justify-center z-10 shadow-elevated hover:bg-card/90 active:scale-95"
                    style={{ willChange: 'transform, opacity' }}
                  >
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                  
                  <Popover open={showRadiusControl} onOpenChange={setShowRadiusControl}>
                    <PopoverTrigger asChild>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className={`fixed end-3 ${selectedPlaces.length > 0 ? 'bottom-[148px]' : 'bottom-[92px]'} w-12 h-12 glass rounded-full flex items-center justify-center z-10 shadow-elevated hover:bg-card/90 active:scale-95`}
                        style={{ willChange: 'transform, opacity' }}
                      >
                        <Target className="w-5 h-5 text-muted-foreground" />
                      </motion.button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="end" side="top">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">نطاق البحث</h3>
                          {radiusKm !== null && (
                            <button
                              onClick={() => {
                                setShowRadiusControl(false);
                              }}
                              className="text-[10px] text-primary hover:text-primary/80 px-2 py-0.5 rounded-md hover:bg-primary/10 transition-colors font-medium"
                            >
                              حفظ
                            </button>
                          )}
                        </div>

                        {radiusKm !== null ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                              <span>{radiusMin === 0 ? '0 م' : `${radiusMin} كم`}</span>
                              <span className="font-semibold text-primary text-xs">
                                {radiusKm < 1 ? `${Math.round(radiusKm * 1000)} م` : `${radiusKm.toFixed(1)} كم`}
                              </span>
                              <span>{radiusMax} كم</span>
                            </div>
                            <div className="relative h-5 flex items-center">
                              <div 
                                className="absolute left-0 right-0 h-1.5 rounded-full pointer-events-none z-0 bg-primary/20 top-1/2 -translate-y-1/2"
                              />
                              <div 
                                className="absolute left-0 right-0 h-1.5 rounded-full pointer-events-none z-0 top-1/2 -translate-y-1/2"
                                style={{
                                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((radiusKm - radiusMin) / (radiusMax - radiusMin)) * 100}%, transparent ${((radiusKm - radiusMin) / (radiusMax - radiusMin)) * 100}%, transparent 100%)`
                                }}
                              />
                              <input
                                type="range"
                                min={radiusMin}
                                max={radiusMax}
                                step={radiusMin === 0 ? 0.1 : 0.5}
                                value={radiusKm}
                                onChange={(e) => {
                                  const newValue = Number(e.target.value);
                                  setRadiusKm(newValue);
                                  
                                  // If reached max, expand the range
                                  if (newValue >= radiusMax) {
                                    setRadiusMin(radiusMax);
                                    setRadiusMax(radiusMax * 1.5);
                                  }
                                }}
                                className="relative w-full appearance-none cursor-pointer slider-range z-20"
                                style={{ background: 'transparent' }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                              <span>0 م</span>
                              <span className="font-semibold text-primary text-xs">0 م</span>
                              <span>2.5 كم</span>
                            </div>
                            <div className="relative h-5 flex items-center">
                              <div 
                                className="absolute left-0 right-0 h-1.5 rounded-full pointer-events-none z-0 bg-primary/20 top-1/2 -translate-y-1/2"
                              />
                              <input
                                type="range"
                                min={0}
                                max={2.5}
                                step={0.1}
                                value={0}
                                onChange={(e) => {
                                  const newValue = Number(e.target.value);
                                  if (newValue > 0) {
                                    setRadiusKm(newValue);
                                    if (newValue >= 2.5) {
                                      setRadiusMin(2.5);
                                      setRadiusMax(3.75);
                                    }
                                  }
                                }}
                                className="relative w-full appearance-none cursor-pointer slider-range z-20"
                                style={{ background: 'transparent' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {selectedPlace && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="fixed z-30 bottom-[148px] start-3 max-w-[calc(100vw-6rem)]"
                  style={{
                    willChange: 'transform, opacity'
                  }}
                >
                  <PlaceCard
                    place={selectedPlace}
                    userLocation={userLocation}
                    variant="popup"
                    isInJourney={selectedPlaceIds.has(selectedPlace.id)}
                    onAddToJourney={() => onTogglePlace(selectedPlace)}
                    onCall={() => window.open(`tel:${selectedPlace.phone}`)}
                    notesCount={placeNotesCount.get(selectedPlace.id) || 0}
                    onOpenInMaps={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                    onWhatsApp={() => {
                      if (selectedPlace.phone) {
                        const phoneNumber = selectedPlace.phone.replace(/[^0-9]/g, '');
                        const url = `https://wa.me/${phoneNumber}`;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>


          <BottomSheet
            isOpen={isBottomSheetOpen}
            onClose={() => setIsBottomSheetOpen(false)}
            title={`الأماكن المحددة (${selectedPlaces.length})`}
            snapPoints={[0.6, 0.9]}
            defaultSnapPoint={0}
            enableDrag={true}
            enableBackdropDismiss={true}
            closeOnDragDown={true}
            contentClassName="p-0"
            aria-label="الأماكن المحددة"
          >
            <div className="p-4">
              <div className="space-y-2">
                {selectedPlaces.map((place, index) => (
                  <motion.div
                    key={place.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.15, ease: 'easeOut' }}
                    className="flex items-center gap-3 bg-muted/50 rounded-xl p-3"
                    style={{ willChange: 'transform, opacity' }}
                  >
                    <div className="flex items-center justify-center w-8 h-8 gradient-primary rounded-full text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    <div className="flex-1">
                      <p className="font-medium">{place.name}</p>
                      <p className="text-sm text-muted-foreground">{place.address}</p>
                    </div>
                    <button
                      onClick={() => onTogglePlace(place)}
                      className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </BottomSheet>
        </>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="sticky top-0 z-20 glass border-b border-border/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="font-bold text-xl">تجهيز الرحلة</h1>
              <button
                onClick={() => setViewMode('map')}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              >
                <MapIcon className="w-5 h-5 text-primary" />
              </button>
            </div>

            <div 
              className="flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-hide"
              style={{ 
                paddingInlineStart: '0',
                paddingInlineEnd: '1rem',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth',
                touchAction: 'pan-x',
                overscrollBehaviorX: 'contain'
              }}
              onWheel={(e) => {
                e.preventDefault();
                e.currentTarget.scrollLeft += e.deltaY;
              }}
            >
              {statusFilters.map((filter) => {
                const Icon = filter.icon;
                const isSelected = statusFilter === filter.id;
                const statusColor = filter.id === 'all' 
                  ? '#4A90D9' // App primary color for "all"
                  : STATUS_COLORS[filter.id as PlaceStatus];
                
                return (
                  <motion.button
                    key={filter.id}
                    whileTap={{ scale: 0.96 }}
                    whileHover={!isSelected ? { scale: 1.02 } : {}}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    onClick={() => setStatusFilter(filter.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full whitespace-nowrap shrink-0 transition-all ${
                      isSelected
                        ? 'text-white'
                        : 'text-foreground/80 hover:bg-primary/20'
                    }`}
                    style={isSelected ? { 
                      backgroundColor: statusColor,
                      willChange: 'transform'
                    } : { 
                      backgroundColor: hexToRgba(statusColor, 0.15),
                      willChange: 'transform'
                    }}
                  >
                    <Icon 
                      className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : ''}`}
                      style={!isSelected ? { color: statusColor } : undefined}
                      strokeWidth={isSelected ? 2.5 : 2}
                    />
                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : ''}`} style={!isSelected ? { color: statusColor } : undefined}>{filter.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Additional Filters and Select All */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <div 
              className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth',
                touchAction: 'pan-x',
                overscrollBehaviorX: 'contain'
              }}
              onWheel={(e) => {
                e.preventDefault();
                e.currentTarget.scrollLeft += e.deltaY;
              }}
            >
              <Popover open={showTypeSelector} onOpenChange={setShowTypeSelector}>
                <PopoverTrigger asChild>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-all ${
                      selectedPlaceTypes.length > 0
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-primary/20'
                    }`}
                    style={selectedPlaceTypes.length > 0 ? { willChange: 'transform' } : { backgroundColor: 'rgba(74,144,217,0.1)', willChange: 'transform' }}
                  >
                    <Tag className={`w-3 h-3 ${selectedPlaceTypes.length > 0 ? 'text-white' : 'text-muted-foreground'}`} strokeWidth={selectedPlaceTypes.length > 0 ? 2.5 : 2} />
                    <span className={`text-sm font-medium ${selectedPlaceTypes.length > 0 ? 'text-white' : 'text-muted-foreground'}`}>
                      {selectedPlaceTypes.length > 0 ? `نوع (${selectedPlaceTypes.length})` : 'نوع'}
                    </span>
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start" side="bottom" dir="rtl">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm mb-2 text-right">اختر النوع</h3>
                    <ScrollArea className="h-[200px] scrollbar-hide">
                      <div className="space-y-1">
                        {PLACE_TYPES.map((placeType) => (
                          <label
                            key={placeType.value}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                            dir="rtl"
                          >
                            <Checkbox
                              checked={selectedPlaceTypes.includes(placeType.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPlaceTypes([...selectedPlaceTypes, placeType.value]);
                                } else {
                                  setSelectedPlaceTypes(selectedPlaceTypes.filter(t => t !== placeType.value));
                                }
                              }}
                            />
                            <div className="flex items-center gap-2 flex-row-reverse">
                              {placeType.icon}
                              <span className="text-sm">{placeType.label}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                    {selectedPlaceTypes.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedPlaceTypes([]);
                          setShowTypeSelector(false);
                        }}
                        className="w-full text-xs text-primary hover:text-primary/80 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors font-medium mt-2 text-right"
                      >
                        إلغاء الكل
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <motion.button
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onClick={() => setHasPhoneFilter(!hasPhoneFilter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-all ${
                  hasPhoneFilter
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:bg-primary/20'
                }`}
                style={hasPhoneFilter ? { willChange: 'transform' } : { backgroundColor: 'rgba(74,144,217,0.1)', willChange: 'transform' }}
              >
                <Phone className={`w-3 h-3 ${hasPhoneFilter ? 'text-white' : 'text-muted-foreground'}`} strokeWidth={hasPhoneFilter ? 2.5 : 2} />
                <span className={`text-sm font-medium ${hasPhoneFilter ? 'text-white' : 'text-muted-foreground'}`}>رقم</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onClick={() => setHasWebsiteFilter(!hasWebsiteFilter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-all ${
                  hasWebsiteFilter
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:bg-primary/20'
                }`}
                style={hasWebsiteFilter ? { willChange: 'transform' } : { backgroundColor: 'rgba(74,144,217,0.1)', willChange: 'transform' }}
              >
                <Globe className={`w-3 h-3 ${hasWebsiteFilter ? 'text-white' : 'text-muted-foreground'}`} strokeWidth={hasWebsiteFilter ? 2.5 : 2} />
                <span className={`text-sm font-medium ${hasWebsiteFilter ? 'text-white' : 'text-muted-foreground'}`}>موقع</span>
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={() => {
                if (areAllFilteredPlacesSelected) {
                  // Deselect all
                  filteredPlaces.forEach(place => {
                    if (selectedPlaceIds.has(place.id)) {
                      onTogglePlace(place);
                    }
                  });
                } else {
                  // Select all
                  filteredPlaces.forEach(place => {
                    if (!selectedPlaceIds.has(place.id)) {
                      onTogglePlace(place);
                    }
                  });
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap shrink-0 transition-all text-foreground hover:text-primary"
              style={{ willChange: 'transform' }}
            >
              {areAllFilteredPlacesSelected ? (
                <>
                  <Square className="w-4 h-4" strokeWidth={2.5} />
                  <span className="text-sm font-medium">إلغاء الكل</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" strokeWidth={2} />
                  <span className="text-sm font-medium">تحديد الكل</span>
                </>
              )}
            </motion.button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
            <div className="space-y-3 pb-32">
              {filteredPlaces.map((place, index) => (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.15, ease: 'easeOut' }}
                  onClick={() => {
                    onPlaceSelect(place);
                    onTogglePlace(place);
                  }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <PlaceCard
                    place={place}
                    userLocation={userLocation}
                    variant="card"
                    isInJourney={selectedPlaceIds.has(place.id)}
                    notesCount={placeNotesCount.get(place.id) || 0}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
