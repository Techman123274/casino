"use client";

import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { TheVault } from "@/components/landing/TheVault";
import { LiveLedgerTicker } from "@/components/landing/LiveLedgerTicker";
import { VIPComparison } from "@/components/landing/VIPComparison";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <SmoothScroll>
      <ScrollProgress />
      <LandingNav />

      <div className="snap-container hide-scrollbar">
        <div className="snap-section">
          <HeroSection />
        </div>

        <div className="snap-section">
          <TheVault />
        </div>

        <div className="snap-section">
          <LiveLedgerTicker />
        </div>

        <div className="snap-section">
          <VIPComparison />
        </div>

        <div className="snap-section">
          <LandingFooter />
        </div>
      </div>
    </SmoothScroll>
  );
}
