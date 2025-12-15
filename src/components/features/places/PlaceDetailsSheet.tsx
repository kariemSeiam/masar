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
  ExternalLink,
  Edit,
} from 'lucide-react';
import { Place, Visit, STATUS_LABELS, PLACE_TYPES } from '@/types';
import { getPlaceIcon, getStatusColor, getPlaceTypeLabel } from '@/lib/utils/place';
import { BottomSheet } from '@/components/common/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getGoogleMapsDirectionUrl } from '@/lib/utils/maps';
import { getWhatsAppUrl } from '@/lib/utils/phone';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { MESSAGES } from '@/lib/constants/messages';

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
  onAddPlace?: () => void;
  onDeletePlace?: () => void;
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
  onAddPlace,
  onDeletePlace,
}: PlaceDetailsSheetProps) {
  const { copied, copy } = useCopyToClipboard();
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);
  const [isContactExpanded, setIsContactExpanded] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Filter visits for this place
  const placeVisits = useMemo(() => {
    if (!place) return [];
    return visits.filter((v) => v.placeId === place.id && v.notes && v.notes.trim());
  }, [visits, place]);

  // Get place type label
  const placeTypeLabel = useMemo(() => {
    if (!place) return '';
    return getPlaceTypeLabel(place);
  }, [place]);

  // Long address (combine governorate + city + address)
  const longAddress = useMemo(() => {
    if (!place) return '';
    const parts = [place.governorate, place.city, place.address].filter(Boolean);
    return parts.join('، ');
  }, [place]);

  const handleCopyPhone = useCallback(() => {
    if (!place?.phone) return;
    copy(place.phone);
  }, [place, copy]);

  const handleCall = useCallback(() => {
    if (!place?.phone || typeof window === 'undefined') return;
    window.open(`tel:${place.phone}`, '_blank');
  }, [place]);

  const handleWhatsApp = useCallback(() => {
    if (!place?.phone || typeof window === 'undefined') return;
    const url = getWhatsAppUrl(place.phone);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [place]);

  const handleNavigate = useCallback(() => {
    if (!place || typeof window === 'undefined') return;
    const url = getGoogleMapsDirectionUrl(place.lat, place.lng);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [place]);

  const handleOpenWebsite = useCallback(() => {
    if (!place?.website || typeof window === 'undefined') return;
    window.open(place.website, '_blank', 'noopener,noreferrer');
  }, [place]);

  const handleOpenFacebook = useCallback(() => {
    if (!place?.facebook || typeof window === 'undefined') return;
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
      showCloseButton={false}
      autoSize={true}
      title={place.name}
      headerSubtitle={
        <>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: statusColor }}
          >
            {STATUS_LABELS[place.status]}
          </span>
          <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
            {placeTypeLabel}
          </span>
          {place.rating !== undefined && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{place.rating}</span>
              {place.ratingCount !== undefined && (
                <span className="text-xs text-amber-600/80 dark:text-amber-400/80">({place.ratingCount})</span>
              )}
            </div>
          )}
        </>
      }
      contentClassName="p-0"
      aria-label="تفاصيل المكان"
      headerActions={
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onDeletePlace?.()}
            disabled={!onDeletePlace}
            className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title="حذف المكان"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleJourney}
            className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-colors ${
              isInJourney
                ? 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700'
                : 'bg-primary/10 hover:bg-primary/20'
            }`}
            title={isInJourney ? 'في الرحلة' : 'أضف للرحلة'}
          >
            <AnimatePresence mode="wait">
              {isInJourney ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus className="w-4 h-4 text-primary" strokeWidth={2.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      }
    >
      <div className="px-4 pb-6 space-y-3">

        {/* Location Section - Collapsible */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-card rounded-2xl shadow-soft border border-border/50 overflow-hidden"
        >
          <button
            onClick={() => setIsLocationExpanded(!isLocationExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-base text-foreground">الموقع</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigate();
                }} 
                variant="outline" 
                className="h-8 px-3 text-xs font-medium border-border/50 hover:bg-primary/5 hover:border-primary/30"
                size="sm"
              >
                <Navigation className="w-3 h-3 ms-1.5" />
                <span>الخرائط</span>
              </Button>
              <motion.div
                animate={{ rotate: isLocationExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </button>
          <AnimatePresence>
            {isLocationExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-4">
                  {place.governorate && (
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-muted-foreground min-w-[70px] shrink-0">المحافظة:</span>
                      <span className="text-sm font-medium text-foreground">{place.governorate}</span>
                    </div>
                  )}
                  {place.city && (
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-muted-foreground min-w-[70px] shrink-0">المنطقة:</span>
                      <span className="text-sm font-medium text-foreground">{place.city}</span>
                    </div>
                  )}
                  {longAddress && (
                    <div className="flex items-start gap-3 pt-2 border-t border-border/30">
                      <span className="text-xs font-semibold text-muted-foreground min-w-[70px] shrink-0">الكامل:</span>
                      <span className="text-sm font-medium text-foreground leading-relaxed flex-1">{longAddress}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Contact Section - Collapsible */}
        {(place.phone || place.website || place.facebook) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
            className="bg-card rounded-2xl shadow-soft border border-border/50 overflow-hidden"
          >
            <button
              onClick={() => setIsContactExpanded(!isContactExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-base text-foreground">معلومات الاتصال</h3>
              </div>
              <motion.div
                animate={{ rotate: isContactExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isContactExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                    {place.phone && (
                      <div className="bg-muted/30 rounded-xl p-3 space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <Phone className="w-4 h-4 text-primary shrink-0" />
                          <span dir="ltr" className="text-sm font-bold text-foreground">
                            {place.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCopyPhone}
                            className="flex-1 h-9 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center gap-1.5 transition-colors"
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
                                  className="flex items-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                  <span className="text-xs font-medium text-green-600 dark:text-green-400">تم</span>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="copy"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex items-center gap-1.5"
                                >
                                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span className="text-xs font-medium text-muted-foreground">نسخ</span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCall}
                            className="flex-1 h-9 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center gap-1.5 transition-colors"
                            title="اتصال"
                          >
                            <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">اتصال</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleWhatsApp}
                            className="flex-1 h-9 rounded-lg bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center gap-1.5 transition-colors"
                            title="واتساب"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">واتساب</span>
                          </motion.button>
                        </div>
                      </div>
                    )}
                    {(place.website || place.facebook) && (
                      <div className="grid grid-cols-2 gap-2">
                        {place.website && (
                          <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleOpenWebsite}
                            className="flex items-center gap-2 bg-muted/30 rounded-lg p-2.5 hover:bg-muted/50 transition-all border border-border/30"
                          >
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                              <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-xs font-semibold text-foreground text-right flex-1 leading-tight">الموقع</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                          </motion.button>
                        )}
                        {place.facebook && (
                          <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleOpenFacebook}
                            className="flex items-center gap-2 bg-muted/30 rounded-lg p-2.5 hover:bg-muted/50 transition-all border border-border/30"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center shrink-0">
                              <Facebook className="w-4 h-4 text-blue-700 dark:text-blue-500" />
                            </div>
                            <span className="text-xs font-semibold text-foreground text-right flex-1 leading-tight">فيسبوك</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Notes Section - Collapsible */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="bg-card rounded-2xl shadow-soft border border-border/50 overflow-hidden"
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-base text-foreground">
                الملاحظات
                {placeVisits.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ms-2">({placeVisits.length})</span>
                )}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {placeVisits.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                  className="w-9 h-9 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                >
                  <motion.div
                    animate={{ rotate: isNotesExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </motion.button>
              )}
              {!isAddingNote && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddingNote(true)}
                  className="w-9 h-9 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
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
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-4">
                  <div className="space-y-3 bg-muted/30 rounded-xl p-3.5">
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="اكتب ملاحظة جديدة..."
                      className="bg-card border-border min-h-[90px] resize-none text-sm"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="flex-1 gradient-primary text-white h-9 text-sm font-medium"
                        size="sm"
                      >
                        <Check className="w-3.5 h-3.5 ms-2" />
                        إضافة
                      </Button>
                      <Button
                        onClick={() => {
                          setIsAddingNote(false);
                          setNewNote('');
                        }}
                        variant="outline"
                        size="sm"
                        className="h-9 text-sm font-medium"
                      >
                        <X className="w-3.5 h-3.5 ms-2" />
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Notes List */}
          <AnimatePresence>
            {isNotesExpanded && placeVisits.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2 border-t border-border/30 pt-4">
                  {placeVisits.map((visit, index) => (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-muted/30 rounded-xl p-3.5 relative group border border-border/20 hover:border-border/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground mb-2 leading-relaxed font-medium">{visit.notes}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">
                              {format(new Date(visit.checkInTime), 'd MMMM yyyy', { locale: ar })}
                            </span>
                            <span>•</span>
                            <span>{format(new Date(visit.checkInTime), 'hh:mm a', { locale: ar })}</span>
                            {visit.rating && (
                              <>
                                <span>•</span>
                                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span className="font-semibold">{visit.rating}</span>
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
                            className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                            title="حذف الملاحظة"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {placeVisits.length === 0 && !isAddingNote && (
            <div className="px-4 pb-4 border-t border-border/30 pt-4">
              <div className="text-center py-6 bg-muted/20 rounded-xl border border-dashed border-border/50">
                <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground">لا توجد ملاحظات</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </BottomSheet>
  );
}
