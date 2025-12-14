'use client';

import { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, Map as MapIcon, Filter, X, Minus, GripVertical, MapPin, Circle, CheckCircle, Clock, ChevronDownIcon, Search, Check, Navigation, Target, Locate, Building2, Phone, Globe, CheckSquare, Square, Tag, Calendar } from 'lucide-react';
import { Place, PlaceStatus, GOVERNORATES, CITIES, STATUS_COLORS, Visit, PLACE_TYPES, PlaceType } from '@/lib/types';
import { MapView } from '@/components/MapView';
import { PlaceCard } from '@/components/PlaceCard';
import { PlaceDetailsSheet } from '@/components/PlaceDetailsSheet';
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
  onAddNote?: (placeId: string, note: string) => void;
  onDeleteNote?: (visitId: string) => void;
  initialPlaceType?: string;
  initialGovernorates?: string[];
  initialCities?: string[];
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
  onAddNote,
  onDeleteNote,
  initialPlaceType,
  initialGovernorates,
  initialCities,
}: PlanScreenProps) {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  useEffect(() => {
    onViewModeChange?.(viewMode);
  }, [viewMode, onViewModeChange]);

  const [statusFilter, setStatusFilter] = useState<PlaceStatus | 'all'>('all');
  // Initialize state with initial values if provided
  const [governorates, setGovernorates] = useState<string[]>(initialGovernorates || []);
  const [cities, setCities] = useState<string[]>(initialCities || []);
  const [selectedPlaceTypes, setSelectedPlaceTypes] = useState<PlaceType[]>(
    initialPlaceType ? [initialPlaceType as PlaceType] : []
  );

  // Apply initial filter values when they change (for updates from parent)
  const prevInitialFilters = useRef<{ placeType?: string; governorates?: string[]; cities?: string[] } | null>(null);
  useEffect(() => {
    // Apply filters if they're provided and different from current state or previous initial values
    const shouldUpdatePlaceType = initialPlaceType && (
      !prevInitialFilters.current?.placeType || 
      prevInitialFilters.current.placeType !== initialPlaceType
    );
    const shouldUpdateGovernorates = initialGovernorates && initialGovernorates.length > 0 && (
      !prevInitialFilters.current?.governorates || 
      JSON.stringify(prevInitialFilters.current.governorates) !== JSON.stringify(initialGovernorates)
    );
    const shouldUpdateCities = initialCities && initialCities.length > 0 && (
      !prevInitialFilters.current?.cities || 
      JSON.stringify(prevInitialFilters.current.cities) !== JSON.stringify(initialCities)
    );
    
    if (shouldUpdatePlaceType || shouldUpdateGovernorates || shouldUpdateCities) {
      if (shouldUpdatePlaceType) {
        setSelectedPlaceTypes([initialPlaceType as PlaceType]);
      }
      if (shouldUpdateGovernorates) {
        setGovernorates(initialGovernorates);
      }
      if (shouldUpdateCities) {
        setCities(initialCities);
      }
      prevInitialFilters.current = { placeType: initialPlaceType, governorates: initialGovernorates, cities: initialCities };
    }
  }, [initialPlaceType, initialGovernorates, initialCities]);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [showLocationSelectors, setShowLocationSelectors] = useState(false);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [showRadiusControl, setShowRadiusControl] = useState(false);
  const [radiusMin, setRadiusMin] = useState<number>(0);
  const [radiusMax, setRadiusMax] = useState<number>(2.5);
  const radiusExpandTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const radiusCollapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevRadiusMinRef = useRef<number>(0);
  const prevRadiusMaxRef = useRef<number>(2.5);
  const radiusChangeCooldownRef = useRef<boolean>(false);
  
  // Cleanup timeout when popover closes or component unmounts
  useEffect(() => {
    return () => {
      if (radiusExpandTimeoutRef.current) {
        clearTimeout(radiusExpandTimeoutRef.current);
        radiusExpandTimeoutRef.current = null;
      }
      if (radiusCollapseTimeoutRef.current) {
        clearTimeout(radiusCollapseTimeoutRef.current);
        radiusCollapseTimeoutRef.current = null;
      }
      radiusChangeCooldownRef.current = false;
    };
  }, [showRadiusControl]);
  
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
    // If no governorates and no cities are selected, show no places
    if (governorates.length === 0 && cities.length === 0) {
      return [];
    }
    
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

  const statusCounts = useMemo(() => {
    // If no governorates and no cities are selected, return zero counts
    if (governorates.length === 0 && cities.length === 0) {
      return { all: 0, new: 0, postponed: 0, visited: 0 };
    }

    const counts = { all: 0, new: 0, postponed: 0, visited: 0 };
    
    places.forEach((place) => {
      // Apply all filters except status filter
      if (governorates.length > 0 && !governorates.includes(place.governorate)) return;
      if (cities.length > 0 && !cities.includes(place.city)) return;
      
      // Filter by radius if radius is set and user location is available
      if (radiusKm !== null && radiusKm > 0 && userLocation) {
        const distance = calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng);
        if (distance > radiusKm) return;
      }
      
      // Filter by phone
      if (hasPhoneFilter && !place.phone) return;
      
      // Filter by website
      if (hasWebsiteFilter && !place.website) return;
      
      // Filter by place type
      if (selectedPlaceTypes.length > 0 && !selectedPlaceTypes.includes(place.type)) return;
      
      // Count for 'all'
      counts.all++;
      
      // Count for specific status
      if (place.status === 'new') counts.new++;
      else if (place.status === 'postponed') counts.postponed++;
      else if (place.status === 'visited') counts.visited++;
    });
    
    return counts;
  }, [places, governorates, cities, radiusKm, userLocation, hasPhoneFilter, hasWebsiteFilter, selectedPlaceTypes]);

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
                      <span className={`text-sm font-medium ${isSelected ? 'text-white' : ''}`} style={!isSelected ? { color: statusColor } : undefined}>
                        {filter.label}
                        <span className="mr-1 opacity-80">({statusCounts[filter.id as keyof typeof statusCounts]})</span>
                      </span>
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
                    {filteredPlaces.length > 0 && (
                      <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold leading-none shadow-sm">
                        {filteredPlaces.length > 99 ? '99+' : filteredPlaces.length}
                      </span>
                    )}
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setRadiusKm(null);
                                  setRadiusMin(0);
                                  setRadiusMax(2.5);
                                }}
                                className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-md hover:bg-muted transition-colors font-medium"
                              >
                                إعادة تعيين
                              </button>
                              <button
                                onClick={() => {
                                  setShowRadiusControl(false);
                                }}
                                className="text-[10px] text-primary hover:text-primary/80 px-2 py-0.5 rounded-md hover:bg-primary/10 transition-colors font-medium"
                              >
                                حفظ
                              </button>
                            </div>
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
                                step={0.1}
                                value={radiusKm}
                                onChange={(e) => {
                                  const newValue = Number(e.target.value);
                                  
                                  // If in cooldown period, just update value and return
                                  if (radiusChangeCooldownRef.current) {
                                    setRadiusKm(newValue);
                                    return;
                                  }
                                  
                                  // Clear any existing timeouts
                                  if (radiusExpandTimeoutRef.current) {
                                    clearTimeout(radiusExpandTimeoutRef.current);
                                    radiusExpandTimeoutRef.current = null;
                                  }
                                  if (radiusCollapseTimeoutRef.current) {
                                    clearTimeout(radiusCollapseTimeoutRef.current);
                                    radiusCollapseTimeoutRef.current = null;
                                  }
                                  
                                  // If reached max, immediately expand and set cooldown
                                  if (newValue >= radiusMax - 0.01) {
                                    // Save current min/max as previous before expanding
                                    prevRadiusMinRef.current = radiusMin;
                                    prevRadiusMaxRef.current = radiusMax;
                                    
                                    const oldMax = radiusMax; // This becomes the center
                                    // New min is the center (old max), new max is old max * 2
                                    const newMin = oldMax; // Center is the old max
                                    const newMax = oldMax * 2;
                                    
                                    // Immediately update range
                                    setRadiusMin(newMin);
                                    setRadiusMax(newMax);
                                    // Keep value at old max (which is now the center/min) so slider stays in position
                                    setRadiusKm(oldMax);
                                    
                                    // Set cooldown for 1 second to prevent immediate re-trigger
                                    radiusChangeCooldownRef.current = true;
                                    radiusExpandTimeoutRef.current = setTimeout(() => {
                                      radiusChangeCooldownRef.current = false;
                                      radiusExpandTimeoutRef.current = null;
                                    }, 1000);
                                  } 
                                  // If reached min and min > 0 (meaning we've expanded before), immediately collapse and set cooldown
                                  else if (newValue <= radiusMin + 0.01 && radiusMin > 0) {
                                    // Restore previous min/max
                                    const prevMin = prevRadiusMinRef.current;
                                    const prevMax = prevRadiusMaxRef.current;
                                    
                                    // The current min (radiusMin) is the old max, which should become the new max after collapse
                                    const valueToSet = radiusMin; // This is the old max, which is the new max
                                    
                                    // Update range
                                    setRadiusMin(prevMin);
                                    setRadiusMax(prevMax);
                                    // Set value to the old max (which is now the new max)
                                    setRadiusKm(valueToSet);
                                    
                                    // Set cooldown for 1 second to prevent immediate re-trigger
                                    radiusChangeCooldownRef.current = true;
                                    radiusCollapseTimeoutRef.current = setTimeout(() => {
                                      radiusChangeCooldownRef.current = false;
                                      radiusCollapseTimeoutRef.current = null;
                                    }, 1000);
                                  } else {
                                    setRadiusKm(newValue);
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
          <div className="sticky top-0 z-20 glass border-b border-border/50 px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" strokeWidth={2} />
                </div>
                <h1 className="text-base font-bold leading-6">تجهيز الرحلة</h1>
              </div>
              <button
                onClick={() => setViewMode('map')}
                className="w-12 h-12 rounded-full bg-primary/10 hover:bg-primary/20 active:bg-primary/30 text-primary flex items-center justify-center transition-colors shrink-0 touch-manipulation"
                aria-label="عرض الخريطة"
              >
                <MapIcon className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div 
              className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide"
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
                    transition={{ 
                      duration: 0.2, 
                      ease: [0.2, 0, 0, 1] // MD3 Emphasized Easing
                    }}
                    onClick={() => setStatusFilter(filter.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-full whitespace-nowrap shrink-0 transition-all touch-manipulation ${
                      isSelected
                        ? 'text-white'
                        : 'text-foreground/80 hover:bg-primary/20 active:bg-primary/30'
                    }`}
                    style={isSelected ? { 
                      backgroundColor: statusColor,
                      willChange: 'transform'
                    } : { 
                      backgroundColor: hexToRgba(statusColor, 0.15),
                      willChange: 'transform'
                    }}
                    aria-pressed={isSelected}
                    aria-label={filter.label}
                  >
                    <Icon 
                      className={`w-4 h-4 ${isSelected ? 'text-white' : ''}`}
                      style={!isSelected ? { color: statusColor } : undefined}
                      strokeWidth={isSelected ? 2.5 : 2}
                    />
                    <span className={`text-sm font-medium leading-5 ${isSelected ? 'text-white' : ''}`} style={!isSelected ? { color: statusColor } : undefined}>
                      {filter.label}
                      <span className="mr-1 opacity-80">({statusCounts[filter.id as keyof typeof statusCounts]})</span>
                    </span>
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
                    transition={{ 
                      duration: 0.2, 
                      ease: [0.2, 0, 0, 1] // MD3 Emphasized Easing
                    }}
                    className={`flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-full whitespace-nowrap shrink-0 transition-all touch-manipulation ${
                      selectedPlaceTypes.length > 0
                        ? 'text-white'
                        : 'text-foreground/80 hover:bg-primary/20 active:bg-primary/30'
                    }`}
                    style={selectedPlaceTypes.length > 0 ? { 
                      backgroundColor: '#4A90D9',
                      willChange: 'transform'
                    } : { 
                      backgroundColor: 'rgba(74,144,217,0.1)', 
                      willChange: 'transform' 
                    }}
                  >
                    <Tag className={`w-4 h-4 ${selectedPlaceTypes.length > 0 ? 'text-white' : ''}`} style={selectedPlaceTypes.length > 0 ? undefined : { color: '#4A90D9' }} strokeWidth={selectedPlaceTypes.length > 0 ? 2.5 : 2} />
                    <span className={`text-sm font-medium leading-5 ${selectedPlaceTypes.length > 0 ? 'text-white' : ''}`} style={selectedPlaceTypes.length > 0 ? undefined : { color: '#4A90D9' }}>
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
                transition={{ 
                  duration: 0.2, 
                  ease: [0.2, 0, 0, 1] // MD3 Emphasized Easing
                }}
                onClick={() => setHasPhoneFilter(!hasPhoneFilter)}
                className={`flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-full whitespace-nowrap shrink-0 transition-all touch-manipulation ${
                  hasPhoneFilter
                    ? 'text-white'
                    : 'text-foreground/80 hover:bg-primary/20 active:bg-primary/30'
                }`}
                style={hasPhoneFilter ? { 
                  backgroundColor: '#4A90D9',
                  willChange: 'transform'
                } : { 
                  backgroundColor: 'rgba(74,144,217,0.1)', 
                  willChange: 'transform' 
                }}
              >
                <Phone className={`w-4 h-4 ${hasPhoneFilter ? 'text-white' : ''}`} style={hasPhoneFilter ? undefined : { color: '#4A90D9' }} strokeWidth={hasPhoneFilter ? 2.5 : 2} />
                <span className={`text-sm font-medium leading-5 ${hasPhoneFilter ? 'text-white' : ''}`} style={hasPhoneFilter ? undefined : { color: '#4A90D9' }}>رقم</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
                transition={{ 
                  duration: 0.2, 
                  ease: [0.2, 0, 0, 1] // MD3 Emphasized Easing
                }}
                onClick={() => setHasWebsiteFilter(!hasWebsiteFilter)}
                className={`flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-full whitespace-nowrap shrink-0 transition-all touch-manipulation ${
                  hasWebsiteFilter
                    ? 'text-white'
                    : 'text-foreground/80 hover:bg-primary/20 active:bg-primary/30'
                }`}
                style={hasWebsiteFilter ? { 
                  backgroundColor: '#4A90D9',
                  willChange: 'transform'
                } : { 
                  backgroundColor: 'rgba(74,144,217,0.1)', 
                  willChange: 'transform' 
                }}
              >
                <Globe className={`w-4 h-4 ${hasWebsiteFilter ? 'text-white' : ''}`} style={hasWebsiteFilter ? undefined : { color: '#4A90D9' }} strokeWidth={hasWebsiteFilter ? 2.5 : 2} />
                <span className={`text-sm font-medium leading-5 ${hasWebsiteFilter ? 'text-white' : ''}`} style={hasWebsiteFilter ? undefined : { color: '#4A90D9' }}>موقع</span>
              </motion.button>
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              transition={{ 
                duration: 0.2, 
                ease: [0.2, 0, 0, 1] // MD3 Emphasized Easing
              }}
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
              className="flex items-center gap-2 py-2 rounded-xl whitespace-nowrap shrink-0 transition-all text-primary hover:text-primary/80"
              style={{ willChange: 'transform' }}
            >
              {areAllFilteredPlacesSelected ? (
                <>
                  <Square className="w-4 h-4" style={{ color: '#4A90D9' }} strokeWidth={2.5} />
                  <span className="text-sm font-medium" style={{ color: '#4A90D9' }}>إلغاء الكل</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" style={{ color: '#4A90D9' }} strokeWidth={2} />
                  <span className="text-sm font-medium" style={{ color: '#4A90D9' }}>تحديد الكل</span>
                </>
              )}
            </motion.button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
            {filteredPlaces.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-4"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    y: [0, -8, 0],
                  }}
                  transition={{ 
                    delay: 0.1,
                    duration: 0.3,
                    ease: 'easeOut',
                    y: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-10 h-10 text-primary" strokeWidth={1.5} />
                  </div>
                </motion.div>
                <motion.h3
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3, ease: 'easeOut' }}
                  className="text-xl font-bold mb-4 text-foreground"
                >
                  لا توجد أماكن
                </motion.h3>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3, ease: 'easeOut' }}
                  className="text-base text-muted-foreground mb-10 leading-relaxed px-4 max-w-xs"
                >
                  {governorates.length === 0 && cities.length === 0
                    ? 'روح لصفحة التجهيز واختار الأماكن اللي عايز تزورها النهاردة'
                    : 'لا توجد أماكن تطابق الفلاتر المحددة'}
                </motion.p>
              </motion.div>
            ) : (
              <div className="space-y-3 pb-32">
                {filteredPlaces.map((place, index) => (
                  <motion.div
                    key={place.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.3), duration: 0.15, ease: 'easeOut' }}
                    onClick={() => {
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
                      onDetailsClick={() => onPlaceSelect(place)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* PlaceDetailsSheet for list view */}
          <PlaceDetailsSheet
            place={selectedPlace}
            isOpen={!!selectedPlace && viewMode === 'list'}
            onClose={() => onPlaceSelect(null)}
            userLocation={userLocation}
            visits={visits}
            isInJourney={selectedPlace ? selectedPlaceIds.has(selectedPlace.id) : false}
            onAddToJourney={() => selectedPlace && onTogglePlace(selectedPlace)}
            onRemoveFromJourney={() => selectedPlace && onTogglePlace(selectedPlace)}
            onAddNote={selectedPlace ? (note: string) => onAddNote?.(selectedPlace.id, note) : undefined}
            onDeleteNote={onDeleteNote}
          />
        </div>
      )}
    </div>
  );
}
