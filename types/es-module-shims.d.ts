export {};

declare module 'es-module-shims' {
  export type ESMSInitOptions = {
    shimMode?: boolean;
    hotReload?: boolean;
    hotReloadInterval?: number;
    nativePassthrough?: boolean;
    version?: string;
    enforceIntegrity?: boolean;
    nonce?: boolean;
    noLoadEventRetriggers?: boolean;
    skip?: RegExp | string[] | string;
    onerror?: (error: unknown) => unknown;
    onpolyfill?: () => void;
    resolve?: (
      id: string,
      parentUrl: string,
      parentResolve: (id: string, parentUrl: string) => string,
    ) => string;
    fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
    revokeBlobURLs?: boolean;
    mapOverrides?: boolean;
    meta?: (meta: unknown, url: string) => void;
    onimport?: (
      url: string,
      fetchOptions: RequestInit,
      parentUrl: string,
    ) => void;
  };
}

declare global {
  type ESMSInitOptions = import('es-module-shims').ESMSInitOptions;

  interface ImportShim {
    <Default = unknown, Exports extends object = Record<string, unknown>>(
      specifier: string,
      parentUrl?: string,
    ): Promise<{ default: Default } & Exports>;
    resolve: (id: string, parentUrl?: string) => string;
    addImportMap: (importMap: {
      imports?: Record<string, string>;
      scopes?: Record<string, Record<string, string>>;
      integrity?: Record<string, string>;
    }) => void;
    getImportMap: () => {
      imports: Record<string, string>;
      scopes: Record<string, Record<string, string>>;
      integrity: Record<string, string>;
    };
  }

  interface Window {
    esmsInitOptions?: ESMSInitOptions;
    importShim?: ImportShim;
  }
}
