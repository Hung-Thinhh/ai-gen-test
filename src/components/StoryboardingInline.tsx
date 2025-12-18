/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { StoryboardingModal } from './StoryboardingModal';

interface StoryboardingInlineProps {
    onClose: () => void;
}

export const StoryboardingInline: React.FC<StoryboardingInlineProps> = ({ onClose }) => {
    return (
        <div className="w-full h-full flex justify-end">
            {/* Override modal styles to make it narrower and stick to the right */}
            <style>{`
                .storyboard-inline-wrapper .modal-overlay {
                    position: static !important;
                    background: transparent !important;
                    width: 100% !important;
                    height: 100% !important;
                    display: flex !important;
                    justify-content: flex-end !important;
                }
                .storyboard-inline-wrapper .modal-content {
                    max-width: calc(100vw - 16rem) !important;
                    width: calc(100vw - 16rem) !important;
                    margin: 0 !important;
                    position: static !important;
                }
            `}</style>
            <div className="storyboard-inline-wrapper w-full h-full">
                <StoryboardingModal
                    isOpen={true}
                    onClose={onClose}
                    onHide={onClose}
                />
            </div>
        </div>
    );
};
