import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'symbol' | 'tile';
}

/**
 * Sovereign Vault Logo for My Budget
 * Real chamfered safe vault body + precision dial spokes + 45° emerald growth arrow.
 * Rendered inline directly in DOM HTML for zero-delay display and 100% cache immunity.
 */
export function Logo({ className = 'w-8 h-8', variant = 'symbol' }: LogoProps) {
  if (variant === 'tile') {
    return (
      <svg
        viewBox="0 0 512 512"
        className={cn('w-10 h-10 flex-shrink-0', className)}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="My Budget Logo"
      >
        <title>My Budget</title>
        <rect width="512" height="512" rx="112" className="fill-zinc-950 dark:fill-zinc-900" />
        <g transform="translate(128, 128)">
          {/* Heavy Chamfered Vault Plate */}
          <path
            d="M 72 36 L 184 36 L 220 72 L 220 184 L 184 220 L 72 220 L 36 184 L 36 72 Z"
            fill="#18181b"
            stroke="#27272a"
            strokeWidth="4"
          />
          {/* Dial Outer Ring */}
          <circle cx="128" cy="128" r="64" stroke="#52525b" strokeWidth="6" strokeDasharray="12 6" />
          {/* Heavy Vault Spokes */}
          <line x1="128" y1="76" x2="128" y2="180" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
          <line x1="76" y1="128" x2="180" y2="128" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
          {/* Central Heavy Locking Core */}
          <circle cx="128" cy="128" r="26" fill="#ffffff" />
          <circle cx="128" cy="128" r="12" fill="#18181b" />
          {/* 45-degree Emerald Growth Vector */}
          <path
            d="M 154 102 L 204 52 M 204 52 H 174 M 204 52 V 82"
            stroke="#10b981"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="204" cy="52" r="6" fill="#10b981" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 256 256"
      className={cn('w-8 h-8 flex-shrink-0', className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="My Budget Logo"
    >
      <title>My Budget</title>
      {/* Heavy Chamfered Vault Plate */}
      <path
        d="M 72 36 L 184 36 L 220 72 L 220 184 L 184 220 L 72 220 L 36 184 L 36 72 Z"
        className="fill-zinc-950 dark:fill-zinc-900 transition-colors"
        stroke="#27272a"
        strokeWidth="4"
      />
      {/* Dial Outer Ring */}
      <circle cx="128" cy="128" r="64" stroke="#52525b" strokeWidth="6" strokeDasharray="12 6" />
      {/* Heavy Vault Spokes */}
      <line x1="128" y1="76" x2="128" y2="180" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
      <line x1="76" y1="128" x2="180" y2="128" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
      {/* Central Heavy Locking Core */}
      <circle cx="128" cy="128" r="26" fill="#ffffff" />
      <circle cx="128" cy="128" r="12" className="fill-zinc-950 dark:fill-zinc-900 transition-colors" />
      {/* 45-degree Emerald Growth Vector */}
      <path
        d="M 154 102 L 204 52 M 204 52 H 174 M 204 52 V 82"
        stroke="#10b981"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="204" cy="52" r="6" fill="#10b981" />
    </svg>
  );
}
