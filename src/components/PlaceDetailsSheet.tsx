'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  MapPin,
  Plus,
  Check,
  Copy,
  Globe,
  Facebook,
  MessageCircle,
  Navigation,
  Star,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Ruler,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Place, Visit, STATUS_LABELS, PLACE_TYPES } from '@/lib/types';
import { getPlaceIcon, getStatusColor, calculateDistance, formatDistance, formatDuration } from '@/lib/store';
import { BottomSheet } from '@/components/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PlaceDetailsSheetProps {
  place: Place | null;
  isOpen: boolean;
  onClose: () => void;
  userLocation?: { lat: number; lng: number } | null;
  visits?: Visit[];
  isInJourney?: boolean;
  onAddToJourney?: () => void;
  onRemoveFromJourney?: () => void;
  onAddNote?: (note: string) => void;
  onDeleteNote?: (visitId: string) => void;
}

export function PlaceDetailsSheet({
  place,
  isOpen,
  onClose,
  userLocation,
  visits = [],
  isInJourney = false,
  onAddToJourney,
  onRemoveFromJourney,
  onDeleteNote,
  onAddNote,
}: PlaceDetailsSheetProps) {
  const [copied, setCopied] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Filter visits for this place
  const placeVisits = useMemo(() => {
    if (!place) return [];
    return visits.filter((v) => v.placeId === place.id && v.notes && v.notes.trim());
  }, [visits, place]);

  // Calculate distance and time
  const distance = useMemo(() => {
    if (!userLocation || !place) return null;
    return calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng);
  }, [userLocation, place]);

  const estimatedTime = useMemo(() => {
    return distance ? Math.round(distance * 3) : null;
  }, [distance]);

  // Get place type label
  const placeTypeLabel = useMemo(() => {
    if (!place) return '';
    const typeInfo = PLACE_TYPES.find((t) => t.value === place.type);
    return typeInfo?.label || place.type;
  }, [place]);

  // Long address (combine governorate + city + address)
  const longAddress = useMemo(() => {
    if (!place) return '';
    const parts = [place.governorate, place.city, place.address].filter(Boolean);
    return parts.join('، ');
  }, [place]);

  const handleCopyPhone = useCallback(async () => {
    if (!place?.phone) return;
    try {
      await navigator.clipboard.writeText(place.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [place]);

  const handleCall = useCallback(() => {
    if (!place?.phone) return;
    window.open(`tel:${place.phone}`, '_blank');
  }, [place]);

  const handleWhatsApp = useCallback(() => {
    if (!place?.phone) return;
    const phoneNumber = place.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phoneNumber}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [place]);

  const handleNavigate = useCallback(() => {
    if (!place) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [place]);

  const handleOpenWebsite = useCallback(() => {
    if (!place?.website) return;
    window.open(place.website, '_blank', 'noopener,noreferrer');
  }, [place]);

  const handleOpenFacebook = useCallback(() => {
    if (!place?.facebook) return;
    window.open(place.facebook, '_blank', 'noopener,noreferrer');
  }, [place]);

  const handleToggleJourney = useCallback(() => {
    if (isInJourney) {
      onRemoveFromJourney?.();
    } else {
      onAddToJourney?.();
    }
  }, [isInJourney, onAddToJourney, onRemoveFromJourney]);

  const handleAddNote = useCallback(() => {
    if (!newNote.trim() || !onAddNote) return;
    onAddNote(newNote.trim());
    setNewNote('');
    setIsAddingNote(false);
  }, [newNote, onAddNote]);

  const handleDeleteNote = useCallback(
    (visitId: string) => {
      if (!onDeleteNote) return;
      onDeleteNote(visitId);
    },
    [onDeleteNote]
  );

  if (!place) return null;

  const statusColor = getStatusColor(place.status);

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0.7, 0.95]}
      defaultSnapPoint={0}
      enableDrag={true}
      enableBackdropDismiss={true}
      closeOnDragDown={true}
      dragThreshold={80}
      showCloseButton={true}
      title={place.name}
      contentClassName="p-0"
      aria-label="تفاصيل المكان"
    >
      <div className="px-6 pb-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-start gap-4 pt-2">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shrink-0">
            {getPlaceIcon(place.type, 'w-8 h-8', 'primary')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h2 className="font-bold text-2xl text-foreground">{place.name}</h2>
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold text-white shrink-0"
                style={{ backgroundColor: statusColor }}
              >
                {STATUS_LABELS[place.status]}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">{placeTypeLabel}</span>
              {place.rating !== undefined && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium text-foreground">{place.rating}</span>
                    {place.ratingCount !== undefined && (
                      <span className="text-xs text-muted-foreground">({place.ratingCount})</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Location Info Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            الموقع
          </h3>
          <div className="space-y-2 bg-muted/30 rounded-xl p-4">
            {place.governorate && (
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-[80px]">المحافظة:</span>
                <span className="text-sm text-foreground">{place.governorate}</span>
              </div>
            )}
            {place.city && (
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-[80px]">المدينة:</span>
                <span className="text-sm text-foreground">{place.city}</span>
              </div>
            )}
            {place.address && (
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground min-w-[80px]">العنوان:</span>
                <span className="text-sm text-foreground">{place.address}</span>
              </div>
            )}
            {longAddress && (
              <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                <span className="text-sm font-medium text-muted-foreground min-w-[80px]">العنوان الكامل:</span>
                <span className="text-sm text-foreground">{longAddress}</span>
              </div>
            )}
            {distance && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Ruler className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{formatDistance(distance)}</span>
                {estimatedTime && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-foreground">{formatDuration(estimatedTime)}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contact Info Section */}
        {(place.phone || place.website || place.facebook) && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              معلومات الاتصال
            </h3>
            <div className="space-y-2">
              {place.phone && (
                <div className="flex items-center justify-between bg-muted/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Phone className="w-5 h-5 text-primary shrink-0" />
                    <span dir="ltr" className="text-base font-medium text-foreground truncate">
                      {place.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopyPhone}
                      className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
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
                          >
                            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="copy"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Copy className="w-5 h-5 text-muted-foreground" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCall}
                      className="w-10 h-10 rounded-full bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center transition-colors"
                      title="اتصال"
                    >
                      <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleWhatsApp}
                      className="w-10 h-10 rounded-full bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center transition-colors"
                      title="واتساب"
                    >
                      <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </motion.button>
                  </div>
                </div>
              )}
              {place.website && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOpenWebsite}
                  className="w-full flex items-center justify-between bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="text-sm font-medium text-foreground">الموقع الإلكتروني</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              )}
              {place.facebook && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOpenFacebook}
                  className="w-full flex items-center justify-between bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Facebook className="w-5 h-5 text-blue-700 dark:text-blue-500 shrink-0" />
                    <span className="text-sm font-medium text-foreground">صفحة فيسبوك</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              )}
            </div>
          </div>
        )}

        {/* Actions Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-foreground">الإجراءات</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleToggleJourney}
              className={`${
                isInJourney
                  ? 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700'
                  : 'gradient-primary'
              } text-white h-12`}
            >
              <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                  {isInJourney ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Check className="w-5 h-5" strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="plus"
                      initial={{ scale: 0, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0, rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Plus className="w-5 h-5" strokeWidth={2.5} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <span>{isInJourney ? 'في الرحلة' : 'أضف للرحلة'}</span>
              </div>
            </Button>
            <Button onClick={handleNavigate} variant="outline" className="h-12">
              <Navigation className="w-5 h-5 ms-2" />
              <span>التنقل</span>
            </Button>
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              الملاحظات ({placeVisits.length})
            </h3>
            <div className="flex items-center gap-2">
              {placeVisits.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                  className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                >
                  {isNotesExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </motion.button>
              )}
              {!isAddingNote && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddingNote(true)}
                  className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4 text-primary" />
                </motion.button>
              )}
            </div>
          </div>

          {/* Add Note Form */}
          <AnimatePresence>
            {isAddingNote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 bg-muted/30 rounded-xl p-4"
              >
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="اكتب ملاحظة جديدة..."
                  className="bg-card border-border min-h-[100px] resize-none"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="flex-1 gradient-primary text-white"
                    size="sm"
                  >
                    <Check className="w-4 h-4 ms-2" />
                    إضافة
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingNote(false);
                      setNewNote('');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <X className="w-4 h-4 ms-2" />
                    إلغاء
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes List */}
          <AnimatePresence>
            {isNotesExpanded && placeVisits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                {placeVisits.map((visit) => (
                  <motion.div
                    key={visit.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-muted/30 rounded-xl p-4 relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground mb-2">{visit.notes}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {format(visit.checkInTime, 'd MMMM yyyy', { locale: ar })}
                          </span>
                          <span>•</span>
                          <span>{format(visit.checkInTime, 'hh:mm a', { locale: ar })}</span>
                          {visit.rating && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{visit.rating}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {onDeleteNote && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteNote(visit.id)}
                          className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                          title="حذف الملاحظة"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {placeVisits.length === 0 && !isAddingNote && (
            <div className="text-center py-8 bg-muted/30 rounded-xl">
              <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد ملاحظات</p>
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
