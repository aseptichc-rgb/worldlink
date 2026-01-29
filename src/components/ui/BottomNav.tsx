'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Scan, User, Network, X, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { path: '/card', icon: QrCode, label: '내 명함', requiresAuth: true },
  { path: '/scan', icon: Scan, label: '스캔', requiresAuth: false },
  // { path: '/contacts', icon: BookUser, label: '연락처', requiresAuth: false }, // 임시 비활성화
  { path: '/network', icon: Network, label: '인맥', requiresAuth: true },
  { path: '/profile', icon: User, label: '프로필', requiresAuth: true },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [targetPath, setTargetPath] = useState('');

  const handleNavClick = (path: string, requiresAuth: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      setTargetPath(path);
      setShowAuthModal(true);
      return;
    }
    router.push(path);
  };

  const handleAuth = () => {
    sessionStorage.setItem('redirectAfterAuth', targetPath);
    router.push('/onboarding');
    setShowAuthModal(false);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#101D33]/95 backdrop-blur-xl border-t border-[#1E3A5F] safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            const isScan = item.path === '/scan';

            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path, item.requiresAuth)}
                className={`relative flex flex-col items-center justify-center w-16 h-full ${
                  isScan ? '-mt-4' : ''
                }`}
              >
              {isScan ? (
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-[#86C9F2] to-[#2C529C] flex items-center justify-center shadow-lg shadow-[#86C9F2]/20"
                >
                  <Icon size={26} className="text-white" />
                </motion.div>
              ) : (
                <>
                  <Icon
                    size={24}
                    className={isActive ? 'text-[#86C9F2]' : 'text-[#4A5E7A]'}
                  />
                  <span
                    className={`text-[10px] mt-1 ${
                      isActive ? 'text-[#86C9F2]' : 'text-[#4A5E7A]'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-0 w-6 h-0.5 bg-[#86C9F2] rounded-full"
                    />
                  )}
                </>
              )}
            </button>
          );
          })}
        </div>
      </nav>

      {/* 로그인 필요 모달 */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#162A4A] rounded-t-3xl border-t border-[#1E3A5F] p-6"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2"
              >
                <X size={20} className="text-[#8BA4C4]" />
              </button>

              <div className="w-12 h-1 bg-[#4A5E7A] rounded-full mx-auto mb-6" />

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#86C9F2]/20 to-[#2C529C]/20 flex items-center justify-center">
                  <UserPlus size={28} className="text-[#86C9F2]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  로그인이 필요해요
                </h3>
                <p className="text-sm text-[#8BA4C4]">
                  내 명함을 만들고 네트워크를 확장하려면<br />
                  간단한 가입이 필요해요
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAuth}
                  className="w-full py-4 bg-[#86C9F2] text-[#0B162C] font-semibold rounded-xl"
                >
                  30초만에 가입하기
                </button>
                <button
                  onClick={() => {
                    router.push('/login');
                    setShowAuthModal(false);
                  }}
                  className="w-full py-4 bg-[#162A4A] text-white font-medium rounded-xl border border-[#1E3A5F]"
                >
                  이미 계정이 있어요
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
