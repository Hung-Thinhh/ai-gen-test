"use client";
import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { SidebarProvider } from '../contexts/SidebarContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { AppControlProvider, ImageEditorProvider } from './uiContexts';
import { OAuthRedirect } from './OAuthRedirect';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ThemeProvider>
                <SidebarProvider>
                    <AppControlProvider>
                        <ImageEditorProvider>
                            <OAuthRedirect />
                            {children}
                        </ImageEditorProvider>
                    </AppControlProvider>
                </SidebarProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}
