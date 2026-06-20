import { ensureEsModuleShims } from './es-module-shims';

let financialVisibilityMfePromise: Promise<void> | null = null;

const FINANCIAL_VISIBILITY_MFE_REMOTE_ENTRY_URL =
  process.env.NEXT_PUBLIC_FINANCIAL_VISIBILITY_MFE_REMOTE_ENTRY_URL ??
  'http://localhost:4201/remoteEntry.json';

export function loadFinancialVisibilityMfe() {
  financialVisibilityMfePromise ??= (async () => {
    await ensureEsModuleShims();

    const { initFederation } = await import(
      '@softarc/native-federation-orchestrator'
    );
    const {
      consoleLogger,
      globalThisStorageEntry,
      useShimImportMap,
    } = await import('@softarc/native-federation-orchestrator/options');

    const { loadRemoteModule } = await initFederation(
      {
        financialVisibilityMfe: FINANCIAL_VISIBILITY_MFE_REMOTE_ENTRY_URL,
      },
      {
        ...useShimImportMap({ shimMode: true }),
        logger: consoleLogger,
        storage: globalThisStorageEntry,
        hostRemoteEntry: false,
      },
    );

    await loadRemoteModule('financialVisibilityMfe', './register');
  })().catch((error) => {
    financialVisibilityMfePromise = null;
    throw error;
  });

  return financialVisibilityMfePromise;
}
