/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// This file contains shared type definitions for UI components and application state.

// Base types
export interface ImageForZip {
    url: string;
    filename: string;
    folder?: string;
    extension?: string;
}

export interface VideoTask {
    status: 'pending' | 'done' | 'error';
    resultUrl?: string;
    error?: string;
    operation?: any;
}

export interface AppConfig {
    id: string;
    titleKey: string;
    descriptionKey: string;
    icon: string;
    supportsCanvasPreset?: boolean;
    previewImageUrl?: string;
}

export interface AppSettings {
    mainTitleKey: string;
    subtitleKey: string;
    useSmartTitleWrapping: boolean;
    smartTitleWrapWords: number;
    [key: string]: any;
}

export interface Settings {
    home: {
        mainTitleKey: string;
        subtitleKey: string;
        useSmartTitleWrapping: boolean;
        smartTitleWrapWords: number;
    };
    apps: AppConfig[];
    enableImageMetadata: boolean;
    // FIX: Add missing enableWebcam property to the Settings interface.
    enableWebcam: boolean;
    architectureIdeator: AppSettings;
    avatarCreator: AppSettings & { minIdeas: number; maxIdeas: number; };
    babyPhotoCreator: AppSettings & { minIdeas: number; maxIdeas: number; };
    beautyCreator: AppSettings;
    midAutumnCreator: AppSettings & { minIdeas: number; maxIdeas: number; };
    entrepreneurCreator: AppSettings & { minIdeas: number; maxIdeas: number; };
    dressTheModel: AppSettings;
    photoRestoration: AppSettings;
    swapStyle: AppSettings;
    freeGeneration: AppSettings;
    toyModelCreator: AppSettings;
    imageInterpolation: AppSettings;
}

export type Theme = 'minimalist-dark' | 'sci-fi-glitch' | 'soft-dark' | 'minimalist-bright' | 'cosmic-dark';
export const THEMES: Theme[] = ['minimalist-dark', 'sci-fi-glitch', 'soft-dark', 'minimalist-bright', 'cosmic-dark'];

export interface ThemeInfo {
    id: Theme;
    name: string;
    colors: [string, string]; // [startColor, endColor] for gradient
}

export const THEME_DETAILS: ThemeInfo[] = [
    { id: 'minimalist-dark', name: 'Minimalist Dark', colors: ['#000000', '#181818'] },
    { id: 'sci-fi-glitch', name: 'Sci-Fi Glitch', colors: ['#000000', '#00FF00'] },
    { id: 'soft-dark', name: 'Soft Dark', colors: ['#2C2C2C', '#444444'] },
    { id: 'minimalist-bright', name: 'Minimalist Bright', colors: ['#FFFFFF', '#EEEEEE'] },
    { id: 'cosmic-dark', name: 'Cosmic Dark', colors: ['#1A1A2E', '#4839TC'] }
];


export interface ImageToEdit {
    url: string | null;
    onSave: (newUrl: string) => void;
}


// --- Centralized State Definitions ---

export type HomeState = { stage: 'home' };

export interface ArchitectureIdeatorState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    styleReferenceImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    options: {
        context: string;
        style: string;
        color: string;
        lighting: string;
        notes: string;
        removeWatermark: boolean;
    };
    error: string | null;
}

export type ImageStatus = 'pending' | 'done' | 'error';
export interface GeneratedAvatarImage {
    status: ImageStatus;
    url?: string;
    error?: string;
}
interface HistoricalAvatarImage {
    idea: string;
    url: string;
}
export interface AvatarCreatorState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    styleReferenceImage: string | null;
    generatedImages: Record<string, GeneratedAvatarImage>;
    historicalImages: HistoricalAvatarImage[];
    selectedIdeas: string[];
    options: {
        additionalPrompt: string;
        removeWatermark: boolean;
        aspectRatio: string;
    };
    error: string | null;
}

export interface BabyPhotoCreatorState extends AvatarCreatorState { }

export interface BeautyCreatorState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    styleReferenceImage: string | null;
    generatedImages: Record<string, GeneratedAvatarImage>;
    historicalImages: HistoricalAvatarImage[];
    selectedIdeas: string[];
    options: {
        notes: string;
        removeWatermark: boolean;
        aspectRatio: string;
    };
    error: string | null;
}

export interface MidAutumnCreatorState extends AvatarCreatorState { }
export interface EntrepreneurCreatorState extends AvatarCreatorState { }


export interface DressTheModelState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    modelImage: string | null;
    clothingImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    options: {
        background: string;
        pose: string;
        style: string;
        aspectRatio: string;
        notes: string;
        removeWatermark: boolean;
    };
    error: string | null;
}

export interface PhotoRestorationState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    options: {
        type: string;
        gender: string;
        age: string;
        nationality: string;
        notes: string;
        removeWatermark: boolean;
        removeStains: boolean;
        colorizeRgb: boolean;
    };
    error: string | null;
}

export interface SwapStyleState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    contentImage: string | null;
    styleImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    options: {
        style: string;
        styleStrength: string;
        notes: string;
        removeWatermark: boolean;
        convertToReal: boolean;
    };
    error: string | null;
}

// FIX: Add missing MixStyleState type definition.
export interface MixStyleState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    contentImage: string | null;
    styleImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    finalPrompt: string | null;
    options: {
        styleStrength: string;
        notes: string;
        removeWatermark: boolean;
    };
    error: string | null;
}

export interface FreeGenerationState {
    stage: 'configuring' | 'generating' | 'results';
    image1: string | null;
    image2: string | null;
    image3: string | null;
    image4: string | null;
    generatedImages: string[];
    historicalImages: string[];
    options: {
        prompt: string;
        removeWatermark: boolean;
        numberOfImages: number;
        aspectRatio: string;
    };
    error: string | null;
}

// FIX: Add missing ImageToRealState type definition to resolve import error.
export interface ImageToRealState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    options: {
        faithfulness: string;
        notes: string;
        removeWatermark: boolean;
    };
    error: string | null;
}

export interface ToyModelCreatorState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    generatedImage: string | null;
    historicalImages: string[];
    concept: string; // e.g., 'desktop_model', 'keychain', 'gachapon', 'miniature'
    options: {
        // Concept 1: Desktop Model
        computerType: string;
        softwareType: string;
        boxType: string;
        background: string;
        // Concept 2: Keychain
        keychainMaterial: string;
        keychainStyle: string;
        accompanyingItems: string;
        deskSurface: string;
        // Concept 3: Gachapon
        capsuleColor: string;
        modelFinish: string;
        capsuleContents: string;
        displayLocation: string;
        // Concept 4: Miniature
        miniatureMaterial: string;
        baseMaterial: string;
        baseShape: string;
        lightingStyle: string;
        // Concept 5: Pokémon Model
        pokeballType: string;
        evolutionDisplay: string;
        modelStyle: string;
        // Concept 6: Crafting Model
        modelType: string;
        blueprintType: string;
        characterMood: string;
        // Constant Options
        aspectRatio: string;
        notes: string;
        removeWatermark: boolean;
    };
    error: string | null;
}

export interface ImageInterpolationState {
    stage: 'idle' | 'prompting' | 'configuring' | 'generating' | 'results';
    analysisMode: 'general' | 'deep' | 'expert';
    inputImage: string | null;
    outputImage: string | null;
    referenceImage: string | null;
    generatedPrompt: string;
    promptSuggestions: string;
    additionalNotes: string;
    finalPrompt: string | null;
    generatedImage: string | null;
    historicalImages: { url: string; prompt: string; }[];
    options: {
        removeWatermark: boolean;
        aspectRatio: string;
    };
    error: string | null;
}

// --- New Advanced AI Tool States ---

export interface ObjectRemoverState {
    stage: 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    objectDescription: string;
    resultImage: string | null;
    error: string | null;
}

export interface FaceSwapState {
    stage: 'configuring' | 'generating' | 'results';
    sourceImage: string | null;
    targetFaceImage: string | null;
    resultImage: string | null;
    options: {
        additionalInstructions: string;
    };
    error: string | null;
}

export interface InpainterState {
    stage: 'configuring' | 'generating' | 'results';
    maskedImage: string | null;
    resultImage: string | null;
    options: {
        prompt: string;
        additionalInstructions: string;
    };
    error: string | null;
}

export interface PhotoBoothState {
    stage: 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    resultImage: string | null;
    options: {
        photoCount: number;
    };
    error: string | null;
}

export interface CloneEffectState {
    stage: 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    resultImage: string | null;
    options: {
        instructions: string;
    };
    error: string | null;
}

export interface ColorPaletteSwapState {
    stage: 'configuring' | 'generating' | 'results';
    sourceImage: string | null;
    paletteImage: string | null;
    resultImage: string | null;
    error: string | null;
}

export interface OutfitExtractorState {
    stage: 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    resultImage: string | null;
    options: { instructions: string };
    error: string | null;
}



export interface ProductMockupState {
    stage: 'configuring' | 'generating' | 'results';
    logoImage: string | null;
    productImage: string | null;
    resultImage: string | null;
    error: string | null;
}

export interface TypographicIllustratorState {
    stage: 'configuring' | 'generating' | 'results';
    phrase: string;
    resultImage: string | null;
    error: string | null;
}

export interface ConceptStudioState {
    stage: 'configuring' | 'generating' | 'results';
    conceptImage: string | null;
    resultImage: string | null;
    error: string | null;
}

export interface PortraitGeneratorState {
    stage: 'configuring' | 'generating' | 'results';
    prompt: string;
    uploadedImage: string | null;
    resultImage: string | null;
    options: { style: string; lighting: string; background: string; notes: string };
    error: string | null;
}

export interface PhotoshootState {
    stage: 'configuring' | 'generating' | 'results';
    personImage: string | null;
    outfitImage: string | null;
    resultImage: string | null;
    options: { background: string; pose: string; lighting: string; notes: string };
    error: string | null;
}

export interface StudioPhotoshootState {
    stage: 'configuring' | 'generating' | 'results';
    subjectImage: string | null;
    resultImage: string | null;
    options: { style: string; setup: string; mood: string; notes: string };
    error: string | null;
}

export interface ProductSceneState {
    stage: 'configuring' | 'generating' | 'results';
    productImage: string | null;
    resultImage: string | null;
    options: { scene: string; lighting: string; angle: string };
    error: string | null;
}

export interface PoseAnimatorState {
    stage: 'configuring' | 'generating' | 'results';
    poseReferenceImage: string | null;
    targetImage: string | null;
    resultImage: string | null;
    options: { instructions: string };
    error: string | null;
}

export interface PosterCreatorState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    productImages: string[]; // Tối đa 3 ảnh sản phẩm chủ thể
    secondaryObjectImage: string | null; // Ảnh vật thể phụ (đổi tên từ environmentReferenceImage)
    referenceImage: string | null; // Ảnh tham khảo bố cục/màu sắc/hình dáng
    textEffectImage: string | null; // Ảnh hiệu ứng chữ cho tiêu đề
    generatedImage: string | null;
    historicalImages: string[];
    options: {
        posterType: string;
        backgroundStyle: string;
        lightingStyle: string;
        productAngle: string;
        aspectRatio: string;
        environmentDescription: string;
        notes: string;
        includeText: boolean; // Toggle có chữ hay không
        headline: string; // Tiêu đề chính
        subheadline: string; // Tiêu đề phụ
        callToAction: string; // Lời kêu gọi hành động
        colorScheme: string; // Màu sắc option
        enableAdvancedStyling: boolean; // Toggle chế độ nâng cao (tích hợp sản phẩm chi tiết)
        imageCount: number; // Số lượng ảnh tạo ra (1-4)
        domain: string; // New field
    };
    error: string | null;
}

export interface IDPhotoCreatorState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    uploadedImage: string | null;
    generatedImage: string | null;
    printSheet: string | null;
    options: {
        gender: 'male' | 'female';
        attire: 'default' | 'shirt' | 'vest' | 'pioneer_scarf' | 'ao_dai' | 'office_wear' | 'polo' | 'blouse' | 't_shirt';
        hair: 'default' | 'neat' | 'short' | 'long' | 'fashion' | 'tied_back';
        background: 'blue' | 'white' | 'gray';
        printSize: '2x3' | '3x4' | '4x6' | '3.5x4.5' | '5x5';
        expression: 'original' | 'smile' | 'serious';
    };
    error: string | null;
}

export interface KhmerPhotoMergeState {
    stage: 'idle' | 'configuring' | 'generating' | 'results';
    activeTab: 'female' | 'male' | 'couple'; // New field
    uploadedImage: string | null; // Female (in couple mode) or Single Person
    uploadedImage2: string | null; // Male (in couple mode)
    selectedStyleImage: string | null;
    generatedImage: string | null;
    historicalImages: { style: string; url: string }[];
    options: {
        customPrompt: string;
        removeWatermark: boolean;
        aspectRatio: string;
    };
    error: string | null;
}

// --- Storyboarding Types ---
export interface FrameState {
    description: string;
    status: 'idle' | 'pending' | 'done' | 'error';
    imageSource: 'reference' | string; // 'reference', 'scene.frame-x.y', or custom image data URL
    imageUrl?: string;
    error?: string;
}

export interface SceneState {
    scene: number;
    startFrame: FrameState;
    animationDescription: string;
    videoPrompt?: string;
    endFrame: FrameState;
    videoStatus?: 'idle' | 'pending' | 'done' | 'error';
    videoUrl?: string;
    videoError?: string;
    videoOperation?: any;
}


// Union type for all possible app states
// FIX: Add MixStyleState and ImageToRealState to the AnyAppState union type.
export type AnyAppState =
    | HomeState
    | ArchitectureIdeatorState
    | AvatarCreatorState
    | BabyPhotoCreatorState
    | BeautyCreatorState
    | MidAutumnCreatorState
    | EntrepreneurCreatorState
    | DressTheModelState
    | PhotoRestorationState
    | SwapStyleState
    | MixStyleState
    | FreeGenerationState
    | ImageToRealState
    | ToyModelCreatorState
    | ImageInterpolationState
    | ObjectRemoverState
    | FaceSwapState
    | InpainterState
    | PhotoBoothState
    | CloneEffectState
    | ColorPaletteSwapState
    | OutfitExtractorState

    | ProductMockupState
    | TypographicIllustratorState
    | ConceptStudioState
    | PortraitGeneratorState
    | PhotoshootState
    | StudioPhotoshootState
    | ProductSceneState
    | PoseAnimatorState
    | PosterCreatorState
    | IDPhotoCreatorState
    | KhmerPhotoMergeState;

// --- App Navigation & State Types (Moved from App.tsx) ---
export type HomeView = { viewId: 'home'; state: HomeState };
export type ArchitectureIdeatorView = { viewId: 'architecture-ideator'; state: ArchitectureIdeatorState };
export type AvatarCreatorView = { viewId: 'avatar-creator'; state: AvatarCreatorState };
export type BabyPhotoCreatorView = { viewId: 'baby-photo-creator'; state: BabyPhotoCreatorState };
export type BeautyCreatorView = { viewId: 'beauty-creator'; state: BeautyCreatorState };
export type MidAutumnCreatorView = { viewId: 'mid-autumn-creator'; state: MidAutumnCreatorState };
export type EntrepreneurCreatorView = { viewId: 'entrepreneur-creator'; state: EntrepreneurCreatorState };
export type DressTheModelView = { viewId: 'dress-the-model'; state: DressTheModelState };
export type PhotoRestorationView = { viewId: 'photo-restoration'; state: PhotoRestorationState };
export type SwapStyleView = { viewId: 'swap-style'; state: SwapStyleState };
export type FreeGenerationView = { viewId: 'free-generation'; state: FreeGenerationState };
export type ToyModelCreatorView = { viewId: 'toy-model-creator'; state: ToyModelCreatorState };
export type ImageInterpolationView = { viewId: 'image-interpolation'; state: ImageInterpolationState };
// FIX: Add missing ImageToRealView type definition.
export type ImageToRealView = { viewId: 'image-to-real'; state: ImageToRealState };
// New navigation views
export type OverviewView = { viewId: 'overview'; state: HomeState };
export type GeneratorsView = { viewId: 'generators'; state: HomeState };
export type LayerComposerView = { viewId: 'layer-composer'; state: HomeState };
export type StoryboardingView = { viewId: 'storyboarding'; state: HomeState };
export type GalleryView = { viewId: 'gallery'; state: HomeState };

export type PromptLibraryView = { viewId: 'prompt-library'; state: HomeState };
export type PosterCreatorView = { viewId: 'poster-creator'; state: PosterCreatorState };
export type IDPhotoCreatorView = { viewId: 'id-photo-creator'; state: IDPhotoCreatorState };
export type KhmerPhotoMergeView = { viewId: 'khmer-photo-merge'; state: KhmerPhotoMergeState };
export type ProfileView = { viewId: 'profile'; state: HomeState };
export type SettingsView = { viewId: 'settings'; state: HomeState };
export type PricingView = { viewId: 'pricing'; state: HomeState };


export type ViewState =
    | HomeView
    | ArchitectureIdeatorView
    | AvatarCreatorView
    | BabyPhotoCreatorView
    | BeautyCreatorView
    | MidAutumnCreatorView
    | EntrepreneurCreatorView
    | DressTheModelView
    | PhotoRestorationView
    | SwapStyleView
    | FreeGenerationView
    | ToyModelCreatorView
    | ImageInterpolationView
    // FIX: Add missing ImageToRealView to union type.
    | ImageToRealView
    | OverviewView
    | GeneratorsView
    | LayerComposerView
    | StoryboardingView
    | GalleryView

    | PromptLibraryView
    | PosterCreatorView
    | IDPhotoCreatorView
    | KhmerPhotoMergeView
    | ProfileView
    | SettingsView
    | PricingView;

// Helper function to get initial state for an app
export const getInitialStateForApp = (viewId: string): AnyAppState => {
    switch (viewId) {
        case 'home':
        case 'overview':
        case 'generators':
        case 'layer-composer':
        case 'storyboarding':
        case 'gallery':
        case 'pricing':

            return { stage: 'home' };
        case 'architecture-ideator':
            return { stage: 'idle', uploadedImage: null, styleReferenceImage: null, generatedImage: null, historicalImages: [], options: { context: '', style: '', color: '', lighting: '', notes: '', removeWatermark: false }, error: null };
        case 'avatar-creator':
            return { stage: 'idle', uploadedImage: null, styleReferenceImage: null, generatedImages: {}, historicalImages: [], selectedIdeas: [], options: { additionalPrompt: '', removeWatermark: false, aspectRatio: 'Giữ nguyên' }, error: null };
        case 'baby-photo-creator':
            return { stage: 'idle', uploadedImage: null, styleReferenceImage: null, generatedImages: {}, historicalImages: [], selectedIdeas: [], options: { additionalPrompt: '', removeWatermark: false, aspectRatio: 'Giữ nguyên' }, error: null };
        case 'beauty-creator':
            return { stage: 'idle', uploadedImage: null, styleReferenceImage: null, generatedImages: {}, historicalImages: [], selectedIdeas: [], options: { notes: '', removeWatermark: false, aspectRatio: 'Giữ nguyên' }, error: null };
        case 'mid-autumn-creator':
            return { stage: 'idle', uploadedImage: null, styleReferenceImage: null, generatedImages: {}, historicalImages: [], selectedIdeas: [], options: { additionalPrompt: '', removeWatermark: false, aspectRatio: 'Giữ nguyên' }, error: null };
        case 'entrepreneur-creator':
            return { stage: 'idle', uploadedImage: null, styleReferenceImage: null, generatedImages: {}, historicalImages: [], selectedIdeas: [], options: { additionalPrompt: '', removeWatermark: false, aspectRatio: 'Giữ nguyên' }, error: null };
        case 'dress-the-model':
            return { stage: 'idle', modelImage: null, clothingImage: null, generatedImage: null, historicalImages: [], options: { background: '', pose: '', style: '', aspectRatio: 'Giữ nguyên', notes: '', removeWatermark: false }, error: null };
        case 'portrait-generator':
            return { stage: 'configuring', prompt: '', uploadedImage: null, resultImage: null, options: { style: '', lighting: '', background: '', notes: '' }, error: null };
        case 'photo-restoration':
            return { stage: 'idle', uploadedImage: null, generatedImage: null, historicalImages: [], options: { type: 'Chân dung', gender: 'Tự động', age: '', nationality: '', notes: '', removeWatermark: false, removeStains: true, colorizeRgb: true }, error: null };
        case 'swap-style':
            return { stage: 'idle', contentImage: null, styleImage: null, generatedImage: null, historicalImages: [], options: { style: '', styleStrength: 'Rất mạnh', notes: '', removeWatermark: false, convertToReal: false }, error: null };
        case 'free-generation':
            return { stage: 'configuring', image1: null, image2: null, image3: null, image4: null, generatedImages: [], historicalImages: [], options: { prompt: '', removeWatermark: false, numberOfImages: 1, aspectRatio: 'Giữ nguyên' }, error: null };
        // FIX: Add missing 'image-to-real' case to factory function.
        case 'image-to-real':
            return { stage: 'idle', uploadedImage: null, generatedImage: null, historicalImages: [], options: { faithfulness: 'Tự động', notes: '', removeWatermark: false }, error: null };
        case 'toy-model-creator':
            return {
                stage: 'idle',
                uploadedImage: null,
                generatedImage: null,
                historicalImages: [],
                concept: 'desktop_model',
                options: {
                    computerType: '',
                    softwareType: '',
                    boxType: '',
                    background: '',
                    keychainMaterial: '',
                    keychainStyle: '',
                    accompanyingItems: '',
                    deskSurface: '',
                    capsuleColor: '',
                    modelFinish: '',
                    capsuleContents: '',
                    displayLocation: '',
                    miniatureMaterial: '',
                    baseMaterial: '',
                    baseShape: '',
                    lightingStyle: '',
                    pokeballType: '',
                    evolutionDisplay: '',
                    modelStyle: '',
                    modelType: '',
                    blueprintType: '',
                    characterMood: '',
                    aspectRatio: 'Giữ nguyên',
                    notes: '',
                    removeWatermark: false
                },
                error: null
            };
        case 'image-interpolation':
            return { stage: 'idle', analysisMode: 'general', inputImage: null, outputImage: null, referenceImage: null, generatedPrompt: '', promptSuggestions: '', additionalNotes: '', finalPrompt: null, generatedImage: null, historicalImages: [], options: { removeWatermark: false, aspectRatio: 'Giữ nguyên' }, error: null };
        case 'face-swap':
            return { stage: 'configuring', sourceImage: null, targetFaceImage: null, resultImage: null, options: { additionalInstructions: '' }, error: null };
        case 'inpainter':
            return { stage: 'configuring', maskedImage: null, resultImage: null, options: { prompt: '', additionalInstructions: '' }, error: null };
        case 'photo-booth':
            return { stage: 'configuring', uploadedImage: null, resultImage: null, options: { photoCount: 4 }, error: null } as PhotoBoothState;
        case 'clone-effect':
            return { stage: 'configuring', uploadedImage: null, resultImage: null, options: { instructions: '' }, error: null } as CloneEffectState;
        case 'color-palette-swap':
            return { stage: 'configuring', sourceImage: null, paletteImage: null, resultImage: null, error: null } as ColorPaletteSwapState;
        case 'object-remover':
            return { stage: 'configuring', uploadedImage: null, objectDescription: '', resultImage: null, error: null };
        case 'outfit-extractor':
            return { stage: 'configuring', uploadedImage: null, resultImage: null, options: { instructions: '' }, error: null } as OutfitExtractorState;

        case 'product-mockup':
            return { stage: 'configuring', logoImage: null, productImage: null, resultImage: null, error: null } as ProductMockupState;
        case 'typographic-illustrator':
            return { stage: 'configuring', phrase: '', resultImage: null, error: null } as TypographicIllustratorState;
        case 'concept-studio':
            return { stage: 'configuring', conceptImage: null, resultImage: null, error: null } as ConceptStudioState;
        case 'portrait-generator':
            return { stage: 'configuring', prompt: '', resultImage: null, options: { style: '', lighting: '', background: '', notes: '' }, error: null } as PortraitGeneratorState;
        case 'photoshoot':
            return { stage: 'configuring', personImage: null, outfitImage: null, resultImage: null, options: { background: '', pose: '', lighting: '', notes: '' }, error: null } as PhotoshootState;
        case 'studio-photoshoot':
            return { stage: 'configuring', subjectImage: null, resultImage: null, options: { style: 'commercial', setup: 'clean backdrop', mood: 'professional', notes: '' }, error: null } as StudioPhotoshootState;
        case 'product-scene':
            return { stage: 'configuring', productImage: null, resultImage: null, options: { scene: 'lifestyle', lighting: 'natural', angle: 'front' }, error: null } as ProductSceneState;
        case 'pose-animator':
            return { stage: 'configuring', poseReferenceImage: null, targetImage: null, resultImage: null, options: { instructions: '' }, error: null } as PoseAnimatorState;
        case 'poster-creator':
            return {
                stage: 'idle',
                productImages: [],
                secondaryObjectImage: null,
                referenceImage: null,
                textEffectImage: null,
                generatedImage: null,
                historicalImages: [],
                options: {
                    posterType: '',
                    backgroundStyle: '',
                    lightingStyle: '',
                    productAngle: '',
                    aspectRatio: 'Giữ nguyên theo ảnh tham khảo',
                    environmentDescription: '',
                    notes: '',
                    includeText: false,
                    headline: '',
                    subheadline: '',
                    callToAction: '',
                    colorScheme: 'Tự động theo ảnh tham khảo',
                    enableAdvancedStyling: false,
                    imageCount: 1,
                    domain: 'Tự do sáng tạo' // Default domain
                },
                error: null,
            } as PosterCreatorState;
        case 'id-photo-creator':
            return {
                stage: 'idle',
                uploadedImage: null,
                generatedImage: null,
                printSheet: null,
                options: {
                    gender: 'female',
                    attire: 'shirt',
                    hair: 'neat',
                    background: 'blue',
                    printSize: '3x4',
                    expression: 'serious'
                },
                error: null
            } as IDPhotoCreatorState;
        case 'khmer-photo-merge':
            return {
                stage: 'idle',
                activeTab: 'female',
                uploadedImage: null,
                uploadedImage2: null,
                selectedStyleImage: null,
                generatedImage: null,
                historicalImages: [],
                options: {
                    customPrompt: '',
                    removeWatermark: false,
                    aspectRatio: 'Giữ nguyên'
                },
                error: null
            } as KhmerPhotoMergeState;
        default:
            return { stage: 'home' };
    }
};

// --- History Entry Type ---
export interface GenerationHistoryEntry {
    id: string;
    timestamp: number;
    appId: string;
    appName: string;
    thumbnailUrl: string;
    settings: {
        viewId: string;
        state: AnyAppState;
    };
    // new fields for DB logging
    tool_id?: number;
    credits_used?: number;
    api_model_used?: string;
    generation_time_ms?: number;
    error_message?: string;
    output_images?: any; // jsonb
    generation_count?: number;
}

export type ModelVersion = 'v2' | 'v3';
export type ImageResolution = '1K' | '2K' | '4K';

// --- Context Types ---

export interface AppControlContextType {
    currentView: ViewState;
    settings: any;
    theme: Theme;
    user?: any; // Added to fix lint
    isLoggedIn?: boolean; // Added to fix lint
    imageGallery: string[];
    historyIndex: number;
    viewHistory: ViewState[];
    isSearchOpen: boolean;
    isGalleryOpen: boolean;
    isInfoOpen: boolean;

    isExtraToolsOpen: boolean;
    isImageLayoutModalOpen: boolean;
    isBeforeAfterModalOpen: boolean;
    isAppCoverCreatorModalOpen: boolean;
    isStoryboardingModalMounted: boolean;
    isStoryboardingModalVisible: boolean;
    isLayerComposerMounted: boolean;
    isLayerComposerVisible: boolean;
    isLoginModalOpen: boolean;
    isOutOfCreditsModalOpen: boolean; // NEW

    checkCredits: (amount?: number) => Promise<boolean>; // Updated to accept amount
    openLoginModal: () => void;
    closeLoginModal: () => void;
    openOutOfCreditsModal: () => void; // NEW
    closeOutOfCreditsModal: () => void; // NEW
    language: 'vi' | 'en';
    guestId: string; // NEW
    guestCredits: number; // NEW
    userCredits: number; // NEW
    userIp: string;   // NEW
    generationHistory: GenerationHistoryEntry[];
    modelVersion: ModelVersion;
    imageResolution: ImageResolution;
    v2UsageCount: number;
    v3UsageCount: number;
    refreshUsageCounts: () => void;
    logGeneration: (appId: string, preGenState: any, thumbnailUrl: string, extraDetails?: any) => Promise<void>; // NEW
    addGenerationToHistory: (entryData: Omit<GenerationHistoryEntry, 'id' | 'timestamp'>) => Promise<void>;
    refreshGallery: () => Promise<void>; // NEW
    addImagesToGallery: (newImages: string[]) => Promise<string[] | undefined>;
    removeImageFromGallery: (imageIndex: number) => void;
    replaceImageInGallery: (imageIndex: number, newImageUrl: string) => void;
    handleThemeChange: (newTheme: Theme) => void;
    handleLanguageChange: (lang: 'vi' | 'en') => void;
    handleModelVersionChange: (version: ModelVersion) => void;
    handleResolutionChange: (resolution: ImageResolution) => void;
    navigateTo: (viewId: string) => void;
    handleStateChange: (newAppState: AnyAppState) => void;
    setActivePage: (viewId: string) => void;
    handleSelectApp: (appId: string) => void;
    handleGoHome: () => void;
    handleGoBack: () => void;
    handleGoForward: () => void;
    handleResetApp: () => void;
    handleOpenSearch: () => void;
    handleCloseSearch: () => void;
    handleOpenGallery: () => void;
    handleCloseGallery: () => void;
    handleOpenInfo: () => void;
    handleCloseInfo: () => void;

    toggleExtraTools: () => void;
    openImageLayoutModal: () => void;
    closeImageLayoutModal: () => void;
    openBeforeAfterModal: () => void;
    closeBeforeAfterModal: () => void;
    openAppCoverCreatorModal: () => void;
    closeAppCoverCreatorModal: () => void;
    openStoryboardingModal: () => void;
    closeStoryboardingModal: () => void;
    hideStoryboardingModal: () => void;
    toggleStoryboardingModal: () => void;
    openLayerComposer: () => void;
    closeLayerComposer: () => void;
    hideLayerComposer: () => void;
    toggleLayerComposer: () => void;
    importSettingsAndNavigate: (settings: any) => void;
    t: (key: string, ...args: any[]) => any;
}