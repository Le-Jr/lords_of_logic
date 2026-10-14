import { describe, expect, it } from "vitest";

import {
  isPlaceholderNickname,
  NICKNAME_MAX_LENGTH,
  placeholderNickname,
} from "@/lib/nickname";

const USER_ID = "0f8c2a5e-1b3d-4c6e-9a7f-123456789abc";

describe("placeholderNickname", () => {
  it("mirrors the on_auth_user_created trigger ('Player_' || left(id, 12))", () => {
    expect(placeholderNickname(USER_ID)).toBe("Player_0f8c2a5e-1b3");
  });

  it("fits within the nickname length limit", () => {
    expect(placeholderNickname(USER_ID).length).toBeLessThanOrEqual(
      NICKNAME_MAX_LENGTH,
    );
  });
});

describe("isPlaceholderNickname", () => {
  it("detects the user's own placeholder", () => {
    expect(isPlaceholderNickname("Player_0f8c2a5e-1b3", USER_ID)).toBe(true);
  });

  it("rejects a chosen nickname", () => {
    expect(isPlaceholderNickname("linus", USER_ID)).toBe(false);
  });

  it("rejects another user's placeholder", () => {
    expect(isPlaceholderNickname("Player_aaaaaaaa-bbb", USER_ID)).toBe(false);
  });
});
