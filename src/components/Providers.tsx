"use client";
import React from 'react';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from '../contexts/AuthContext';
import { SidebarProvider } from '../contexts/SidebarContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AppControlProvider, ImageEditorProvider } from './uiContexts';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ThemeProvider>
                <SidebarProvider>
                    <AppControlProvider>
                        <ImageEditorProvider>
                            <Toaster position="top-center" />

                            {children}
                        </ImageEditorProvider>
                    </AppControlProvider>
                </SidebarProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}
