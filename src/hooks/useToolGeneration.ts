/**
 * Hook for standardizing tool generation with credit checks
 */
import { useAppControls } from '../components/uiUtils';

export function useToolGeneration() {
    const { checkCredits, modelVersion } = useAppControls();

    /**
     * Wraps a generation function with automatic credit checking
     * @param generateFn - The async function to execute
     * @param options - Configuration options
     * @returns Result of generateFn or null if credit check failed
     */
    async function withCreditCheck<T>(
        generateFn: () => Promise<T>,
        options?: {
            creditsPerImage?: number;
            modelCostMultiplier?: boolean; // If true, v3 costs 2x
        }
    ): Promise<T | null> {
        const baseCredits = options?.creditsPerImage || 1;
        const useModelMultiplier = options?.modelCostMultiplier !== false;

        const creditCost = useModelMultiplier && modelVersion === 'v3'
            ? baseCredits * 2
            : baseCredits;

        // Check credits first
        if (!await checkCredits(creditCost)) {
            return null; // Credits insufficient
        }

        // Execute generation
        return await generateFn();
    }

    /**
     * Calculate credit cost based on model version
     */
    function calculateCreditCost(imagesCount: number = 1): number {
        return modelVersion === 'v3' ? imagesCount * 2 : imagesCount;
    }

    return {
        withCreditCheck,
        calculateCreditCost,
        modelVersion
    };
}
