'use client';

import { forwardRef, useState, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  type?: string;
  className?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  required?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isPassword = type === 'password';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-[13px] font-medium text-[#8B949E] mb-3 pl-1 tracking-wide">
            {label}
          </label>
        )}
        {/* 외부 컨테이너 */}
        <div className={`
          relative bg-[#161B22] rounded-2xl p-2
          transition-all duration-300 ease-out
          ${error ? 'ring-1 ring-[#FF4D4D]/60' : ''}
        `}>
          {/* 내부 입력창 */}
          <div className={`
            bg-[#21262D] rounded-xl h-[48px] px-6 flex items-center
            transition-all duration-300
            ${isFocused ? 'bg-[#282E36] ring-1 ring-[#30363D]' : ''}
          `}>
            {leftIcon && (
              <div className={`
                mr-3 transition-colors duration-200
                ${isFocused ? 'text-[#007AFF]' : 'text-[#484F58]'}
              `}>
                {leftIcon}
              </div>
            )}
            <input
              ref={ref}
              type={isPassword && showPassword ? 'text' : type}
              className={`
                flex-1 bg-transparent border-0 text-[#FFFFFF]
                h-full text-base font-medium
                focus:outline-none
                placeholder:text-[#484F58]
                ${className}
              `}
              onFocus={(e) => {
                setIsFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                props.onBlur?.(e);
              }}
              {...props}
            />
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-3 text-[#484F58] hover:text-[#F0F6FC] transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            )}
            {rightIcon && !isPassword && (
              <div className="ml-3 text-[#484F58]">
                {rightIcon}
              </div>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-2 text-xs text-[#FF4D4D]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
