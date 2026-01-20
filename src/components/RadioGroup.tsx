import React from 'react';

interface RadioOption {
    value: string;
    label: string;
    icon?: string;
}

interface RadioGroupProps {
    label: string;
    options: RadioOption[];
    value: string;
    onChange: (value: string) => void;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({ label, options, value, onChange }) => {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">{label}</label>
            <div className="flex flex-col gap-2">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${value === option.value
                                ? 'bg-orange-500/20 text-white border border-orange-500'
                                : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:bg-neutral-800'
                            }`}
                    >
                        {/* Radio Circle */}
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${value === option.value
                                ? 'border-orange-500'
                                : 'border-neutral-600'
                            }`}>
                            {value === option.value && (
                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            )}
                        </div>

                        {/* Icon */}
                        {option.icon && <span className="text-base">{option.icon}</span>}

                        {/* Label */}
                        <span className="flex-1 text-left">{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
