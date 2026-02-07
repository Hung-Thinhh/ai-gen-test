"use client";

import AppLayout from "@/components/AppLayout";

export default function PosterLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppLayout>
            {children}
        </AppLayout>
    );
}
