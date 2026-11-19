import { cn } from '@/lib/utils'

export function DemoCapture({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <form
      action="/demo"
      method="get"
      className={cn(
        'flex w-full max-w-md items-center gap-1 rounded-full p-1.5 shadow-[0_12px_40px_-20px_rgb(10_15_28/0.35)]',
        dark ? 'bg-white/10 ring-1 ring-white/15' : 'bg-background ring-1 ring-border',
        className,
      )}
    >
      <label htmlFor={dark ? 'demo-email-dark' : 'demo-email'} className="sr-only">
        Adresse e-mail professionnelle
      </label>
      <input
        id={dark ? 'demo-email-dark' : 'demo-email'}
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="vous@entreprise.fr"
        className={cn(
          'h-10 min-w-0 flex-1 bg-transparent px-4 text-[15px] outline-none',
          dark ? 'text-white placeholder:text-white/40' : 'text-foreground placeholder:text-subtle',
        )}
      />
      <button
        type="submit"
        className={cn(
          'h-10 shrink-0 rounded-full px-5 text-[14.5px] font-medium transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
          dark ? 'bg-white text-ink' : 'bg-foreground text-background',
        )}
      >
        Demander une démo
      </button>
    </form>
  )
}
