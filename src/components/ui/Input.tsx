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
          <label className="block text-[13px] font-medium text-[#CCCCCC] mb-2 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={`
              absolute left-4 top-1/2 -translate-y-1/2
              transition-colors duration-200
              ${isFocused ? 'text-[#007AFF]' : 'text-[#484F58]'}
            `}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={`
              w-full bg-[#252525] border border-[#333333] text-[#FFFFFF]
              rounded-lg h-[52px] px-5 text-base font-medium
              transition-all duration-300 ease-out
              focus:outline-none focus:border-[#007AFF] focus:shadow-[0_0_0_3px_rgba(0,122,255,0.15)]
              placeholder:text-[#484F58]
              hover:border-[rgba(240,246,252,0.2)]
              ${leftIcon ? 'pl-12' : ''}
              ${rightIcon || isPassword ? 'pr-12' : ''}
              ${error ? 'border-[#FF4D4D]/60 focus:border-[#FF4D4D] focus:shadow-[0_0_0_3px_rgba(255,77,77,0.15)]' : ''}
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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#484F58] hover:text-[#F0F6FC] transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#484F58]">
              {rightIcon}
            </div>
          )}
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
