import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const focusRing = 'rounded-md outline-none focus-visible:ring-2 focus-visible:ring-steel/60'

export function Logo({ href, className }: { href: string; className?: string }) {
  return (
    <Link href={href} aria-label="HSentinel — accueil" className={cn('flex items-center gap-2.5', focusRing, className)}>
      <Image src="/logo-mark.png" alt="" width={28} height={28} priority className="logo-mark size-7 shrink-0" />
      <span className="logo-word font-heading text-[14px] font-bold tracking-tight text-white">HSentinel</span>
    </Link>
  )
}

export function LogoMark({ href }: { href: string }) {
  return (
    <Link href={href} aria-label="HSentinel — accueil" className={cn('flex shrink-0', focusRing)}>
      <Image src="/logo-mark.png" alt="" width={28} height={28} priority className="logo-mark size-7" />
    </Link>
  )
}
