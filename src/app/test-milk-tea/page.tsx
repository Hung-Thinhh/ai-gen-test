'use client';

import { useEffect, useState } from 'react';
import MilkTeaPosterGenerator from '@/components/MilkTeaPosterGenerator';

export default function MilkTeaPosterPage() {
    const [studio, setStudio] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStudio() {
            try {
                const response = await fetch('/api/tool-custom?slug=milk-tea-poster');
                if (!response.ok) {
                    throw new Error('Failed to fetch studio');
                }
                const data = await response.json();
                setStudio(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        }

        fetchStudio();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-neutral-400">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error || !studio) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-500 text-lg mb-2">❌ Lỗi</p>
                    <p className="text-neutral-400">{error || 'Studio not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <MilkTeaPosterGenerator
            studio={studio}
            onGoBack={() => window.history.back()}
        />
    );
}
