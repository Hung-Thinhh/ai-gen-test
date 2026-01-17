# Example: Using ResultCard & ResultGrid

## 📦 Components

### 1. ResultCard
Single result display with lightbox integration

### 2. ResultGrid
Multiple results in grid layout

### 3. useResultLightbox Hook
Manages lightbox state for results

---

## 🚀 Quick Example

```tsx
import { ResultCard, ResultGrid } from '@/components/result';
import { useResultLightbox } from '@/hooks';
import Lightbox from '@/components/Lightbox';

function MyToolResults() {
    const { t } = useAppControls();
    const [results, setResults] = useState([
        { id: '1', imageUrl: 'blob:...', status: 'done', caption: 'Result 1' },
        { id: '2', imageUrl: null, status: 'pending', caption: 'Result 2' }
    ]);
    
    // Collect all images for lightbox
    const allImages = [
        appState.uploadedImage,
        ...results.map(r => r.imageUrl)
    ];
    
    const { 
        lightboxImages, 
        lightboxIndex, 
        closeLightbox, 
        navigateLightbox,
        handleResultClick 
    } = useResultLightbox(allImages);
    
    return (
        <div>
            {/* Option 1: Individual Cards */}
            {results.map(result => (
                <ResultCard
                    key={result.id}
                    {...result}
                    onImageClick={() => handleResultClick(result.id, result.imageUrl!)}
                    onRegenerate={(prompt) => handleRegenerate(result.id, prompt)}
                    regenerationTitle={t('common_regenTitle')}
                    regenerationPlaceholder={t('common_regenPlaceholder')}
                />
            ))}
            
            {/* Option 2: Result Grid */}
            <ResultGrid
                results={results}
                onImageClick={handleResultClick}
                t={t}
            />
            
            {/* Lightbox */}
            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </div>
    );
}
```

## 🎨 With ResultsView

```tsx
import { ResultsView } from '@/components/uiUtils';
import { ResultCard } from '@/components/result';
import { useResultLightbox } from '@/hooks';

function MyToolResults({ appState }) {
    const allImages = [appState.uploadedImage, appState.resultImage];
    const { lightboxImages, lightboxIndex, closeLightbox, navigateLightbox, handleImageClick } = 
        useResultLightbox(allImages);
    
    return (
        <>
            <ResultsView
                stage={appState.stage}
                originalImage={appState.uploadedImage}
                onOriginalClick={() => handleImageClick(appState.uploadedImage!)}
                error={appState.error}
                actions={
                    <>
                        <button onClick={handleBackToOptions} className="btn btn-secondary">
                            Edit
                        </button>
                        <button onClick={onReset} className="btn btn-secondary">
                            Start Over
                        </button>
                    </>
                }
            >
                <ResultCard
                    imageUrl={appState.resultImage}
                    caption={t('result_caption')}
                    status={appState.stage === 'generating' ? 'pending' : 'done'}
                    error={appState.error}
                    onImageClick={() => handleImageClick(appState.resultImage!)}
                    onRegenerate={handleRegenerate}
                    regenerationTitle={t('common_regenTitle')}
                />
            </ResultsView>
            
            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </>
    );
}
```

## 📊 Full Example with Video Support

```tsx
import { ResultGrid } from '@/components/result';
import { useResultLightbox } from '@/hooks';
import { useVideoGeneration } from '@/components/uiUtils';

function FullExample({ appState }) {
    const { videoTasks, generateVideo } = useVideoGeneration();
    const { t } = useAppControls();
    
    // Prepare results
    const results = appState.generatedImages.map((url, index) => ({
        id: `result-${index}`,
        imageUrl: url,
        caption: t('result_caption', index + 1),
        status: 'done' as const,
        onRegenerate: (prompt: string) => handleRegeneration(index, prompt),
        onGenerateVideo: (prompt: string) => generateVideo(url, prompt),
        regenerationTitle: t('common_regenTitle'),
        regenerationPlaceholder: t('common_regenPlaceholder')
    }));
    
    const allImages = [appState.uploadedImage, ...appState.generatedImages];
    const { lightboxImages, lightboxIndex, closeLightbox, navigateLightbox, handleResultClick } = 
        useResultLightbox(allImages);
    
    return (
        <>
            <ResultGrid
                results={results}
                onImageClick={handleResultClick}
                videoTasks={videoTasks}
                sourceImages={appState.generatedImages}
                t={t}
            />
            
            <Lightbox
                images={lightboxImages}
                selectedIndex={lightboxIndex}
                onClose={closeLightbox}
                onNavigate={navigateLightbox}
            />
        </>
    );
}
```

## 🎯 Import Paths

```tsx
// Result Components
import { ResultCard, ResultGrid } from '@/components/result';
import type { ResultCardProps, ResultItem } from '@/components/result';

// Hook
import { useResultLightbox } from '@/hooks';
```
