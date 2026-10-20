// CFO-3, spec §4.7: the band is a projection that widens with the horizon.
import { describe, expect, it } from "vitest";
import { projectBand, MIN_BAND_SHARE, MAX_MONTHLY_GROWTH } from "@/lib/engine/projection";

const noisy = Array.from({ length: 13 }, (_, i) => (i < 2 ? null : 1000 + 20 * i + (i % 2 ? 80 : -80)));

describe("projectBand", () => {
  it("has 12 months and month 1 base equals the given base", () => {
    const b = projectBand(noisy, 5000);
    expect(b).toHaveLength(12);
    expect(b[0]!.base).toBe(5000);
  });
  it("widens every month (high − low strictly increasing)", () => {
    const widths = projectBand(noisy, 5000).map((p) => p.high - p.low);
    widths.slice(1).forEach((w, i) => expect(w).toBeGreaterThan(widths[i]!));
  });
  it("never collapses to a line on a perfectly clean series (minimum width)", () => {
    const clean = Array.from({ length: 13 }, () => 1000);
    const b = projectBand(clean, 5000);
    expect(b[0]!.high - b[0]!.low).toBe(Math.round(2 * 5000 * MIN_BAND_SHARE));
  });
  it("works with no pilot data (/preview)", () => {
    const b = projectBand([], 4000);
    expect(b.every((p) => p.base === 4000)).toBe(true);
  });
  it("floors at 0 and caps runaway trends", () => {
    const crashing = Array.from({ length: 13 }, (_, i) => 2000 - 150 * i);
    const b = projectBand(crashing, 300);
    expect(b.every((p) => p.low >= 0 && p.base >= 0)).toBe(true);
    const rising = Array.from({ length: 13 }, (_, i) => 100 * 2 ** i);
    expect(projectBand(rising, 1000)[11]!.base).toBeLessThanOrEqual(Math.round(1000 * (1 + MAX_MONTHLY_GROWTH * 11)));
  });
  it("ignores the enrolment ramp: a series that only grows before week 8 projects flat", () => {
    const ramp = Array.from({ length: 13 }, (_, i) => (i + 1 < 7 ? 200 * (i + 1) : 1400));
    const b = projectBand(ramp, 5000);
    expect(b[11]!.base).toBe(5000);
  });
  it("projects flat when the steady-state trend is just noise", () => {
    const noise = Array.from({ length: 13 }, (_, i) => 1000 + [40, -60, 90, -30, 70, -80, 20, 60, -90, 50, -40, 80, -20][i]!);
    expect(projectBand(noise, 5000)[11]!.base).toBe(5000);
  });
  it("extends a clear steady-state trend", () => {
    const rising = Array.from({ length: 13 }, (_, i) => 1000 + 30 * i + (i % 2 ? 5 : -5));
    expect(projectBand(rising, 5000)[11]!.base).toBeGreaterThan(5000);
  });
  it("skips hidden weeks", () => {
    const gaps = noisy.map((y, i) => (i % 3 === 0 ? null : y));
    expect(() => projectBand(gaps, 5000)).not.toThrow();
  });
});
