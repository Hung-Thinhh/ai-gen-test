import { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { ContactOptions } from "@/components/contact/ContactOptions";

export const metadata: Metadata = {
  title: "Contact Us | Duky AI",
  description: "Contact the Duky AI team. We are always ready to support you 24/7.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Contact Section */}
      <section className="py-12 md:py-20 bg-black">
        <div className="max-w-6xl mx-auto px-4">
          <ContactForm />
        </div>
      </section>

      <ContactOptions />
    </main>
  );
}
