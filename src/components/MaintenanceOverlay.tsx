import React from 'react';

const MaintenanceOverlay = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl text-white overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/20 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="relative z-10 flex flex-col items-center p-8 max-w-2xl text-center space-y-8 animate-in fade-in zoom-in duration-1000">
                {/* Icon / Logo Area */}
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 flex items-center justify-center shadow-2xl shadow-orange-500/20 mb-6 p-4">
                    <img
                        src="/img/logo_site.webp"
                        alt="Duky AI Logo"
                        className="w-full h-full object-contain drop-shadow-lg"
                    />
                </div>

                {/* Main Title */}
                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-orange-100 to-orange-200 tracking-tight">
                    Duky AI
                </h1>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-gray-400 font-light max-w-lg leading-relaxed">
                    Hệ thống đang được nâng cấp để phục vụ bạn tốt hơn. Vui lòng quay lại sau.
                </p>

                <p className="text-sm text-gray-600 font-mono pt-8">
                    Est. Duration: ~2 hours
                </p>

                {/* Loading Indicator */}
                <div className="mt-12 flex gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceOverlay;
