import React, { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAppControls } from './uiUtils';
import { useIsMobile } from '../utils/mobileUtils';
import { MobileHomeHeader } from './MobileHeader';
import { Pricing } from './Pricing';
import { HeroSlider } from './HeroSlider';
import { PersonalGallery } from './PersonalGallery';
import { ZaloCTA } from './ZaloCTA';

import {
    PlaceholderMagicIcon,
    SwapIcon,
    PlaceholderArchitectureIcon,
    PlaceholderClothingIcon,
    GalleryIcon,
    PlaceholderStyleIcon,
    PlaceholderPersonIcon,
    RegenerateIcon,
    BrushIcon,

    AddIcon,
} from './icons';

// Tool icon mapping - minimalist SVG icons matching menu style
const TOOL_ICON_COMPONENTS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    'free-generation': PlaceholderMagicIcon,
    'image-interpolation': SwapIcon,
    'architecture-ideator': PlaceholderArchitectureIcon,
    'dress-the-model': PlaceholderClothingIcon,
    'photo-restoration': GalleryIcon,
    'swap-style': PlaceholderStyleIcon,
    'baby-photo-creator': PlaceholderPersonIcon,
    'avatar-creator': PlaceholderPersonIcon,
    'beauty-creator': BrushIcon,
    'entrepreneur-creator': PlaceholderPersonIcon,
    'toy-model-creator': PlaceholderMagicIcon,
    'mid-autumn-creator': PlaceholderMagicIcon,
    'face-swap': RegenerateIcon,
    'photo-booth': GalleryIcon,
    'clone-effect': RegenerateIcon,
    'color-palette-swap': BrushIcon,
    'object-remover': PlaceholderMagicIcon,
    'inpainter': BrushIcon,
    'poster-creator': GalleryIcon,
    'khmer-photo-merge': PlaceholderMagicIcon,
};

// Colors for tool icons (will be applied to SVG stroke/fill)
const TOOL_ICON_COLORS = [
    '#FF69B4', // Pink
    '#4ECDC4', // Cyan
    '#56AB91', // Mint
    '#FF9500', // Orange
    '#9370DB', // Purple
    '#BDB76B', // Khaki
    '#B19CD9', // Lavender
    '#90EE90', // Light Green
    '#FF6347', // Coral
    '#6495ED', // Light Blue
];

// Fallback image if tool config doesn't have one
const DEFAULT_TOOL_IMAGE = 'https://images.unsplash.com/photo-1620641785835-253c911394a5?w=300&h=300&fit=crop';

// Featured prompts data
const FEATURED_PROMPTS = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop',
        title: 'Colorful floating shapes in zero gravity',
        description: '3D abstract art with soft lighting',
        style: 'Abstract',
        author: {
            name: 'Sarah Art',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop'
        },
        stats: { views: '12K', likes: '2.4K' }
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        title: 'Serene landscape with mountains',
        description: 'Oil painting style nature scene',
        style: 'Oil Painting',
        author: {
            name: 'Da Vinci AI',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop'
        },
        stats: { views: '8.5K', likes: '1.9K' }
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
        title: 'Dreamy sunset over ocean waves',
        description: 'Pastel colors and soft waves',
        style: 'Landscape',
        author: {
            name: 'OceanSoul',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop'
        },
        stats: { views: '22K', likes: '5.1K' }
    },
    {
        id: 4,
        image: 'https://images.unsplash.com/photo-1633469924738-52101af51d87?w=400&h=300&fit=crop',
        title: 'Cyberpunk city street at night',
        description: 'Neon lights and rain reflections',
        style: 'Cyberpunk',
        author: {
            name: 'Neon Rider',
            avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=50&h=50&fit=crop'
        },
        stats: { views: '45K', likes: '9.8K' }
    },
    {
        id: 5,
        image: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=400&h=300&fit=crop',
        title: 'Cute 3D rendered isometric room',
        description: 'Cozy gaming setup with plants',
        style: '3D Render',
        author: {
            name: 'PolyMaster',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop'
        },
        stats: { views: '15K', likes: '3.2K' }
    },
    {
        id: 6,
        image: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=300&fit=crop',
        title: 'Anime style portrait with glowing eyes',
        description: 'Magical girl character design',
        style: 'Anime',
        author: {
            name: 'OtakuArt',
            avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50&fit=crop'
        },
        stats: { views: '67K', likes: '14K' }
    },
    {
        id: 7,
        image: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&h=300&fit=crop',
        title: 'Watercolor painting of cherry blossoms',
        description: 'Soft pink floral art',
        style: 'Watercolor',
        author: {
            name: 'FloraStudio',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop'
        },
        stats: { views: '9K', likes: '1.5K' }
    },
    {
        id: 8,
        image: 'https://images.unsplash.com/photo-1586075010999-b1d431c19b06?w=400&h=300&fit=crop',
        title: 'Architectural sketch of modern villa',
        description: 'Pencil shading and clean lines',
        style: 'Sketch',
        author: {
            name: 'ArchiDraw',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop'
        },
        stats: { views: '11K', likes: '2.1K' }
    },
    {
        id: 9,
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop',
        title: 'Futuristic space station',
        description: 'Orbiting a purple planet',
        style: 'Sci-Fi',
        author: {
            name: 'SpaceXplorer',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop'
        },
        stats: { views: '33K', likes: '7.5K' }
    },
    {
        id: 10,
        image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=300&fit=crop',
        title: 'Cinematic portrait of a warrior',
        description: 'Golden armor and epic lighting',
        style: 'Portrait',
        author: {
            name: 'EpicLens',
            avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=50&h=50&fit=crop'
        },
        stats: { views: '50K', likes: '11K' }
    },
];

const Overview: React.FC = () => {
    const appControls = useAppControls() as any;
    const { t, handleSelectApp, settings, language, modelVersion, handleModelVersionChange, guestCredits, userCredits, isLoggedIn } = appControls;
    // Calculate credits display
    const currentCredits = isLoggedIn ? userCredits : guestCredits;
    const isMobile = useIsMobile();
    const promptsScrollRef = useRef<HTMLDivElement>(null);

    // Get tools for grid (9 for Mobile, 15 for Desktop)
    const toolGridCount = isMobile ? 9 : 15;
    const popularTools = settings?.apps.slice(0, toolGridCount) || [];

    return (
        <div className="overview-v2">
            {/* ===== MOBILE HOME HEADER ===== */}
            {isMobile && (
                <MobileHomeHeader
                    modelVersion={modelVersion}
                    onModelChange={handleModelVersionChange}
                    credits={currentCredits}
                />
            )}

            {/* ===== HERO BANNER SLIDER ===== */}
            <HeroSlider />

            {/* ===== AI TOOLS GRID ===== */}
            <motion.section
                className="ai-tools-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
            >
                <div className="section-header-inline">
                    <h2 className="section-title-v2">
                        🛠️ AI Tools / Công cụ
                    </h2>
                    <Link href="/generators" className="see-all-link">See All</Link>
                </div>

                {isMobile ? (
                    // MOBILE LAYOUT - Keep Icons
                    <div className="tools-icon-grid">
                        {popularTools.map((tool: any, index: number) => {
                            const IconComponent = TOOL_ICON_COMPONENTS[tool.id] || PlaceholderMagicIcon;
                            const iconColor = TOOL_ICON_COLORS[index % TOOL_ICON_COLORS.length];
                            return (
                                <Link
                                    key={tool.id}
                                    href={`/tool/${tool.id}`}
                                    onClick={() => handleSelectApp(tool.id)}
                                    className="tool-icon-item"
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="tool-icon-wrapper"
                                    >
                                        <div className="tool-icon-circle">
                                            <IconComponent
                                                className="tool-svg-icon"
                                                style={{ color: iconColor }}
                                            />
                                        </div>
                                        <span className="tool-label">{t(tool.titleKey)}</span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                        <Link href="/generators" className="tool-icon-item">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="tool-icon-wrapper">
                                <div className="tool-icon-circle tool-icon-more">
                                    <AddIcon className="tool-svg-icon" />
                                </div>
                                <span className="tool-label">{language === 'vi' ? 'Thêm' : 'More'}</span>
                            </motion.div>
                        </Link>
                    </div>
                ) : (
                    // DESKTOP LAYOUT - New Image Cards from Tool Settings
                    <div className="flex items-center justify-center flex-wrap gap-5 p-4">
                        {popularTools.slice(0, 17).map((tool: any) => {
                            // Use previewImageUrl from tool settings if available
                            const imageUrl = tool.previewImageUrl || DEFAULT_TOOL_IMAGE;
                            return (
                                <Link
                                    key={tool.id}
                                    href={`/tool/${tool.id}`}
                                    onClick={() => handleSelectApp(tool.id)}
                                    className="group relative flex flex-col items-center gap-3"
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-orange-500 shadow-lg group-hover:shadow-orange-500/20 bg-neutral-800 relative z-10 transition-all duration-300"
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={t(tool.titleKey)}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                    </motion.div>
                                    <span className="text-sm font-medium text-neutral-400 group-hover:text-white text-center w-28 truncate transition-colors">
                                        {t(tool.titleKey)}
                                    </span>
                                </Link>
                            );
                        })}
                        <Link href="/generators" className="group relative flex flex-col items-center gap-3">
                            <motion.div
                                whileHover={{ scale: 1.05, y: -5 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-24 h-24 rounded-2xl border-2 border-neutral-700 flex items-center justify-center bg-neutral-800/50 group-hover:bg-neutral-800 transition-all duration-300"
                            >
                                <AddIcon className="w-8 h-8 text-neutral-500 group-hover:text-white transition-colors" />
                            </motion.div>
                            <span className="text-sm font-medium text-neutral-400 group-hover:text-white text-center transition-colors">
                                {language === 'vi' ? 'Xem thêm' : 'More'}
                            </span>
                        </Link>
                    </div>
                )}
            </motion.section>

            <motion.section
                className="inspiration-feed-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                {/* Tabs Header */}
                <div className="flex items-center gap-6 mb-6 px-4 border-b border-neutral-800 pb-2">
                    <button className="text-white font-bold text-sm border-b-2 border-orange-500 pb-2 -mb-2.5">
                        {language === 'vi' ? 'Tất cả' : 'All'}
                    </button>
                    <button className="text-neutral-400 font-medium text-sm hover:text-white transition-colors pb-2 relative group">
                        {language === 'vi' ? 'Sự kiện' : 'Events'}
                        <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">HOT</span>
                    </button>
                    <button className="text-neutral-400 font-medium text-sm hover:text-white transition-colors pb-2">
                        {language === 'vi' ? 'Hướng dẫn' : 'Tutorials'}
                    </button>
                </div>

                {/* Scrollable Masonry Grid Content */}
                <div className="px-4 pb-20">
                    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                        {FEATURED_PROMPTS.map((prompt) => (
                            <motion.div
                                key={prompt.id}
                                className="break-inside-avoid bg-neutral-900 rounded-xl overflow-hidden group cursor-pointer border border-neutral-800 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 mb-4"
                                whileHover={{ y: -5 }}
                                onClick={() => handleSelectApp('free-generation')}
                            >
                                {/* Image Container - Natural Aspect Ratio */}
                                <div className="relative overflow-hidden bg-neutral-800">
                                    <img
                                        src={prompt.image}
                                        alt={prompt.title}
                                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute top-2 left-2">
                                        {prompt.style && (
                                            <span className="bg-black/60 backdrop-blur-md text-white/90 text-[10px] px-2 py-1 rounded-md font-medium border border-white/10">
                                                {prompt.style.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                </div>

                                {/* Card Body */}
                                <div className="p-3">
                                    {/* Title & Desc */}
                                    <h3 className="text-white font-semibold text-sm truncate mb-1" title={prompt.title}>{prompt.title}</h3>
                                    <p className="text-neutral-400 text-xs truncate">{prompt.description || prompt.title}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* ===== ZALO CTA SECTION ===== */}
            <ZaloCTA />

            {/* ===== PERSONAL GALLERY SECTION ===== */}
            <motion.section
                className="gallery-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <PersonalGallery />
            </motion.section>


        </div>
    );
};

export default Overview;
