import VideoGenerator from '@/components/VideoGenerator';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Video Generator | Duky AI',
    description: 'Create amazing videos with AI models like VEO, Wan, and more.',
};

export default function VideoGeneratorPage() {
    return <VideoGenerator />;
}
