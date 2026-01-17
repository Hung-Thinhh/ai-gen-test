/**
 * Higher-Order Component for Tool State Management
 * Automatically handles appState initialization, updates, and reset
 */
import { useState, ComponentType } from 'react';
import { getInitialStateForApp } from '../uiUtils';

export interface WithToolStateInjectedProps<TState> {
    appState: TState;
    onStateChange: (newState: Partial<TState>) => void;
    onReset: () => void;
    onGoBack: () => void;
}

export function withToolState<P extends WithToolStateInjectedProps<any>>(
    Component: ComponentType<P>,
    toolId: string
) {
    return function WrappedComponent(
        props: Omit<P, keyof WithToolStateInjectedProps<any>>
    ) {
        const [appState, setAppState] = useState(() =>
            getInitialStateForApp(toolId)
        );

        const handleStateChange = (newState: any) => {
            setAppState((prev: any) => ({ ...prev, ...newState }));
        };

        const handleReset = () => {
            setAppState(getInitialStateForApp(toolId));
        };

        const handleGoBack = () => {
            // Empty by default - pages can override if needed
        };

        return (
            <Component
                {...(props as P)}
                appState={appState}
                onStateChange={handleStateChange}
                onReset={handleReset}
                onGoBack={handleGoBack}
            />
        );
    };
}
