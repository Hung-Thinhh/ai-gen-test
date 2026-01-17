/**
 * Reusable Text Input component for tools
 */

interface ToolInputProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    id?: string;
    type?: 'text' | 'number' | 'email';
    colorScheme?: 'yellow' | 'orange' | 'blue' | 'green' | 'purple';
    className?: string;
}

export function ToolInput({
    label,
    value,
    onChange,
    placeholder,
    id,
    type = 'text',
    colorScheme = 'yellow',
    className = ''
}: ToolInputProps) {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : 'input');

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
            <input
                id={inputId}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`form-input focus:border-${colorScheme}-500 focus:ring-${colorScheme}-500`}
            />
        </div>
    );
}
