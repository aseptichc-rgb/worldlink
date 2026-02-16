'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { onAuthChange, getUser } from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const router = useRouter();
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUser(firebaseUser.uid);
        setUser(userData);
        router.push('/network');
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
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center"
      >
        <motion.div
          className="inline-block rounded-full p-8 mb-8"
        >
          <motion.h1
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl md:text-8xl font-bold text-[#2563EB]"
          >
            NODDED
          </motion.h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-[#64748B] text-lg md:text-xl mb-4"
        >
          신뢰 기반 비즈니스 네트워크
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-[#94A3B8] text-base"
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
          <div className="w-8 h-8 border-2 border-[#E2E8F0] border-t-[#2563EB] rounded-full animate-spin mx-auto" />
        </motion.div>
      </motion.div>
    </div>
  );
}
