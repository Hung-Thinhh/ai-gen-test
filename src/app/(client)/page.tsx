"use client";

import { useEffect } from 'react';
import Overview from '@/components/Overview';
import { useAppControls } from '@/components/uiContexts';
import { HomeV2 } from "@/components/homev2";


export default function HomePage() {
  const { setActivePage } = useAppControls();

  useEffect(() => {
    setActivePage('overview' as any);
  }, [setActivePage]);

  return <HomeV2 />;
}
