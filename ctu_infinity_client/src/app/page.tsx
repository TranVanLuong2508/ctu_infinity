import { HomeHeader } from '@/components/home/home-header';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturesSection } from '@/components/home/features-section';
import { HowItWorksSection } from '@/components/home/how-it-works-section';
import { CTASection } from '@/components/home/cta-section';
import { HomeFooter } from '@/components/home/home-footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <HomeHeader />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <HomeFooter />
    </div>
  );
}
