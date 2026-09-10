import { describe, expect, it } from "vitest";
import { koMessages, koText } from "@/lib/locales/ko";
import { formatMessage, isLocale } from "@/lib/locales/types";

describe("locale contracts", () => {
  it("supports the two shipped locales only", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ko")).toBe(true);
    expect(isLocale("ja")).toBe(false);
  });

  it("keeps interpolation deterministic and falls back to English when a catalog key is absent", () => {
    expect(formatMessage("{count} unread", { count: 2 })).toBe("2 unread");
    expect(koText("Activity inbox, {count} unread", { count: 2 })).toBe("활동 알림, 읽지 않은 항목 2개");
    expect(koText("Uncatalogued sample text")).toBe("Uncatalogued sample text");
  });

  it("contains the navigation, evidence, and primary operational controls", () => {
    for (const key of ["Command", "System map", "Crisis Lab", "Explore evidence", "Export operations brief", "Your system, in perspective."]) {
      expect(koMessages[key]).toBeTypeOf("string");
      expect(koMessages[key]).not.toBe(key);
    }
  });
});
