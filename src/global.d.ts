import type { Game } from './game/game';

declare global {
  interface Window {
    /** Gancho de depuración/QA expuesto por `main.ts`; no forma parte del juego. */
    __BT__?: Game;
  }
}

export {};
