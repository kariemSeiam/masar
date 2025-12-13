'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check, Calendar, XCircle, AlertCircle, Flag, FileText, Plus } from 'lucide-react';
import { Place, VisitOutcome } from '@/lib/types';
import { getPlaceIcon } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BottomSheet } from '@/components/bottom-sheet';

interface CheckInModalProps {
  place: Place;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (outcome: VisitOutcome, notes: string, rating?: number) => void;
}

const outcomes: { id: VisitOutcome; label: string; icon: typeof Check; color: string; lightColor: string; bg: string }[] = [
  { id: 'visited', label: 'تمت الزيارة', icon: Check, color: '#34C759', lightColor: 'rgba(52, 199, 89, 0.3)', bg: 'bg-green-50 dark:bg-green-950/30' },
  { id: 'postponed', label: 'تأجيل', icon: Calendar, color: '#F5A623', lightColor: 'rgba(245, 166, 35, 0.3)', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  { id: 'closed', label: 'مغلق', icon: XCircle, color: '#8E8E93', lightColor: 'rgba(142, 142, 147, 0.3)', bg: 'bg-muted' },
  { id: 'not_found', label: 'غير موجود', icon: AlertCircle, color: '#FF3B30', lightColor: 'rgba(255, 59, 48, 0.3)', bg: 'bg-red-50 dark:bg-red-950/30' },
];

const resultOptions = ['تم البيع', 'مهتم', 'غير مهتم'];

export function CheckInModal({ place, isOpen, onClose, onSubmit }: CheckInModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<VisitOutcome | null>(null);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setSelectedOutcome(null);
      setNotes('');
      setRating(0);
      setSelectedResult(null);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (selectedOutcome) {
      const fullNotes = selectedResult ? `${selectedResult}: ${notes}` : notes;
      onSubmit(selectedOutcome, fullNotes, selectedOutcome === 'visited' ? rating : undefined);
      onClose();
    }
  };

  const hasExtendedContent = selectedOutcome === 'visited';
  const snapPoints = hasExtendedContent ? [0.75, 0.95] : [0.65, 0.9];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={snapPoints}
      defaultSnapPoint={0}
      enableDrag={true}
      enableBackdropDismiss={true}
      closeOnDragDown={true}
      dragThreshold={80}
      showCloseButton={false}
      contentClassName="p-0"
      aria-label="تسجيل زيارة"
    >
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center text-xl shrink-0">
              {getPlaceIcon(place.type, 'w-6 h-6', 'primary')}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-xl text-foreground truncate">{place.name}</h2>
              <p className="text-muted-foreground text-sm">تسجيل زيارة</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all border-2 border-dotted text-foreground hover:opacity-80 shrink-0"
            style={{
              borderColor: 'rgba(74, 144, 217, 0.3)',
              backgroundColor: 'rgba(173, 216, 230, 0.08)',
            }}
          >
            <Plus
              className="w-4 h-4"
              style={{ 
                color: '#4A90D9'
              }}
            />
            <span className="text-xs font-medium" style={{ color: '#4A90D9' }}>
              جديد
            </span>
          </motion.button>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Flag className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-muted-foreground font-medium">وصلت؟</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {outcomes.map((outcome) => {
                    const Icon = outcome.icon;
                    const isSelected = selectedOutcome === outcome.id;
                    return (
                      <motion.button
                        key={outcome.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedOutcome(outcome.id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all border-2 border-dotted ${
                          isSelected
                            ? 'text-white shadow-lg'
                            : 'bg-card text-foreground hover:bg-muted/50'
                        }`}
                        style={{
                          borderColor: outcome.lightColor,
                          ...(isSelected ? {
                            backgroundColor: outcome.color,
                          } : {})
                        }}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isSelected 
                              ? 'bg-white/20 dark:bg-white/10' 
                              : outcome.bg
                          }`}
                        >
                          <Icon
                            className="w-5 h-5"
                            style={{ 
                              color: isSelected 
                                ? 'white' 
                                : outcome.color 
                            }}
                          />
                        </div>
                        <span className={`text-xs font-medium text-center leading-tight ${
                          isSelected ? 'text-white' : 'text-foreground'
                        }`}>
                          {outcome.label}
                        </span>
                      </motion.button>
                    );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedOutcome === 'visited' && (
            <motion.div
              key="visited-content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 overflow-hidden"
            >
                    <div>
                      <p className="text-muted-foreground font-medium mb-3">النتيجة:</p>
                      <div 
                        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
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
                        {resultOptions.map((result) => {
                          const visitedOutcome = outcomes.find(o => o.id === 'visited');
                          return (
                            <button
                              key={result}
                              onClick={() => setSelectedResult(selectedResult === result ? null : result)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border-2 border-dotted whitespace-nowrap shrink-0 ${
                                selectedResult === result
                                  ? 'text-white shadow-md'
                                  : 'bg-card text-foreground hover:bg-muted/50'
                              }`}
                              style={{
                                borderColor: visitedOutcome?.lightColor || 'rgba(52, 199, 89, 0.3)',
                                ...(selectedResult === result ? {
                                  backgroundColor: visitedOutcome?.color || '#34C759',
                                } : {})
                              }}
                            >
                              {result} {selectedResult === result && '✓'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-muted-foreground font-medium">تقييم الزيارة</p>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <p className="text-muted-foreground font-medium">ملاحظات</p>
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder='اكتب ملاحظاتك هنا... مثال: "باع 20 علبة باندول"'
            className="bg-card border-border text-foreground placeholder:text-muted-foreground min-h-[100px] resize-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!selectedOutcome}
          className="w-full h-14 text-lg font-semibold gradient-success text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-shadow"
        >
          <Check className="w-5 h-5 ms-2" />
          حفظ والمتابعة
        </Button>
      </div>
    </BottomSheet>
  );
}
