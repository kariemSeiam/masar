'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, X, Check, Loader2, Search, ChevronDownIcon } from 'lucide-react';
import { Place, PlaceType, PLACE_TYPES, GOVERNORATES, CITIES } from '@/types';
import { BottomSheet } from '@/components/common/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPlaceIcon } from '@/lib/utils/place';

interface AddPlaceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (place: Omit<Place, 'id' | 'createdAt'>) => void;
  userLocation: { lat: number; lng: number } | null;
  availableData?: { type: string; count: number; cities?: string[]; governorates?: string[] }[];
}

export function AddPlaceSheet({ isOpen, onClose, onSave, userLocation, availableData = [] }: AddPlaceSheetProps) {
  const [placeName, setPlaceName] = useState('');
  const [placeType, setPlaceType] = useState<PlaceType>('other');
  const [customPlaceType, setCustomPlaceType] = useState('');
  const [governorate, setGovernorate] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [governorateSearch, setGovernorateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [isGovernorateInputEditable, setIsGovernorateInputEditable] = useState(false);
  const [isCityInputEditable, setIsCityInputEditable] = useState(false);
  const governorateInputRef = useRef<HTMLInputElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && userLocation) {
      setLocation(userLocation);
    }
  }, [isOpen, userLocation]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when closed
      setPlaceName('');
      setPlaceType('other');
      setCustomPlaceType('');
      setGovernorate('');
      setCity('');
      setLocation(userLocation);
      setGovernorateSearch('');
      setCitySearch('');
      setIsGovernorateInputEditable(false);
      setIsCityInputEditable(false);
    }
  }, [isOpen, userLocation]);

  // Filter governorates based on search
  const filteredGovernorates = useMemo(() => {
    if (!governorateSearch.trim()) return GOVERNORATES;
    return GOVERNORATES.filter(gov => 
      gov.toLowerCase().includes(governorateSearch.toLowerCase())
    );
  }, [governorateSearch]);

  const availableCities = governorate ? (CITIES[governorate] || []) : [];

  // Get place types that exist in availableData
  const availablePlaceTypes = useMemo(() => {
    if (!availableData || availableData.length === 0) {
      // If no data, return all PLACE_TYPES with "other" at the end
      const allTypes = [...PLACE_TYPES];
      const otherIndex = allTypes.findIndex(t => t.value === 'other');
      if (otherIndex > -1) {
        const other = allTypes.splice(otherIndex, 1)[0];
        allTypes.push(other);
      }
      return allTypes;
    }
    
    // Extract unique types from availableData
    const typesInData = new Set(availableData.map(d => d.type).filter(Boolean));
    
    // Filter PLACE_TYPES to only include types that exist in data, plus always include "other"
    const filtered = PLACE_TYPES.filter(type => 
      typesInData.has(type.value) || type.value === 'other'
    );
    
    // Move "other" to the end if it exists
    const otherIndex = filtered.findIndex(t => t.value === 'other');
    if (otherIndex > -1) {
      const other = filtered.splice(otherIndex, 1)[0];
      filtered.push(other);
    }
    
    return filtered;
  }, [availableData]);

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return availableCities;
    return availableCities.filter(c => 
      c.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [citySearch, availableCities]);

  const handleGetCurrentLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      if (typeof window !== 'undefined') {
        alert('المتصفح لا يدعم تحديد الموقع');
      }
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        if (userLocation) {
          setLocation(userLocation);
        }
        setIsGettingLocation(false);
      }
    );
  }, [userLocation]);

  const handleSave = () => {
    if (!placeName.trim()) {
      alert('يرجى إدخال اسم المكان');
      return;
    }
    if (!governorate) {
      alert('يرجى اختيار المحافظة');
      return;
    }
    if (!city) {
      alert('يرجى اختيار المدينة');
      return;
    }
    if (!location) {
      alert('يرجى الحصول على الموقع الحالي');
      return;
    }
    if (placeType === 'other' && !customPlaceType.trim()) {
      alert('يرجى إدخال نوع المكان');
      return;
    }

    const newPlace: Omit<Place, 'id' | 'createdAt'> = {
      name: placeName.trim(),
      type: placeType,
      customType: placeType === 'other' && customPlaceType.trim() ? customPlaceType.trim() : undefined,
      governorate,
      city,
      lat: location.lat,
      lng: location.lng,
      status: 'new',
      isImportant: false,
    };

    onSave(newPlace);
    onClose();
  };

  const canSave = placeName.trim() && governorate && city && location && (placeType !== 'other' || customPlaceType.trim());

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0.85, 0.95]}
      defaultSnapPoint={0}
      enableDrag={true}
      enableBackdropDismiss={true}
      closeOnDragDown={true}
      dragThreshold={80}
      showCloseButton={true}
      autoSize={true}
      title="إضافة مكان جديد"
      contentClassName="p-0"
      aria-label="إضافة مكان جديد"
    >
      <div className="px-6 pb-6 space-y-5">
        {/* Place Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            اسم المكان
          </label>
          <Input
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="أدخل اسم المكان"
            className="bg-card border-border text-foreground h-10 w-full"
            dir="rtl"
            autoFocus
          />
        </div>

        {/* Place Type */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground block">نوع المكان</label>
          <div className="flex items-center gap-3">
            {/* Type Input - always visible, locked when not "other", editable when "other" */}
            <Input
              value={placeType === 'other' ? customPlaceType : (PLACE_TYPES.find(t => t.value === placeType)?.label || '')}
              onChange={(e) => {
                if (placeType === 'other') {
                  setCustomPlaceType(e.target.value);
                }
              }}
              placeholder={placeType === 'other' ? 'أدخل نوع المكان' : 'اختر نوع المكان'}
              className="bg-card border-border text-foreground h-10 flex-1"
              dir="rtl"
              readOnly={placeType !== 'other'}
              inputMode={placeType === 'other' ? 'text' : 'none'}
              tabIndex={placeType === 'other' ? 0 : -1}
            />
            {/* Select - on end (right in RTL) */}
            <div className="w-32 shrink-0">
              <Select value={placeType} onValueChange={(value) => {
                setPlaceType(value as PlaceType);
                if (value !== 'other') {
                  setCustomPlaceType('');
                }
              }}>
                <SelectTrigger 
                  className="bg-card border-border text-foreground h-10 w-full !w-full" 
                  dir="rtl"
                  style={{ width: '100%' }}
                >
                  <SelectValue>
                    <div className="flex items-center gap-2 w-full">
                      {getPlaceIcon(placeType, 'w-4 h-4', 'light')}
                      <span className="flex-1 text-right">{PLACE_TYPES.find(t => t.value === placeType)?.label || placeType}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {(availablePlaceTypes || PLACE_TYPES).map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Governorate and City - Horizontal Layout */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Governorate */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">المحافظة</label>
              <Popover onOpenChange={(open) => {
                if (!open) {
                  setIsGovernorateInputEditable(false);
                  setGovernorateSearch('');
                  if (governorateInputRef.current) {
                    governorateInputRef.current.blur();
                  }
                }
              }}>
                <PopoverTrigger asChild>
                  <button 
                    type="button"
                    className="bg-card border border-border text-foreground w-full h-10 rounded-md px-3 text-sm flex items-center justify-between gap-2 hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    dir="rtl"
                    onMouseDown={(e) => e.preventDefault()}
                    onTouchStart={(e) => e.preventDefault()}
                  >
                    <span className={governorate ? '' : 'text-muted-foreground'}>
                      {governorate || 'اختر المحافظة'}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 opacity-50 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="p-2" 
                  align="start"
                  side="bottom"
                  onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    if (governorateInputRef.current) {
                      governorateInputRef.current.blur();
                    }
                  }}
                >
                  <div className="mb-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        ref={governorateInputRef}
                        type="text"
                        placeholder="ابحث..."
                        value={governorateSearch}
                        onChange={(e) => setGovernorateSearch(e.target.value)}
                        onClick={() => setIsGovernorateInputEditable(true)}
                        onFocus={() => setIsGovernorateInputEditable(true)}
                        readOnly={!isGovernorateInputEditable}
                        inputMode={isGovernorateInputEditable ? "text" : "none"}
                        tabIndex={isGovernorateInputEditable ? 0 : -1}
                        className="w-full pr-9 pl-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {filteredGovernorates.length > 0 ? (
                      filteredGovernorates.map((gov) => (
                        <button
                          key={gov}
                          type="button"
                          onClick={() => {
                            setGovernorate(gov);
                            setCity('');
                            setCitySearch('');
                            setIsGovernorateInputEditable(false);
                            setGovernorateSearch('');
                          }}
                          className={`w-full text-right px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm ${
                            governorate === gov ? 'bg-primary/10 text-primary' : ''
                          }`}
                        >
                          {gov}
                        </button>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        لا توجد نتائج
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* City */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground block">المدينة</label>
              <Popover onOpenChange={(open) => {
                if (!open) {
                  setIsCityInputEditable(false);
                  setCitySearch('');
                  if (cityInputRef.current) {
                    cityInputRef.current.blur();
                  }
                }
              }}>
                <PopoverTrigger asChild>
                  <button 
                    type="button"
                    disabled={!governorate || availableCities.length === 0}
                    className="bg-card border border-border text-foreground w-full h-10 rounded-md px-3 text-sm flex items-center justify-between gap-2 hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    dir="rtl"
                    onMouseDown={(e) => e.preventDefault()}
                    onTouchStart={(e) => e.preventDefault()}
                  >
                    <span className={city ? '' : 'text-muted-foreground'}>
                      {city || (governorate ? 'اختر المدينة' : 'اختر المحافظة أولاً')}
                    </span>
                    <ChevronDownIcon className="w-4 h-4 opacity-50 shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="p-2" 
                  align="start"
                  side="bottom"
                  onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    if (cityInputRef.current) {
                      cityInputRef.current.blur();
                    }
                  }}
                >
                  <div className="mb-2">
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        ref={cityInputRef}
                        type="text"
                        placeholder="ابحث..."
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        onClick={() => setIsCityInputEditable(true)}
                        onFocus={() => setIsCityInputEditable(true)}
                        readOnly={!isCityInputEditable}
                        inputMode={isCityInputEditable ? "text" : "none"}
                        tabIndex={isCityInputEditable ? 0 : -1}
                        className="w-full pr-9 pl-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        dir="rtl"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {filteredCities.length > 0 ? (
                      filteredCities.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCity(c);
                            setIsCityInputEditable(false);
                            setCitySearch('');
                          }}
                          className={`w-full text-right px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm ${
                            city === c ? 'bg-primary/10 text-primary' : ''
                          }`}
                        >
                          {c}
                        </button>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        {governorate ? 'لا توجد نتائج' : 'اختر المحافظة أولاً'}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            الموقع
          </label>
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            {location ? (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                <span>تم الحصول على الموقع</span>
                <span className="text-muted-foreground text-xs">
                  ({location.lat.toFixed(6)}, {location.lng.toFixed(6)})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <X className="w-4 h-4 text-red-500 shrink-0" />
                <span>لم يتم الحصول على الموقع</span>
              </div>
            )}
            <Button
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              variant="outline"
              className="w-full h-10"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 ms-2 animate-spin" />
                  جاري الحصول على الموقع...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 ms-2" />
                  الحصول على الموقع الحالي
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full h-12 text-base font-semibold gradient-primary text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Check className="w-5 h-5 ms-2" />
            حفظ المكان
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
