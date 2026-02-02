import React from 'react';
import { VisibleIcon, EditorIcon, DeleteIcon, ShareIcon } from './icons';

interface ImageThumbnailActionsProps {
    isSelectionMode: boolean;
    isVideo: boolean;
    onEdit?: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    onQuickView?: (e: React.MouseEvent) => void;
    onShare?: (e: React.MouseEvent) => void;
    isShared?: boolean;
}


export const ImageThumbnailActions: React.FC<ImageThumbnailActionsProps> = ({
    isSelectionMode,
    isVideo,
    onEdit,
    onDelete,
    onQuickView,
    onShare,
    isShared,
}) => {
    if (isSelectionMode) {
        return null;
    }

    return (
        <div className="thumbnail-actions">
            {/* Quick View removed as per request */}
            {/* {onQuickView && (
                <button onClick={onQuickView} className="thumbnail-action-btn flex items-center justify-center" aria-label="Xem nhanh" title="Xem nhanh">
                    <VisibleIcon className="h-4 w-4" strokeWidth={2} />
                </button>
            )} */}

            {/* Share Button added */}
            {onShare && (
                <button
                    onClick={onShare}
                    className={`thumbnail-action-btn flex items-center justify-center ${isShared ? '!bg-orange-500 text-white hover:!bg-orange-600' : 'bg-blue-500/20 hover:!bg-blue-500/40 text-blue-300'}`}
                    aria-label={isShared ? "Huỷ chia sẻ" : "Chia sẻ"}
                    title={isShared ? "Huỷ chia sẻ" : "Chia sẻ cộng đồng"}
                >
                    <ShareIcon className="h-4 w-4" />
                </button>
            )}

            {!isVideo && onEdit && (
                <button onClick={onEdit} className="thumbnail-action-btn flex items-center justify-center" aria-label="Sửa ảnh" title="Sửa ảnh">
                    <EditorIcon className="h-4 w-4" />
                </button>
            )}
            <button onClick={onDelete} className="thumbnail-action-btn flex items-center justify-center hover:!bg-red-600 focus:!ring-red-500" aria-label="Xóa ảnh" title="Xóa ảnh">
                <DeleteIcon className="h-4 w-4" />
            </button>
        </div>
    );
};