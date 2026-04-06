"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 이미 설치된 경우 (standalone 모드)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // iOS 체크
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // 이미 설치 배너를 닫은 경우 체크
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    if (Date.now() - dismissedTime < oneWeek) return;

    // Android/Desktop: beforeinstallprompt 이벤트
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // 2초 후에 배너 표시 (사용자가 페이지를 먼저 둘러볼 수 있도록)
      setTimeout(() => setShowInstallBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS: 직접 가이드 표시
    if (isIOSDevice) {
      setTimeout(() => setShowInstallBanner(true), 3000);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // iOS: navigator.share()로 공유 시트를 직접 열어서
      // 사용자가 "홈 화면에 추가"를 바로 찾을 수 있게 함
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Nodded - 비즈니스 네트워크",
            text: "Nodded를 홈 화면에 추가하세요",
            url: window.location.origin,
          });
          setShowInstallBanner(false);
          return;
        } catch (err) {
          // 사용자가 공유 시트를 닫은 경우 → 가이드 표시
          if ((err as Error).name === "AbortError") {
            setShowIOSGuide(true);
            return;
          }
        }
      }
      // navigator.share 미지원 시 가이드 표시
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // 이미 설치된 경우 표시 안함
  if (isStandalone) return null;

  return (
    <>
      {/* 설치 유도 배너 */}
      <AnimatePresence>
        {showInstallBanner && !showIOSGuide && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-bottom"
          >
            <div className="mx-auto max-w-md bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl border border-cyan-500/30 shadow-lg shadow-cyan-500/10 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* 아이콘 */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">N</span>
                  </div>

                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base">
                      NODDED 앱 설치하기
                    </h3>
                    <p className="text-gray-400 text-base mt-0.5">
                      홈 화면에 추가하면 더 빠르게 접속할 수 있어요
                    </p>
                  </div>

                  {/* 닫기 버튼 */}
                  <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 설치 버튼 */}
                <button
                  onClick={handleInstallClick}
                  className="w-full mt-3 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isIOS ? "홈 화면에 추가" : "지금 설치하기"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS 설치 가이드 모달 */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full max-w-md bg-gray-900 rounded-t-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 핸들 */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-600 rounded-full" />
              </div>

              <div className="px-6 pb-8">
                <h2 className="text-xl font-bold text-white text-center mb-4">
                  홈 화면에 추가하기
                </h2>
                <p className="text-gray-400 text-center text-sm mb-6">
                  Safari 브라우저에서만 설치할 수 있어요
                </p>

                {/* 단계별 가이드 */}
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        하단의 공유 버튼 탭하기
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-gray-400">
                        <Share className="w-5 h-5" />
                        <span className="text-base">
                          Safari 하단 중앙의{" "}
                          <Share className="w-4 h-4 inline" /> 아이콘
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        &quot;홈 화면에 추가&quot; 선택
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-gray-400">
                        <Plus className="w-5 h-5" />
                        <span className="text-base">
                          아래로 스크롤하면 찾을 수 있어요
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 공유 시트 열기 버튼 */}
                <button
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: "Nodded - 비즈니스 네트워크",
                          text: "Nodded를 홈 화면에 추가하세요",
                          url: window.location.origin,
                        });
                        handleDismiss();
                      } catch {
                        // 사용자가 닫은 경우 무시
                      }
                    }
                  }}
                  className="w-full mt-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Share className="w-4 h-4" />
                  공유 시트 열기
                </button>

                <button
                  onClick={handleDismiss}
                  className="w-full mt-2 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 font-medium rounded-xl transition-colors"
                >
                  나중에 하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
