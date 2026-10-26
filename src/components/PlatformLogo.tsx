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

  const titleSizes = {
    sm: 'text-[16px] font-bold',
    md: 'text-[18px] font-bold',
    lg: 'text-[22px] font-bold',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      id="platform-global-logo-btn"
      aria-label="IBO Hub - Return to Home"
      className={`inline-flex items-center gap-2 text-left rounded focus:outline-none cursor-pointer select-none ${className}`}
    >
      <div className="flex flex-col justify-center leading-tight">
        <span
          className={`tracking-tight ${titleSizes[size]} ${
            isLight ? 'text-primary-dark' : 'text-white'
          }`}
        >
          IBO Hub
        </span>
        {showText && subtitle && (
          <span className="text-[11px] text-muted">{subtitle}</span>
        )}
      </div>
    </button>
  );
};
