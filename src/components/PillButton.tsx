import React from 'react';

interface PillButtonProps {
    label: string;
    isSelected: boolean;
    onClick: () => void;
}

export const PillButton: React.FC<PillButtonProps> = ({ label, isSelected, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${isSelected
                    ? 'bg-orange-500 text-white'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
        >
            {label}
        </button>
    );
};
