import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ImpactReports } from "@/components/reports/impact-reports";

describe("report server rendering", () => {
  it("renders chart titles as single text nodes without React hydration warnings", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const html = renderToStaticMarkup(createElement(ImpactReports));
      const titles = [...html.matchAll(/<title>(.*?)<\/title>/g)].map((match) => match[1]);
      expect(titles).toHaveLength(7);
      expect(titles[0]).toBe("2026-07-08 – 2026-07-08: 1.4 modeled hours, 54 tracked changes");
      expect(titles[6]).toBe("2026-07-14 – 2026-07-14: 3.7 modeled hours, 75 tracked changes");
      expect(errors).not.toHaveBeenCalled();
    } finally {
      errors.mockRestore();
    }
  });
});
