'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, ArrowLeft, Check } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { validateEgyptianPhone, normalizePhoneNumber } from '@/lib/utils/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_SIMULATION_DELAY } from '@/lib/constants/timing';
import { MESSAGES } from '@/lib/constants/messages';

export function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate phone number
    const validation = validateEgyptianPhone(phone);
    if (!validation.valid) {
      setError(validation.error || MESSAGES.ERRORS.PHONE_INVALID);
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call delay (demo mode - always succeeds)
      await new Promise(resolve => setTimeout(resolve, API_SIMULATION_DELAY));
      
      // Normalize and login
      const normalizedPhone = normalizePhoneNumber(phone);
      await login(normalizedPhone);
      
      // The UserContext will handle navigation by updating user state
      // The parent component (page.tsx) will detect the change and show appropriate screen
    } catch (err) {
      setError(MESSAGES.ERRORS.LOGIN_FAILED);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-3xl p-8 shadow-elevated border border-border/50">
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="flex justify-center mb-8"
          >
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
              <Phone className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-3xl font-bold text-center mb-2 text-foreground"
          >
            مرحباً بك في مسار
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-center text-muted-foreground mb-8"
          >
            أدخل رقم هاتفك للبدء
          </motion.p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <label htmlFor="phone" className="block text-sm font-semibold mb-2 text-foreground">
                رقم الهاتف
              </label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError(null);
                  }}
                  placeholder="01234567890"
                  dir="ltr"
                  className={`pr-10 ${error ? 'border-destructive focus-visible:border-destructive' : ''}`}
                  disabled={isLoading}
                  autoFocus
                />
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive mt-2 flex items-center gap-1"
                >
                  <span>{error}</span>
                </motion.p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                مثال: 01234567890 أو +201234567890
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Button
                type="submit"
                disabled={isLoading || !phone.trim()}
                className="w-full h-12 text-lg font-semibold gradient-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>جاري التحقق...</span>
                  </>
                ) : (
                  <>
                    <span>تسجيل الدخول</span>
                    <ArrowLeft className="w-5 h-5" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Demo Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-6 p-4 bg-muted/50 rounded-xl border border-border/50"
          >
            <p className="text-xs text-muted-foreground text-center">
              💡 وضع التجربة: سيتم حفظ بياناتك محلياً
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

