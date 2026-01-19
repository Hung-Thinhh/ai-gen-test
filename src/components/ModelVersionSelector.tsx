import React from 'react';
import { cn } from '../lib/utils';
import { ModelVersion } from './uiTypes';

interface ModelVersionSelectorProps {
    modelVersion: ModelVersion;
    onModelChange: (version: ModelVersion) => void;
    className?: string;
}

export const ModelVersionSelector: React.FC<ModelVersionSelectorProps> = ({
    modelVersion,
    onModelChange,
    className
}) => {
    return (
        <div className={cn(
            "flex gap-1 themed-card backdrop-blur-md rounded-full p-1 border border-white/10 shadow-lg",
            "md:flex-row md:text-sm",
            "text-xs",
            className
        )}>
            <button
                onClick={() => onModelChange('v2')}
                className={cn(
                    'rounded-full font-bold transition-all duration-200',
                    'md:px-4 md:py-1.5 md:text-xs',
                    'px-2 py-1 text-[10px]',
                    modelVersion === 'v2' ? 'text-black shadow-md' : 'text-neutral-400 hover:text-white'
                )}
                style={modelVersion === 'v2' ? { backgroundColor: '#f97316' } : {}} // Orange-500
            >
                <span className="hidden md:inline">Model </span>V2
            </button>
            <button
                onClick={() => onModelChange('v3')}
                className={cn(
                    'rounded-full font-bold transition-all duration-200',
                    'md:px-4 md:py-1.5 md:text-xs',
                    'px-2 py-1 text-[10px]',
                    modelVersion === 'v3' ? 'text-black shadow-md' : 'text-neutral-400 hover:text-white'
                )}
                style={modelVersion === 'v3' ? { backgroundColor: '#f97316' } : {}} // Orange-500
            >
                <span className="hidden md:inline">Model </span>V3
            </button>
        </div>
    );
};
