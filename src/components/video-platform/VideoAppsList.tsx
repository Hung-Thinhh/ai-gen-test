import React from 'react';
import Link from 'next/link';
import { MOCK_APPS } from './constants';

export function VideoAppsList() {
    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            {/* Section Header */}
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300 mb-2">
                    Chọn Phong Cách TVC
                </h2>
                <p className="text-gray-400">Click vào app để bắt đầu tạo video quảng cáo chuyên nghiệp</p>
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {MOCK_APPS.map((app) => (
                    <Link
                        key={app.id}
                        href={`/video-generator?app=${app.slug}`}
                        className="group relative bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-5 cursor-pointer hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/20 transition-all duration-300 overflow-hidden block"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/10 group-hover:to-orange-600/5 transition-all duration-300 rounded-2xl"></div>

                        {app.badge && (
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-full z-10 shadow-lg">
                                {app.badge}
                            </div>
                        )}

                        <div className="relative w-full aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl mb-4 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                <span className="text-xs font-mono text-orange-400 bg-black/70 backdrop-blur-sm px-2 py-1 rounded border border-orange-500/30">
                                    {app.model_config.model.split('/')[1] || app.model_config.model}
                                </span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                                {app.name}
                            </h3>
                            <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                                {app.description}
                            </p>
                        </div>

                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
