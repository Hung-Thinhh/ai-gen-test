import React from 'react';
import { useAppControls } from './uiUtils';

export const OutOfCreditsModal: React.FC = () => {
    const {
        isOutOfCreditsModalOpen,
        closeOutOfCreditsModal,
        handleSelectApp,
        language
    } = useAppControls();

    if (!isOutOfCreditsModalOpen) return null;

    const handleUpgrade = () => {
        closeOutOfCreditsModal();
        handleSelectApp('pricing');
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1f1f1f] border border-neutral-700 max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 rounded-2xl">
                {/* Header with Icon */}
                <div className="pt-8 pb-4 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                        {language === 'vi' ? 'Không đủ Credit' : 'Insufficient Credits'}
                    </h2>
                    <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
                        {language === 'vi'
                            ? 'Số lượng credit không đủ để tạo thêm ảnh, hãy giảm số lượng ảnh hoặc mua thêm gói.'
                            : 'Not enough credits to generate more images. Please reduce the number of images or purchase more credits.'}
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 pt-2 flex flex-col gap-3">
                    <button
                        onClick={handleUpgrade}
                        className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                    >
                        {language === 'vi' ? 'Nâng cấp ngay' : 'Upgrade Now'}
                    </button>

                    <button
                        onClick={closeOutOfCreditsModal}
                        className="w-full py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-xl transition-all"
                    >
                        {language === 'vi' ? 'Để sau' : 'Maybe Later'}
                    </button>
                </div>
            </div>
        </div>
    );
};
