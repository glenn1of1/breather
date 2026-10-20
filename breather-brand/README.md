# @breather/brand

The Breather brand kit, built on SE Health's brand guidelines. One package gives every screen the same colours, type, shapes, components and rules, and lets each employer's homepage carry its own name and accent without breaking the SE Health brand.

**Full guidelines:** [`docs/BRAND-GUIDELINES.md`](docs/BRAND-GUIDELINES.md).

## What's inside

| Path | What it is |
| --- | --- |
| `tokens/tokens.json` | The source of truth: colours, tones, chart series, type, radius, spacing, focus, privacy rule |
| `css/tokens.css` | Every token as a `--br-*` CSS variable |
| `css/breather.css` | Five type styles, buttons, cards, stat cards, pills, tags, number tiles, inputs, privacy value, banner, employer frame |
| `css/tailwind.css` | Tailwind v4 theme: `bg-se-red`, `text-plum`, `bg-teal-tint`, `rounded-xl`, `font-sans`, no shadows |
| `css/aliases.css` | Maps shadcn/ui variables and the team repo's `app/breather.css` variables onto the brand |
| `src/index.js` | `tokens`, `themes`, `contrastRatio`, `meetsAA`, `suppress` (the "<5" rule), `checkEmployerTheme`, `employerStyle` |
| `src/react.js` | `Button`, `Card`, `StatCard`, `IconChip`, `Pill`, `SectionTag`, `PrivacyValue`, `PageTitle`, `SyntheticBanner`, `BrandShape`, `EmployerFrame` (plain React, no build step) |
| `themes/` | Employer co-brand layers. `northwind` is the fictional demo employer. |
| `assets/shapes/` | The five brand shapes: heart, crescent, star, plus, blob |
| `docs/` | The brand guidelines in Markdown |

## Install

The package is private and not on the npm registry. Install it from the folder or from the packed file:

```bash
npm install ../breather-brand
```

```bash
npm install ./breather-brand-1.0.0.tgz
```

## Use

**CSS**

```css
@import "@breather/brand/css/tokens.css";
@import "@breather/brand/css/breather.css";
@import "@breather/brand/themes/northwind.css"; /* optional employer layer */
```

**Tailwind v4**

```css
@import "tailwindcss";
@import "@breather/brand/css/tailwind.css";
```

**Rebrand an existing app** without renaming its variables: import `css/aliases.css` after `tokens.css`, then put `class="br-root"` (or `data-employer="northwind"`) on the part of the page to rebrand.

**React**

```jsx
import "@breather/brand/css/tokens.css";
import "@breather/brand/css/breather.css";
import { EmployerFrame, PageTitle, StatCard, Button } from "@breather/brand/react";

export function Home() {
  return (
    <EmployerFrame employer="northwind">
      <PageTitle kicker="Week 6 of 13">Good morning, Northwind</PageTitle>
      <StatCard tone="people" label="Accepted" value={12} />
      <StatCard tone="info" label="Waitlisted" value={3} groupSize={3} /> {/* renders <5 */}
      <Button variant="hero">Submit to SE Health</Button>
    </EmployerFrame>
  );
}
```

**JavaScript tokens** (Recharts, inline styles)

```js
import { tokens, suppress } from "@breather/brand";

<Bar dataKey="hours" fill={tokens.chart.bar} />;
suppress(3); // "<5"
```

## Add an employer

1. Copy `themes/northwind.json` to `themes/<slug>.json` and change the name, accent and tint.
2. Run `npm run build` to generate `themes/<slug>.css` and `src/themes.js`.
3. Run `npm test`. A theme fails if white text on its accent is under 4.5:1, if the accent is unreadable on the page, or if the accent is red (SE Red stays the only hero colour).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run build` | Regenerates the CSS, JS tokens and theme files from the JSON |
| `npm test` | Checks every approved colour pairing for WCAG AA, the five type styles, no shadows, employer guardrails and the "<5" rule |
| `npm pack` | Builds, tests and writes `breather-brand-1.0.0.tgz` |

## Notes

- Sources, in order: SE Health Brand Placemat 2026, the SE Health "Home of Health" campaign, the Breather brand manual, and the Sphere design workshop (Oct 17 2026).
- The SE Health logos are SE Health's and are not included here. Use them unaltered and only for this pilot.
- Northwind Logistics is fictional. All demo data is synthetic.
