"use client";

import AppLayout from "@/components/AppLayout";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppLayout>
            {children}
        </AppLayout>
    );
}
