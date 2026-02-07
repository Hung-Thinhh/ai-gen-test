import React from 'react';

interface StylePresetCardProps {
    icon: string;
    iconBg: string;
    title: string;
    description: string;
    isSelected: boolean;
    onClick: () => void;
}

export const StylePresetCard: React.FC<StylePresetCardProps> = ({
    icon,
    iconBg,
    title,
    description,
    isSelected,
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            className={`relative flex flex-col items-start p-4 rounded-xl cursor-pointer transition-all duration-200 ${isSelected
                ? 'bg-neutral-800 ring-2 ring-orange-500'
                : 'bg-neutral-900 hover:bg-neutral-800'
                }`}
        >
            {/* Selected Badge */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}

            {/* Icon */}
            {/* <div
                className="w-12 h-12 rounded-full hidden md:flex items-center justify-center text-2xl mb-3"
                style={{ backgroundColor: iconBg }}
            >
                {icon}
            </div> */}

            {/* Title */}
            <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>

            {/* Description */}
            <p className="text-neutral-400 !text-xs leading-relaxed">{description}</p>
        </div>
    );
};
