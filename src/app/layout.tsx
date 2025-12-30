import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";
import { DevMockLogin } from "@/components/DevMockLogin";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['300', '400', '500', '600', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['vietnamese', 'latin'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
});

export const metadata: Metadata = {
  title: "Duky AI",
  description: "AI Generated Images",
  icons: {
    icon: '/img/logo_site.webp',
    shortcut: '/img/logo_site.webp',
    apple: '/img/logo_site.webp',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${beVietnamPro.className}`} suppressHydrationWarning>
        <Providers>
          {children}
          {/* DEV ONLY: Mock login button */}
          {process.env.NODE_ENV === 'development' && (
            <DevMockLogin />
          )}
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                    console.log('ServiceWorker unregistered:', registration);
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
