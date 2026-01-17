/**
 * Wrapper component for tool pages
 * Handles common setup: setActivePage, settings loading, etc.
 */
import { useEffect, ReactNode } from 'react';
import { useAppControls } from '../uiUtils';

interface ToolPageWrapperProps {
    toolId: string;
    settingsKey: string;
    children: (injectedProps: {
        settings: any;
        t: (key: string, ...args: any[]) => string;
        addImagesToGallery: (images: string[], persist?: boolean) => Promise<string[] | undefined>;
        logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: any) => void;
    }) => ReactNode;
}

export function ToolPageWrapper({ toolId, settingsKey, children }: ToolPageWrapperProps) {
    const { setActivePage, settings, t, addImagesToGallery, logGeneration } = useAppControls();

    useEffect(() => {
        setActivePage(toolId as any);
    }, [setActivePage, toolId]);

    const toolSettings = settings?.[settingsKey] || {};

    return (
        <>
            {children({
                settings: toolSettings,
                t,
                addImagesToGallery,
                logGeneration
            })}
        </>
    );
}
