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
import { getAllPrompts, incrementPromptUsage, getAllTools } from '../services/storageService';

// ... inside component ...




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

interface FeaturedPrompt {
    id: number;
    image: string;
    title: string;
    description: string;
    style: string;
    author: {
        name: string;
        avatar: string;
    };
    stats: { views: string; likes: string; };
}

const Overview: React.FC = () => {
    const appControls = useAppControls() as any;
    const { t, handleSelectApp, settings, language, modelVersion, handleModelVersionChange, guestCredits, userCredits, isLoggedIn } = appControls;
    const [featuredPrompts, setFeaturedPrompts] = React.useState<FeaturedPrompt[]>([]);
    const [loadingPrompts, setLoadingPrompts] = React.useState(true);
    const [copiedId, setCopiedId] = React.useState<number | null>(null);



    const handleCopyPrompt = async (prompt: FeaturedPrompt) => {
        try {
            await navigator.clipboard.writeText(prompt.description);
            setCopiedId(prompt.id);
            setTimeout(() => setCopiedId(null), 2000);

            // Increment usage count in background
            incrementPromptUsage(prompt.id);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };



    const currentCredits = isLoggedIn ? userCredits : guestCredits;
    const isMobile = useIsMobile();
    const promptsScrollRef = useRef<HTMLDivElement>(null);




    const [dbTools, setDbTools] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Prompts
                const dbPrompts = await getAllPrompts('usage');
                const mappedPrompts = (dbPrompts || []).slice(0, 10).map((p: any) => ({
                    id: p.id,
                    image: p.avt_url || 'https://via.placeholder.com/400x300',
                    title: p.name,
                    description: p.content,
                    style: 'Creative',
                    author: {
                        name: 'Duky AI',
                        avatar: 'https://ui-avatars.com/api/?name=Duky+AI&background=random'
                    },
                    stats: { views: '1K+', likes: '100+' }
                }));
                const existingSetFeatured = setFeaturedPrompts;
                if (existingSetFeatured) existingSetFeatured(mappedPrompts);

                const existingSetLoading = setLoadingPrompts;
                if (existingSetLoading) existingSetLoading(false);

                // Fetch Tools
                const tools = await getAllTools();
                console.log("[Overview] tools:", tools);
                const mappedTools = (tools || []).map((t: any) => ({
                    id: t.tool_key || t.tool_id?.toString() || '',
                    titleKey: t.name, // User specified 'name', assuming it's the display text or key
                    description: t.description,
                    previewImageUrl: t.preview_image_url,
                    ...t
                }));
                // Filter out inactive if not already done by DB
                const activeTools = mappedTools.filter((t: any) => t.status == 'active'); // Assumption

                setDbTools(activeTools);
            } catch (error) {
                console.error("Error fetching data", error);
                const existingSetLoading = setLoadingPrompts;
                if (existingSetLoading) existingSetLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fallback if DB tools empty check
    const toolsToDisplay = dbTools.length > 0 ? dbTools : []
    console.log("[Overview] toolsToDisplay:", toolsToDisplay);
    const toolGridCount = isMobile ? 9 : 15;
    const popularTools = toolsToDisplay.slice(0, toolGridCount); // Use display list instead of settings directly
    console.log(popularTools);
    return (
        <div className="overview-v2" suppressHydrationWarning>
            {/* ===== MOBILE HOME HEADER ===== */}
            {isMobile && (
                <MobileHomeHeader
                    title="Home"
                    apps={settings ? settings.apps.map((app: any) => ({ ...app, title: t(app.titleKey), description: t(app.descriptionKey) })) : []}
                    onSelectApp={handleSelectApp}
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
                            const imageUrl = tool.previewImageUrl || 'https://res.cloudinary.com/dmxmzannb/image/upload/v1765978950/pqotah7yias7jtpnwnca.jpg';
                            return (
                                <Link
                                    key={tool.id}
                                    href={tool.id === 'studio' ? '/studio' : `/tool/${tool.id}`}
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

            {/* ===== FEATURED PROMPTS ===== */}
            <motion.section
                className="featured-prompts-section px-4 pb-20"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
            >
                <div className="section-header-inline mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded text-xs tracking-wider">HOT</span>
                        <h2 className="section-title-v2 !mb-0">Ý tưởng Prompt</h2>
                    </div>
                </div>

                {loadingPrompts ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                        {featuredPrompts.map((prompt) => (
                            <motion.div
                                key={prompt.id}
                                className="break-inside-avoid bg-neutral-900 rounded-xl overflow-hidden group cursor-pointer border border-neutral-800 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 mb-4 relative"
                                whileHover={{ y: -5 }}
                                onClick={() => handleCopyPrompt(prompt)}
                            >
                                {/* Copied Overlay */}
                                {copiedId === prompt.id && (
                                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                        <div className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2">
                                            <span>✓ Copied!</span>
                                        </div>
                                    </div>
                                )}

                                {/* Image Container */}
                                <div className="relative overflow-hidden bg-neutral-800">
                                    <img
                                        src={prompt.image}
                                        alt={prompt.title}
                                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute top-2 left-2">
                                        <span className="bg-black/60 backdrop-blur-md text-white/90 text-[10px] px-2 py-1 rounded-md font-medium border border-white/10">
                                            CREATIVE
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                </div>

                                {/* Card Body */}
                                <div className="p-3">
                                    <h3 className="text-white font-semibold text-sm truncate mb-1" title={prompt.title}>{prompt.title}</h3>
                                    <p className="text-neutral-400 text-xs truncate">{prompt.description || prompt.title}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
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
