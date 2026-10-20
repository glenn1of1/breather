// HR-5 + AI-2: themes need >= 5 people; quotes with personal information never survive; fail closed.
import { describe, expect, it } from "vitest";
import { codeThemes, mockCoder, type ThemeCoder } from "@/lib/themes/code";

const people = (n: number, text: (i: number) => string) => Array.from({ length: n }, (_, i) => ({ speaker: `P${i}`, text: text(i) }));

describe("codeThemes", () => {
  it("drops a theme raised by fewer than 5 people", async () => {
    expect(await codeThemes(people(4, () => "Booking was confusing"), mockCoder)).toEqual([]);
  });

  it("removes quotes with personal information inside a kept theme", async () => {
    const ex = [
      ...people(5, (i) => `My focus at work is better now (${i})`),
      { speaker: "P0", text: "My manager Dave Thompson noticed my work improved" },
      { speaker: "P1", text: "Email me at sam@example.org about work" },
      { speaker: "P2", text: "Call 416-555-0199 about my work schedule" },
    ];
    const [theme] = await codeThemes(ex, mockCoder);
    expect(theme!.participantCount).toBe(5);
    const text = theme!.quotes.map((q) => q.text).join(" ");
    expect(text).not.toMatch(/Thompson|@|416-555/);
    expect(theme!.quotes.length).toBeGreaterThan(0);
  });

  it("fails closed: keeps the label but shows no quotes when the check cannot run", async () => {
    const broken: ThemeCoder = { ...mockCoder, containsPII: async () => { throw new Error("jev down"); } };
    const [theme] = await codeThemes(people(6, (i) => `Better focus at work ${i}`), broken);
    expect(theme!.quotes).toEqual([]);
    expect(theme!.participantCount).toBe(6);
  });

  it("the committed data/themes.json has only themes of >= 5 people and no planted personal information", async () => {
    const { themes } = (await import("@/data/themes.json")).default as { themes: { participantCount: number; quotes: { text: string }[] }[] };
    expect(themes.length).toBeGreaterThan(0);
    for (const t of themes) {
      expect(t.participantCount).toBeGreaterThanOrEqual(5);
      for (const q of t.quotes) expect(q.text).not.toMatch(/Thompson|416-555|@/);
    }
  });
});
