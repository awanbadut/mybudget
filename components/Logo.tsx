import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'symbol' | 'tile';
}

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
          <path
            fill="#ffffff"
            fillRule="evenodd"
            d="
              M 56 36
              L 144 36
              A 44 44 0 0 1 188 80
              A 44 44 0 0 1 150 124
              L 56 124
              Z
              M 92 68
              L 140 68
              A 16 16 0 0 1 156 84
              A 16 16 0 0 1 140 100
              L 92 100
              Z
            "
          />
          <path
            fill="#10b981"
            fillRule="evenodd"
            d="
              M 56 124
              L 150 124
              A 48 48 0 0 1 200 172
              A 48 48 0 0 1 152 220
              L 56 220
              Z
              M 92 148
              L 144 148
              A 20 20 0 0 1 164 168
              L 164 176
              L 144 196
              L 92 196
              Z
            "
          />
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
      {/* Top Vault & Spine: dark in light mode, crisp white in dark mode */}
      <path
        className="fill-zinc-900 dark:fill-white transition-colors"
        fillRule="evenodd"
        d="
          M 56 36
          L 144 36
          A 44 44 0 0 1 188 80
          A 44 44 0 0 1 150 124
          L 56 124
          Z
          M 92 68
          L 140 68
          A 16 16 0 0 1 156 84
          A 16 16 0 0 1 140 100
          L 92 100
          Z
        "
      />
      {/* Lower Growth Vault in Emerald Green */}
      <path
        className="fill-emerald-600 dark:fill-emerald-500"
        fillRule="evenodd"
        d="
          M 56 124
          L 150 124
          A 48 48 0 0 1 200 172
          A 48 48 0 0 1 152 220
          L 56 220
          Z
          M 92 148
          L 144 148
          A 20 20 0 0 1 164 168
          L 164 176
          L 144 196
          L 92 196
          Z
        "
      />
    </svg>
  );
}
