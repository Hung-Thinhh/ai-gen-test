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
            <div className="flex flex-row justify-between items-center mt-4 mb-4 flex-shrink-0 gap-3 md:gap-0 px-10">
                <h3 className="base-font font-bold text-2xl text-orange-600 text-center md:text-left">{t('galleryToolbar_selected', selectedCount)}</h3>
                <div className="flex items-center gap-2 justify-center md:justify-end">
                    {onDownloadAll && (
                        <button
                            onClick={onDownloadAll}
                            className="btn !py-2 !px-4 btn-secondary btn-sm"
                            disabled={selectedCount === 0}
                        >
                            {t('common_downloadAll')}
                        </button>
                    )}
                    <button onClick={onDeleteSelected} className="btn !py-2 !px-4 btn-secondary btn-sm !bg-red-500/20 !border-red-500/80 hover:!bg-red-500" disabled={selectedCount === 0}>
                        {t('common_delete')}
                    </button>
                    <button onClick={onToggleSelectionMode} className="btn !py-2 !px-4 btn-secondary btn-sm hover:transform-none" aria-label={t('common_cancel')}>
                        {t('common_cancel')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-row justify-between items-center mt-0 md:mt-4 mb-4 flex-shrink-0 gap-3 md:gap-0 px-10">
            <h3 className="base-font font-bold text-2xl text-orange-500 text-center md:text-left">{title}</h3>
            <div className="flex items-center gap-2 justify-center md:justify-end">
                <button onClick={onToggleSelectionMode} className="btn btn-secondary btn-sm text-sm !p-2" disabled={imageCount === 0}>{t('common_select')}</button>
            </div>
        </div>
    );
};