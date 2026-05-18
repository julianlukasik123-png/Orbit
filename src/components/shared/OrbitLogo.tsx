interface Props {
  size?: number
  className?: string
}

export function OrbitLogoMark({ size = 36 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Orbit ring — tilted ellipse, visually forms the O */}
      <ellipse
        cx="18"
        cy="18"
        rx="13"
        ry="8"
        transform="rotate(-20 18 18)"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      {/* Central star */}
      <circle cx="18" cy="18" r="3.5" fill="currentColor" />
      {/* Orbiting body — sits on the ring */}
      <circle cx="30" cy="14" r="2.5" fill="currentColor" />
    </svg>
  )
}

export function OrbitWordmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { icon: 30, text: 'text-xl' },
    md: { icon: 38, text: 'text-3xl' },
    lg: { icon: 46, text: 'text-4xl' },
  }
  const { icon, text } = sizes[size]

  return (
    <span className={`inline-flex items-center font-bold ${text}`} style={{ color: 'var(--brand-primary)', gap: '0.05em' }}>
      <OrbitLogoMark size={icon} />
      <span>rbit</span>
    </span>
  )
}
