'use client';

import { useEffect, useRef, useState } from 'react';
import { loadFinancialVisibilityMfe } from '../_utils/load-financial-visibility-mfe';

type MfeStatus = 'loading' | 'ready' | 'error';

export function FinancialVisibilityMfe() {
  const elementRef = useRef<HTMLElement | null>(null);
  const [status, setStatus] = useState<MfeStatus>('loading');

  useEffect(() => {
    let active = true;
    let element: HTMLElement | null = null;

    const onVisibilityItemSelected = (event: Event) => {
      console.log('Item selecionado no MFE Angular:', (event as CustomEvent).detail);
    };

    async function loadMfe() {
      try {
        await loadFinancialVisibilityMfe();

        if (!active) return;

        element = elementRef.current;

        element?.setAttribute('customer-id', '123');
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

  if (status === 'error') {
    return (
      <p className="text-body-sm text-error">
        Não foi possível carregar o microfrontend.
      </p>
    );
  }

  return (
    <>
      {status === 'loading' && (
        <p className="text-body-sm text-subtle">Carregando microfrontend...</p>
      )}

      <mcintosh-financial-visibility ref={elementRef} customer-id="123" />
    </>
  );
}
