/**
 * Reusable Number Input with increment/decrement buttons
 */
import { Minus, Plus } from 'lucide-react';

interface ToolNumberInputProps {
    label?: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    id?: string;
    colorScheme?: 'yellow' | 'orange' | 'blue' | 'green' | 'purple';
    className?: string;
    showButtons?: boolean;
}

export function ToolNumberInput({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    id,
    colorScheme = 'yellow',
    className = '',
    showButtons = true
}: ToolNumberInputProps) {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : 'number-input');

    const handleIncrement = () => {
        const newValue = value + step;
        if (max === undefined || newValue <= max) {
            onChange(newValue);
        }
    };

    const handleDecrement = () => {
        const newValue = value - step;
        if (min === undefined || newValue >= min) {
            onChange(newValue);
        }
    };

    return (
        <div className={className}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-left base-font font-bold text-lg text-neutral-200 mb-2"
                >
                    {label}
                </label>
            )}
            <div className="flex items-center gap-2">
                {showButtons && (
                    <button
                        type="button"
                        onClick={handleDecrement}
                        disabled={min !== undefined && value <= min}
                        className="btn btn-secondary !px-3 !py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Minus className="h-4 w-4" />
                    </button>
                )}
                <input
                    id={inputId}
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    min={min}
                    max={max}
                    step={step}
                    className={`form-input focus:border-${colorScheme}-500 focus:ring-${colorScheme}-500 text-center ${!showButtons ? 'flex-1' : 'w-20'}`}
                />
                {showButtons && (
                    <button
                        type="button"
                        onClick={handleIncrement}
                        disabled={max !== undefined && value >= max}
                        className="btn btn-secondary !px-3 !py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
