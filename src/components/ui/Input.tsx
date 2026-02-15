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
          <label className="block text-sm font-medium text-[#8B949E] mb-2 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={`
              absolute left-4 top-1/2 -translate-y-1/2
              transition-colors duration-200
              ${isFocused ? 'text-[#58A6FF]' : 'text-[#484F58]'}
            `}>
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={isPassword && showPassword ? 'text' : type}
            className={`
              w-full bg-[rgba(22,27,34,0.8)] border border-[#30363D] text-[#F0F6FC]
              rounded-lg py-4 px-4 text-base font-medium
              transition-all duration-300 ease-out
              focus:outline-none focus:border-[rgba(88,166,255,0.6)] focus:shadow-[0_0_0_3px_rgba(88,166,255,0.15)]
              placeholder:text-[#484F58]
              hover:border-[rgba(240,246,252,0.2)]
              ${leftIcon ? 'pl-12' : ''}
              ${rightIcon || isPassword ? 'pr-12' : ''}
              ${error ? 'border-[#F85149]/60 focus:border-[#F85149] focus:shadow-[0_0_0_3px_rgba(248,81,73,0.15)]' : ''}
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
          <p className="mt-2 text-sm text-[#F85149]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
