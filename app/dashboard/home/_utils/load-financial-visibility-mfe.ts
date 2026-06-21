import { ensureEsModuleShims } from './es-module-shims';

let financialVisibilityMfePromise: Promise<void> | null = null;

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
        financialVisibilityMfe: 'http://localhost:4201/remoteEntry.json',
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
