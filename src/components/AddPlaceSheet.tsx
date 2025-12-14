'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, X, Check, Loader2 } from 'lucide-react';
import { Place, PlaceType, PLACE_TYPES, GOVERNORATES, CITIES } from '@/lib/types';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPlaceIcon } from '@/lib/store';

interface AddPlaceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (place: Omit<Place, 'id' | 'createdAt'>) => void;
  userLocation: { lat: number; lng: number } | null;
}

export function AddPlaceSheet({ isOpen, onClose, onSave, userLocation }: AddPlaceSheetProps) {
  const [placeName, setPlaceName] = useState('');
  const [placeType, setPlaceType] = useState<PlaceType>('other');
  const [governorate, setGovernorate] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

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
      setGovernorate('');
      setCity('');
      setLocation(userLocation);
    }
  }, [isOpen, userLocation]);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('المتصفح لا يدعم تحديد الموقع');
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

  const availableCities = governorate ? (CITIES[governorate] || []) : [];

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

    const newPlace: Omit<Place, 'id' | 'createdAt'> = {
      name: placeName.trim(),
      type: placeType,
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

  const canSave = placeName.trim() && governorate && city && location;

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
      title="إضافة مكان جديد"
      contentClassName="p-0"
      aria-label="إضافة مكان جديد"
    >
      <div className="px-6 pb-6 space-y-6">
        {/* Place Name */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            اسم المكان
          </label>
          <Input
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            placeholder="أدخل اسم المكان"
            className="bg-card border-border text-foreground"
            dir="rtl"
            autoFocus
          />
        </div>

        {/* Place Type */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">نوع المكان</label>
          <Select value={placeType} onValueChange={(value) => setPlaceType(value as PlaceType)}>
            <SelectTrigger className="bg-card border-border text-foreground" dir="rtl">
              <SelectValue>
                <div className="flex items-center gap-2">
                  {getPlaceIcon(placeType, 'w-4 h-4', 'light')}
                  <span>{PLACE_TYPES.find(t => t.value === placeType)?.label || placeType}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent dir="rtl">
              {PLACE_TYPES.map((type) => (
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

        {/* Governorate */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">المحافظة</label>
          <Select value={governorate} onValueChange={(value) => {
            setGovernorate(value);
            setCity(''); // Reset city when governorate changes
          }}>
            <SelectTrigger className="bg-card border-border text-foreground" dir="rtl">
              <SelectValue placeholder="اختر المحافظة" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              {GOVERNORATES.map((gov) => (
                <SelectItem key={gov} value={gov}>
                  {gov}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground">المدينة</label>
          <Select 
            value={city} 
            onValueChange={setCity}
            disabled={!governorate || availableCities.length === 0}
          >
            <SelectTrigger className="bg-card border-border text-foreground" dir="rtl">
              <SelectValue placeholder={governorate ? "اختر المدينة" : "اختر المحافظة أولاً"} />
            </SelectTrigger>
            <SelectContent dir="rtl">
              {availableCities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            الموقع
          </label>
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            {location ? (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-green-500" />
                <span>تم الحصول على الموقع</span>
                <span className="text-muted-foreground text-xs">
                  ({location.lat.toFixed(6)}, {location.lng.toFixed(6)})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <X className="w-4 h-4 text-red-500" />
                <span>لم يتم الحصول على الموقع</span>
              </div>
            )}
            <Button
              onClick={handleGetCurrentLocation}
              disabled={isGettingLocation}
              variant="outline"
              className="w-full"
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
        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="w-full h-14 text-lg font-semibold gradient-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-5 h-5 ms-2" />
          حفظ المكان
        </Button>
      </div>
    </BottomSheet>
  );
}
