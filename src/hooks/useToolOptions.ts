/**
 * Hook for managing tool options changes
 * Simplifies option state management pattern
 */
import { useCallback } from 'react';

export function useToolOptions<TOptions>(
    currentOptions: TOptions,
    onUpdate: (newOptions: Partial<TOptions>) => void
) {
    const handleChange = useCallback(<K extends keyof TOptions>(
        field: K,
        value: TOptions[K]
    ) => {
        const update = {} as Partial<TOptions>;
        update[field] = value;
        onUpdate(update);
    }, [onUpdate]);

    const handleMultipleChanges = useCallback((changes: Partial<TOptions>) => {
        onUpdate(changes);
    }, [onUpdate]);

    const resetOption = useCallback(<K extends keyof TOptions>(
        field: K,
        defaultValue: TOptions[K]
    ) => {
        handleChange(field, defaultValue);
    }, [handleChange]);

    return {
        options: currentOptions,
        handleChange,
        handleMultipleChanges,
        resetOption
    };
}
