'use client';

import LeonardoHeader from '@/components/LeonardoHeader';
import LeonardoBanner from '@/components/LeonardoBanner';

export default function LeonardoDemo() {
    return (
        <div className="min-h-screen bg-black">
            <LeonardoHeader />
            <LeonardoBanner />
        </div>
    );
}
