import Image from 'next/image'
import { APP_NAME } from '@/lib/constants'

interface Props {
  logoUrl?: string | null
  tenantName?: string | null
  className?: string
}

export function BrandedLogo({ logoUrl, tenantName, className }: Props) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={tenantName ?? APP_NAME}
        width={120}
        height={32}
        className={className}
        style={{ objectFit: 'contain' }}
      />
    )
  }

  return (
    <span
      className={className}
      style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: '1.25rem' }}
    >
      {tenantName ?? APP_NAME}
    </span>
  )
}
