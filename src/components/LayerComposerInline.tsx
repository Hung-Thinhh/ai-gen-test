/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLayerComposerState } from './LayerComposer/useLayerComposerState';
import { GalleryPicker, WebcamCaptureModal, useAppControls } from './uiUtils';
import { LayerComposerSidebar } from './LayerComposer/LayerComposerSidebar';
import { LayerComposerCanvas } from './LayerComposer/LayerComposerCanvas';
import { AIProcessLogger } from './LayerComposer/AIProcessLogger';
import { AIChatbot } from './LayerComposer/AIChatbot';
import { CloudUploadIcon } from './icons';

interface LayerComposerInlineProps {
    onClose: () => void;
}

// Wrapper component to conditionally render webcam button
const CustomStartScreen: React.FC<{ state: any }> = ({ state }) => {
    const { t, settings } = useAppControls();
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-neutral-900/50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-yellow-400 base-font">{t('layerComposer_title')}</h3>
            <p className="text-neutral-400 text-center max-w-sm">Tạo canvas mới, tải lên ảnh hoặc kéo thả file .json để bắt đầu.</p>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
                <button onClick={state.handleCreateNew} className="btn btn-primary btn-sm">{t('imageEditor_createButton')}</button>
                <button onClick={() => state.setIsGalleryOpen(true)} className="btn btn-secondary btn-sm" disabled={state.imageGallery.length === 0}>{t('imageEditor_galleryButton')}</button>
                <button onClick={state.handleUploadClick} className="btn btn-secondary btn-sm">{t('imageEditor_uploadButton')}</button>
                {settings?.enableWebcam && (
                    <button onClick={() => state.setIsWebcamOpen(true)} className="btn btn-secondary btn-sm">{t('imageEditor_webcamButton')}</button>
                )}
            </div>
        </div>
    );
};

export const LayerComposerInline: React.FC<LayerComposerInlineProps> = ({ onClose }) => {
    const state = useLayerComposerState({ isOpen: true, onClose, onHide: onClose });

    return (
        <div className="w-full h-full flex flex-col relative">
            <div className="w-full h-full flex flex-row relative">
                {!state.canvasInitialized ? (
                    <div className="w-full h-full" onDragOver={state.handleStartScreenDragOver} onDragLeave={state.handleStartScreenDragLeave} onDrop={state.handleStartScreenDrop}>
                        <input
                            type="file"
                            ref={state.fileInputRef}
                            className="hidden"
                            accept="image/*,.json"
                            multiple
                            onChange={state.handleFileSelected}
                        />
                        <CustomStartScreen state={state} />
                        <AnimatePresence>
                            {state.isStartScreenDraggingOver && (
                                <div className="absolute inset-0 z-10 bg-black/70 border-4 border-dashed border-yellow-400 rounded-lg flex flex-col items-center justify-center pointer-events-none">
                                    <CloudUploadIcon className="h-16 w-16 text-yellow-400 mb-4" strokeWidth={1} />
                                    <p className="text-2xl font-bold text-yellow-400">{state.t('layerComposer_startScreen_dropPrompt')}</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <>
                        <LayerComposerSidebar {...state} />
                        <LayerComposerCanvas {...state} />
                    </>
                )}
            </div>

            <AnimatePresence>
                {state.isLogVisible && state.aiProcessLog.length > 0 && (
                    <AIProcessLogger log={state.aiProcessLog} onClose={() => state.setIsLogVisible(false)} t={state.t} />
                )}
            </AnimatePresence>

            <AIChatbot
                isOpen={state.isChatbotOpen}
                onClose={state.handleCloseChatbot}
                selectedLayers={state.selectedLayers}
                captureLayer={state.captureLayer}
            />

            <GalleryPicker
                isOpen={state.isGalleryOpen}
                onClose={() => state.setIsGalleryOpen(false)}
                onSelect={state.handleAddImage}
                images={state.imageGallery}
            />

            <WebcamCaptureModal
                isOpen={state.isWebcamOpen}
                onClose={() => state.setIsWebcamOpen(false)}
                onCapture={state.handleAddImage}
            />

            <AnimatePresence>
                {state.isConfirmingClose && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50" onClick={() => state.setIsConfirmingClose(false)}>
                        <div className="modal-content !max-w-md" onClick={(e) => e.stopPropagation()}>
                            <h3 className="base-font font-bold text-2xl text-yellow-400">{state.t('confirmClose_title')}</h3>
                            <p className="text-neutral-300 my-2">{state.t('confirmClose_message')}</p>
                            <div className="flex justify-end items-center gap-4 mt-4">
                                <button onClick={() => state.setIsConfirmingClose(false)} className="btn btn-secondary btn-sm">{state.t('confirmClose_stay')}</button>
                                <button onClick={() => { state.handleCloseAndReset(); state.setIsConfirmingClose(false); }} className="btn btn-primary btn-sm">{state.t('confirmClose_close')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {state.isConfirmingNew && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50" onClick={() => state.setIsConfirmingNew(false)}>
                        <div className="modal-content !max-w-md" onClick={(e) => e.stopPropagation()}>
                            <h3 className="base-font font-bold text-2xl text-yellow-400">{state.t('layerComposer_new_title')}</h3>
                            <p className="text-neutral-300 my-2">{state.t('layerComposer_new_message')}</p>
                            <div className="flex justify-end items-center gap-4 mt-4">
                                <button onClick={() => state.setIsConfirmingNew(false)} className="btn btn-secondary btn-sm">{state.t('common_cancel')}</button>
                                <button onClick={state.handleConfirmNew} className="btn btn-primary btn-sm !bg-red-500 hover:!bg-red-600">{state.t('layerComposer_new_confirm')}</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
