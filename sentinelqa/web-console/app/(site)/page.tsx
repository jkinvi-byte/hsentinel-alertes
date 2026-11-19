import { ClosingCta } from '@/components/site/closing-cta'
import { HomeHero } from '@/components/site/home/hero'
import {
  HomeStory,
  ProductGrid,
  SectorStrip,
  ShiftBlock,
  StatsBand,
  TrustRow,
  UseCases,
} from '@/components/site/home/sections'

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <SectorStrip />
      <ProductGrid />
      <ShiftBlock />
      <HomeStory />
      <StatsBand />
      <UseCases />
      <TrustRow />
      <ClosingCta />
    </>
  )
}
