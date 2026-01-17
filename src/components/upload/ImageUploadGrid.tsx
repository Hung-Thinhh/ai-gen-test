/**
 * Reusable Image Upload Grid Component
 * Supports progressive reveal (show slots one by one)
 */
import { motion, AnimatePresence } from 'framer-motion';
import ActionablePolaroidCard from '../ActionablePolaroidCard';

export interface UploadSlot {
    id: string;
    image: string | null;
    caption: string;
    description: string;
    placeholderType?: 'person' | 'magic' | 'architecture' | 'clothing' | 'style';
}

interface ImageUploadGridProps {
    slots: UploadSlot[];
    onImageChange: (slotId: string, url: string | null) => void;
    onImageClick?: (slotId: string) => void;
    progressive?: boolean; // Show slots one by one
    columns?: 2 | 3 | 4;
    className?: string;
}

export function ImageUploadGrid({
    slots,
    onImageChange,
    onImageClick,
    progressive = false,
    columns = 4,
    className = ''
}: ImageUploadGridProps) {
    const gridCols = {
        2: 'grid-cols-2',
        3: 'grid-cols-2 md:grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-4'
    };

    return (
        <div className={`grid ${gridCols[columns]} gap-2 w-full max-w-7xl mx-auto px-4 ${className}`}>
            {slots.map((slot, index) => {
                // Progressive reveal: hide slot if previous one is empty
                if (progressive && index > 0 && !slots[index - 1].image) {
                    return null;
                }

                return (
                    <AnimatePresence key={slot.id}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <ActionablePolaroidCard
                                    type={slot.image ? 'multi-input' : 'uploader'}
                                    caption={slot.caption}
                                    status="done"
                                    mediaUrl={slot.image || undefined}
                                    placeholderType={
                                        slot.placeholderType === 'person' ||
                                            slot.placeholderType === 'architecture' ||
                                            slot.placeholderType === 'clothing' ||
                                            slot.placeholderType === 'style' ||
                                            slot.placeholderType === 'magic'
                                            ? slot.placeholderType
                                            : 'magic'
                                    }
                                    onClick={slot.image && onImageClick ? () => onImageClick(slot.id) : undefined}
                                    onImageChange={(url) => onImageChange(slot.id, url)}
                                />
                                <p className="base-font font-bold text-neutral-300 text-center max-w-xs text-xs sm:text-sm">
                                    {slot.description}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                );
            })}
        </div>
    );
}
