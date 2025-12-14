'use client';

import { useRef, useCallback, useEffect, useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Star, Sun, Moon, ChevronDownIcon, Search, Check, CheckCircle2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Place, PLACE_TYPES, GOVERNORATES, CITIES } from '@/lib/types';
import { getPlaceIcon, getStatusColor, getStatusColorLight, calculateDistance, formatDistance } from '@/lib/store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Map center updater component (must be outside to avoid hooks order issues)
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  const lastCenterRef = useRef<[number, number] | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear any pending updates
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Check if map is ready and has a valid container
    if (!map || !map.getContainer()) {
      return;
    }
    
    // Skip if center hasn't changed
    if (lastCenterRef.current && 
        Math.abs(lastCenterRef.current[0] - center[0]) < 0.0001 &&
        Math.abs(lastCenterRef.current[1] - center[1]) < 0.0001) {
      return;
    }
    
    try {
      const container = map.getContainer();
      if (!container || !container.parentElement) {
        return;
      }
      
      // Check if map pane exists (indicates map is fully initialized)
      const mapPane = map.getPane('mapPane');
      if (!mapPane) {
        return;
      }
      
      // Debounce updates to prevent rapid successive calls
      timeoutRef.current = setTimeout(() => {
        try {
          if (map && map.getContainer() && map.getPane('mapPane')) {
            // Check if map is in a valid state
            const mapContainer = map.getContainer();
            if (!mapContainer || !mapContainer.offsetParent) {
              return;
            }
            
            const currentCenter = map.getCenter();
            const currentZoom = map.getZoom();
            
            // Only update if center actually changed (avoid unnecessary updates)
            if (
              Math.abs(currentCenter.lat - center[0]) > 0.0001 ||
              Math.abs(currentCenter.lng - center[1]) > 0.0001
            ) {
              map.setView(center, currentZoom, { animate: false });
              lastCenterRef.current = center;
            }
          }
        } catch (error) {
          // Silently handle errors during map updates
          // Only log if it's not the specific Leaflet initialization error
          if (!error || (error as Error).message?.includes('_leaflet_pos')) {
            // This is the known Leaflet initialization issue, ignore it
            return;
          }
          console.warn('Map center update error:', error);
        }
      }, 100);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    } catch (error) {
      // Silently handle errors during map initialization
      if (!error || (error as Error).message?.includes('_leaflet_pos')) {
        return;
      }
      console.warn('Map center update error:', error);
    }
  }, [center, map]);
  return null;
}

// Custom Marker Component (must be outside to avoid hooks order issues)
const CustomMarker = memo(({ place, index, isSelected, isInJourney, journeyIndex, isCurrentTarget, onSelect, darkMode }: {
  place: Place;
  index: number;
  isSelected: boolean;
  isInJourney: boolean;
  journeyIndex: number;
  isCurrentTarget: boolean;
  onSelect: () => void;
  darkMode: boolean;
}) => {
  const markerRef = useRef<L.Marker>(null);
  
  // Get icon SVG path based on place type
  const getIconSvg = (type: string) => {
    const icons: Record<string, string> = {
      pharmacy: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z',
      restaurant: 'M3 2h18l-2 20H5L3 2z',
      cafe: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z',
      supermarket: 'M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z',
      bakery: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      clinic: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
      other: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    };
    return icons[type] || icons.other;
  };
  
  const icon = useMemo(() => {
    const isSelectedOrJourney = isSelected || isInJourney;
    const bgColor = isSelectedOrJourney ? getStatusColorLight(place.status) : (darkMode ? '#1a1a1a' : '#ffffff');
    const iconColor = isSelected ? '#ffffff' : '#4A90D9';
    const shadowColor = isSelected 
      ? (darkMode ? 'rgba(74, 144, 217, 0.5)' : 'rgba(74, 144, 217, 0.4)')
      : (darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)');
    const statusColor = getStatusColor(place.status);
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: ${bgColor};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 ${isSelected ? '8px 24px' : '4px 12px'} ${shadowColor};
          position: relative;
          transform: scale(${isSelected ? 1.12 : 1});
          transition: transform 0.2s;
          border: ${isSelected ? '2px solid #4A90D9' : 'none'};
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="${getIconSvg(place.type)}"/>
          </svg>
          ${isInJourney && journeyIndex >= 0 ? `
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: white;
              color: #4A90D9;
              font-size: 10px;
              font-weight: bold;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              border: 2px solid #4A90D9;
            ">${journeyIndex + 1}</div>
          ` : `
            <div style="
              position: absolute;
              top: -8px;
              right: -8px;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: white;
              color: #4A90D9;
              font-size: 10px;
              font-weight: bold;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              border: 2px solid ${statusColor};
            ">${index + 1}</div>
          `}
          ${place.isImportant && !isInJourney ? `
            <div style="
              position: absolute;
              top: -4px;
              left: -4px;
              width: 12px;
              height: 12px;
            ">
              <svg viewBox="0 0 24 24" fill="#FBBF24" style="width: 100%; height: 100%;">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          ` : ''}
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  }, [place, isSelected, isInJourney, journeyIndex, index, darkMode]);

  return (
    <>
      {isCurrentTarget && (
        <Circle
          center={[place.lat, place.lng]}
          radius={30}
          pathOptions={{
            color: '#4A90D9',
            fillColor: '#4A90D9',
            fillOpacity: 0.3,
          }}
        />
      )}
      <Marker
        ref={markerRef}
        position={[place.lat, place.lng]}
        icon={icon}
        eventHandlers={{
          click: onSelect,
        }}
      >
        <Popup>
          <div className="text-center p-2">
            <p className="font-semibold">{place.name}</p>
            <p className="text-sm text-muted-foreground">{place.city}</p>
          </div>
        </Popup>
      </Marker>
    </>
  );
});

CustomMarker.displayName = 'CustomMarker';

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
  const mapRef = useRef<L.Map | null>(null);
  const [mapCenter] = useState<[number, number]>([30.5877, 31.5020]);
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
    
    // Fix Leaflet default icon issue
    if (typeof window !== 'undefined') {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    }
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
  const prevGovernoratesRef = useRef<string[]>(selectedGovernorates);
  const prevCitiesRef = useRef<string[]>(selectedCities);
  
  useEffect(() => {
    // Only update if arrays are actually different (shallow comparison)
    const governoratesChanged = 
      prevGovernoratesRef.current.length !== selectedGovernorates.length ||
      prevGovernoratesRef.current.some((gov, i) => gov !== selectedGovernorates[i]);
    
    const citiesChanged = 
      prevCitiesRef.current.length !== selectedCities.length ||
      prevCitiesRef.current.some((city, i) => city !== selectedCities[i]);
    
    if (governoratesChanged) {
      setTempSelectedGovernorates(selectedGovernorates);
      prevGovernoratesRef.current = selectedGovernorates;
    }
    
    if (citiesChanged) {
      setTempSelectedCities(selectedCities);
      prevCitiesRef.current = selectedCities;
    }
  }, [selectedGovernorates, selectedCities]);

  // Calculate map center based on places or user location
  const calculatedCenter = useMemo<[number, number]>(() => {
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }
    if (places.length > 0) {
      const avgLat = places.reduce((sum, p) => sum + p.lat, 0) / places.length;
      const avgLng = places.reduce((sum, p) => sum + p.lng, 0) / places.length;
      return [avgLat, avgLng];
    }
    return mapCenter;
  }, [places, userLocation, mapCenter]);

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

  // Journey route coordinates (must be before early return)
  const journeyRoute = useMemo(() => {
    if (journeyPlaces.length < 2) return [];
    return journeyPlaces.map(place => [place.lat, place.lng] as [number, number]);
  }, [journeyPlaces]);

  if (!mounted) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-muted animate-pulse" />
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden" onClick={() => onPlaceSelect(null)}>
      <MapContainer
        center={calculatedCenter}
        zoom={userLocation ? 13 : 11}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
        attributionControl={false}
        className="z-0"
      >
        <MapCenterUpdater center={calculatedCenter} />
        
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          url={isDark 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* User Location Marker */}
        {userLocation && (
          <>
            {radiusKm !== null && radiusKm > 0 && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={radiusKm * 1000}
                pathOptions={{
                  color: '#4A90D9',
                  fillColor: '#4A90D9',
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              />
            )}
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={15}
              pathOptions={{
                color: '#4A90D9',
                fillColor: '#4A90D9',
                fillOpacity: 0.3,
                weight: 2,
              }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={L.divIcon({
                className: 'user-location-marker',
                html: `
                  <div style="
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #4A90D9;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  "></div>
                `,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            />
          </>
        )}

        {/* Journey Route */}
        {journeyRoute.length > 1 && (
          <Polyline
            positions={journeyRoute}
            pathOptions={{
              color: '#4A90D9',
              weight: 4,
              opacity: 0.8,
              dashArray: '8, 8',
            }}
          />
        )}

        {/* Place Markers */}
        {places.map((place, index) => {
          const isSelected = selectedPlace?.id === place.id;
          const isInJourney = journeyPlaceIds.has(place.id);
          const journeyIndex = journeyPlaceIndices.get(place.id) ?? -1;
          const isCurrentTarget = isJourneyMode && journeyIndex === currentTargetIndex;

          return (
            <CustomMarker
              key={place.id}
              place={place}
              index={index}
              isSelected={isSelected}
              isInJourney={isInJourney}
              journeyIndex={journeyIndex}
              isCurrentTarget={isCurrentTarget}
              onSelect={() => onPlaceSelect(place)}
              darkMode={isDark}
            />
          );
        })}
      </MapContainer>

      <div className="absolute top-4 right-4 left-4 pointer-events-none z-[1000]">
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
                    className={`flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground px-3 py-2 rounded-xl transition-colors cursor-pointer max-w-[200px] justify-between group shrink-0 ${
                      selectedCities.length === 0 && selectedGovernorates.length === 0
                        ? 'border border-dashed border-primary/40'
                        : 'border border-transparent'
                    }`}
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
                        // Show hint if no selection yet
                        if (selectedCities.length === 0 && selectedGovernorates.length === 0) {
                          return 'اختر مكان للبدء';
                        }
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