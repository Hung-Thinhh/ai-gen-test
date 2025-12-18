/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mobile utilities and hooks
 */

/**
 * Check if device is mobile based on screen width
 */
export const useIsMobile = (): boolean => {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

/**
 * Get mobile breakpoint
 */
export const getBreakpoint = (): 'mobile' | 'tablet' | 'desktop' => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
};

/**
 * Check if touch device
 */
export const isTouchDevice = (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

import React from 'react';
