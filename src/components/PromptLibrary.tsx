/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppControls } from './uiUtils';
import { DocumentTextIcon, DownloadIcon } from './icons';

interface Prompt {
    id: string;
    category: string;
    text: string;
    imageUrl: string;
    tags?: string[];
}

interface PromptLibraryProps {
    onClose: () => void;
}

// Sample prompts data
import promptsData from '../data/prompts.json';

const PROMPTS: Prompt[] = promptsData.prompts;
const CATEGORIES = promptsData.categories;

const ITEMS_PER_PAGE = 20;

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ onClose }) => {
    const { t, language } = useAppControls();
    const [activeCategory, setActiveCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Filter prompts by category
    const filteredPrompts = useMemo(() => {
        if (activeCategory === 'all') return PROMPTS;
        return PROMPTS.filter(p => p.category === activeCategory);
    }, [activeCategory]);

    // Pagination
    const totalPages = Math.ceil(filteredPrompts.length / ITEMS_PER_PAGE);
    const paginatedPrompts = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredPrompts.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredPrompts, currentPage]);

    const handleCopyPrompt = async (prompt: Prompt) => {
        try {
            await navigator.clipboard.writeText(prompt.text);
            setCopiedId(prompt.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleCategoryChange = (categoryId: string) => {
        setActiveCategory(categoryId);
        setCurrentPage(1); // Reset to first page
    };

    return (
        <div className="w-full h-full flex flex-col themed-bg">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-white/10">
                <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-bold themed-text text-orange-600">{t('promptLibrary_title')}</h2>

                </div>
                <p className="themed-text-secondary text-center mb-4">{t('promptLibrary_subtitle')}</p>
            </div>

            {/* Category Tabs */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 overflow-x-auto prompt-library-categories">
                <div className="flex gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeCategory === cat.id
                                ? 'text-black'
                                : 'themed-text-secondary hover:themed-text'
                                }`}
                            style={activeCategory === cat.id ? {
                                backgroundColor: 'var(--accent-primary)',
                            } : {}}
                        >
                            {language === 'vi' ? cat.labelVi : cat.labelEn}
                        </button>
                    ))}
                </div>
            </div>

            {/* Prompt Grid */}
            <div className="flex-1 overflow-y-auto p-6 prompt-library-container">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 prompt-library-grid">
                    <AnimatePresence mode="wait">
                        {paginatedPrompts.map((prompt, index) => (
                            <motion.div
                                key={prompt.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className="themed-card rounded-lg overflow-hidden group cursor-pointer"
                            >
                                {/* Image */}
                                <div className="relative aspect-[4/5] overflow-hidden">
                                    <img
                                        src={prompt.imageUrl}
                                        alt={prompt.text}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                            <p className="text-white text-xs line-clamp-3">{prompt.text}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Copy Button */}
                                <button
                                    onClick={() => handleCopyPrompt(prompt)}
                                    className="w-full py-2.5 flex items-center justify-center gap-2 transition-colors"
                                    style={{
                                        backgroundColor: copiedId === prompt.id ? 'var(--accent-primary)' : 'rgba(249, 115, 22, 0.1)',
                                        color: copiedId === prompt.id ? '#000' : 'var(--accent-primary)'
                                    }}
                                >
                                    {copiedId === prompt.id ? (
                                        <>
                                            <DownloadIcon className="w-4 h-4" />
                                            <span className="text-sm font-medium">{t('promptLibrary_copied')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <DocumentTextIcon className="w-4 h-4" />
                                            <span className="text-sm font-medium">{t('promptLibrary_copy')}</span>
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Empty State */}
                {filteredPrompts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 themed-text-tertiary">
                        <p className="text-lg">{t('promptLibrary_empty')}</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex-shrink-0 p-6 border-t border-white/10">
                    <div className="flex justify-center items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="btn btn-secondary btn-sm"
                        >
                            {t('common_previous')}
                        </button>

                        <div className="flex gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all font-medium text-sm ${currentPage === page
                                        ? 'text-white shadow-lg'
                                        : 'themed-text-secondary hover:themed-text hover:bg-white/5'
                                        }`}
                                    style={currentPage === page ? {
                                        backgroundColor: '#ff6b35',
                                    } : {}}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="btn btn-secondary btn-sm"
                        >
                            {t('common_next')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
