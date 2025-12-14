'use client';

import { memo, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Plus, ExternalLink, MessageCircle, ChevronLeft, Car, Ruler, Clock, Globe, Facebook, Copy, Check, FileText } from 'lucide-react';
import { Place } from '@/lib/types';
import { getPlaceIcon, getStatusColor, formatDistance, formatDuration, calculateDistance } from '@/lib/store';
import { STATUS_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface PlaceCardProps {
  place: Place;
  userLocation?: { lat: number; lng: number } | null;
  onAddToJourney?: () => void;
  onOpenInMaps?: () => void;
  onCall?: () => void;
  onWhatsApp?: () => void;
  isInJourney?: boolean;
  variant?: 'popup' | 'card' | 'journey';
  journeyIndex?: number;
  onClose?: () => void;
  notesCount?: number;
  onDetailsClick?: () => void;
}

function PlaceCardComponent({
  place,
  userLocation,
  onAddToJourney,
  onOpenInMaps,
  onCall,
  onWhatsApp,
  isInJourney = false,
  variant = 'card',
  journeyIndex,
  onClose,
  notesCount = 0,
  onDetailsClick,
}: PlaceCardProps) {
  const distance = useMemo(() => {
    if (!userLocation) return null;
    return calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng);
  }, [userLocation, place.lat, place.lng]);

  const estimatedTime = useMemo(() => {
    return distance ? Math.round(distance * 3) : null;
  }, [distance]);

  const [copied, setCopied] = useState(false);

  if (variant === 'popup') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="rounded-2xl p-4 w-fit max-w-[90vw] box-border relative bg-card/95 backdrop-blur-md"
        style={{ willChange: 'transform, opacity' }}
      >
        {notesCount > 0 && (
          <div className="absolute top-4 end-4 z-20">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1 bg-primary/10 text-primary border-2 border-dotted border-primary/30">
              <FileText className="w-3 h-3 text-primary" />
              {notesCount}
            </span>
          </div>
        )}
        <div className="flex items-start justify-between mb-3 gap-2 w-fit">
          <div className="flex items-center gap-2 min-w-0">
            {getPlaceIcon(place.type, 'w-6 h-6', 'light')}
            <div className="min-w-0">
              <h3 className="font-bold text-lg leading-tight">{place.name}</h3>
            </div>
          </div>
        </div>

        {place.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 w-fit">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{place.address}</span>
          </div>
        )}

        {place.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 w-fit">
            <Phone className="w-4 h-4 shrink-0" />
            <span dir="ltr" className="font-medium">{place.phone}</span>
            <div className="relative shrink-0">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(place.phone || '');
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

        <div className="flex items-center gap-2 mb-4 w-fit flex-wrap">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium text-white whitespace-nowrap shrink-0"
            style={{ backgroundColor: getStatusColor(place.status) }}
          >
            {STATUS_LABELS[place.status]}
          </span>
          {distance && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1 bg-primary/10 text-primary">
              <Ruler className="w-3 h-3" />
              {formatDistance(distance)}
            </span>
          )}
          {estimatedTime && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-500">
              <Clock className="w-3 h-3" />
              {formatDuration(estimatedTime)}
            </span>
          )}
        </div>

          <div className="flex items-center gap-2 mb-1 w-fit flex-wrap">
            <Button
              onClick={onAddToJourney}
              className={`${isInJourney ? 'bg-green-500 dark:bg-green-600' : 'gradient-primary'} text-white shrink-0 min-w-fit me-0`}
              size="sm"
            >
              <div className="relative w-4 h-4 ms-1 shrink-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isInJourney ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0, rotate: 180 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="plus"
                      initial={{ scale: 0, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0, rotate: 180 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className="whitespace-nowrap">{isInJourney ? 'في الرحلة' : 'أضف للرحلة'}</span>
            </Button>
          {(onOpenInMaps || (place.lat && place.lng)) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenInMaps) {
                  onOpenInMaps();
                } else if (place.lat && place.lng) {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }
              }}
              className="h-8 w-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors shrink-0"
              title="فتح في خرائط جوجل"
            >
              <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
            </motion.button>
          )}
          {place.phone && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                if (onWhatsApp) {
                  onWhatsApp();
                } else if (place.phone) {
                  const phoneNumber = place.phone.replace(/[^0-9]/g, '');
                  const url = `https://wa.me/${phoneNumber}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                }
              }}
              className="h-8 w-8 rounded-full bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center transition-colors shrink-0"
              title="واتساب"
            >
              <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </motion.button>
          )}
          {place.phone && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                if (onCall) onCall();
              }}
              className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors shrink-0"
              title="اتصال"
            >
              <Phone className="w-4 h-4 text-primary" />
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  if (variant === 'journey') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="bg-card rounded-2xl p-4 shadow-elevated"
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Compact Header: Place Name, Phone, Distance, Time */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shrink-0">
            {getPlaceIcon(place.type, 'w-6 h-6', 'primary')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-lg text-foreground truncate">{place.name}</h3>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium text-white shrink-0"
                style={{ backgroundColor: getStatusColor(place.status) }}
              >
                {place.status === 'new' ? 'زيارة أولى' : STATUS_LABELS[place.status]}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
              {place.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 shrink-0 text-[#4A90D9]" />
                  <span dir="ltr">{place.phone.replace(/[^0-9]/g, '')}</span>
                </div>
              )}
              {distance && (
                <>
                  {place.phone && <span>•</span>}
                  <span>{formatDistance(distance)}</span>
                </>
              )}
              {estimatedTime && (
                <>
                  <span>•</span>
                  <span>{estimatedTime} د.ق</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Address and Action Buttons */}
        <div className="flex items-center gap-2 justify-between">
          {place.address ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <MapPin className="w-4 h-4 shrink-0 text-[#4A90D9]" />
              <p className="text-sm text-muted-foreground truncate">{place.address}</p>
            </div>
          ) : (
            <div className="flex-1" />
          )}
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              onClick={onOpenInMaps}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"
              title="فتح في خرائط جوجل"
            >
              <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
            </motion.button>
            {place.phone && (
              <>
                <motion.button
                  onClick={onWhatsApp}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center transition-colors"
                  title="واتساب"
                >
                  <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </motion.button>
                <motion.button
                  onClick={onCall}
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
      </motion.div>
    );
  }

  const statusColor = getStatusColor(place.status);
  const primaryColor = '#4A90D9';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`rounded-xl p-4 transition-all duration-200 cursor-pointer ${
        isInJourney
          ? 'glass shadow-soft hover:bg-card/90'
          : 'bg-card shadow-soft border border-border/50 hover:shadow-md hover:border-border/80'
      } hover:scale-[1.01] active:scale-[0.99]`}
      style={isInJourney ? {
        border: `2px dotted ${primaryColor}`,
        borderSpacing: '2px',
        backgroundColor: `${primaryColor}15`,
        willChange: 'transform, opacity'
      } : {
        willChange: 'transform, opacity'
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <div
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-150 ${
              isInJourney
                ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(74,144,217,0.25)]'
                : 'bg-muted/40 text-muted-foreground border-border/70'
            }`}
            style={
              isInJourney
                ? undefined
                : {
                    color: statusColor,
                    borderColor: `${statusColor}66`,
                    backgroundColor: `${statusColor}12`,
                  }
            }
          >
            <AnimatePresence mode="wait">
              {isInJourney ? (
                <motion.div
                  key="selected"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex items-center justify-center"
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                </motion.div>
              ) : (
                <motion.div
                  key="add"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.75} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-semibold text-base leading-tight truncate">{place.name}</h3>
                <span
                  className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: statusColor }}
                >
                  {STATUS_LABELS[place.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <span className="truncate">{place.city}</span>
                {distance && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="whitespace-nowrap">{formatDistance(distance)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {place.phone && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span dir="ltr" className="truncate font-medium">{place.phone}</span>
              </div>
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await navigator.clipboard.writeText(place.phone || '');
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch (err) {
                      console.error('Failed to copy:', err);
                    }
                  }}
                  className="p-1.5 hover:bg-muted/50 rounded-md transition-colors"
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
          <div className="flex items-center gap-2 mt-2.5">
            {place.phone && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onCall) onCall();
                }}
                className="w-8 h-8 rounded-full bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
                title="اتصال"
              >
                <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </motion.button>
            )}
            {place.phone && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onWhatsApp) onWhatsApp();
                }}
                className="w-8 h-8 rounded-full bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center transition-colors"
                title="واتساب"
              >
                <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </motion.button>
            )}
            {place.website && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(place.website, '_blank', 'noopener,noreferrer');
                }}
                className="w-8 h-8 rounded-full bg-purple-500/10 hover:bg-purple-500/20 flex items-center justify-center transition-colors"
                title="الموقع الإلكتروني"
              >
                <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </motion.button>
            )}
            {place.facebook && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(place.facebook, '_blank', 'noopener,noreferrer');
                }}
                className="w-8 h-8 rounded-full bg-blue-600/10 hover:bg-blue-600/20 flex items-center justify-center transition-colors"
                title="صفحة فيسبوك"
              >
                <Facebook className="w-4 h-4 text-blue-700 dark:text-blue-500" />
              </motion.button>
            )}
          </div>
        </div>
        {onDetailsClick ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDetailsClick();
            }}
            className="w-5 h-5 text-muted-foreground/60 shrink-0 mt-1 hover:text-primary transition-colors flex items-center justify-center"
            title="عرض التفاصيل"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <ChevronLeft className="w-5 h-5 text-muted-foreground/60 shrink-0 mt-1" />
        )}
      </div>
    </motion.div>
  );
}

export const PlaceCard = memo(PlaceCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.place.id === nextProps.place.id &&
    prevProps.place.status === nextProps.place.status &&
    prevProps.isInJourney === nextProps.isInJourney &&
    prevProps.variant === nextProps.variant &&
    prevProps.userLocation?.lat === nextProps.userLocation?.lat &&
    prevProps.userLocation?.lng === nextProps.userLocation?.lng
  );
});
