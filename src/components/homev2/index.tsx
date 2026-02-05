"use client";

import { AnnouncementBar } from "./AnnouncementBar";
import { LandingNavbar } from "./LandingNavbar";
import { HeroV2 } from "./HeroV2";
import { TrustBadges } from "./TrustBadges";
import { ToolsShowcaseV2 } from "./ToolsShowcaseV2";
import { HowItWorks } from "./HowItWorks";
import { CommunityShowcase } from "./CommunityShowcase";
import { Testimonials } from "./Testimonials";
import { Pricing } from "../Pricing";
import { FAQ } from "./FAQ";
import { FinalCTA } from "./FinalCTA";
import { FooterV2 } from "./FooterV2";
import ToolShowcase from "../ToolShowcase";
import { CommunityGallery } from "../CommunityGallery";
import { MobileHomeHeader } from "../MobileHeader";
import { useAppControls } from "../uiContexts";
import { useIsMobile } from "@/utils/mobileUtils";
import StudioConcept from "../StudioConcept";


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
       {/* Studio Concept Section */}
                  <div className="relative z-10 w-screen left-1/2 -translate-x-1/2 bg-black">
                      <StudioConcept />
                  </div>
      <CommunityGallery />
      {/* <CommunityShowcase /> */}
      <Testimonials />
      <section id="pricing" className="hidden md:block py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Chọn gói phù hợp
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              Bắt đầu miễn phí, nâng cấp khi cần. Hoàn tiền trong 7 ngày nếu không hài lòng.
            </p>
          </div>
          <Pricing />
        </div>
      </section>
      <section id="faq">
        <FAQ />
      </section>
      <FinalCTA />
     
    </main>
  );
};
