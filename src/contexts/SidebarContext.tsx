/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
    activePage: string;
    setActivePage: (page: string) => void;
    expandedSections: Set<string>;
    toggleSection: (section: string) => void;
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider');
    }
    return context;
};

interface SidebarProviderProps {
    children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
    const [activePage, setActivePage] = useState('overview');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['generators']));
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return newSet;
        });
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(prev => !prev);
    };

    return (
        <SidebarContext.Provider
            value={{
                activePage,
                setActivePage,
                expandedSections,
                toggleSection,
                isSidebarCollapsed,
                toggleSidebar,
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
};
