'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle, Calendar, XCircle, Clock, Star, BarChart3, FileText, Filter, Map as MapIcon, PenSquare } from 'lucide-react';
import { Visit, Place } from '@/lib/types';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval, isSameDay, isSameMonth, isSameWeek } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { PlaceDetailsSheet } from '@/components/PlaceDetailsSheet';

interface HistoryScreenProps {
  visits: Visit[];
  onNavigateToPlan?: () => void;
  places?: Place[];
  onPlaceSelect?: (place: Place | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  onAddNote?: (placeId: string, note: string) => void;
  onDeleteNote?: (visitId: string) => void;
  onTogglePlace?: (place: Place) => void;
}

const outcomeIcons: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  visited: { icon: CheckCircle, color: '#34C759', bg: 'bg-green-50 dark:bg-green-950/30' },
  postponed: { icon: Calendar, color: '#F5A623', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  closed: { icon: XCircle, color: '#8E8E93', bg: 'bg-muted' },
  not_found: { icon: XCircle, color: '#FF3B30', bg: 'bg-red-50 dark:bg-red-950/30' },
};

type FilterType = 'all' | 'today' | 'week' | 'month' | 'custom';

export function HistoryScreen({ 
  visits, 
  onNavigateToPlan,
  places = [],
  onPlaceSelect,
  userLocation,
  onAddNote,
  onDeleteNote,
  onTogglePlace,
}: HistoryScreenProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [baseDate, setBaseDate] = useState<Date>(new Date()); // Base date for navigation
  const [customDateRange, setCustomDateRange] = useState<{from?: Date; to?: Date} | undefined>({from: new Date(), to: new Date()});
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // Calculate date range based on filter type
  const dateRange = useMemo(() => {
    switch (filterType) {
      case 'all':
        // For "all", we don't need a date range - all visits will be shown
        return {
          start: new Date(0),
          end: new Date(),
        };
      case 'today':
        const today = new Date();
        return {
          start: startOfDay(today),
          end: endOfDay(today),
        };
      case 'week':
        return {
          start: startOfWeek(baseDate, { locale: ar }),
          end: endOfWeek(baseDate, { locale: ar }),
        };
      case 'month':
        return {
          start: startOfMonth(baseDate),
          end: endOfMonth(baseDate),
        };
      case 'custom':
        if (customDateRange?.from && customDateRange?.to) {
          return {
            start: startOfDay(customDateRange.from),
            end: endOfDay(customDateRange.to),
          };
        }
        return {
          start: startOfDay(baseDate),
          end: endOfDay(baseDate),
        };
      default:
        return {
          start: startOfDay(baseDate),
          end: endOfDay(baseDate),
        };
    }
  }, [filterType, baseDate, customDateRange]);

  // Filter visits based on date range
  const filteredVisits = useMemo(() => {
    if (filterType === 'all') {
      return visits; // Return all visits without filtering
    }
    return visits.filter((visit) => {
      const visitDate = new Date(visit.date);
      return isWithinInterval(visitDate, dateRange);
    });
  }, [visits, dateRange, filterType]);

  const visitedCount = filteredVisits.filter((v) => v.outcome === 'visited').length;
  const postponedCount = filteredVisits.filter((v) => v.outcome === 'postponed').length;

  // Format date range display
  const getDateRangeDisplay = () => {
    switch (filterType) {
      case 'all':
        return {
          label: 'الكل',
          date: 'جميع الزيارات',
        };
      case 'today':
        return {
          label: 'اليوم',
          date: format(new Date(), 'd MMMM yyyy', { locale: ar }),
        };
      case 'week':
        return {
          label: 'هذا الأسبوع',
          date: `${format(dateRange.start, 'd MMMM', { locale: ar })} - ${format(dateRange.end, 'd MMMM yyyy', { locale: ar })}`,
        };
      case 'month':
        return {
          label: 'هذا الشهر',
          date: format(dateRange.start, 'MMMM yyyy', { locale: ar }),
        };
      case 'custom':
        if (customDateRange?.from && customDateRange?.to) {
          const isSame = isSameDay(customDateRange.from, customDateRange.to);
          return {
            label: 'مخصص',
            date: isSame
              ? format(customDateRange.from, 'd MMMM yyyy', { locale: ar })
              : `${format(customDateRange.from, 'd MMMM', { locale: ar })} - ${format(customDateRange.to, 'd MMMM yyyy', { locale: ar })}`,
          };
        }
        return {
          label: 'مخصص',
          date: format(new Date(), 'd MMMM yyyy', { locale: ar }),
        };
      default:
        return {
          label: 'الكل',
          date: 'جميع الزيارات',
        };
    }
  };

  const dateDisplay = getDateRangeDisplay();

  const handleFilterChange = (newFilter: FilterType) => {
    setFilterType(newFilter);
    if (newFilter === 'custom') {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
      // Reset base date to today when switching to non-custom filters
      setBaseDate(new Date());
    }
  };

  const handleCustomDateApply = () => {
    if (customDateRange?.from && customDateRange?.to) {
      setShowCustomPicker(false);
    }
  };

  // Navigation functions for each filter type
  const navigatePeriod = (direction: 'prev' | 'next') => {
    switch (filterType) {
      case 'all':
      case 'today':
        // No navigation for "all" and "today" filters
        break;
      case 'week': {
        const newDate = new Date(baseDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        setBaseDate(newDate);
        break;
      }
      case 'month': {
        const newDate = new Date(baseDate);
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        setBaseDate(newDate);
        break;
      }
      case 'custom': {
        if (customDateRange?.from && customDateRange?.to) {
          const daysDiff = Math.ceil((customDateRange.to.getTime() - customDateRange.from.getTime()) / (1000 * 60 * 60 * 24));
          const newCustomStart = new Date(customDateRange.from);
          newCustomStart.setDate(newCustomStart.getDate() + (direction === 'next' ? daysDiff + 1 : -(daysDiff + 1)));
          const newCustomEnd = new Date(newCustomStart);
          newCustomEnd.setDate(newCustomEnd.getDate() + daysDiff);
          setCustomDateRange({ from: newCustomStart, to: newCustomEnd });
        }
        break;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir="rtl">
      <div className="sticky top-0 z-20 glass border-b border-border/50">
        <div className="px-4 pl-0 py-3">
          {/* Title and View Mode Toggle */}
          <div className="flex items-center justify-between mb-3 ml-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary" strokeWidth={2} />
              </div>
              <h1 className="text-lg font-bold text-right leading-tight">السجل</h1>
            </div>
            <button
              onClick={() => onNavigateToPlan?.()}
              className="w-12 h-12 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors shrink-0"
              aria-label="التجهيز"
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3.5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center justify-center shrink-0 ${
                filterType === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => handleFilterChange('today')}
              className={`px-3.5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center justify-center shrink-0 ${
                filterType === 'today'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => handleFilterChange('week')}
              className={`px-3.5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center justify-center shrink-0 ${
                filterType === 'week'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              هذا الأسبوع
            </button>
            <button
              onClick={() => handleFilterChange('month')}
              className={`px-3.5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center justify-center shrink-0 ${
                filterType === 'month'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              هذا الشهر
            </button>
            <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
              <PopoverTrigger asChild>
                <button
                  onClick={() => handleFilterChange('custom')}
                  className={`px-3.5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center justify-center gap-1.5 shrink-0 ${
                    filterType === 'custom'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 shrink-0" />
                  مخصص
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2 text-right">اختر الفترة الزمنية</p>
                    <CalendarComponent
                      mode="range"
                      selected={customDateRange}
                      onSelect={setCustomDateRange}
                      locale={ar}
                      numberOfMonths={1}
                    />
                  </div>
                  <Button
                    onClick={handleCustomDateApply}
                    className="w-full"
                    disabled={!customDateRange?.from || !customDateRange?.to}
                  >
                    تطبيق
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

        </div>
      </div>

      <div className="px-4 pt-3 pb-8">
        <div className="h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide">
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl shadow-soft p-4"
            >
              {/* Summary Header with Date Display and Navigation */}
              <div className="flex items-center justify-between gap-3 mb-3" dir='rtl'>
                {/* Left: Summary Title */}
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-semibold text-right">
                    {filterType === 'all' && 'ملخص الكل'}
                    {filterType === 'today' && 'ملخص اليوم'}
                    {filterType === 'week' && 'ملخص الأسبوع'}
                    {filterType === 'month' && 'ملخص الشهر'}
                    {filterType === 'custom' && 'ملخص الفترة'}
                  </span>
                </div>

                {/* Right: Date Display with Navigation */}
                {filterType !== 'all' && filterType !== 'today' && (
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <motion.button
                      onClick={() => navigatePeriod('prev')}
                      whileTap={{ scale: 0.95 }}
                      className="w-8 h-8 rounded-lg hover:bg-primary/5 hover:text-primary flex items-center justify-center transition-all shrink-0 text-muted-foreground"
                      aria-label="الفترة السابقة"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>

                    {/* Date Display */}
                    <motion.div
                      key={`${dateDisplay.label}-${dateDisplay.date}`}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-1.5 px-0 py-1.5 min-w-0"
                    >
                      <span className="text-xs font-semibold text-foreground whitespace-nowrap leading-tight">
                        {dateDisplay.date}
                      </span>
                    </motion.div>

                    {/* Next Button */}
                    <motion.button
                      onClick={() => navigatePeriod('next')}
                      whileTap={{ scale: 0.95 }}
                      className="w-8 h-8 rounded-lg hover:bg-primary/5 hover:text-primary flex items-center justify-center transition-all shrink-0 text-muted-foreground"
                      aria-label="الفترة التالية"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
                {(filterType === 'all' || filterType === 'today') && (
                  <div className="text-xs font-semibold text-muted-foreground">
                    {dateDisplay.date}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-500 dark:text-green-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{visitedCount}</p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70">زيارة</p>
                </div>

                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl">
                  <Calendar className="w-6 h-6 text-orange-500 dark:text-orange-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{postponedCount}</p>
                  <p className="text-xs text-orange-600/70 dark:text-orange-400/70">مؤجل</p>
                </div>

                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                  <Clock className="w-6 h-6 text-blue-500 dark:text-blue-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">4:30</p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">ساعة</p>
                </div>
              </div>
            </motion.div>

            <div className="space-y-3">
            {filteredVisits.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-muted-foreground/50" />
                </div>
                <h3 className="font-semibold text-lg mb-1">لا توجد زيارات</h3>
                <p className="text-muted-foreground text-sm">
                  مفيش زيارات مسجلة في اليوم ده
                </p>
              </motion.div>
            ) : (
              filteredVisits.map((visit, index) => {
                const outcomeInfo = outcomeIcons[visit.outcome];
                const place = places.find(p => p.id === visit.placeId);
                const isManualNote = visit.isManualNote === true;
                return (
                  <motion.div
                    key={visit.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-xl p-4 shadow-soft cursor-pointer hover:bg-muted/50 transition-colors" 
                    dir='rtl'
                    onClick={() => {
                      if (place) {
                        setSelectedPlace(place);
                        onPlaceSelect?.(place);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isManualNote ? (
                            <PenSquare className="w-4 h-4 shrink-0 text-purple-500 dark:text-purple-400" />
                          ) : (
                            (() => {
                              const Icon = outcomeInfo.icon;
                              return <Icon className="w-4 h-4 shrink-0" style={{ color: outcomeInfo.color }} />;
                            })()
                          )}
                          <h3 className="font-semibold">{visit.placeName}</h3>
                        </div>

                        {visit.notes && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2 line-clamp-2">
                            <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>"{visit.notes}"</span>
                          </div>
                        )}

                        {visit.rating && (
                          <div className="flex gap-0.5 justify-start">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= visit.rating!
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-muted-foreground/50'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="w-px h-full bg-border self-stretch min-h-[60px]" />

                      <div className="text-sm text-muted-foreground font-medium whitespace-nowrap">
                        {format(visit.checkInTime, 'hh:mm a', { locale: ar })}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            </div>
          </div>
        </div>
      </div>

      {/* PlaceDetailsSheet */}
      {selectedPlace && (
        <PlaceDetailsSheet
          place={selectedPlace}
          isOpen={!!selectedPlace}
          onClose={() => {
            setSelectedPlace(null);
            onPlaceSelect?.(null);
          }}
          userLocation={userLocation}
          visits={visits}
          isInJourney={false}
          onAddToJourney={selectedPlace && onTogglePlace ? () => onTogglePlace(selectedPlace) : undefined}
          onRemoveFromJourney={undefined}
          onAddNote={selectedPlace && onAddNote ? (note: string) => onAddNote(selectedPlace.id, note) : undefined}
          onDeleteNote={onDeleteNote}
        />
      )}
    </div>
  );
}
