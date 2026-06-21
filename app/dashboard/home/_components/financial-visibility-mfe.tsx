'use client';

import { useEffect, useRef, useState } from 'react';
import { loadFinancialVisibilityMfe } from '../_utils/load-financial-visibility-mfe';
import { selectFinancialVisibilityData } from '../../_store/account/account.selectors';
import { useAppSelector } from '../../_store/hooks';
import type { McintoshFinancialVisibilityElement } from '@/types/custom-elements';

type MfeStatus = 'loading' | 'ready' | 'error';

export function FinancialVisibilityMfe() {
  const financialVisibilityData = useAppSelector(selectFinancialVisibilityData);
  const financialVisibilityDataRef = useRef(financialVisibilityData);
  const elementRef = useRef<McintoshFinancialVisibilityElement | null>(null);
  const [status, setStatus] = useState<MfeStatus>('loading');

  useEffect(() => {
    let active = true;
    let element: McintoshFinancialVisibilityElement | null = null;

    const onVisibilityItemSelected = (event: Event) => {
      console.log('Item selecionado no MFE Angular:', (event as CustomEvent).detail);
    };

    async function loadMfe() {
      try {
        await loadFinancialVisibilityMfe();

        if (!active) return;

        element = elementRef.current;

        element?.setAttribute('customer-id', '123');
        if (element) {
          element.financialVisibilityData = financialVisibilityDataRef.current;
        }
        element?.addEventListener('visibilityItemSelected', onVisibilityItemSelected);

        setStatus('ready');
      } catch (error) {
        console.error(error);

        if (active) {
          setStatus('error');
        }
      }
    }

    loadMfe();

    return () => {
      active = false;
      element?.removeEventListener('visibilityItemSelected', onVisibilityItemSelected);
    };
  }, []);

  useEffect(() => {
    financialVisibilityDataRef.current = financialVisibilityData;

    if (!elementRef.current || status !== 'ready') {
      return;
    }

    elementRef.current.financialVisibilityData = financialVisibilityData;
  }, [financialVisibilityData, status]);

  if (status === 'error') {
    return (
      <p className="text-body-sm text-error">
        Não foi possível carregar a visibilidade financeira.
      </p>
    );
  }

  return (
    <>
      {status === 'loading' && (
        <p className="text-body-sm text-subtle">Carregando visibilidade financeira...</p>
      )}

      <mcintosh-financial-visibility ref={elementRef} customer-id="123" />
    </>
  );
}
