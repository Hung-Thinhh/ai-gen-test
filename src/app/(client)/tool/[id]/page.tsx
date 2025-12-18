"use client";

import RouteSetter from '@/components/RouteSetter';
import { useParams } from 'next/navigation';

export default function ToolPage() {
    const params = useParams();
    const id = params?.id as string;

    return <RouteSetter viewId={id} />;
}
