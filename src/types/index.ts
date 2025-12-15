'use client';

import React from 'react';
import { Pill, Store, Croissant, Building2, Coffee, UtensilsCrossed, MapPin } from 'lucide-react';

export type PlaceType = 'pharmacy' | 'restaurant' | 'cafe' | 'supermarket' | 'bakery' | 'clinic' | 'other';

export type PlaceStatus = 'new' | 'visited' | 'postponed' | 'closed' | 'not_found';

export type VisitOutcome = 'visited' | 'postponed' | 'closed' | 'not_found';

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  governorate: string;
  city: string;
  address?: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  facebook?: string;
  rating?: number;
  ratingCount?: number;
  status: PlaceStatus;
  isImportant: boolean;
  createdAt: string; // ISO string
}

export interface Visit {
  id: string;
  placeId: string;
  placeName: string;
  date: string; // ISO string
  checkInTime: string; // ISO string
  outcome: VisitOutcome;
  notes?: string;
  rating?: number;
  soldItems?: string;
  isManualNote?: boolean; // Indicates if this note was added manually (not from a visit)
}

export interface Journey {
  id: string;
  date: string; // ISO string
  startTime: string; // ISO string
  endTime?: string; // ISO string
  places: string[];
  status: 'planning' | 'active' | 'completed';
  currentIndex: number;
}

export const PLACE_TYPES: { value: PlaceType; label: string; icon: React.ReactNode }[] = [
  { value: 'pharmacy', label: 'صيدلية', icon: React.createElement(Pill, { className: 'w-6 h-6 text-primary' }) },
  { value: 'supermarket', label: 'ماركت', icon: React.createElement(Store, { className: 'w-6 h-6 text-primary' }) },
  { value: 'bakery', label: 'مخبز', icon: React.createElement(Croissant, { className: 'w-6 h-6 text-primary' }) },
  { value: 'clinic', label: 'ملابس', icon: React.createElement(Building2, { className: 'w-6 h-6 text-primary' }) },
  { value: 'cafe', label: 'كافيه', icon: React.createElement(Coffee, { className: 'w-6 h-6 text-primary' }) },
  { value: 'restaurant', label: 'مطعم', icon: React.createElement(UtensilsCrossed, { className: 'w-6 h-6 text-primary' }) },
  { value: 'other', label: 'أخرى', icon: React.createElement(MapPin, { className: 'w-6 h-6 text-primary' }) },
];

export const GOVERNORATES = [
  'الشرقية',
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الدقهلية',
  'الغربية',
  'المنوفية',
  'البحيرة',
  'كفر الشيخ',
  'الفيوم',
];

export const CITIES: Record<string, string[]> = {
  'الشرقية': ['الزقازيق', 'بلبيس', 'أبو حماد', 'فاقوس', 'العاشر من رمضان', 'منيا القمح'],
  'القاهرة': ['مدينة نصر', 'المعادي', 'حلوان', 'شبرا', 'عين شمس', 'التجمع الخامس'],
  'الجيزة': ['الدقي', 'المهندسين', '6 أكتوبر', 'الهرم', 'فيصل', 'الشيخ زايد'],
  'الإسكندرية': ['سيدي جابر', 'محطة الرمل', 'سموحة', 'المنتزه', 'العجمي'],
};

export const STATUS_COLORS: Record<PlaceStatus, string> = {
  new: '#4A90D9',
  visited: '#34C759',
  postponed: '#F5A623',
  closed: '#8E8E93',
  not_found: '#FF3B30',
};

export const STATUS_LABELS: Record<PlaceStatus, string> = {
  new: 'جديد',
  visited: 'تمت الزيارة',
  postponed: 'مؤجل',
  closed: 'مغلق',
  not_found: 'غير موجود',
};

