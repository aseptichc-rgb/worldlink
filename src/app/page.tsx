'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { onAuthChange, getUser } from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { setUser, setLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUser(firebaseUser.uid);
        setUser(userData);
        router.push('/card');
      } else {
        setUser(null);
        // Redirect to login immediately
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, setUser, setLoading]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Stars Background */}
      <div className="stars-bg" />

      {/* Animated Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center"
      >
        {/* Glow Effect */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 60px rgba(0, 229, 255, 0.3)',
              '0 0 100px rgba(124, 77, 255, 0.3)',
              '0 0 60px rgba(0, 229, 255, 0.3)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="inline-block rounded-full p-8 mb-8"
        >
          <motion.h1
            animate={{
              opacity: [0.7, 1, 0.7],
              filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl md:text-8xl font-bold gradient-text"
          >
            NEXUS
          </motion.h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-[#8B949E] text-lg md:text-xl mb-4"
        >
          신뢰 기반 비즈니스 네트워크
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-[#484F58] text-sm"
        >
          단순한 주소록을 넘어, 비즈니스 기회의 지도를 그리다
        </motion.p>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-12"
        >
          <div className="w-8 h-8 border-2 border-[#21262D] border-t-[#00E5FF] rounded-full animate-spin mx-auto" />
        </motion.div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating orbs */}
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#00E5FF]/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#7C4DFF]/5 rounded-full blur-3xl"
        />
      </div>
    </div>
  );
}
