'use client';

import React from 'react';
import { Pill, UtensilsCrossed, Coffee, Store, Croissant, Building2, MapPin } from 'lucide-react';
import { PlaceStatus } from '@/types';

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

