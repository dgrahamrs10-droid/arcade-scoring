import { describe, expect, it } from "vitest";
import { GAME_TYPES } from "./index";

describe("GAME_TYPES", () => {
  it("lists both planned games", () => {
    expect(GAME_TYPES).toEqual(["basketball", "puttskee"]);
  });
});
