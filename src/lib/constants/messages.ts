// User-facing messages and error strings

export const MESSAGES = {
  ERRORS: {
    NO_PLACES_IN_JOURNEY: 'لا توجد أماكن في الرحلة',
    LOGIN_FAILED: 'حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.',
    PHONE_INVALID: 'رقم الهاتف غير صحيح',
    NAME_SAVE_FAILED: 'حدث خطأ أثناء حفظ الاسم. يرجى المحاولة مرة أخرى.',
    COPY_FAILED: 'فشل النسخ',
    GEOLOCATION_ERROR: 'خطأ في تحديد الموقع',
  },
  PLACEHOLDERS: {
    PHONE: 'أدخل رقم الهاتف',
    NAME: 'أدخل الاسم',
    NOTE: 'اكتب ملاحظة جديدة...',
  },
  SUCCESS: {
    COPIED: 'تم النسخ',
  },
} as const;

