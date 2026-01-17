/**
 * Reusable Options Panel Container
 * Consistent styling for all tool option sections
 */
import { ReactNode } from 'react';

interface ToolOptionsPanelProps {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    colorScheme?: 'yellow' | 'orange' | 'blue' | 'green' | 'purple';
    className?: string;
}

export function ToolOptionsPanel({
    title,
    subtitle,
    children,
    colorScheme = 'yellow',
    className = ''
}: ToolOptionsPanelProps) {
    const colors = {
        yellow: { title: 'text-yellow-400', border: 'border-yellow-400/20' },
        orange: { title: 'text-orange-500', border: 'border-orange-500/30' },
        blue: { title: 'text-blue-400', border: 'border-blue-400/20' },
        green: { title: 'text-green-400', border: 'border-green-400/20' },
        purple: { title: 'text-purple-400', border: 'border-purple-400/20' },
    };

    const scheme = colors[colorScheme];

    return (
        <div className={`w-full max-w-4xl bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-2xl border border-neutral-700/50 ${className}`}>
            {title && (
                <h2 className={`base-font font-bold text-2xl ${scheme.title} border-b ${scheme.border} pb-2 mb-4`}>
                    {title}
                </h2>
            )}
            {subtitle && (
                <p className="text-neutral-300 text-sm mb-4">{subtitle}</p>
            )}
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}
