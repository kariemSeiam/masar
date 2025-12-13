'use client';

import { useRef, useCallback, useEffect, useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Star, Sun, Moon, ChevronDownIcon, Search, Check, CheckCircle2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Place, PLACE_TYPES, GOVERNORATES, CITIES } from '@/lib/types';
import { getPlaceIcon, getStatusColor, getStatusColorLight, calculateDistance, formatDistance } from '@/lib/store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onPlaceSelect: (place: Place | null) => void;
  journeyPlaces?: Place[];
  userLocation?: { lat: number; lng: number } | null;
  isJourneyMode?: boolean;
  currentTargetIndex?: number;
  onLocationEdit?: () => void;
  selectedGovernorates?: string[];
  selectedCities?: string[];
  radiusKm?: number | null;
  availableData?: { type: string; count: number; cities?: string[]; governorates?: string[] }[];
  onPlaceTypeChange?: (placeType: string | null) => void;
  onGovernoratesChange?: (governorates: string[]) => void;
  onCitiesChange?: (cities: string[]) => void;
}

export function MapView({
  places,
  selectedPlace,
  onPlaceSelect,
  journeyPlaces = [],
  userLocation,
  isJourneyMode = false,
  currentTargetIndex = 0,
  onLocationEdit,
  selectedGovernorates = [],
  selectedCities = [],
  radiusKm = null,
  availableData = [],
  onPlaceTypeChange,
  onGovernoratesChange,
  onCitiesChange,
}: MapViewProps) {
  const [mapCenter] = useState({ lat: 30.5877, lng: 31.5020 });
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedPlaceTypes, setSelectedPlaceTypes] = useState<string[]>([]);
  const [showPlaceTypeSelector, setShowPlaceTypeSelector] = useState(false);
  const [showGovernoratesDropdown, setShowGovernoratesDropdown] = useState(false);
  const [showCitiesDropdown, setShowCitiesDropdown] = useState(false);
  const [governorateSearch, setGovernorateSearch] = useState<string>('');
  const [citySearch, setCitySearch] = useState<string>('');
  const [tempSelectedGovernorates, setTempSelectedGovernorates] = useState<string[]>(selectedGovernorates);
  const [tempSelectedCities, setTempSelectedCities] = useState<string[]>(selectedCities);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDark = mounted && theme === 'dark';

  // Get available place types from availableData
  const availablePlaceTypes = useMemo(() => {
    if (availableData.length === 0) return PLACE_TYPES.filter(t => t.value !== 'bakery');
    const typesWithData = availableData.map(d => d.type);
    return PLACE_TYPES.filter(t => t.value !== 'bakery' && typesWithData.includes(t.value));
  }, [availableData]);

  // Get cities that have data for the selected place types
  const getCitiesWithData = useMemo(() => {
    if (selectedPlaceTypes.length === 0) return new Set<string>();
    const allCities = new Set<string>();
    selectedPlaceTypes.forEach(placeType => {
      const dataItem = availableData.find(d => d.type === placeType);
      if (dataItem?.cities) {
        dataItem.cities.forEach(city => allCities.add(city));
      }
    });
    return allCities;
  }, [selectedPlaceTypes, availableData]);

  // Get available governorates from availableData or derive from cities
  const availableGovernorates = useMemo(() => {
    if (selectedPlaceTypes.length === 0) return [];
    
    // Collect governorates from all selected place types
    const allGovernorates = new Set<string>();
    selectedPlaceTypes.forEach(placeType => {
      const dataItem = availableData.find(d => d.type === placeType);
      
      // If governorates are directly available in availableData, use them
      if (dataItem?.governorates && dataItem.governorates.length > 0) {
        dataItem.governorates.forEach(gov => allGovernorates.add(gov));
      }
    });
    
    // Also derive from cities if needed
    const citiesWithData = getCitiesWithData;
    citiesWithData.forEach((city) => {
      for (const [gov, govCities] of Object.entries(CITIES)) {
        if (govCities.includes(city)) {
          allGovernorates.add(gov);
          break;
        }
      }
    });
    
    return Array.from(allGovernorates);
  }, [selectedPlaceTypes, getCitiesWithData, availableData]);

  // Filter governorates by search
  const filteredGovernorates = useMemo(() => {
    if (!governorateSearch) return availableGovernorates;
    return availableGovernorates.filter(gov => 
      gov.toLowerCase().includes(governorateSearch.toLowerCase()) ||
      gov.includes(governorateSearch)
    );
  }, [governorateSearch, availableGovernorates]);

  // Get cities from selected governorates that have data
  const availableCitiesForSelection = useMemo(() => {
    if (selectedPlaceTypes.length === 0) return [];
    const citiesWithData = Array.from(getCitiesWithData);
    if (tempSelectedGovernorates.length === 0) return citiesWithData;
    return citiesWithData.filter(city => {
      for (const gov of tempSelectedGovernorates) {
        const govCities = CITIES[gov] || [];
        if (govCities.includes(city)) return true;
      }
      return false;
    });
  }, [selectedPlaceTypes, tempSelectedGovernorates, getCitiesWithData]);

  // Filter cities by search
  const filteredCities = useMemo(() => {
    if (!citySearch) return availableCitiesForSelection;
    return availableCitiesForSelection.filter(city => 
      city.toLowerCase().includes(citySearch.toLowerCase()) ||
      city.includes(citySearch)
    );
  }, [citySearch, availableCitiesForSelection]);

  // Handle place type selection (multi-select)
  const handlePlaceTypeSelect = (placeType: string) => {
    const isSelected = selectedPlaceTypes.includes(placeType);
    
    if (isSelected) {
      // Deselect
      const newSelected = selectedPlaceTypes.filter(t => t !== placeType);
      setSelectedPlaceTypes(newSelected);
      
      // Update governorates and cities based on remaining selections
      if (newSelected.length === 0) {
        setTempSelectedGovernorates([]);
        setTempSelectedCities([]);
        onPlaceTypeChange?.(null);
      } else {
        // Recalculate based on remaining place types
        const allCities = new Set<string>();
        const allGovernorates = new Set<string>();
        
        newSelected.forEach(type => {
          const dataItem = availableData.find(d => d.type === type);
          if (dataItem?.cities) {
            dataItem.cities.forEach(city => {
              allCities.add(city);
              // Find governorate for city
              for (const [gov, govCities] of Object.entries(CITIES)) {
                if (govCities.includes(city)) {
                  allGovernorates.add(gov);
                  break;
                }
              }
            });
          }
        });
        
        setTempSelectedGovernorates(Array.from(allGovernorates));
        setTempSelectedCities(Array.from(allCities));
        onPlaceTypeChange?.(newSelected.join(','));
      }
    } else {
      // Select
      const newSelected = [...selectedPlaceTypes, placeType];
      setSelectedPlaceTypes(newSelected);
      
      // Merge cities and governorates from all selected types
      const allCities = new Set<string>();
      const allGovernorates = new Set<string>();
      
      newSelected.forEach(type => {
        const dataItem = availableData.find(d => d.type === type);
        if (dataItem?.cities) {
          dataItem.cities.forEach(city => {
            allCities.add(city);
            // Find governorate for city
            for (const [gov, govCities] of Object.entries(CITIES)) {
              if (govCities.includes(city)) {
                allGovernorates.add(gov);
                break;
              }
            }
          });
        }
        // Also add governorates directly if available
        if (dataItem?.governorates) {
          dataItem.governorates.forEach(gov => allGovernorates.add(gov));
        }
      });
      
      setTempSelectedGovernorates(Array.from(allGovernorates));
      setTempSelectedCities(Array.from(allCities));
      onPlaceTypeChange?.(newSelected.join(','));
    }
  };

  // Apply selections
  const handleApplySelections = () => {
    onGovernoratesChange?.(tempSelectedGovernorates);
    onCitiesChange?.(tempSelectedCities);
    setShowPlaceTypeSelector(false);
  };

  // Reset when place type changes externally
  useEffect(() => {
    setTempSelectedGovernorates(selectedGovernorates);
    setTempSelectedCities(selectedCities);
  }, [selectedGovernorates, selectedCities]);

  const markerPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    places.forEach((place) => {
      const latDiff = (place.lat - mapCenter.lat) * 2000;
      const lngDiff = (place.lng - mapCenter.lng) * 2000;
      const x = 50 + lngDiff;
      const y = 50 - latDiff;
      positions.set(place.id, {
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(10, Math.min(85, y))
      });
    });
    return positions;
  }, [places, mapCenter]);

  const journeyPlaceIds = useMemo(() => {
    return new Set(journeyPlaces.map(p => p.id));
  }, [journeyPlaces]);

  const journeyPlaceIndices = useMemo(() => {
    const indices = new Map<string, number>();
    journeyPlaces.forEach((place, index) => {
      indices.set(place.id, index);
    });
    return indices;
  }, [journeyPlaces]);

  return (
    <div className="relative w-full h-full overflow-hidden" onClick={() => onPlaceSelect(null)}>
      <div 
        className="absolute inset-0 bg-background"
        style={{
          background: isDark
            ? `linear-gradient(135deg, var(--card) 0%, var(--card) 25%, var(--card) 50%, var(--card) 75%, var(--card) 100%)`
            : `linear-gradient(135deg, #e8f4f8 0%, #d4e8e8 25%, #c8dcd8 50%, #e0ece4 75%, #f0f8f4 100%)`,
        }}
      >
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg" style={{ willChange: 'contents' }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? 'var(--border)' : '#9ca3af'} strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="absolute inset-0" style={{ willChange: 'contents' }}>
          {useMemo(() => [...Array(6)].map((_, i) => (
            <div
              key={`block-${i}`}
              className={`absolute rounded-sm ${isDark ? 'bg-muted/15' : 'bg-[#d4ddd8]/30'}`}
              style={{
                width: `${18 + (i % 3) * 5}%`,
                height: `${12 + (i % 2) * 4}%`,
                left: `${(i % 3) * 30 + 5}%`,
                top: `${Math.floor(i / 3) * 45 + 15}%`,
                willChange: 'transform',
              }}
            />
          )), [isDark])}
        </div>
      </div>

      {journeyPlaces.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ willChange: 'contents' }}>
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4A90D9" />
              <stop offset="100%" stopColor="#6BA3E0" />
            </linearGradient>
          </defs>
          {journeyPlaces.slice(0, -1).map((place, i) => {
            const from = markerPositions.get(place.id);
            const to = markerPositions.get(journeyPlaces[i + 1].id);
            if (!from || !to) return null;
            return (
              <motion.line
                key={`route-${i}`}
                x1={`${from.x}%`}
                y1={`${from.y}%`}
                x2={`${to.x}%`}
                y2={`${to.y}%`}
                stroke="url(#routeGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="8,8"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                style={{ willChange: 'stroke-dasharray, opacity' }}
              />
            );
          })}
        </svg>
      )}

      {userLocation && (
        <div
          className="absolute z-0 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: '50%',
            top: '50%',
            willChange: 'transform',
          }}
        >
          {radiusKm !== null && radiusKm > 0 && (
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/40 bg-primary/10"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                left: '50%',
                top: '50%',
                width: `${radiusKm * 18}px`,
                height: `${radiusKm * 18}px`,
                willChange: 'transform, opacity',
              }}
            />
          )}
          <div className="relative">
            <motion.div
              className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4A90D9]/30"
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.1, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ left: '50%', top: '50%', willChange: 'transform, opacity' }}
            />
            <div className="w-4 h-4 rounded-full bg-primary border-3 border-card shadow-lg" style={{ willChange: 'transform' }} />
          </div>
        </div>
      )}

      {places.map((place, index) => {
        const pos = markerPositions.get(place.id);
        if (!pos) return null;
        const isSelected = selectedPlace?.id === place.id;
        const isInJourney = journeyPlaceIds.has(place.id);
        const journeyIndex = journeyPlaceIndices.get(place.id) ?? -1;
        const isCurrentTarget = isJourneyMode && journeyIndex === currentTargetIndex;

        return (
          <motion.div
            key={place.id}
            className="absolute z-0 cursor-pointer"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              willChange: 'transform',
            }}
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => {
              e.stopPropagation();
              onPlaceSelect(place);
            }}
          >
            {isCurrentTarget && (
              <motion.div
                className="absolute rounded-full bg-[#4A90D9]"
                style={{ width: 60, height: 60, left: -8, top: -8, willChange: 'transform, opacity' }}
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <motion.div
              animate={{ scale: isSelected ? 1.12 : 1 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative flex items-center justify-center w-11 h-11 rounded-xl shadow-elevated transition-all duration-200"
              style={{
                background: (isSelected || isInJourney) 
                  ? getStatusColorLight(place.status)
                  : 'var(--card)',
                border: 'none',
                boxShadow: isSelected 
                  ? `0 8px 24px ${isDark ? 'rgba(74, 144, 217, 0.5)' : 'rgba(74, 144, 217, 0.4)'}` 
                  : isDark 
                    ? '0 4px 12px rgba(0,0,0,0.3)' 
                    : '0 4px 12px rgba(0,0,0,0.15)',
                willChange: 'transform',
              }}
            >
              {getPlaceIcon(place.type, 'w-5 h-5', isSelected ? 'primary' : 'light')}
              {isInJourney && journeyIndex >= 0 ? (
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-primary text-xs font-bold flex items-center justify-center shadow-sm border-2 border-primary">
                  {journeyIndex + 1}
                </div>
              ) : (
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-primary text-xs font-bold flex items-center justify-center shadow-sm border-2" style={{ borderColor: getStatusColor(place.status) }}>
                  {index + 1}
                </div>
              )}
              {place.isImportant && !isInJourney && (
                <div className="absolute -top-1 -left-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </div>
              )}
            </motion.div>
          </motion.div>
        );
      })}

      <div className="absolute top-4 right-4 left-4 pointer-events-none z-40">
        <div className="glass rounded-2xl px-4 py-3 shadow-elevated pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTheme();
                }}
                className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                title={mounted && theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
              >
                {mounted && theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-white" />
                ) : (
                  <Moon className="w-4 h-4 text-white" />
                )}
              </button>
              <span className="font-bold text-lg">مسار</span>
            </div>
            {isJourneyMode && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  المحطة {currentTargetIndex + 1} من {journeyPlaces.length}
                </span>
                <div className="flex gap-1">
                  {journeyPlaces.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i < currentTargetIndex
                          ? 'bg-[#34C759]'
                          : i === currentTargetIndex
                          ? 'bg-[#4A90D9]'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {!isJourneyMode && (
              <Popover open={showPlaceTypeSelector} onOpenChange={setShowPlaceTypeSelector}>
                <PopoverTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (availableData.length > 0) {
                        setShowPlaceTypeSelector(true);
                      } else {
                        onLocationEdit?.();
                      }
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground px-3 py-2 rounded-xl transition-colors cursor-pointer max-w-[200px] justify-between group shrink-0"
                  >
                    <span className="text-right truncate">
                      {selectedPlaceTypes.length > 0 ? (() => {
                        const typeLabels = selectedPlaceTypes.map(type => {
                          const typeInfo = PLACE_TYPES.find(t => t.value === type);
                          return typeInfo?.label || type;
                        }).join('، ');
                        const cityText = selectedCities.length === 0
                          ? 'المدينة'
                          : selectedCities.length === 1
                            ? selectedCities[0]
                            : `${selectedCities.length} مدينة`;
                        const govText = selectedGovernorates.length === 0
                          ? 'المحافظة'
                          : selectedGovernorates.length === 1
                            ? selectedGovernorates[0]
                            : `${selectedGovernorates.length} محافظة`;
                        return `${typeLabels} - ${cityText}، ${govText}`;
                      })() : (() => {
                        const cityText = selectedCities.length === 0
                          ? 'المدينة'
                          : selectedCities.length === 1
                            ? selectedCities[0]
                            : `${selectedCities.length} مدينة`;
                        const govText = selectedGovernorates.length === 0
                          ? 'المحافظة'
                          : selectedGovernorates.length === 1
                            ? selectedGovernorates[0]
                            : `${selectedGovernorates.length} محافظة`;
                        return `${cityText}، ${govText}`;
                      })()}
                    </span>
                    <Edit className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto min-w-[280px] max-w-[320px] p-0 mt-2" align="end" side="bottom">
                  <div className="p-4 space-y-4">
                    {/* Place Type Selection - Vertical List */}
                    <div>
                      <p className="text-sm font-medium mb-3 text-right">اختر نوع المكان</p>
                      <div className="space-y-2">
                        {availablePlaceTypes.map((type) => {
                          const dataItem = availableData.find(d => d.type === type.value);
                          const count = dataItem?.count || 0;
                          const isSelected = selectedPlaceTypes.includes(type.value);
                          
                          return (
                            <button
                              key={type.value}
                              onClick={() => handlePlaceTypeSelect(type.value)}
                              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all text-right ${
                                isSelected
                                  ? 'bg-primary/10 border-2 border-primary text-primary shadow-sm'
                                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border-2 border-transparent hover:border-border'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {isSelected && (
                                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" strokeWidth={2.5} />
                                )}
                                <div className={isSelected ? 'text-primary' : 'text-muted-foreground'}>
                                  {type.icon}
                                </div>
                                <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                  {type.label}
                                </span>
                              </div>
                              {count > 0 && (
                                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                                  isSelected
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {count} {count === 1 ? 'مكان' : 'أماكن'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Governorates and Cities Dropdowns - Horizontal */}
                    {selectedPlaceTypes.length > 0 && availableGovernorates.length > 0 && (
                      <div className="flex gap-2">
                        {/* Governorates Dropdown */}
                        <Popover open={showGovernoratesDropdown} onOpenChange={setShowGovernoratesDropdown}>
                          <PopoverTrigger asChild>
                            <button className="flex-1 flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted border border-border rounded-xl transition-colors text-right">
                              <ChevronDownIcon className="w-4 h-4 opacity-50 shrink-0" />
                              <span className="flex-1 text-right">
                                {tempSelectedGovernorates.length === 0
                                  ? 'اختر المحافظات'
                                  : tempSelectedGovernorates.length === 1
                                    ? tempSelectedGovernorates[0]
                                    : `${tempSelectedGovernorates.length} محافظة`}
                              </span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start" side="bottom">
                            <div className="mb-2">
                              <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                  type="text"
                                  placeholder="ابحث عن محافظة..."
                                  value={governorateSearch}
                                  onChange={(e) => setGovernorateSearch(e.target.value)}
                                  className="w-full pr-9 pl-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                  dir="rtl"
                                />
                              </div>
                            </div>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {filteredGovernorates.length > 0 ? (
                                <>
                                  <label className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">
                                    <Checkbox
                                      checked={filteredGovernorates.every(gov => tempSelectedGovernorates.includes(gov))}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          const newGovs = [...new Set([...tempSelectedGovernorates, ...filteredGovernorates])];
                                          setTempSelectedGovernorates(newGovs);
                                        } else {
                                          setTempSelectedGovernorates(prev => prev.filter(g => !filteredGovernorates.includes(g)));
                                          // Remove cities from deselected governorates
                                          const govsToRemove = filteredGovernorates;
                                          const citiesToRemove = new Set<string>();
                                          govsToRemove.forEach(gov => {
                                            const govCities = CITIES[gov] || [];
                                            govCities.forEach(city => citiesToRemove.add(city));
                                          });
                                          setTempSelectedCities(prev => prev.filter(c => !citiesToRemove.has(c)));
                                        }
                                      }}
                                    />
                                    <span className="text-sm font-medium">اختيار الكل</span>
                                  </label>
                                  {filteredGovernorates.map((gov) => (
                                    <label
                                      key={gov}
                                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={tempSelectedGovernorates.includes(gov)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setTempSelectedGovernorates([...tempSelectedGovernorates, gov]);
                                          } else {
                                            const newGovs = tempSelectedGovernorates.filter(g => g !== gov);
                                            setTempSelectedGovernorates(newGovs);
                                            // Remove cities from deselected governorate
                                            const govCities = CITIES[gov] || [];
                                            setTempSelectedCities(prev => prev.filter(c => !govCities.includes(c)));
                                          }
                                        }}
                                      />
                                      <span className="text-sm">{gov}</span>
                                    </label>
                                  ))}
                                </>
                              ) : (
                                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                  لا توجد نتائج
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>

                        {/* Cities Dropdown */}
                        {availableCitiesForSelection.length > 0 && (
                          <Popover open={showCitiesDropdown} onOpenChange={setShowCitiesDropdown}>
                            <PopoverTrigger asChild>
                              <button className="flex-1 flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-foreground bg-muted/50 hover:bg-muted border border-border rounded-xl transition-colors text-right">
                                <ChevronDownIcon className="w-4 h-4 opacity-50 shrink-0" />
                                <span className="flex-1 text-right">
                                  {tempSelectedCities.length === 0
                                    ? 'اختر المدن'
                                    : tempSelectedCities.length === 1
                                      ? tempSelectedCities[0]
                                      : `${tempSelectedCities.length} مدينة`}
                                </span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-2" align="start" side="bottom">
                              <div className="mb-2">
                                <div className="relative">
                                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <input
                                    type="text"
                                    placeholder="ابحث عن مدينة..."
                                    value={citySearch}
                                    onChange={(e) => setCitySearch(e.target.value)}
                                    className="w-full pr-9 pl-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    dir="rtl"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1 max-h-48 overflow-y-auto">
                                {filteredCities.length > 0 ? (
                                  <>
                                    {tempSelectedGovernorates.length > 0 && (
                                      <label className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer">
                                        <Checkbox
                                          checked={filteredCities.every(city => tempSelectedCities.includes(city))}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              const newCities = [...new Set([...tempSelectedCities, ...filteredCities])];
                                              setTempSelectedCities(newCities);
                                            } else {
                                              setTempSelectedCities(prev => prev.filter(c => !filteredCities.includes(c)));
                                            }
                                          }}
                                        />
                                        <span className="text-sm font-medium">اختيار الكل</span>
                                      </label>
                                    )}
                                    {filteredCities.map((city) => (
                                      <label
                                        key={city}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={tempSelectedCities.includes(city)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setTempSelectedCities([...tempSelectedCities, city]);
                                            } else {
                                              setTempSelectedCities(tempSelectedCities.filter(c => c !== city));
                                            }
                                          }}
                                        />
                                        <span className="text-sm">{city}</span>
                                      </label>
                                    ))}
                                  </>
                                ) : (
                                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                    لا توجد نتائج
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    )}

                    {/* Apply Button */}
                    {selectedPlaceTypes.length > 0 && (
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <button
                          onClick={() => {
                            setSelectedPlaceTypes([]);
                            setTempSelectedGovernorates([]);
                            setTempSelectedCities([]);
                            setShowPlaceTypeSelector(false);
                            onPlaceTypeChange?.(null);
                            onGovernoratesChange?.([]);
                            onCitiesChange?.([]);
                          }}
                          className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted rounded-xl transition-colors"
                        >
                          إعادة تعيين
                        </button>
                        <button
                          onClick={handleApplySelections}
                          disabled={tempSelectedGovernorates.length === 0 || tempSelectedCities.length === 0}
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          تطبيق
                        </button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}