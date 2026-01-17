/**
 * Reusable Result Grid Component
 * Displays multiple result cards in a grid layout
 */
import { ResultCard, type ResultCardProps } from './ResultCard';

export interface ResultItem extends Omit<ResultCardProps, 'onImageClick'> {
    id: string;
}

interface ResultGridProps {
    results: ResultItem[];
    onImageClick: (id: string, imageUrl: string) => void;
    videoTasks?: Record<string, {
        status: 'pending' | 'done' | 'error';
        resultUrl: string | null;
        error?: string;
    }>;
    sourceImages?: string[];
    className?: string;
    t?: (key: string) => string;
}

export function ResultGrid({
    results,
    onImageClick,
    videoTasks = {},
    sourceImages = [],
    className = '',
    t = (key) => key
}: ResultGridProps) {
    return (
        <div className={`flex flex-col md:flex-row items-start justify-center gap-8 flex-wrap w-full px-4 ${className}`}>
            {results.map((result) => (
                <ResultCard
                    key={result.id}
                    {...result}
                    onImageClick={
                        result.imageUrl && result.status === 'done'
                            ? () => onImageClick(result.id, result.imageUrl!)
                            : undefined
                    }
                />
            ))}

            {/* Video results */}
            {sourceImages.map(sourceUrl => {
                const videoTask = videoTasks[sourceUrl];
                if (!videoTask) return null;

                return (
                    <ResultCard
                        key={`${sourceUrl}-video`}
                        imageUrl={videoTask.resultUrl}
                        caption={t('common_video')}
                        status={videoTask.status}
                        error={videoTask.error}
                        onImageClick={
                            videoTask.resultUrl
                                ? () => onImageClick(`${sourceUrl}-video`, videoTask.resultUrl!)
                                : undefined
                        }
                    />
                );
            })}
        </div>
    );
}
