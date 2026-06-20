'use client';

import { useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { makeDashboardStore } from './store';

type DashboardStoreProviderProps = {
  children: ReactNode;
};

export function DashboardStoreProvider({ children }: DashboardStoreProviderProps) {
  const [store] = useState(makeDashboardStore);

  return <Provider store={store}>{children}</Provider>;
}
