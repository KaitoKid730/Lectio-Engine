/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_PERSONA_SWITCHER?: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
