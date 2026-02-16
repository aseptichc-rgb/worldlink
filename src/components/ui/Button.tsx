'use client';

import { forwardRef, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  title?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    type = 'button',
    onClick,
    title,
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white';

    const variants = {
      primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:shadow-[0_4px_12px_rgba(37,99,235,0.2)] focus:ring-[#2563EB]',
      secondary: 'bg-white border border-[#E2E8F0] text-[#1A1A2E] hover:border-[#CBD5E1] hover:bg-[#F8F9FA] focus:ring-[#E2E8F0]',
      ghost: 'bg-transparent text-[#64748B] hover:text-[#1A1A2E] hover:bg-[#F1F3F5] focus:ring-[#E2E8F0]',
    };

    const sizes = {
      sm: 'px-3.5 py-2 text-base',
      md: 'px-5 py-3 text-base',
      lg: 'px-7 py-4 text-lg',
    };

    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={!isDisabled ? { y: -1 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        disabled={isDisabled}
        onClick={onClick}
        title={title}
      >
        {isLoading ? (
          <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
