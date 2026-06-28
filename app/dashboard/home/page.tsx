'use client';

import { useAuthSessionContext } from '@/app/context/auth-session-context';
import { FinancialVisibilityPanel } from './_components/financial-visibility-panel';

export default function HomeDashboardPage() {
  const { session } = useAuthSessionContext();

  if (!session) {
    return null;
  }

  return <FinancialVisibilityPanel />;
}
