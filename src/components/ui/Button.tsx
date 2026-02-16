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
    const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1E1E1E]';

    const variants = {
      primary: 'bg-[#007AFF] text-white hover:bg-[#0066DD] hover:shadow-[0_8px_24px_rgba(0,122,255,0.25)] focus:ring-[#007AFF]',
      secondary: 'bg-[#252525] border border-[#363636] text-[#F0F6FC] hover:border-[#58A6FF] hover:bg-[rgba(88,166,255,0.08)] focus:ring-[#363636]',
      ghost: 'bg-transparent text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[rgba(240,246,252,0.05)] focus:ring-[#363636]',
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