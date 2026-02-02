/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
    ArrowUpLeft, ArrowUp, ArrowUpRight,
    ArrowLeft, Aperture, ArrowRight,
    ArrowDownLeft, ArrowDown, ArrowDownRight,
    Box as BoxIcon
} from 'lucide-react';

export type AnglePreset =
    | 'top-left' | 'overhead' | 'top-right'
    | 'left' | 'front' | 'right'
    | 'low-left' | 'worm-eye' | 'low-right';

export interface CameraSettings {
    presets: AnglePreset[]; // Changed from single preset to array
}

// Angle configurations
const ANGLE_CONFIGS: Record<
    AnglePreset,
    {
        rotation: number
        tilt: number
        label: string
        icon: string
        prompt: string
        negativePrompt: string
    }
> = {
    'top-left': {
        rotation: 315,
        tilt: 60,
        label: 'Top Left',
        icon: '↖️',
        prompt:
            `Single main subject: the tea tin. Only one subject.Camera angle must be clearly different from other images.
Do NOT reuse camera position.

High angle shot from upper-left.
Camera elevated above the object.
Top surface and left face clearly visible.
Right face occupies at least 60% of the visible area.
Front face secondary.
Left face barely visible.

Camera height: high.
Camera distance: medium.
Professional product photography, white background.`,
        negativePrompt:
            "front dominant, symmetrical view, right-side dominant, reused angle, eye-level shot, low angle, bottom view, overhead flat lay, bird's-eye view, camera on right, camera in front, camera behind",
    },

    overhead: {
        rotation: 0,
        tilt: 75,
        label: 'Overhead',
        icon: '⬆️',
        prompt:
            "Single main subject: the tea tin. Only one subject. Camera angle must be clearly different from other images. Do NOT reuse camera position. True overhead bird's-eye view. Camera directly above at 90-degree vertical angle, pointing straight down. Top surface occupies at least 80% of frame. All sides equally visible. Flat lay composition, no perspective depth. Camera height: directly above. Camera distance: medium. Professional product photography, white background, 8k resolution.",
        negativePrompt:
            "angled view, three-quarter view, side dominance, eye-level, low angle, perspective depth, tilted camera, camera from side",
    },

    'top-right': {
        rotation: 45,
        tilt: 60,
        label: 'Top Right',
        icon: '↗️',
        prompt:
            `Single main subject: the tea tin.
Only one subject.

Camera angle must be clearly different from other images.
Do NOT reuse camera position.

High angle shot from upper-left.
Camera elevated above the object.
Top surface and left face clearly visible.
Left face occupies at least 60% of the visible area.
Front face secondary.
Right face barely visible.

Camera height: high.
Camera distance: medium.
Professional product photography, white background.
`,
        negativePrompt:
            "front dominant, left-side dominant, reused angle, straight-on view, eye-level shot, low angle, overhead flat lay, camera on left",
    },

    left: {
        rotation: 270,
        tilt: 0,
        label: 'Left',
        icon: '⬅️',
        prompt:
            "Single main subject: the tea tin. Only one subject. Camera angle must be clearly different from other images. Do NOT reuse camera position. Eye-level LEFT profile shot. Camera positioned 90 degrees on the left side at subject center height. LEFT face occupies at least 75% of frame. Front and right faces not visible. Flat profile composition. Camera height: eye-level. Camera distance: medium. Professional product photography, white background, 8k resolution.",
        negativePrompt:
            "front view, three-quarter view, right-side view, angled shot, high angle, low angle, top view, reused camera angle",
    },

    front: {
        rotation: 0,
        tilt: 0,
        label: 'Front',
        icon: '⭕',
        prompt:
            "Single main subject: the tea tin. Only one subject. Camera angle must be clearly different from other images. Do NOT reuse camera position. Eye-level straight-on FRONT view. Camera directly in front at subject center height. Front face occupies at least 80% of frame. Side faces minimal. Symmetrical framing, parallel vertical edges. Camera height: eye-level. Camera distance: medium. Professional product photography, white background, 8k resolution.",
        negativePrompt:
            "side view, angled view, three-quarter view, perspective depth, high angle, low angle, top view, reused angle",
    },

    right: {
        rotation: 90,
        tilt: 0,
        label: 'Right',
        icon: '➡️',
        prompt:
            "Single main subject: the tea tin. Only one subject. Camera angle must be clearly different from other images. Do NOT reuse camera position. Eye-level RIGHT profile shot. Camera positioned 90 degrees on the right side at subject center height. RIGHT face occupies at least 75% of frame. Front and left faces not visible. Flat profile composition. Camera height: eye-level. Camera distance: medium. Professional product photography, white background, 8k resolution.",
        negativePrompt:
            "front view, three-quarter view, left-side view, angled shot, high angle, low angle, top view, reused camera angle",
    },

    'low-left': {
        rotation: 315,
        tilt: -60,
        label: 'Low Left',
        icon: '↙️',
        prompt:
            "Single main subject: the tea tin. Only one subject. Camera angle must be clearly different from other images. Do NOT reuse camera position. Low-angle three-quarter view from lower-left. Camera below subject, angled upward at 45 degrees. Bottom surface and LEFT face visible. LEFT face dominant. Dramatic hero perspective. Camera height: low. Camera distance: medium. Professional product photography, white background, 8k resolution.",
        negativePrompt:
            "eye-level, high angle, top view, overhead, front dominant, reused angle",
    },

    'worm-eye': {
        rotation: 0,
        tilt: -75,
        label: "Worm's Eye",
        icon: '⬇️',
        prompt:
            "Single main subject: the tea tin. Only one subject. Camera angle must be clearly different from other images. Do NOT reuse camera position. Extreme worm's-eye view. Camera directly below subject at 90-degree vertical angle, pointing straight up. Bottom surface dominates frame. All bottom edges visible. Strong upward perspective. Camera height: ground level. Camera distance: medium. Professional product photography, white background, 8k resolution.",
        negativePrompt:
            "eye-level, side view, angled shot, high angle, top view, perspective from side",
    },

    'low-right': {
        rotation: 45,
        tilt: -60,
        label: 'Low Right',
        icon: '↘️',
        prompt:
            "Single main subject: the tea tin. Only one subject. Camera angle must be clearly different from other images. Do NOT reuse camera position. Low-angle three-quarter view from lower-right. Camera below subject, angled upward at 45 degrees. Bottom surface and RIGHT face visible. RIGHT face dominant. Dramatic hero perspective. Camera height: low. Camera distance: medium. Professional product photography, white background, 8k resolution.",
        negativePrompt:
            "eye-level, high angle, top view, overhead, left dominant, reused angle",
    },
}


export const getCameraPrompt = (preset: AnglePreset): string => {
    const config = ANGLE_CONFIGS[preset] || ANGLE_CONFIGS['front'];

    // Combine angle-specific prompt with base quality requirements
    const fullPrompt = `${config.prompt} Professional studio shot, realistic materials, ultra sharp focus, commercial e-commerce photo.`;

    // Combine general negative prompts with angle-specific ones
    const generalNegative = "multiple products, duplicate items, two products, many items, tilted subject, rotated subject, distorted perspective, poor lighting, blurry, low quality, pixelated, bad composition";
    const combinedNegative = `${generalNegative}, ${config.negativePrompt}`;

    return `${fullPrompt}\n\nNegative: ${combinedNegative}`;
};

interface CameraControlPanelProps {
    value: CameraSettings;
    onChange: (settings: CameraSettings) => void;
    productImage?: string | null;
}


// 3D Scene Component
function Scene({ preset, selectedPresets }: { preset: AnglePreset; selectedPresets: AnglePreset[] }) {
    // Use default front view when multiple presets are selected
    const shouldUseDefaultView = selectedPresets.length > 1;
    const activePreset = shouldUseDefaultView ? 'front' : preset;

    const safePreset = ANGLE_CONFIGS[activePreset] ? activePreset : 'front';
    const { rotation, tilt } = ANGLE_CONFIGS[safePreset];

    // Calculate camera position for main preview
    const sphereRadius = 1.5;
    const rotRad = (-rotation * Math.PI) / 180;
    const tiltRad = (-tilt * Math.PI) / 180;

    const horizontalDistance = sphereRadius * Math.cos(tiltRad);
    const camX = horizontalDistance * Math.sin(rotRad);
    const camY = sphereRadius * Math.sin(tiltRad);
    const camZ = horizontalDistance * Math.cos(rotRad);

    // Note: Camera position is now controlled by OrbitControls for interactive rotation
    // The initial position is set via Canvas camera prop

    // Helper to calculate camera position for any preset
    // Use shorter distance for indicators (65% of sphere radius)
    const getCameraPosition = (presetName: AnglePreset) => {
        const config = ANGLE_CONFIGS[presetName];
        // Convert rotation to radians - no negation needed for correct orientation
        const rotRad = (config.rotation * Math.PI) / 180;
        const tiltRad = (-config.tilt * Math.PI) / 180;
        const indicatorRadius = sphereRadius * 0.65; // Shorter distance
        const horizontalDistance = indicatorRadius * Math.cos(tiltRad);
        return {
            x: horizontalDistance * Math.sin(rotRad),
            y: indicatorRadius * Math.sin(tiltRad),
            z: horizontalDistance * Math.cos(rotRad)
        };
    };

    return (
        <>
            {/* Lights - Improved for better 3D look */}
            <ambientLight intensity={1.5} />
            <directionalLight position={[5, 10, 7]} intensity={2} castShadow />
            <pointLight position={[-5, -5, -5]} intensity={1} color="#fb923c" />

            {/* Wireframe Sphere Grid - Subtle */}
            <Sphere args={[sphereRadius, 32, 16]}>
                <meshBasicMaterial wireframe color="#f97316" opacity={0.2} transparent />
            </Sphere>

            {/* Equator Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[sphereRadius, 0.01, 32, 100]} />
                <meshBasicMaterial color="#f97316" opacity={0.3} transparent />
            </mesh>

            {/* Product Sphere at Center - Always Orange */}
            <mesh position={[0, 0, 0]} scale={0.4}>
                <sphereGeometry args={[0.5, 64, 64]} />
                <meshStandardMaterial
                    color="#f97316"
                    roughness={0.3}
                    metalness={0.2}
                />
            </mesh>

            {/* Direction Indicator (Front) */}
            <mesh position={[0, 0, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.3]} />
                <meshBasicMaterial color="#22c55e" />
            </mesh>
            <mesh position={[0, 0, 0.95]} rotation={[-Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.05, 0.1]} />
                <meshBasicMaterial color="#22c55e" />
            </mesh>

            {/* Camera Position Indicators - only show when multiple selections */}
            {shouldUseDefaultView && selectedPresets.map((presetName) => {
                const pos = getCameraPosition(presetName);

                return (
                    <group key={presetName}>
                        {/* Wireframe cube camera icon */}
                        <mesh position={[pos.x, pos.y, pos.z]}>
                            <boxGeometry args={[0.25, 0.25, 0.25]} />
                            <meshBasicMaterial
                                wireframe
                                color="#fbbf24"
                                opacity={0.9}
                                transparent
                            />
                        </mesh>

                        {/* Short line from camera to near sphere surface */}
                        <Line
                            points={[[pos.x, pos.y, pos.z], [pos.x * 0.45, pos.y * 0.45, pos.z * 0.45]]}
                            color="#f97316"
                            lineWidth={1.5}
                            opacity={0.5}
                            transparent
                        />
                    </group>
                );
            })}

            {/* OrbitControls for interactive rotation */}
            <OrbitControls
                enableZoom={true}
                enablePan={false}
                enableRotate={true}
                zoomSpeed={0.5}
                rotateSpeed={0.5}
            />
        </>
    );
};


const CameraControlPanel: React.FC<CameraControlPanelProps> = ({ value, onChange, productImage }) => {
    // Ensure we always have valid presets array
    const selectedPresets = value?.presets || ['front'];
    const [generateAll, setGenerateAll] = useState(false);

    // For 3D preview, show the first selected preset
    const previewPreset = selectedPresets[0] || 'front';

    // Toggle preset selection
    const togglePreset = (targetPreset: AnglePreset) => {
        if (generateAll) return; // Don't allow manual selection when "all" is checked

        const isCurrentlySelected = selectedPresets.includes(targetPreset);
        let newPresets: AnglePreset[];

        if (isCurrentlySelected) {
            // Deselect - but keep at least one
            newPresets = selectedPresets.filter(p => p !== targetPreset);
            if (newPresets.length === 0) newPresets = [targetPreset]; // Keep at least one
        } else {
            // Add to selection
            newPresets = [...selectedPresets, targetPreset];
        }

        onChange({ presets: newPresets });
    };

    // Handle "Generate all 9 angles" checkbox
    const handleGenerateAllChange = (checked: boolean) => {
        setGenerateAll(checked);
        if (checked) {
            // Select all 9 presets
            const allPresets: AnglePreset[] = [
                'top-left', 'overhead', 'top-right',
                'left', 'front', 'right',
                'low-left', 'worm-eye', 'low-right'
            ];
            onChange({ presets: allPresets });
        } else {
            // Reset to just the first one
            onChange({ presets: [selectedPresets[0] || 'front'] });
        }
    };

    // Quick helper to render a button
    const renderBtn = (targetPreset: AnglePreset) => {
        const config = ANGLE_CONFIGS[targetPreset];
        const isSelected = selectedPresets.includes(targetPreset);

        let IconComponent = BoxIcon; // Default
        switch (targetPreset) {
            case 'top-left': IconComponent = ArrowUpLeft; break;
            case 'overhead': IconComponent = ArrowUp; break;
            case 'top-right': IconComponent = ArrowUpRight; break;
            case 'left': IconComponent = ArrowLeft; break;
            case 'front': IconComponent = Aperture; break;
            case 'right': IconComponent = ArrowRight; break;
            case 'low-left': IconComponent = ArrowDownLeft; break;
            case 'worm-eye': IconComponent = ArrowDown; break;
            case 'low-right': IconComponent = ArrowDownRight; break;
        }

        return (
            <button
                onClick={() => togglePreset(targetPreset)}
                className={`
                    flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 border relative
                    ${isSelected
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                        : 'bg-neutral-900/50 border-neutral-800 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300 hover:border-neutral-700'
                    }
                    ${generateAll ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title={config.label}
                disabled={generateAll}
            >
                <IconComponent size={24} strokeWidth={1.5} />
                {isSelected && selectedPresets.length > 1 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                        {selectedPresets.indexOf(targetPreset) + 1}
                    </div>
                )}
            </button>
        );
    };

    return (
        <div className="flex flex-row gap-6 w-full max-w-3xl items-start">
            {/* Left Column: 3D Visualization */}
            <div className="w-[280px] shrink-0">
                <div className="w-full aspect-square bg-black rounded-xl overflow-hidden border border-neutral-800 shadow-2xl relative">
                    <Canvas
                        camera={{ position: [0, 0, 8.5], fov: 60, near: 0.1, far: 100 }}
                        gl={{ antialias: true, alpha: true }}
                    >
                        <color attach="background" args={['#0a0a0a']} />
                        <Scene preset={previewPreset as AnglePreset} selectedPresets={selectedPresets as AnglePreset[]} />
                    </Canvas>

                    {/* Overlay Label */}
                    <div className="absolute inset-x-0 bottom-3 text-center pointer-events-none">
                        <span className="text-[10px] uppercase tracking-wider text-neutral-600 font-semibold bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                            {selectedPresets.length > 1 ? `${selectedPresets.length} Angles Selected` : ANGLE_CONFIGS[previewPreset as AnglePreset]?.label || 'Camera Preview'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Column: Preset Angles Grid */}
            <div className="flex-1 flex flex-col justify-center h-[280px]">
                <div className="flex items-center gap-2 mb-4 px-1">
                    <span className="text-sm font-semibold text-neutral-200">Camera Angles</span>
                    <span className="text-xs text-orange-400 px-2 py-0.5 bg-orange-900/30 rounded-full border border-orange-800">{selectedPresets.length} Selected</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {/* Row 1 */}
                    {renderBtn('top-left')}
                    {renderBtn('overhead')}
                    {renderBtn('top-right')}

                    {/* Row 2 */}
                    {renderBtn('left')}
                    {renderBtn('front')}
                    {renderBtn('right')}

                    {/* Row 3 */}
                    {renderBtn('low-left')}
                    {renderBtn('worm-eye')}
                    {renderBtn('low-right')}
                </div>

                <div className="mt-4 flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-neutral-900/80 backdrop-blur px-3 py-1.5 rounded-full border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
                        <input
                            type="checkbox"
                            id="batch-angles"
                            checked={generateAll}
                            onChange={(e) => handleGenerateAllChange(e.target.checked)}
                            className="rounded border-neutral-600 bg-neutral-800 text-orange-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <label htmlFor="batch-angles" className="text-xs text-neutral-400 cursor-pointer select-none">Generate all 9 angles</label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CameraControlPanel;
