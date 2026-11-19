import { DemoCapture } from '../demo-capture'
import { Container, TextLink } from '../ui'
import { HeroProduct } from './hero-product'

export function HomeHero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="dot-grid fade-mask absolute inset-x-0 top-0 h-[640px]" />
      <div
        aria-hidden="true"
        className="absolute top-[420px] left-1/2 h-[520px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(37_99_235/0.16),transparent)]"
      />
      <Container className="relative flex flex-col items-center gap-7 pt-20 pb-16 text-center lg:pt-28">
        <p className="h-rise font-mono text-[11.5px] tracking-[0.08em] text-muted-foreground uppercase">
          QA + Pentest autonomes pour SaaS B2B
        </p>
        <h1 className="h-rise max-w-4xl font-heading text-[46px] leading-[0.98] font-semibold tracking-[-0.04em] text-balance [animation-delay:80ms] md:text-[84px]">
          Attaquez votre SaaS. <span className="text-steel">Avant eux.</span>
        </h1>
        <p className="h-rise max-w-2xl text-[17px] leading-relaxed text-pretty text-muted-foreground [animation-delay:140ms] md:text-[20px]">
          Des agents <strong className="font-semibold text-foreground">explorent</strong> votre préproduction,{' '}
          <strong className="font-semibold text-foreground">rejouent</strong> chaque requête avec la session d’un autre client
          et <strong className="font-semibold text-foreground">prouvent</strong> la fuite, à chaque déploiement.
        </p>
        <div className="h-rise flex w-full flex-col items-center gap-4 [animation-delay:200ms]">
          <DemoCapture />
          <TextLink href="/signup">Ou démarrer l’essai de 7 jours</TextLink>
        </div>
      </Container>
      <Container className="relative pb-20 lg:pb-28">
        <HeroProduct />
      </Container>
    </section>
  )
}
