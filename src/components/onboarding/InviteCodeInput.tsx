'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { validateInviteCode } from '@/lib/firebase-services';
import { useAuthStore } from '@/store/authStore';

interface InviteCodeInputProps {
  onValidCode: (code: string, inviterId: string) => void;
}

export default function InviteCodeInput({ onValidCode }: InviteCodeInputProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWarping, setIsWarping] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setInviteCode } = useAuthStore();

  const handleInput = (index: number, value: string) => {
    if (!/^[A-Za-z0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if code is complete
    const fullCode = newCode.join('');
    if (fullCode.length === 6) {
      validateCode(`${fullCode.slice(0, 3)}-${fullCode.slice(3)}`);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^A-Za-z0-9]/g, '').slice(0, 6);
    const newCode = [...code];

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i].toUpperCase();
    }

    setCode(newCode);
    setError(null);

    if (pastedData.length >= 6) {
      const fullCode = newCode.join('');
      validateCode(`${fullCode.slice(0, 3)}-${fullCode.slice(3)}`);
    }
  };

  const validateCode = async (fullCode: string) => {
    setIsValidating(true);
    setError(null);

    try {
      const result = await validateInviteCode(fullCode);

      if (result.valid && result.createdBy) {
        setInviteCode(fullCode);
        setIsWarping(true);

        setTimeout(() => {
          onValidCode(fullCode, result.createdBy!);
        }, 600);
      } else {
        setError('유효하지 않은 초대 코드입니다');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('코드 검증 중 오류가 발생했습니다');
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <motion.div
      className={`flex flex-col items-center ${isWarping ? 'warp' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-2">
        {code.slice(0, 3).map((digit, index) => (
          <motion.input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInput(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isValidating}
            whileFocus={{ scale: 1.1 }}
            className={`
              w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold
              bg-[#0D1117] border-2 rounded-xl
              text-white uppercase
              transition-all duration-300
              focus:outline-none
              ${error
                ? 'border-[#FF4081] focus:border-[#FF4081] focus:shadow-[0_0_0_3px_rgba(255,64,129,0.25)]'
                : digit
                  ? 'border-[#00E5FF] focus:border-[#00E5FF] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.25)]'
                  : 'border-[#21262D] focus:border-[#00E5FF] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.25)]'
              }
            `}
          />
        ))}

        <span className="text-[#484F58] text-2xl font-bold mx-1">-</span>

        {code.slice(3).map((digit, idx) => {
          const index = idx + 3;
          return (
            <motion.input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={isValidating}
              whileFocus={{ scale: 1.1 }}
              className={`
                w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold
                bg-[#0D1117] border-2 rounded-xl
                text-white uppercase
                transition-all duration-300
                focus:outline-none
                ${error
                  ? 'border-[#FF4081] focus:border-[#FF4081] focus:shadow-[0_0_0_3px_rgba(255,64,129,0.25)]'
                  : digit
                    ? 'border-[#00E5FF] focus:border-[#00E5FF] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.25)]'
                    : 'border-[#21262D] focus:border-[#00E5FF] focus:shadow-[0_0_0_3px_rgba(0,229,255,0.25)]'
                }
              `}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {isValidating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex items-center gap-2 text-[#8B949E]"
          >
            <div className="w-5 h-5 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
            <span>코드 검증 중...</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 text-[#FF4081] text-sm"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <p className="mt-8 text-[#6E7681] text-sm text-center leading-relaxed">
        NEXUS는 초대를 통해서만 가입할 수 있습니다.<br />
        <span className="text-[#484F58]">신뢰할 수 있는 네트워크를 위한 첫 걸음입니다.</span>
      </p>
    </motion.div>
  );
}
