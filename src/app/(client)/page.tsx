"use client";

import { useEffect } from 'react';
import Overview from '@/components/Overview';
import { useAppControls } from '@/components/uiContexts';

export default function HomePage() {
  const { setActivePage } = useAppControls();

  useEffect(() => {
    setActivePage('overview' as any);
  }, [setActivePage]);

  return <Overview />;
}
