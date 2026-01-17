/**
 * Reusable Textarea with local state management
 * Syncs with parent state only on blur (performance optimization)
 */
import { useState, useEffect } from 'react';

interface ToolTextareaProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
    id?: string;
    colorScheme?: 'yellow' | 'orange' | 'blue' | 'green' | 'purple';
    className?: string;
}

export function ToolTextarea({
    label,
    value,
    onChange,
    placeholder,
    rows = 3,
    id,
    colorScheme = 'yellow',
    className = ''
}: ToolTextareaProps) {
    const [localValue, setLocalValue] = useState(value);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : 'textarea');

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

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
            <textarea
                id={inputId}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={() => {
                    if (localValue !== value) {
                        onChange(localValue);
                    }
                }}
                placeholder={placeholder}
                className={`form-input focus:border-${colorScheme}-500 focus:ring-${colorScheme}-500`}
                rows={rows}
            />
        </div>
    );
}
