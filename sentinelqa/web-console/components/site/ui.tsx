import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-6xl px-5', className)}>{children}</div>
}

export function Eyebrow({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={cn('font-mono text-[11.5px] tracking-[0.08em] uppercase', dark ? 'text-[#8fb3ff]' : 'text-steel')}>
      {children}
    </p>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  dark,
  center,
  className,
}: {
  eyebrow?: string
  title: React.ReactNode
  body?: React.ReactNode
  dark?: boolean
  center?: boolean
  className?: string
}) {
  return (
    <div className={cn('h-reveal flex max-w-2xl flex-col gap-4', center && 'mx-auto items-center text-center', className)}>
      {eyebrow ? <Eyebrow dark={dark}>{eyebrow}</Eyebrow> : null}
      <h2
        className={cn(
          'font-heading text-[32px] leading-[1.06] font-semibold tracking-[-0.03em] text-balance md:text-[44px]',
          dark ? 'text-white' : 'text-foreground',
        )}
      >
        {title}
      </h2>
      {body ? (
        <p className={cn('text-[16px] leading-relaxed text-pretty md:text-[17px]', dark ? 'text-white/65' : 'text-muted-foreground')}>
          {body}
        </p>
      ) : null}
    </div>
  )
}

const PILL_VARIANTS = {
  primary: 'bg-foreground text-background hover:opacity-85',
  secondary: 'bg-secondary text-foreground hover:bg-border',
  outline: 'border border-foreground/15 text-foreground hover:bg-secondary',
  light: 'bg-white text-ink hover:opacity-90',
  ghostDark: 'bg-white/10 text-white hover:bg-white/15',
} as const

export function PillLink({
  href,
  variant = 'primary',
  size = 'md',
  arrow,
  className,
  children,
}: {
  href: string
  variant?: keyof typeof PILL_VARIANTS
  size?: 'sm' | 'md'
  arrow?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group/pill inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        size === 'sm' ? 'h-9 px-4 text-[14px]' : 'h-11 px-5 text-[15px]',
        arrow && (size === 'sm' ? 'pr-1' : 'pr-1.5'),
        PILL_VARIANTS[variant],
        className,
      )}
    >
      {children}
      {arrow ? (
        <span
          aria-hidden="true"
          className={cn(
            'flex items-center justify-center rounded-full transition-transform group-hover/pill:translate-x-0.5',
            size === 'sm' ? 'size-7' : 'size-8',
            variant === 'primary' ? 'bg-white/15' : variant === 'light' ? 'bg-ink/10' : 'bg-foreground/10',
          )}
        >
          <ArrowRight className="size-3.5" />
        </span>
      ) : null}
    </Link>
  )
}

export function TextLink({ href, children, dark }: { href: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'group/link inline-flex items-center gap-1.5 text-[15px] font-medium underline-offset-4 hover:underline',
        dark ? 'text-white' : 'text-foreground',
      )}
    >
      {children}
      <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

export function PageHero({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string
  title: React.ReactNode
  body: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden="true" className="dot-grid fade-mask absolute inset-0" />
      <Container className="relative flex flex-col items-start gap-6 py-20 lg:py-28">
        <div className="h-rise">
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
        <h1 className="h-rise max-w-3xl font-heading text-[42px] leading-[1.02] font-semibold tracking-[-0.035em] text-balance [animation-delay:80ms] md:text-[64px]">
          {title}
        </h1>
        <p className="h-rise max-w-2xl text-[17px] leading-relaxed text-pretty text-muted-foreground [animation-delay:140ms] md:text-[19px]">
          {body}
        </p>
        {children ? <div className="h-rise flex flex-wrap items-center gap-3 [animation-delay:200ms]">{children}</div> : null}
      </Container>
    </section>
  )
}
