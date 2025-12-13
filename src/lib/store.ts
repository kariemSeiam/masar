'use client';

import React from 'react';
import { Place, Visit, Journey, PlaceStatus } from './types';
import { Pill, UtensilsCrossed, Coffee, Store, Croissant, Building2, MapPin } from 'lucide-react';

const ZAGAZIG_CENTER = { lat: 30.5877, lng: 31.5020 };

export const mockPlaces: Place[] = [
  {
    id: '1',
    name: 'صيدلية الشفاء',
    type: 'pharmacy',
    governorate: 'الشرقية',
    city: 'الزقازيق',
    address: 'شارع الجلاء، الزقازيق',
    lat: 30.5877 + 0.008,
    lng: 31.5020 + 0.005,
    phone: '055-123-4567',
    website: 'https://www.alshifaa-pharmacy.com',
    facebook: 'https://www.facebook.com/alshifaa.pharmacy',
    rating: 4.3,
    ratingCount: 127,
    status: 'new',
    isImportant: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'صيدلية النور',
    type: 'pharmacy',
    governorate: 'الشرقية',
    city: 'الزقازيق',
    address: 'شارع الملك فيصل، الزقازيق',
    lat: 30.5877 - 0.005,
    lng: 31.5020 + 0.012,
    phone: '055-234-5678',
    rating: 4.1,
    ratingCount: 89,
    status: 'new',
    isImportant: false,
    createdAt: new Date(),
  },
  {
    id: '3',
    name: 'صيدلية الأمل',
    type: 'pharmacy',
    governorate: 'الشرقية',
    city: 'الزقازيق',
    address: 'شارع فاروق',
    lat: 30.5877 + 0.015,
    lng: 31.5020 - 0.008,
    phone: '055-345-6789',
    website: 'https://www.alamal-pharmacy.com',
    rating: 4.5,
    ratingCount: 203,
    status: 'visited',
    isImportant: true,
    createdAt: new Date(),
  },
  {
    id: '4',
    name: 'صيدلية الحياة',
    type: 'pharmacy',
    governorate: 'الشرقية',
    city: 'الزقازيق',
    address: 'ميدان الزراعة',
    lat: 30.5877 - 0.012,
    lng: 31.5020 - 0.006,
    phone: '055-456-7890',
    rating: 3.9,
    ratingCount: 65,
    status: 'postponed',
    isImportant: false,
    createdAt: new Date(),
  },
  {
    id: '5',
    name: 'صيدلية السلام',
    type: 'pharmacy',
    governorate: 'الشرقية',
    city: 'الزقازيق',
    address: 'شارع المحافظة',
    lat: 30.5877 + 0.003,
    lng: 31.5020 + 0.018,
    phone: '055-567-8901',
    facebook: 'https://www.facebook.com/alsalam.pharmacy',
    rating: 4.7,
    ratingCount: 312,
    status: 'new',
    isImportant: true,
    createdAt: new Date(),
  },
  {
    id: '6',
    name: 'صيدلية الدواء',
    type: 'pharmacy',
    governorate: 'الشرقية',
    city: 'الزقازيق',
    address: 'شارع الثورة',
    lat: 30.5877 - 0.018,
    lng: 31.5020 + 0.003,
    phone: '055-678-9012',
    rating: 4.0,
    ratingCount: 98,
    status: 'new',
    isImportant: false,
    createdAt: new Date(),
  },
  {
    id: '7',
    name: 'كافيه الصحبة',
    type: 'cafe',
    governorate: 'الشرقية',
    city: 'الزقازيق',
    address: 'شارع الجمهورية',
    lat: 30.5877 + 0.020,
    lng: 31.5020 + 0.010,
    phone: '055-789-0123',
    website: 'https://www.alsahba-cafe.com',
    facebook: 'https://www.facebook.com/alsahba.cafe',
    rating: 4.4,
    ratingCount: 156,
    status: 'new',
    isImportant: false,
    createdAt: new Date(),
  },
  {
    id: '8',
    name: 'مطعم الأصدقاء',
    type: 'restaurant',
    governorate: 'الشرقية',
    city: 'الزقازيق',
    address: 'شارع عبد السلام عارف',
    lat: 30.5877 - 0.007,
    lng: 31.5020 - 0.015,
    phone: '055-890-1234',
    website: 'https://www.alasdiqaa-restaurant.com',
    facebook: 'https://www.facebook.com/alasdiqaa.restaurant',
    rating: 4.2,
    ratingCount: 234,
    status: 'visited',
    isImportant: false,
    createdAt: new Date(),
  },
];

export const mockVisits: Visit[] = [
  {
    id: 'v1',
    placeId: '3',
    placeName: 'صيدلية الأمل',
    date: new Date(),
    checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    outcome: 'visited',
    notes: 'باع 20 علبة باندول، مهتم بالعروض الجديدة',
    rating: 5,
  },
  {
    id: 'v2',
    placeId: '8',
    placeName: 'مطعم الأصدقاء',
    date: new Date(),
    checkInTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    outcome: 'visited',
    notes: 'تم الاتفاق على توريد جديد',
    rating: 4,
  },
  {
    id: 'v3',
    placeId: '4',
    placeName: 'صيدلية الحياة',
    date: new Date(),
    checkInTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
    outcome: 'postponed',
    notes: 'صاحبها مش موجود، هزوره بكرة',
  },
  {
    id: 'v4',
    placeId: '1',
    placeName: 'صيدلية الشفاء',
    date: new Date(),
    checkInTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    outcome: 'visited',
    notes: 'طلب 50 علبة باراسيتامول',
    rating: 5,
  },
  {
    id: 'v5',
    placeId: '1',
    placeName: 'صيدلية الشفاء',
    date: new Date(),
    checkInTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    outcome: 'visited',
    notes: 'مهتم بالعروض الصيفية',
    rating: 4,
  },
  {
    id: 'v6',
    placeId: '5',
    placeName: 'صيدلية السلام',
    date: new Date(),
    checkInTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    outcome: 'visited',
    notes: 'طلب عرض خاص على الأدوية المزمنة',
    rating: 5,
  },
  {
    id: 'v7',
    placeId: '5',
    placeName: 'صيدلية السلام',
    date: new Date(),
    checkInTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    outcome: 'visited',
    notes: 'اتفقنا على توريد شهري',
    rating: 5,
  },
  {
    id: 'v8',
    placeId: '7',
    placeName: 'كافيه الصحبة',
    date: new Date(),
    checkInTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    outcome: 'visited',
    notes: 'طلب عرض على القهوة المميزة',
    rating: 4,
  },
];

export const getPlaceIcon = (
  type: string, 
  size: string = 'w-5 h-5', 
  variant: 'light' | 'primary' = 'light'
): React.ReactNode => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    pharmacy: Pill,
    restaurant: UtensilsCrossed,
    cafe: Coffee,
    supermarket: Store,
    bakery: Croissant,
    clinic: Building2,
    other: MapPin,
  };
  const IconComponent = icons[type] || MapPin;
  const colorClass = variant === 'primary' ? 'text-white' : 'text-primary';
  return React.createElement(IconComponent, { className: `${size} ${colorClass}` });
};

export const getStatusColor = (status: PlaceStatus): string => {
  const colors: Record<PlaceStatus, string> = {
    new: '#4A90D9',
    visited: '#34C759',
    postponed: '#F5A623',
    closed: '#8E8E93',
    not_found: '#FF3B30',
  };
  return colors[status];
};

// Helper function to lighten a hex color by mixing with white
const lightenColor = (hex: string, amount: number = 0.3): string => {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * amount));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * amount));
  const b = Math.min(255, Math.floor((num & 0x0000FF) + (255 - (num & 0x0000FF)) * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

export const getStatusColorLight = (status: PlaceStatus): string => {
  return lightenColor(getStatusColor(status), 0.35);
};

export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} م`;
  }
  return `${km.toFixed(1)} كم`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} د.ق`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours} س ${mins > 0 ? `و ${mins} د.ق` : ''}`;
};

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
