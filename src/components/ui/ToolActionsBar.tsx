/**
 * Reusable Actions Bar for tools
 * Standardizes button layout and loading states
 */

interface ActionButton {
    label: string;
    onClick: () => void;
    variant?: 'secondary' | 'danger';
}

interface ToolActionsBarProps {
    primary: {
        label: string;
        onClick: () => void;
        disabled?: boolean;
        loading?: boolean;
        loadingLabel?: string;
    };
    secondary?: ActionButton[];
    className?: string;
}

export function ToolActionsBar({ primary, secondary, className = '' }: ToolActionsBarProps) {
    return (
        <div className={`flex items-center justify-end gap-4 pt-4 ${className}`}>
            {secondary?.map((btn, index) => (
                <button
                    key={index}
                    onClick={btn.onClick}
                    className={`btn btn-${btn.variant || 'secondary'}`}
                >
                    {btn.label}
                </button>
            ))}
            <button
                onClick={primary.onClick}
                className="btn btn-primary"
                disabled={primary.disabled || primary.loading}
            >
                {primary.loading ? (primary.loadingLabel || primary.label) : primary.label}
            </button>
        </div>
    );
}
