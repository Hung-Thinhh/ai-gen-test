/**
 * Reusable Checkbox component for tools
 */

interface ToolCheckboxProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    id?: string;
    colorScheme?: 'yellow' | 'orange' | 'blue' | 'green' | 'purple';
    className?: string;
}

export function ToolCheckbox({
    label,
    checked,
    onChange,
    id,
    colorScheme = 'yellow',
    className = ''
}: ToolCheckboxProps) {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={`flex items-center ${className}`}>
            <input
                type="checkbox"
                id={inputId}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className={`h-4 w-4 rounded border-neutral-500 bg-neutral-700 text-${colorScheme}-400 focus:ring-${colorScheme}-400 focus:ring-offset-neutral-800`}
            />
            <label
                htmlFor={inputId}
                className="ml-3 block text-sm font-medium text-neutral-300"
            >
                {label}
            </label>
        </div>
    );
}
