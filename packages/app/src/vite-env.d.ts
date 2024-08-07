/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_REDUX_TOOLKIT_DEVCHECKS: string
  readonly VITE_APP_DATA_GRID_LICENSE_KEY: string
  readonly VITE_LANGSERVE_URL: string
  readonly VITE_LANGSERVE_RAG_ENDPOINT: string
  readonly VITE_LANGSERVE_PATIENTS_ENDPOINT: string
  readonly VITE_LANGSERVE_EVENTS_ENDPOINT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
