export const GAME_TYPES = ["basketball", "puttskee"] as const;

export type GameType = (typeof GAME_TYPES)[number];
