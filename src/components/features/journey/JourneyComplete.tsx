'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Home, FileText, Clock, CheckCircle, Calendar, XCircle, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JourneyStats {
  visited: number;
  postponed: number;
  closed: number;
  duration: string;
}

interface JourneyCompleteProps {
  stats: JourneyStats;
  onViewDetails: () => void;
  onGoHome: () => void;
}

export function JourneyComplete({ stats, onViewDetails, onGoHome }: JourneyCompleteProps) {
  const confettiRef = useRef(false);

  useEffect(() => {
    if (!confettiRef.current) {
      confettiRef.current = true;

      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ['#4A90D9', '#34C759', '#F5A623', '#FF6B6B', '#FFD93D'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-b from-[#4A90D9] to-[#3A7BC8] z-50 flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="mb-6"
      >
        <PartyPopper className="w-24 h-24 text-white" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-3xl font-bold text-white mb-2 text-center"
      >
        أحسنت!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-white/80 text-lg mb-8"
      >
        خلصت الرحلة بنجاح
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-sm mb-8"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.visited}</p>
              <p className="text-white/60 text-sm">زيارة ناجحة</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.postponed}</p>
              <p className="text-white/60 text-sm">مؤجل</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.closed}</p>
              <p className="text-white/60 text-sm">مغلق</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{stats.duration}</p>
              <p className="text-white/60 text-sm">الوقت</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex gap-3 w-full max-w-sm"
      >
        <Button
          onClick={onViewDetails}
          variant="outline"
          className="flex-1 h-14 bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <FileText className="w-5 h-5 ms-2" />
          التفاصيل
        </Button>
        <Button
          onClick={onGoHome}
          className="flex-1 h-14 bg-white text-[#4A90D9] hover:bg-white/90"
        >
          <Home className="w-5 h-5 ms-2" />
          الرئيسية
        </Button>
      </motion.div>
    </motion.div>
  );
}
