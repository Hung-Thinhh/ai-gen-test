"use client";

import { AnnouncementBar } from "./AnnouncementBar";
import { LandingNavbar } from "./LandingNavbar";
import { HeroV2 } from "./HeroV2";
import { TrustBadges } from "./TrustBadges";
import { ToolsShowcaseV2 } from "./ToolsShowcaseV2";
import { HowItWorks } from "./HowItWorks";
import { CommunityShowcase } from "./CommunityShowcase";
import { Testimonials } from "./Testimonials";
import { PricingV2 } from "./PricingV2";
import { FAQ } from "./FAQ";
import { FinalCTA } from "./FinalCTA";
import { FooterV2 } from "./FooterV2";
import ToolShowcase from "../ToolShowcase";
import { CommunityGallery } from "../CommunityGallery";
import { MobileHomeHeader } from "../MobileHeader";
import { useAppControls } from "../uiContexts";
import { useIsMobile } from "@/utils/mobileUtils";


export const HomeV2 = () => {
  const appControls = useAppControls() as any;
    const { t, handleSelectApp, settings, language, modelVersion, handleModelVersionChange, guestCredits, userCredits, isLoggedIn } = appControls;
const currentCredits = isLoggedIn ? userCredits : guestCredits;
  const isMobile = useIsMobile();
    const toolGridCount = isMobile ? 9 : 15;
  
  return (
    <main className="min-h-screen bg-black">
       {isMobile && (
                      <MobileHomeHeader
                          title="Home"
                          apps={settings ? settings.apps.map((app: any) => ({ ...app, title: t(app.titleKey), description: t(app.descriptionKey) })) : []}
                          onSelectApp={handleSelectApp}
                          credits={currentCredits}
                      />
                  )}
      <AnnouncementBar />
      {/* <LandingNavbar /> */}
      <HeroV2 />
      <TrustBadges />
      <section id="tools">
        <ToolsShowcaseV2 />
      </section>
      <div className="relative z-10 w-screen left-1/2 -translate-x-1/2 bg-black">
        <ToolShowcase />
      </div>
      <HowItWorks />
      <CommunityGallery />
      {/* <CommunityShowcase /> */}
      <Testimonials />
      <section id="pricing" className="hidden md:block">
        <PricingV2 />
      </section>
      <section id="faq">
        <FAQ />
      </section>
      <FinalCTA />
      <FooterV2 />
    </main>
  );
};
