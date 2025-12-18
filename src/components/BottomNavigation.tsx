/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * BottomNavigation - Mobile-first navigation component
 */
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

// Icon component type
interface IconProps {
    className?: string;
    strokeWidth?: number;
}

interface BottomNavItem {
    id: string;
    label: string;
    icon: React.ComponentType<IconProps>;
    onClick: () => void;
}

interface BottomNavigationProps {
    items: BottomNavItem[];
    activeId?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ items, activeId }) => {
    const midIndex = Math.floor(items.length / 2);

    return (
        <nav className="bottom-navigation">
            {items.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeId === item.id;
                const isMidItem = index === midIndex;

                if (isMidItem) {
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={item.onClick}
                            className="bottom-nav-item-center"
                            aria-label={item.label || item.id}
                        >
                            {/* Elevated circular button */}
                            <div className={cn(
                                "bottom-nav-center-circle",
                                isActive && "active"
                            )}>
                                <Icon
                                    className="w-7 h-7 text-white"
                                    strokeWidth={2.5}
                                />
                            </div>
                        </button>
                    );
                }

                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={item.onClick}
                        className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                        aria-label={item.label || item.id}
                    >
                        <Icon
                            className={`bottom-nav-icon-svg ${isActive ? 'text-orange-500' : 'text-white'}`}
                            strokeWidth={isActive ? 2.5 : 2}
                        />
                        {isActive && (
                            <motion.div
                                className="bottom-nav-indicator"
                                layoutId="bottom-nav-indicator"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        )}
                    </button>
                );
            })}
        </nav>
    );
};
