# Reusable Components Library - Complete Guide

## � All Components Created

### 🎯 **HOCs & Wrappers**
1. **`withToolState`** - `src/components/hoc/withToolState.tsx`
2. **`ToolPageWrapper`** - `src/components/wrappers/ToolPageWrapper.tsx`

### 📝 **Form Controls** - `src/components/form/`
3. **`ToolSelect`** - Dropdown/Select
4. **`ToolCheckbox`** - Checkbox with label
5. **`ToolTextarea`** - Textarea with local state
6. **`ToolInput`** - Text/Number/Email input
7. **`ToolNumberInput`** - Number input with +/- buttons

### 🎨 **UI Components** - `src/components/ui/`
8. **`ToolActionsBar`** - Action buttons bar
9. **`ToolOptionsPanel`** - Options container with title

### 📤 **Upload Components** - `src/components/upload/`
10. **`ImageUploadGrid`** - Multi-image upload with progressive reveal

### 🔧 **Hooks** - `src/hooks/`
11. **`useToolGeneration`** - Credit check & generation
12. **`useToolOptions`** - Options state management

---

## 🚀 Quick Start Examples

### Example 1: Simple Form with All Controls
```tsx
import { ToolSelect, ToolCheckbox, ToolTextarea, ToolInput, ToolNumberInput } from '@/components/form';
import { ToolOptionsPanel, ToolActionsBar } from '@/components/ui';
import { useToolOptions } from '@/hooks';

function MyToolOptions({ appState, onStateChange, onGenerate, onReset }) {
    const { options, handleChange } = useToolOptions(
        appState.options,
        (changes) => onStateChange({ ...appState, options: { ...appState.options, ...changes } })
    );
    
    return (
        <ToolOptionsPanel title="Settings" colorScheme="orange">
            <ToolSelect
                label="Style"
                value={options.style}
                options={['Modern', 'Classic', 'Minimalist']}
                onChange={(value) => handleChange('style', value)}
                colorScheme="orange"
            />
            
            <ToolInput
                label="Title"
                value={options.title}
                onChange={(value) => handleChange('title', value)}
                placeholder="Enter title..."
                colorScheme="orange"
            />
            
            <ToolNumberInput
                label="Images Count"
                value={options.count}
                onChange={(value) => handleChange('count', value)}
                min={1}
                max={4}
                showButtons
                colorScheme="orange"
            />
            
            <ToolTextarea
                label="Notes"
                value={options.notes}
                onChange={(value) => handleChange('notes', value)}
                rows={3}
                colorScheme="orange"
            />
            
            <ToolCheckbox
                label="Remove Watermark"
                checked={options.removeWatermark}
                onChange={(checked) => handleChange('removeWatermark', checked)}
                colorScheme="orange"
            />
            
            <ToolActionsBar
                primary={{
                    label: 'Generate',
                    onClick: onGenerate,
                    loading: appState.stage === 'generating'
                }}
                secondary={[
                    { label: 'Reset', onClick: onReset }
                ]}
            />
        </ToolOptionsPanel>
    );
}
```

### Example 2: Image Upload Grid
```tsx
import { ImageUploadGrid, type UploadSlot } from '@/components/upload';

function MyImageUploader({ appState, onStateChange }) {
    const slots: UploadSlot[] = [
        {
            id: '1',
            image: appState.image1,
            caption: 'Main Image',
            description: 'Upload your main image here',
            placeholderType: 'product'
        },
        {
            id: '2',
            image: appState.image2,
            caption: 'Reference',
            description: 'Optional reference image',
            placeholderType: 'magic'
        }
    ];
    
    return (
        <ImageUploadGrid
            slots={slots}
            onImageChange={(id, url) => {
                onStateChange({
                    ...appState,
                    [`image${id}`]: url
                });
            }}
            onImageClick={(id) => openLightbox(id)}
            progressive // Show slots one by one
            columns={4}
        />
    );
}
```

### Example 3: Complete Tool Page (Best Practice)
```tsx
"use client";

import MyToolComponent from '@/components/MyToolComponent';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';
import { withToolState } from '@/components/hoc/withToolState';

function MyToolPage({ appState, onStateChange, onReset, onGoBack }: any) {
    return (
        <ToolPageWrapper toolId="my-tool" settingsKey="myTool">
            {({ settings: s, t, addImagesToGallery, logGeneration }) => (
                <MyToolComponent 
                    mainTitle={t(s.mainTitleKey)}
                    subtitle={t(s.subtitleKey)}
                    // ... other props from settings
                    appState={appState}
                    onStateChange={onStateChange}
                    onReset={onReset}
                    onGoBack={onGoBack}
                    addImagesToGallery={addImagesToGallery}
                    logGeneration={logGeneration}
                />
            )}
        </ToolPageWrapper>
    );
}

export default withToolState(MyToolPage, 'my-tool');
```

---

## 📚 Import Paths

```tsx
// HOCs & Wrappers
import { withToolState } from '@/components/hoc/withToolState';
import { ToolPageWrapper } from '@/components/wrappers/ToolPageWrapper';

// Form Controls (all exports)
import { 
    ToolSelect, 
    ToolCheckbox, 
    ToolTextarea, 
    ToolInput, 
    ToolNumberInput 
} from '@/components/form';

// UI Components (all exports)
import { ToolActionsBar, ToolOptionsPanel } from '@/components/ui';

// Upload Components
import { ImageUploadGrid, type UploadSlot } from '@/components/upload';

// Hooks
import { useToolGeneration, useToolOptions } from '@/hooks';
```

---

## 🎨 Color Schemes

All form and UI components support these color schemes:
- `'yellow'` (default)
- `'orange'`
- `'blue'`
- `'green'`
- `'purple'`

---

## ✅ Refactored Tools (29/29)

All 29 tools have been refactored with `withToolState` and `ToolPageWrapper`:

✅ poster-creator, typographic-illustrator, studio-photoshoot  
✅ product-mockup, product-scene, pose-animator  
✅ portrait-generator, photo-booth, photoshoot  
✅ outfit-extractor, object-remover, inpainter  
✅ face-swap, concept-studio, color-palette-swap  
✅ clone-effect, free-generation, photo-restoration  
✅ architecture-ideator, avatar-creator, swap-style  
✅ dress-the-model, beauty-creator, baby-photo-creator  
✅ mid-autumn-creator, entrepreneur-creator, toy-model-creator  
✅ image-interpolation, khmer-photo-merge

---

## 📊 Impact Summary

| Component Type | Components | Lines Saved | Status |
|----------------|-----------|-------------|--------|
| HOCs & Wrappers | 2 | ~750 lines | ✅ Applied to 29 tools |
| Form Controls | 5 | ~400 lines potential | ⏳ Ready to use |
| UI Components | 2 | ~200 lines potential | ⏳ Ready to use |
| Upload Components | 1 | ~300 lines potential | ⏳ Ready to use |
| Hooks | 2 | ~150 lines potential | ⏳ Ready to use |
| **TOTAL** | **12** | **~1,800 lines** | **2 applied, 10 ready** |

---

## 🚀 Next Steps

1. **Use form controls** in tool components to replace manual form code
2. **Use ImageUploadGrid** in tools with multiple image uploads (FreeGeneration, etc.)
3. **Use useToolGeneration** hook in all generation functions
4. **Standardize UI** by using ToolOptionsPanel everywhere

**Estimated additional savings:** ~1,200 lines if all components are adopted
