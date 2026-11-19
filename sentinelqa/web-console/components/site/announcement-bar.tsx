import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function AnnouncementBar() {
  return (
    <Link
      href="/tarifs"
      className="group flex items-center justify-center gap-2 bg-ink px-5 py-2.5 text-center text-[13px] text-white/80 transition-colors hover:text-white"
    >
      <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10.5px] tracking-wide text-[#8fb3ff] uppercase">
        Nouveau
      </span>
      <span className="truncate">Audit Express : un pentest ciblé en 14 jours avant votre prochaine signature B2B</span>
      <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}
