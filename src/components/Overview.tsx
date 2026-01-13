import React, { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppControls } from './uiUtils';
import { useIsMobile } from '../utils/mobileUtils';
import { MobileHomeHeader } from './MobileHeader';
import { Pricing } from './Pricing';
import { HeroSlider } from './HeroSlider';
import { PersonalGallery } from './PersonalGallery';
import { ZaloCTA } from './ZaloCTA';
import LeonardoBanner from './LeonardoBanner';
import ToolShowcase from './ToolShowcase';
import StudioConcept from './StudioConcept';
import CommunitySection from './CommunitySection';
import { getAllPrompts, incrementPromptUsage, getAllTools, getAllCategories } from '../services/storageService';

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
    category_ids?: string[];
}

const Overview: React.FC = () => {
    const appControls = useAppControls() as any;
    const { t, handleSelectApp, settings, language, modelVersion, handleModelVersionChange, guestCredits, userCredits, isLoggedIn } = appControls;
    const router = useRouter();
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

    const handleUsePrompt = (e: React.MouseEvent, prompt: FeaturedPrompt) => {
        e.stopPropagation(); // Prevent triggering copy on parent click
        // Store prompt in sessionStorage
        sessionStorage.setItem('selectedPrompt', prompt.description);

        // Navigate to free generation tool
        router.push('/tool/free-generation');
    };



    const currentCredits = isLoggedIn ? userCredits : guestCredits;
    const isMobile = useIsMobile();
    const promptsScrollRef = useRef<HTMLDivElement>(null);




    const [dbTools, setDbTools] = React.useState<any[]>([]);
    const [categories, setCategories] = React.useState<any[]>([]);
    const [activeCategory, setActiveCategory] = React.useState('all');

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Prompts & Categories
                const [dbPrompts, dbCategories] = await Promise.all([
                    getAllPrompts('usage'),
                    getAllCategories()
                ]);

                if (dbCategories) {
                    // Filter only specific categories for Homepage
                    const targetCategories = ['nam', 'nữ', 'cặp đôi'];
                    const filteredCats = dbCategories.filter((c: any) =>
                        targetCategories.includes(c.name.toLowerCase().trim())
                    );
                    setCategories(filteredCats);
                }

                const mappedPrompts = (dbPrompts || []).map((p: any) => ({
                    id: p.id,
                    image: p.avt_url || 'https://via.placeholder.com/400x300',
                    title: p.name,
                    description: p.content,
                    category_ids: p.category_ids || [],
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
        <div className="overview-v2 !py-0" suppressHydrationWarning>
            {/* ===== MOBILE HOME HEADER ===== */}
            {isMobile && (
                <MobileHomeHeader
                    title="Home"
                    apps={settings ? settings.apps.map((app: any) => ({ ...app, title: t(app.titleKey), description: t(app.descriptionKey) })) : []}
                    onSelectApp={handleSelectApp}
                    credits={currentCredits}
                />
            )}

            {/* ===== LEONARDO BANNER ===== */}
            <div className="relative w-screen left-1/2 -translate-x-1/2">
                <LeonardoBanner />
            </div>

            {/* Tool Showcase Section */}
            <div className="relative z-10 w-screen left-1/2 -translate-x-1/2 bg-black">
                <ToolShowcase />
            </div>

            {/* Studio Concept Section */}
            <div className="relative z-10 w-screen left-1/2 -translate-x-1/2 bg-black">
                <StudioConcept />
            </div>



            {/* ===== AI TOOLS GRID ===== */}
            <motion.section
                className="ai-tools-section hidden"
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
                    <div className="tools-icon-grid hidden">
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
                className="featured-prompts-section px-4 pb-20 mt-20 max-w-[1300px] mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <div className="flex  flex-col justify-center">


                    <div className=" mb-6 text-start">
                        <h2 className="!text-4xl leading-[1.5] md:text-6xl text-start font-magesta bg-gradient-to-r from-[#eb5a01] to-[#eb5a00] text-transparent bg-clip-text">
                            Thư viện Prompt
                        </h2>
                        {/* <Link href="/prompt-library" className="see-all-link">See All</Link> */}
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`px-4 !py-[5px] rounded-full text-sm  font-medium whitespace-nowrap w-[129px] cursor-pointer transition-all ${activeCategory === 'all'
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                                    }`}
                            >
                                Tất cả
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-4 !py-[5px] rounded-full text-sm font-medium whitespace-nowrap w-auto cursor-pointer transition-all ${activeCategory === cat.id
                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                        : 'border border-orange-500/60 text-white hover:bg-orange-500'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                        <Link
                            href="/prompt-library"
                            className="px-4 py-2 text-sm font-medium text-orange-500 hover:text-orange-400 whitespace-nowrap transition-colors flex items-center gap-1"
                        >
                            Xem thêm
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
                {loadingPrompts ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                        {featuredPrompts
                            .filter(p => activeCategory === 'all' || (p.category_ids && p.category_ids.includes(activeCategory)))
                            .slice(0, 10) // Display limit
                            .map((prompt) => (
                                <motion.div
                                    key={prompt.id}
                                    className="break-inside-avoid bg-neutral-900 rounded-xl overflow-hidden group cursor-pointer border border-neutral-800 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 mb-4 relative"
                                    whileHover={{ y: -5 }}
                                    onClick={() => handleCopyPrompt(prompt)}
                                >
                                    {/* Copy Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyPrompt(prompt);
                                        }}
                                        className="absolute top-2 right-2 z-20 p-2 bg-black/60 hover:bg-orange-500/90 backdrop-blur-sm rounded-lg transition-all duration-200 group/copy"
                                        title="Copy prompt"
                                    >
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                    </button>

                                    {/* Copied Overlay */}
                                    {copiedId === prompt.id && (
                                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                                            <div className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2">
                                                <span>✓ Copied!</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Image Container */}
                                    <div className="relative overflow-hidden bg-neutral-800 aspect-[9/16]">
                                        <img
                                            src={prompt.image}
                                            alt={prompt.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-3">
                                        <h3 className="text-white font-semibold text-sm truncate mb-1" title={prompt.title}>{prompt.title}</h3>
                                        {/* <p className="text-neutral-400 text-xs truncate mb-3">{prompt.description || prompt.title}</p> */}

                                        <button
                                            onClick={(e) => handleUsePrompt(e, prompt)}
                                            className="w-full cursor-pointer py-2 flex items-center justify-center gap-2 transition-all duration-200 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            <span className="text-xs font-semibold">Dùng ngay</span>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                )}
            </motion.section>



            {/* ===== COMMUNITY SECTION ===== */}
            <Community Section />
            {/* ===== PERSONAL GALLERY SECTION ===== */}
            <motion.section
                className="gallery-section hidden"
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
