"use client";

import { useAppControls } from './uiContexts';
import { useEffect, useState } from 'react';
import MainApp from './MainApp';

interface RouteSetterProps {
    viewId: string;
}

export default function RouteSetter({ viewId }: RouteSetterProps) {
    const { setActivePage, currentView } = useAppControls();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (viewId) {
            setActivePage(viewId as any);
            // Small delay to ensure state is updated before rendering
            setTimeout(() => setIsReady(true), 0);
        }
    }, [viewId, setActivePage]);

    // Don't render MainApp until the correct view is set
    // This prevents flash of wrong content
    if (!isReady || currentView?.viewId !== viewId) {
        return null;
    }

    return <MainApp />;
}
