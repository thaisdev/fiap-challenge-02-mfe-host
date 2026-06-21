let esModuleShimsPromise: Promise<void> | null = null;

const ES_MODULE_SHIMS_SCRIPT_SELECTOR = 'script[data-es-module-shims="true"]';
const ES_MODULE_SHIMS_SCRIPT_SRC = '/vendor/es-module-shims.js';

function hasImportShim() {
  const browserWindow = window as unknown as { importShim?: unknown };

  return typeof browserWindow.importShim === 'function';
}

function configureEsModuleShims() {
  window.esmsInitOptions = {
    ...window.esmsInitOptions,
    shimMode: true,
  };
}

export function ensureEsModuleShims() {
  if (hasImportShim()) {
    return Promise.resolve();
  }

  esModuleShimsPromise ??= new Promise<void>((resolve, reject) => {
    configureEsModuleShims();

    const existingScript = document.querySelector<HTMLScriptElement>(
      ES_MODULE_SHIMS_SCRIPT_SELECTOR,
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Nao foi possivel carregar es-module-shims.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');

    script.async = true;
    script.src = ES_MODULE_SHIMS_SCRIPT_SRC;
    script.dataset.esModuleShims = 'true';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error('Nao foi possivel carregar es-module-shims.')),
      { once: true },
    );

    document.head.appendChild(script);
  });

  return esModuleShimsPromise;
}
