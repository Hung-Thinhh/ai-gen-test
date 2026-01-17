"use client";

import { useEffect } from 'react';
import Home from '@/components/Home';
import { useAppControls } from '@/components/uiContexts';
import { renderSmartlyWrappedTitle } from '@/components/uiUtils';
import type { AppConfig } from '@/components/uiTypes';
import { useRouter } from 'next/navigation';

export default function GeneratorsPage() {
    const { setActivePage, settings, t } = useAppControls();
    const router = useRouter();

    useEffect(() => {
        setActivePage('generators' as any);
    }, [setActivePage]);

    if (!settings) return null;

    return (
        <Home
            onSelectApp={(appId) => {
                // Special case: studio tool redirects to /studio instead of /tool/studio
                if (appId === 'studio') {
                    router.push('/studio');
                } else {
                    router.push(`/tool/${appId}`);
                }
            }}
            title={renderSmartlyWrappedTitle(
                t(settings.home.mainTitleKey),
                settings.home.useSmartTitleWrapping,
                settings.home.smartTitleWrapWords
            )}
            subtitle={t(settings.home.subtitleKey)}
            apps={settings.apps.map((app: AppConfig) => ({
                ...app,
                title: t(app.titleKey),
                description: t(app.descriptionKey)
            }))}
        />
    );
}
