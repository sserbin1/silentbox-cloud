'use client';

import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  variant?: 'light' | 'dark' | 'neon';
  hover?: boolean;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function GlassCard({
  children,
  variant = 'dark',
  hover = true,
  glow = false,
  className = '',
  style,
  onClick,
}: GlassCardProps) {
  const baseStyles = 'rounded-2xl transition-all duration-300';

  const variantStyles = {
    light: `
      bg-white/10
      backdrop-blur-xl
      border border-white/20
      ${hover ? 'hover:bg-white/20 hover:border-white/30' : ''}
    `,
    dark: `
      bg-slate-900/80
      backdrop-blur-xl
      border border-white/10
      ${hover ? 'hover:bg-slate-900/90 hover:border-white/20' : ''}
    `,
    neon: `
      bg-slate-900/80
      backdrop-blur-xl
      border border-violet-500/30
      ${hover ? 'hover:border-violet-500/60' : ''}
    `,
  };

  const glowStyles = glow
    ? 'shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_50px_rgba(139,92,246,0.5)]'
    : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${glowStyles} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Gradient border card
interface GradientBorderCardProps {
  children: ReactNode;
  className?: string;
  gradient?: string;
}

export function GradientBorderCard({
  children,
  className = '',
  gradient = 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
}: GradientBorderCardProps) {
  return (
    <div
      className={`relative p-[1px] rounded-2xl ${className}`}
      style={{ background: gradient }}
    >
      <div className="bg-slate-900 rounded-2xl h-full">
        {children}
      </div>
    </div>
  );
}

// Neon button
interface NeonButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

export function NeonButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  style,
}: NeonButtonProps) {
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-violet-600 to-violet-500
      hover:from-violet-500 hover:to-violet-400
      text-white font-semibold
      shadow-[0_0_20px_rgba(139,92,246,0.4)]
      hover:shadow-[0_0_30px_rgba(139,92,246,0.6)]
    `,
    accent: `
      bg-gradient-to-r from-cyan-500 to-cyan-400
      hover:from-cyan-400 hover:to-cyan-300
      text-white font-semibold
      shadow-[0_0_20px_rgba(6,182,212,0.4)]
      hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]
    `,
    outline: `
      bg-transparent
      border-2 border-violet-500
      text-violet-400
      hover:bg-violet-500/10
      hover:border-violet-400
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-xl
        transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        inline-flex items-center justify-center whitespace-nowrap
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `}
      style={style}
    >
      {children}
    </button>
  );
}

// Glowing badge
interface GlowBadgeProps {
  children: ReactNode;
  color?: 'violet' | 'cyan' | 'pink' | 'green';
  className?: string;
}

export function GlowBadge({ children, color = 'violet', className = '' }: GlowBadgeProps) {
  const colorStyles = {
    violet: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1
        rounded-full text-xs font-medium
        border backdrop-blur-sm
        ${colorStyles[color]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
