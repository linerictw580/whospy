/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Colyseus HTTP/WebSocket base URL (must match server `PORT` in local dev). */
  readonly VITE_COLYSEUS_URL?: string;
}
