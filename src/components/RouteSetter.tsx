"use client";

import { useAppControls } from './uiContexts';
import { useEffect } from 'react';
import MainApp from './MainApp';

interface RouteSetterProps {
    viewId: string;
}

export default function RouteSetter({ viewId }: RouteSetterProps) {
    const { setActivePage } = useAppControls();

    useEffect(() => {
        if (viewId) {
            setActivePage(viewId as any);
        }
    }, [viewId, setActivePage]);

    return <MainApp />;
}
