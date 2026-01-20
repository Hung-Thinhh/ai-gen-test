import React from 'react';

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange }) => {
    return (
        <div className="flex items-center justify-between">
            <label className="text-white font-semibold text-base flex items-center gap-2">
                <span className="text-orange-500 text-lg">T</span>
                {label}
            </label>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${checked ? 'bg-orange-500' : 'bg-neutral-700'
                    }`}
            >
                <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 ${checked ? 'right-0.5' : 'left-0.5'
                        }`}
                />
            </button>
        </div>
    );
};
