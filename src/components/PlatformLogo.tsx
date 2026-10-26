import React from 'react';

interface PlatformLogoProps {
  onNavigate?: (path: string) => void;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export const PlatformLogo: React.FC<PlatformLogoProps> = ({
  onNavigate,
  variant = 'light',
  size = 'md',
  showText = true,
  subtitle,
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.href = '/';
    }
  };

  const isLight = variant === 'light';

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-9 h-9',
  };

  const titleSizes = {
    sm: 'text-[16px] font-bold',
    md: 'text-[19px] font-bold',
    lg: 'text-[22px] font-bold',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      id="platform-global-logo-btn"
      aria-label="IBO Hub - Return to Home"
      className={`inline-flex items-center gap-2.5 text-left rounded focus:outline-none cursor-pointer select-none group ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSizes[size]} shrink-0 transition-transform group-hover:scale-105`}
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="14" fill="#00D27A" />
        {/* Shopping Cart Handle & Basket */}
        <path
          d="M11 16H17.5L22.5 39H46.5L51.5 22H20"
          stroke="#0B1F17"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 22H51.5L46.5 39H22.5L20 22Z"
          fill="#0B1F17"
        />
        {/* Gold Accent Spark Inside Cart */}
        <circle cx="35.5" cy="30.5" r="3.5" fill="#FFB400" />
        {/* Cart Wheels */}
        <circle cx="25" cy="48.5" r="4.5" fill="#0B1F17" />
        <circle cx="44" cy="48.5" r="4.5" fill="#0B1F17" />
      </svg>

      {showText && (
        <div className="flex flex-col justify-center leading-tight">
          <span
            className={`tracking-tight ${titleSizes[size]} ${
              isLight ? 'text-ink' : 'text-white'
            }`}
          >
            IBO <span className="text-primary-dark">Hub</span>
          </span>
          {subtitle && (
            <span
              className={`text-[11px] ${
                isLight ? 'text-muted' : 'text-white/60'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </button>
  );
};
