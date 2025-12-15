'use client';

import { WHATSAPP_BASE_URL, EGYPT_COUNTRY_CODE } from '@/lib/constants/urls';

/**
 * Validates Egyptian phone number format
 * Accepts: 01234567890, +201234567890, 201234567890
 */
export function validateEgyptianPhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, error: 'يرجى إدخال رقم الهاتف' };
  }

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Check for valid formats
  const formats = [
    /^0\d{10}$/,           // 01234567890 (11 digits starting with 0)
    /^\+20\d{10}$/,        // +201234567890 (with country code)
    /^20\d{10}$/,          // 201234567890 (without +)
  ];

  const isValid = formats.some(format => format.test(cleaned));

  if (!isValid) {
    return {
      valid: false,
      error: 'رقم الهاتف غير صحيح. يرجى إدخال رقم مصري صحيح (مثال: 01234567890)',
    };
  }

  return { valid: true };
}

/**
 * Normalizes Egyptian phone number to +201234567890 format
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Handle different formats
  if (cleaned.startsWith('+20')) {
    return cleaned;
  } else if (cleaned.startsWith('20') && cleaned.length === 12) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `+20${cleaned.substring(1)}`;
  } else if (cleaned.length === 10) {
    return `+20${cleaned}`;
  }

  // If already in correct format or can't normalize, return as is
  return cleaned.startsWith('+') ? cleaned : `+20${cleaned}`;
}

/**
 * Generates a WhatsApp URL for the given phone number
 * Handles normalization to international format (20XXXXXXXXXX)
 */
export function getWhatsAppUrl(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/[^0-9]/g, '');
  
  // Normalize to international format
  let normalized: string;
  if (cleaned.startsWith(EGYPT_COUNTRY_CODE)) {
    // Already has country code
    normalized = cleaned;
  } else if (cleaned.startsWith('0')) {
    // Remove leading 0 and add country code
    normalized = `${EGYPT_COUNTRY_CODE}${cleaned.substring(1)}`;
  } else {
    // Assume it's a 10-digit number, add country code
    normalized = `${EGYPT_COUNTRY_CODE}${cleaned}`;
  }
  
  return `${WHATSAPP_BASE_URL}/${normalized}`;
}

