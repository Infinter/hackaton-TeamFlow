import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  showWordmark?: boolean
}

/**
 * Marque TeamFlow : icône (carré bleu + vagues) reconstruite en SVG inline
 * pour rester nette à toutes les tailles et lisible sur fond clair ou sombre.
 * Le wordmark utilise la couleur de texte du thème (currentColor).
 */
export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 112 112"
        role="img"
        aria-label="TeamFlow"
        className="h-7 w-7 shrink-0"
      >
        <rect x="0" y="0" width="112" height="112" rx="26" fill="#2D7FF9" />
        <path
          d="M30 44 q26 -22 52 0"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M30 64 q26 -22 52 0"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M30 84 q26 -22 52 0"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.45"
        />
      </svg>
      {showWordmark && (
        <span className="text-lg font-semibold tracking-tight">TeamFlow</span>
      )}
    </span>
  )
}
