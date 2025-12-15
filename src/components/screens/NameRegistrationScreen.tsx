'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Check, ArrowLeft } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_SIMULATION_DELAY } from '@/lib/constants/timing';
import { MESSAGES } from '@/lib/constants/messages';

export function NameRegistrationScreen() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateName } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError('يرجى إدخال اسم صحيح (حرفين على الأقل)');
      return;
    }

    if (trimmedName.length > 50) {
      setError('الاسم طويل جداً (الحد الأقصى 50 حرف)');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call delay (demo mode - always succeeds)
      await new Promise(resolve => setTimeout(resolve, API_SIMULATION_DELAY));
      
      // Update user name
      updateName(trimmedName);
      
      // The UserContext will handle the update
      // The parent component (page.tsx) will detect the change and show main app
    } catch (err) {
      setError(MESSAGES.ERRORS.NAME_SAVE_FAILED);
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
              <User className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-3xl font-bold text-center mb-2 text-foreground"
          >
            مرحباً بك!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-center text-muted-foreground mb-2"
          >
            يبدو أن هذا أول استخدام لك
          </motion.p>

          {user?.phone && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="text-center text-sm text-muted-foreground mb-8"
            >
              رقم الهاتف: <span dir="ltr" className="font-medium">{user.phone}</span>
            </motion.p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <label htmlFor="name" className="block text-sm font-semibold mb-2 text-foreground">
                الاسم الكامل
              </label>
              <div className="relative">
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="أدخل اسمك الكامل"
                  dir="rtl"
                  className={`pr-10 ${error ? 'border-destructive focus-visible:border-destructive' : ''}`}
                  disabled={isLoading}
                  autoFocus
                />
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
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
                سيتم استخدام هذا الاسم في التطبيق
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <Button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="w-full h-12 text-lg font-semibold gradient-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <span>متابعة</span>
                    <Check className="w-5 h-5" />
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
              💡 يمكنك تغيير الاسم لاحقاً من الإعدادات
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

