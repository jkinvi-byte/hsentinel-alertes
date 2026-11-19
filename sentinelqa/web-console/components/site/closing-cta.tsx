import { DemoCapture } from './demo-capture'
import { Container, TextLink } from './ui'

export function ClosingCta({
  title = 'Prouvez-le avant votre prochain client.',
  body = 'Une démo de 30 minutes sur votre propre préproduction, ou un essai de 7 jours en autonomie.',
}: {
  title?: string
  body?: string
}) {
  return (
    <section className="py-20 lg:py-24">
      <Container>
        <div className="h-reveal relative overflow-hidden rounded-[28px] bg-ink px-8 py-14 text-white md:px-14 md:py-20">
          <div aria-hidden="true" className="dot-grid-dark absolute inset-0" />
          <div
            aria-hidden="true"
            className="absolute -top-40 -right-24 size-[420px] rounded-full bg-[radial-gradient(circle,rgb(37_99_235/0.35),transparent_65%)]"
          />
          <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-xl flex-col gap-4">
              <h2 className="font-heading text-[34px] leading-[1.04] font-semibold tracking-[-0.03em] text-balance md:text-[48px]">
                {title}
              </h2>
              <p className="text-[16px] leading-relaxed text-white/65">{body}</p>
            </div>
            <div className="flex w-full max-w-md flex-col gap-4">
              <DemoCapture dark />
              <div className="pl-2">
                <TextLink href="/signup" dark>
                  Ou démarrer l’essai de 7 jours
                </TextLink>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
