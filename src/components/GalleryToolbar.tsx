/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useAppControls } from './uiUtils';
import { CloseIcon, CloudUploadIcon } from './icons';

interface GalleryToolbarProps {
    isSelectionMode: boolean;
    selectedCount: number;
    imageCount: number;
    title: string;
    isCombining?: boolean;
    onToggleSelectionMode: () => void;
    onDeleteSelected: () => void;
    onClose: () => void;
    onUploadClick?: () => void;
    onDownloadAll?: () => void; // Optional for contexts where download isn't needed
    onCombineHorizontal?: () => void;
    onCombineVertical?: () => void;
}

export const GalleryToolbar: React.FC<GalleryToolbarProps> = ({
    isSelectionMode,
    selectedCount,
    imageCount,
    title,
    isCombining,
    onToggleSelectionMode,
    onDeleteSelected,
    onClose,
    onUploadClick,
    onDownloadAll,
    onCombineHorizontal,
    onCombineVertical,
}) => {
    const { t } = useAppControls();

    if (isSelectionMode) {
        return (
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-4 mb-4 flex-shrink-0 gap-3 md:gap-0">
                <h3 className="base-font font-bold text-2xl text-yellow-400 text-center md:text-left">{t('galleryToolbar_selected', selectedCount)}</h3>
                <div className="flex items-center gap-2 justify-center md:justify-end">
                    <button onClick={onDeleteSelected} className="btn btn-secondary btn-sm !bg-red-500/20 !border-red-500/80 hover:!bg-red-500" disabled={selectedCount === 0}>
                        {t('common_delete')}
                    </button>
                    <button onClick={onToggleSelectionMode} className="btn btn-secondary btn-sm" aria-label={t('common_cancel')}>
                        {t('common_cancel')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-4 mb-4 flex-shrink-0 gap-3 md:gap-0">
            <h3 className="base-font font-bold text-2xl text-yellow-400 text-center md:text-left">{title}</h3>
            <div className="flex items-center gap-2 justify-center md:justify-end">
                {onDownloadAll && <button onClick={onDownloadAll} className="btn btn-secondary btn-sm text-sm" disabled={imageCount === 0}>{t('common_downloadAll')}</button>}
                <button onClick={onToggleSelectionMode} className="btn btn-secondary btn-sm text-sm" disabled={imageCount === 0}>{t('common_select')}</button>

            </div>
        </div>
    );
};