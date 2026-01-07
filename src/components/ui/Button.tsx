'use client';

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
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
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0D1117]';

    const variants = {
      primary: 'bg-gradient-to-r from-[#00E5FF] to-[#7C4DFF] text-black hover:shadow-[0_10px_30px_rgba(0,229,255,0.25)] focus:ring-[#00E5FF]',
      secondary: 'bg-transparent border border-[#21262D] text-white hover:border-[#00E5FF] hover:bg-[rgba(0,229,255,0.1)] focus:ring-[#21262D]',
      ghost: 'bg-transparent text-[#8B949E] hover:text-white hover:bg-[#21262D] focus:ring-[#21262D]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-7 py-3.5 text-lg',
    };

    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        type={type}
        whileHover={!isDisabled ? { y: -2 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        disabled={isDisabled}
        onClick={onClick}
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
