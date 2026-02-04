import { Metadata } from "next";
import { ContactHero } from "@/components/contact/ContactHero";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactInfo } from "@/components/contact/ContactInfo";
import { ContactOptions } from "@/components/contact/ContactOptions";

export const metadata: Metadata = {
  title: "Liên hệ | Duky AI",
  description: "Liên hệ với đội ngũ Duky AI. Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black">
      <ContactHero />

      {/* Contact Section */}
      <section className="py-12 md:py-16 bg-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Form - Takes 3 columns */}
            <div className="lg:col-span-3">
              <ContactForm />
            </div>

            {/* Info - Takes 2 columns */}
            <div className="lg:col-span-2">
              <ContactInfo />
            </div>
          </div>
        </div>
      </section>

      <ContactOptions />
    </main>
  );
}
