/**
 * Reusable Select/Dropdown component for tools
 */

interface ToolSelectProps {
    label: string;
    value: string;
    options: string[];
    onChange: (value: string) => void;
    id?: string;
    colorScheme?: 'yellow' | 'orange' | 'blue' | 'green' | 'purple';
    className?: string;
}

export function ToolSelect({
    label,
    value,
    options,
    onChange,
    id,
    colorScheme = 'yellow',
    className = ''
}: ToolSelectProps) {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={className}>
            <label
                htmlFor={inputId}
                className="block text-left base-font font-bold text-lg text-neutral-200 mb-2"
            >
                {label}
            </label>
            <select
                id={inputId}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`form-input focus:border-${colorScheme}-500 focus:ring-${colorScheme}-500`}
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        </div>
    );
}
