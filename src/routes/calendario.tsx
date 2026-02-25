import { createFileRoute } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { CalendarSkeleton } from '@/components/calendar/CalendarSkeleton';

const CalendarPage = lazy(() => import('@/components/calendar/CalendarPage'));

export const Route = createFileRoute('/calendario')({
  component: () => (
    <Suspense fallback={<CalendarSkeleton view="month" />}>
      <CalendarPage />
    </Suspense>
  ),
});
