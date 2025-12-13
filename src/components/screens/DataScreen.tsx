'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, ChevronUp, MapPin, Phone, Star, Download, Settings, BarChart3, Rocket, Sun, Moon, Database, Search, X, ChevronDownIcon, Tag, Clock, CheckCircle2, Sparkles, Zap, TrendingUp } from 'lucide-react';
import { useTheme } from 'next-themes';
import { PLACE_TYPES, GOVERNORATES, CITIES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DataScreenProps {
  availableData: { type: string; count: number; cities?: string[]; governorates?: string[] }[];
}

interface Order {
  id: string;
  placeName: string;
  placeType: string;
  governorates: string[];
  cities: string[];
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed';
}

export function DataScreen({ availableData }: DataScreenProps) {
  const [isAvailableDataExpanded, setIsAvailableDataExpanded] = useState(true);
  const [isNewDataExpanded, setIsNewDataExpanded] = useState(false);
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('');
  const [placeName, setPlaceName] = useState<string>('');
  const [selectedGovernorates, setSelectedGovernorates] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [governorateSearch, setGovernorateSearch] = useState<string>('');
  const [citySearch, setCitySearch] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [deleteCityDialog, setDeleteCityDialog] = useState<{ open: boolean; orderId: string; city: string; governorate: string } | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Get 6 place types excluding "bakery", with "other" last
  const availablePlaceTypes = useMemo(() => {
    const types = PLACE_TYPES.filter(type => type.value !== 'bakery');
    // Move "other" to the end
    const otherIndex = types.findIndex(t => t.value === 'other');
    if (otherIndex > -1) {
      const other = types.splice(otherIndex, 1)[0];
      types.push(other);
    }
    return types;
  }, []);

  // Get cities that have data for the selected place type
  const getCitiesWithData = useMemo(() => {
    if (!selectedType) return new Set<string>();
    const dataItem = availableData.find(d => d.type === selectedType);
    return new Set(dataItem?.cities || []);
  }, [selectedType, availableData]);

  // Handle clicking on available data item
  const handleAvailableDataClick = (type: string) => {
    const typeInfo = PLACE_TYPES.find(t => t.value === type);
    const dataItem = availableData.find(d => d.type === type);
    
    // Set the type and place name
    setSelectedType(type);
    setPlaceName(typeInfo?.label || '');
    
    // Extract governorates and cities from available data
    if (dataItem?.cities && dataItem.cities.length > 0) {
      const availableCities = dataItem.cities;
      const governorates = new Set<string>();
      
      // Find which governorates these cities belong to
      availableCities.forEach((city) => {
        for (const [gov, govCities] of Object.entries(CITIES)) {
          if (govCities.includes(city)) {
            governorates.add(gov);
            break;
          }
        }
      });
      
      setSelectedGovernorates(Array.from(governorates));
      // Automatically add available cities to selection
      setSelectedCities(availableCities);
    } else {
      // If no cities data, reset selections
      setSelectedGovernorates([]);
      setSelectedCities([]);
    }
    
    // Expand the new data form and collapse available data
    setIsNewDataExpanded(true);
    setIsAvailableDataExpanded(false);
  };

  // Get all cities from selected governorates
  const availableCities = useMemo(() => {
    const cities: string[] = [];
    selectedGovernorates.forEach((gov) => {
      const govCities = CITIES[gov] || [];
      cities.push(...govCities);
    });
    return cities;
  }, [selectedGovernorates]);

  // Filter governorates by search
  const filteredGovernorates = useMemo(() => {
    if (!governorateSearch) return GOVERNORATES;
    return GOVERNORATES.filter(gov => 
      gov.toLowerCase().includes(governorateSearch.toLowerCase()) ||
      gov.includes(governorateSearch)
    );
  }, [governorateSearch]);

  // Filter cities by search
  const filteredCities = useMemo(() => {
    if (!citySearch) return availableCities;
    return availableCities.filter(city => 
      city.toLowerCase().includes(citySearch.toLowerCase()) ||
      city.includes(citySearch)
    );
  }, [citySearch, availableCities]);

  // Group selected cities by governorate
  const getCitiesByGovernorate = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    selectedCities.forEach((city) => {
      // Find which governorate this city belongs to
      for (const gov of selectedGovernorates) {
        const govCities = CITIES[gov] || [];
        if (govCities.includes(city)) {
          if (!grouped[gov]) {
            grouped[gov] = [];
          }
          grouped[gov].push(city);
          break;
        }
      }
    });
    return grouped;
  }, [selectedCities, selectedGovernorates]);

  const toggleGovernorate = (gov: string) => {
    setSelectedGovernorates(prev => {
      if (prev.includes(gov)) {
        // Remove governorate and all its cities
        const govCities = CITIES[gov] || [];
        setSelectedCities(current => current.filter(city => !govCities.includes(city)));
        return prev.filter(g => g !== gov);
      } else {
        return [...prev, gov];
      }
    });
  };

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const removeCity = (city: string) => {
    // Allow removing cities even if they have available data
    setSelectedCities(prev => prev.filter(c => c !== city));
  };

  const removeGovernorate = (gov: string) => {
    setSelectedGovernorates(prev => prev.filter(g => g !== gov));
    const govCities = CITIES[gov] || [];
    setSelectedCities(prev => prev.filter(city => !govCities.includes(city)));
  };

  const selectAllCitiesForGov = (gov: string) => {
    const govCities = CITIES[gov] || [];
    const allSelected = govCities.every(city => selectedCities.includes(city));
    if (allSelected) {
      // Deselect all cities for this governorate
      setSelectedCities(prev => prev.filter(city => !govCities.includes(city)));
    } else {
      // Select all cities for this governorate
      setSelectedCities(prev => {
        const newCities = [...prev];
        govCities.forEach(city => {
          if (!newCities.includes(city)) {
            newCities.push(city);
          }
        });
        return newCities;
      });
    }
  };

  const handleAddNewType = () => {
    setIsAvailableDataExpanded(false);
    setTimeout(() => {
      setIsNewDataExpanded(true);
    }, 200);
  };

  // Handle placing order
  const handlePlaceOrder = () => {
    if (!placeName || !selectedType || selectedGovernorates.length === 0 || selectedCities.length === 0) {
      return;
    }

    setOrders(prev => {
      // Check if an order with the same placeName and placeType already exists
      const existingOrderIndex = prev.findIndex(
        order => order.placeName === placeName && order.placeType === selectedType
      );

      if (existingOrderIndex !== -1) {
        // Update existing order by merging cities and governorates
        const existingOrder = prev[existingOrderIndex];
        const newCities = [...new Set([...existingOrder.cities, ...selectedCities])];
        const newGovernorates = [...new Set([...existingOrder.governorates, ...selectedGovernorates])];
        
        const updatedOrders = [...prev];
        updatedOrders[existingOrderIndex] = {
          ...existingOrder,
          cities: newCities,
          governorates: newGovernorates,
          // Keep the original creation date
        };
        
        return updatedOrders;
      } else {
        // Create new order if no existing order found
        const newOrder: Order = {
          id: Date.now().toString(),
          placeName,
          placeType: selectedType,
          governorates: [...selectedGovernorates],
          cities: [...selectedCities],
          createdAt: new Date(),
          status: 'pending'
        };
        
        return [newOrder, ...prev];
      }
    });
    
    // Expand orders section when new order is added/updated
    setIsOrdersExpanded(true);
    
    // Reset form
    setPlaceName('');
    setSelectedType('');
    setSelectedGovernorates([]);
    setSelectedCities([]);
    setIsNewDataExpanded(false);
  };

  const handleDeleteCity = () => {
    if (!deleteCityDialog) return;

    const { orderId, city, governorate } = deleteCityDialog;

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newCities = o.cities.filter(c => c !== city);
        // If no cities left, delete the entire order
        if (newCities.length === 0) {
          return null;
        }
        // Remove governorate if it has no cities left
        const citiesForGov = newCities.filter(c => {
          const govCities = CITIES[governorate] || [];
          return govCities.includes(c);
        });
        const newGovernorates = citiesForGov.length === 0
          ? o.governorates.filter(g => g !== governorate)
          : o.governorates;
        
        return {
          ...o,
          cities: newCities,
          governorates: newGovernorates
        };
      }
      return o;
    }).filter(Boolean) as Order[]);

    setDeleteCityDialog(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/30 pb-32">
      <div className="sticky top-0 z-20 glass border-b border-border/50">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
              title={mounted && theme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن'}
            >
              {mounted && theme === 'dark' ? (
                <Sun className="w-5 h-5 text-white" />
              ) : (
                <Moon className="w-5 h-5 text-white" />
              )}
            </button>
            <div>
              <h1 className="font-bold text-xl">مسار</h1>
              <p className="text-sm text-muted-foreground">طلب البيانات</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="px-4 py-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pb-32 overscroll-y-contain"
        style={{ scrollbarGutter: 'stable' }}
      >
        {/* Orders Section */}
        {orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-soft overflow-hidden relative"
          >
            {/* Gradient Background Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-orange-500/80 to-orange-500/60" />
            
            {/* Header with Premium Design */}
            <button
              onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
              className="w-full px-4 py-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors relative border-b border-border/50 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center shrink-0">
                  <Rocket className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                
                <div className="flex flex-col items-start text-right flex-1">
                  <h2 className="font-semibold text-lg">الطلبات المعلقة</h2>
                  <p className="text-sm text-muted-foreground">{orders.length} {orders.length === 1 ? 'طلب' : 'طلبات'}</p>
                </div>
              </div>
              
              {/* Completion Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-700 dark:text-orange-400" />
                <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                  {orders.filter(o => o.status === 'completed').length}/{orders.length} مكتمل
                </span>
              </div>
            </button>
            
            <AnimatePresence>
              {isOrdersExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 py-4 space-y-3">
              {orders.map((order) => {
                const typeInfo = PLACE_TYPES.find(t => t.value === order.placeType);
                // Group cities by governorate
                const orderCitiesByGov: Record<string, string[]> = {};
                order.cities.forEach((city) => {
                  for (const gov of order.governorates) {
                    const govCities = CITIES[gov] || [];
                    if (govCities.includes(city)) {
                      if (!orderCitiesByGov[gov]) {
                        orderCitiesByGov[gov] = [];
                      }
                      orderCitiesByGov[gov].push(city);
                      break;
                    }
                  }
                });
                
                const isExpanded = expandedOrders.has(order.id);
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-muted/50 rounded-xl border border-border/50 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setExpandedOrders(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(order.id)) {
                            newSet.delete(order.id);
                          } else {
                            newSet.add(order.id);
                          }
                          return newSet;
                        });
                      }}
                      className="w-full p-4 flex items-start justify-between gap-3 hover:bg-muted/70 transition-colors text-right relative"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-primary">{typeInfo?.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{order.placeName}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {order.governorates.length} محافظة • {order.cities.length} مدينة
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                          order.status === 'pending' 
                            ? 'bg-orange-500/20 text-orange-700 dark:text-orange-400'
                            : order.status === 'processing'
                            ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400'
                            : 'bg-green-500/20 text-green-700 dark:text-green-400'
                        }`}>
                          {order.status === 'pending' ? 'قيد الانتظار' : order.status === 'processing' ? 'قيد المعالجة' : 'مكتمل'}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
                            {order.governorates.map((gov) => {
                              const govCities = orderCitiesByGov[gov] || [];
                              return (
                                <div key={gov} className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-xs font-medium">{gov}</span>
                                  </div>
                                  {govCities.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mr-5">
                                      {govCities.map((city) => (
                                        <button
                                          key={city}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteCityDialog({
                                              open: true,
                                              orderId: order.id,
                                              city,
                                              governorate: gov,
                                            });
                                          }}
                                          className="text-[10px] px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary rounded-full hover:bg-destructive/20 hover:border-destructive/50 hover:text-destructive transition-colors"
                                        >
                                          {city}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {availableData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl shadow-soft overflow-hidden"
          >
            <button
              onClick={() => setIsAvailableDataExpanded(!isAvailableDataExpanded)}
              className="w-full px-4 py-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex flex-col items-start text-right">
                  <h2 className="font-semibold text-lg">البيانات المتوفرة</h2>
                  <p className="text-sm text-muted-foreground">{availableData.length} أنواع</p>
                </div>
              </div>
              {isAvailableDataExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
            </button>

            <AnimatePresence>
              {isAvailableDataExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="px-4 pb-4 space-y-2 overflow-hidden"
                >
                {availableData.map((data, index) => {
                  const typeInfo = PLACE_TYPES.find(t => t.value === data.type);
                  return (
                    <motion.button
                      key={data.type}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleAvailableDataClick(data.type)}
                      className="w-full flex items-center justify-between py-3 px-4 bg-muted/50 rounded-xl hover:bg-muted/70 transition-colors text-right"
                    >
                      <div className="flex items-center gap-3">
                        {typeInfo?.icon || <MapPin className="w-5 h-5 text-primary" />}
                        <span className="font-medium">{typeInfo?.label || data.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{data.count} مكان</span>
                      </div>
                    </motion.button>
                  );
                })}

                <button 
                  onClick={handleAddNewType}
                  className="w-full py-3 px-4 border-2 border-dashed border-muted-foreground/30 rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5 group-hover:text-primary" />
                  <span>طلب نوع جديد</span>
                </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl shadow-soft overflow-hidden"
        >
          <button
            onClick={() => setIsNewDataExpanded(!isNewDataExpanded)}
            className="w-full px-4 py-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col items-start text-right">
                <h2 className="font-semibold text-lg">طلب بيانات جديدة</h2>
                <p className="text-sm text-muted-foreground">اختار نوع الأماكن والمنطقة</p>
              </div>
            </div>
            {isNewDataExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
          </button>

          <AnimatePresence>
            {isNewDataExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="px-4 pb-5 pt-1 space-y-4 overflow-hidden bg-card"
              >
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">اسم المكان</label>
                <div className="relative mt-2">
                  <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="اسم المكان"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    className="h-12 rounded-xl pr-10 pl-4"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">نوع المكان</label>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {availablePlaceTypes.map((type) => (
                    <motion.button
                      key={type.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedType(type.value);
                        // Keep input empty for "other" type
                        if (type.value !== 'other') {
                          setPlaceName(type.label);
                        } else {
                          setPlaceName('');
                        }
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                        selectedType === type.value
                          ? 'bg-primary/10 border-2 border-primary text-primary border-solid'
                          : 'bg-muted/50 text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <div className={selectedType === type.value ? 'text-primary' : ''}>{type.icon}</div>
                      <span className="text-sm font-medium">{type.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">المنطقة</label>
                <div className="flex gap-2 mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button 
                        type="button"
                        className="bg-muted/50 h-10 rounded-xl flex-1 px-3 text-sm text-right flex items-center justify-between gap-2 hover:text-primary transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onTouchStart={(e) => e.preventDefault()}
                      >
                        <span className="text-muted-foreground">
                          {selectedGovernorates.length === 0 
                            ? 'المحافظة' 
                            : selectedGovernorates.length === 1 
                              ? selectedGovernorates[0] 
                              : `${selectedGovernorates.length} محافظة`}
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
                                checked={selectedGovernorates.includes(gov)}
                                onCheckedChange={() => toggleGovernorate(gov)}
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
                      <button 
                        type="button"
                        className="bg-muted/50 h-10 rounded-xl flex-1 px-3 text-sm text-right flex items-center justify-between gap-2 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={selectedGovernorates.length === 0}
                        onMouseDown={(e) => e.preventDefault()}
                        onTouchStart={(e) => e.preventDefault()}
                      >
                        <span className="text-muted-foreground">
                          {selectedCities.length === 0 
                            ? 'المدينة' 
                            : selectedCities.length === 1 
                              ? selectedCities[0] 
                              : `${selectedCities.length} مدينة`}
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
                        {selectedGovernorates.length === 0 ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            اختر المحافظة أولاً
                          </div>
                        ) : filteredCities.length > 0 ? (
                          selectedGovernorates.map((gov) => {
                            const govCities = CITIES[gov] || [];
                            const filteredGovCities = filteredCities.filter(city => govCities.includes(city));
                            if (filteredGovCities.length === 0) return null;
                            
                            const allSelected = filteredGovCities.every(city => selectedCities.includes(city));
                            
                            return (
                              <div key={gov} className="space-y-1">
                                <div className="flex items-center justify-between px-2 py-1.5">
                                  <span className="text-xs font-semibold text-muted-foreground">{gov}</span>
                                  <button
                                    onClick={() => selectAllCitiesForGov(gov)}
                                    className="text-xs text-primary font-medium hover:underline"
                                  >
                                    {allSelected ? 'إلغاء الكل' : 'اختيار الكل'}
                                  </button>
                                </div>
                                {filteredGovCities.map((city) => {
                                  const hasData = getCitiesWithData.has(city);
                                  const isSelected = selectedCities.includes(city);
                                  // Lock available cities - they can't be unchecked, but can be removed from summary
                                  const isLocked = hasData;
                                  return (
                                    <label
                                      key={city}
                                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${
                                        hasData 
                                          ? 'bg-green-50 dark:bg-green-900/20' 
                                          : 'hover:bg-accent'
                                      } ${
                                        isLocked && isSelected ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                                      }`}
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        disabled={isLocked && isSelected}
                                        onCheckedChange={() => {
                                          if (!(isLocked && isSelected)) {
                                            // If it has data and is selected, don't allow unchecking
                                            if (!isSelected) {
                                              toggleCity(city);
                                            }
                                          }
                                        }}
                                      />
                                      <div className="flex items-center gap-2 flex-1">
                                        <span className="text-sm">{city}</span>
                                        {hasData && (
                                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-700 dark:text-green-400 rounded-full">
                                            متوفر
                                          </span>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            لا توجد نتائج
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Summary Section */}
              {(selectedGovernorates.length > 0 || selectedCities.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border-2 border-dashed border-muted-foreground/30 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span className="font-semibold">ملخص الطلب</span>
                  </div>
                  
                  {selectedGovernorates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      لا توجد اختيارات
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {selectedGovernorates.map((gov) => {
                        const govCities = getCitiesByGovernorate[gov] || [];
                        return (
                          <div key={gov} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                <span className="font-medium text-sm">{gov}</span>
                              </div>
                              <button
                                onClick={() => removeGovernorate(gov)}
                                className="w-5 h-5 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                              >
                                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                              </button>
                            </div>
                            {govCities.length > 0 ? (
                              <div className="flex flex-wrap gap-2 mr-4">
                                {govCities.map((city) => {
                                  const hasData = getCitiesWithData.has(city);
                                  return (
                                    <motion.div
                                      key={city}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
                                        hasData 
                                          ? 'bg-green-500/20 border border-green-500/50' 
                                          : 'bg-primary/10 border border-primary/30'
                                      }`}
                                    >
                                      <span className={`text-xs font-medium ${
                                        hasData ? 'text-green-700 dark:text-green-400' : 'text-primary'
                                      }`}>{city}</span>
                                      {hasData && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/30 text-green-700 dark:text-green-400 rounded-full">
                                          ✓
                                        </span>
                                      )}
                                      <button
                                        onClick={() => removeCity(city)}
                                        className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                          hasData 
                                            ? 'hover:bg-green-500/20' 
                                            : 'hover:bg-primary/20'
                                        }`}
                                      >
                                        <X className={`w-3 h-3 ${
                                          hasData 
                                            ? 'text-green-700/70 dark:text-green-400/70 hover:text-green-700 dark:hover:text-green-400' 
                                            : 'text-primary/70 hover:text-primary'
                                        }`} />
                                      </button>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground mr-4">لم يتم اختيار مدن</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {selectedType && selectedGovernorates.length > 0 && selectedCities.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-2 border-dashed border-primary/30 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span className="font-semibold">البيانات المتوقعة</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">~180-220 مكان</p>
                  <div className="flex flex-wrap gap-4 sm:gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>~40% بأرقام</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>~76% بتقييمات</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <Button
                className="w-full h-12 sm:h-14 text-lg font-semibold gradient-primary text-white"
                disabled={!placeName || !selectedType || selectedGovernorates.length === 0 || selectedCities.length === 0}
                onClick={handlePlaceOrder}
              >
                <Download className="w-5 h-5 ms-2 text-white" />
                طلب البيانات
              </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {availableData.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-32 h-32 mx-auto mb-6 bg-muted rounded-3xl flex items-center justify-center">
              <MapPin className="w-16 h-16 text-muted-foreground/50" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-xl font-bold">ابدأ رحلتك!</h3>
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              اطلب بيانات الأماكن اللي بتشتغل معاها عشان تجهز رحلاتك
            </p>
            <Button className="gradient-primary text-white px-8">
              <Plus className="w-4 h-4 ms-2 text-white" />
              طلب بيانات صيدليات
            </Button>
          </motion.div>
        )}
      </div>

      <AlertDialog open={deleteCityDialog?.open || false} onOpenChange={(open) => {
        if (!open) {
          setDeleteCityDialog(null);
        }
      }}>
        <AlertDialogContent className="rounded-2xl border border-border/50 bg-card shadow-soft p-6">
          <AlertDialogHeader className="text-right space-y-3 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shrink-0">
                <X className="w-5 h-5 text-white" />
              </div>
              <AlertDialogTitle className="text-lg font-bold text-foreground">حذف المدينة</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
              هل تريد حذف <span className="font-semibold text-foreground">{deleteCityDialog?.city}</span> من هذا الطلب؟
              {deleteCityDialog && (() => {
                const order = orders.find(o => o.id === deleteCityDialog.orderId);
                const cityCount = order?.cities.length || 0;
                return cityCount === 1 ? (
                  <span className="block mt-2 text-xs text-orange-600 dark:text-orange-400">
                    سيتم حذف الطلب بالكامل لأن هذه هي المدينة الوحيدة
                  </span>
                ) : null;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-3 pt-2">
            <AlertDialogCancel className="h-11 px-6 rounded-xl bg-muted/50 hover:bg-muted/70 text-foreground border-0">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCity}
              className="h-11 px-6 rounded-xl gradient-primary text-white hover:opacity-90 shadow-lg"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
