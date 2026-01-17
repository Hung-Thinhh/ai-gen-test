/**
 * Reusable Result Card Component
 * Displays result images with lightbox integration
 */
import { motion } from 'framer-motion';
import ActionablePolaroidCard from '../ActionablePolaroidCard';

export interface ResultCardProps {
    imageUrl: string | null;
    caption: string;
    status: 'pending' | 'done' | 'error';
    error?: string;
    onImageClick?: () => void;
    onRegenerate?: (prompt: string) => void;
    onImageChange?: (newUrl: string | null) => void;
    onGenerateVideo?: (prompt: string) => void;
    regenerationTitle?: string;
    regenerationDescription?: string;
    regenerationPlaceholder?: string;
    isMobile?: boolean;
    className?: string;
}

export function ResultCard({
    imageUrl,
    caption,
    status,
    error,
    onImageClick,
    onRegenerate,
    onImageChange,
    onGenerateVideo,
    regenerationTitle,
    regenerationDescription,
    regenerationPlaceholder,
    isMobile,
    className = ''
}: ResultCardProps) {
    return (
        <motion.div
            className={`w-full md:w-auto flex-shrink-0 ${className}`}
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        >
            <ActionablePolaroidCard
                type="output"
                caption={caption}
                status={status}
                mediaUrl={imageUrl || undefined}
                error={error}
                onClick={status === 'done' && imageUrl ? onImageClick : undefined}
                onRegenerate={onRegenerate}
                onImageChange={onImageChange}
                onGenerateVideoFromPrompt={onGenerateVideo}
                regenerationTitle={regenerationTitle}
                regenerationDescription={regenerationDescription}
                regenerationPlaceholder={regenerationPlaceholder}
                isMobile={isMobile}
            />
        </motion.div>
    );
}
