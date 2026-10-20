/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MUSE_LOGO_URL?: string;
  readonly VITE_MUSE_GLOW_COLOR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
