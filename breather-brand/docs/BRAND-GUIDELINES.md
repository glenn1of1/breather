# Breather brand guidelines

Version 1.0 · October 18, 2026 · Breather by SE Health, for the Respite for All pilot

These guidelines are the written half of the `@breather/brand` package. The tokens, CSS and components in the package carry out every rule below, so if the code and this document ever disagree, fix whichever is wrong and keep them in step. The PDF (`Breather-Brand-Guidelines.pdf`) is the same content, laid out for reading and presenting.

**Sources, in order of authority**

1. SE Health Brand Placemat 2026: colour, Calibri, voice. Official and normative.
2. SE Health "Home of Health" campaign: Soft Sage, and the line "Warm at the edges. Clear at the center."
3. Pilot Hub / Breather brand manual: layout, cards, shapes and charts, where SE Health is silent.
4. Sphere design workshop, Oct 17 2026: one hero colour, five type styles, a 12px floor, one component style, and the anti-pattern checklist.

Values marked *derived* are tints or shades of an SE Health colour, made to pass contrast. They are not in the SE Health guidelines.

---

## 1. Who Breather is

Breather helps an employer run SE Health's 3-month caregiver pilot, then decide whether to **scale, sustain or stop** the benefit.

- **Caregivers** fill in an anonymous one-minute survey and get a claim number.
- **HR** sees company-wide totals only. Any number from fewer than 5 people is hidden.
- **The CFO** sees a recommendation with its reasons, the cost to continue as a range, and a 12-month projection band.

**Positioning.** Visibility without intrusion, plus a clear exit ramp.

**Creative north star.** "Warm at the edges, clear at the center." The center of every screen is clear: plum type, one big number per card, plain words. The warmth lives at the edges: a soft off-white page, rounded cards, tinted containers and one faint shape in a card corner.

**Fixed phrases.** Use these exactly:

- "Breather recommends; you decide."
- "Projection, not a prediction"
- "Available at pilot end"
- "Hidden to protect privacy: fewer than 5 people."

## 2. Brand architecture

| Layer | What it is | Where it shows |
| --- | --- | --- |
| SE Health | The master brand and sponsor. Its guidelines govern colour and text. | Logo, palette, type, voice on every screen |
| Breather | The product name. Set in Calibri, Plum, no logo of its own. | Sidebar, page titles, emails |
| Employer | The company running the pilot (demo: Northwind Logistics, fictional). | Only the co-brand strip on its homepage (section 13) |

### Logo

- Use SE Health's own logo files (not included in this package) unaltered: horizontal for headers and footers, vertical for tall spaces.
- Full colour on Page (#F8F7F5) or White only. Never on Plum, SE Red or a photo; never recoloured, stretched, outlined or given effects.
- Clear space on every side: at least the height of the "S" in the wordmark. Minimum width: 120px on screen.
- Breather has no separate logo. Write the name in Calibri, in Plum, in sentence case.
- Always give the logo alt text: "SE Health".

## 3. Colour

SE Red is the one hero colour. Plum carries structure and words. Teal carries information. Warm greys carry surfaces.

| Token | Hex | Role |
| --- | --- | --- |
| `se-red` | #E41A2E | The hero: primary action, the title rule, the key moment. Fill or 24px+ text only. At most about 10% of a screen. |
| `se-red-deep` | #AB1323 | Red text at any size; hover for SE Red. |
| `plum` | #432844 | Headings, body text, sidebar, chart marks, icon buttons. |
| `teal` | #00A2B1 | Information fills: number tiles, privacy and money fills. White text on it must be large. |
| `teal-deep` | #007A85 | Teal text and thin chart marks on the page. *Derived.* |
| `soft-sage` | #C7DED8 | Positive and done. From the Home of Health campaign. |
| `page` | #F8F7F5 | Every page background. Never pure white. |
| `card` | #EBE9E8 | Neutral cards, panels, progress tracks. |
| `logo-grey` | #CEC8C6 | Hairlines, input borders, decorative shapes. Never text. |
| `text-grey` | #6D6E71 | Secondary text on the page background only. |
| `red-tint` | #FBE4E6 | People family. *Derived.* |
| `teal-tint` | #DDF0F2 | Privacy, waitlist and money family. *Derived.* |
| `plum-tint` | #ECE4EC | Activity and time family. *Derived.* |
| `white` | #FFFFFF | Text on SE Red, Teal and Plum; input fields. Not a page or card background. |

### Colour as meaning (tones)

Each tint is one idea family. Text on every tint is Plum.

| Tone | Background | Means | Shape |
| --- | --- | --- | --- |
| `people` | Red tint | Caregivers identified, accepted, the verdict | Heart |
| `info` | Teal tint | Privacy, "<5", waitlist, cost, funds used | Crescent |
| `activity` | Plum tint | Hours used, usage, pilot weeks | Star |
| `positive` | Soft Sage | Improved, value shown, done | Plus |
| `card` | Card | Neutral panels and charts | Blob |

### Colour rules

- **One hero.** If two red things compete on a screen, remove one.
- **Deep for text.** When red or teal becomes small text, use SE Red Deep or Teal Deep.
- **Plum on tint.** Text on every tint and on Card is Plum at full opacity. No grey and no translucent text on coloured surfaces.
- **Word, not just colour.** Every coloured pill or dot also carries a word ("Improved", "Waitlist", "<5").
- **Flat.** No gradients.

### Approved text pairings (checked by `npm test`)

| Text | On | Ratio |
| --- | --- | --- |
| Plum | Page, Card, every tint, White | 9.2:1 to 12.9:1 |
| SE Red Deep | Page, Card, Red tint, White | 6.1:1 to 7.4:1 |
| Teal Deep | Page | 4.8:1 |
| Text Grey | Page only | 4.8:1 |
| White | SE Red, Plum, Sidebar active | 4.7:1 to 12.9:1 |
| White | Teal | 3.1:1, large text only |

## 4. Typography

**Typeface.** Calibri, SE Health's corporate face. On the web, Carlito (free, metric-compatible, from Google Fonts) stands in where Calibri is missing, then Segoe UI.

`font-family: Calibri, Carlito, 'Segoe UI', ui-sans-serif, sans-serif;`

**Exactly five styles.** Every piece of text maps to one of these.

| Style | Size | Weight | Line height | Use |
| --- | --- | --- | --- | --- |
| Display | 40–56px (fluid) | 400 | 1.05 | Page title, the big number on a stat card, the verdict word. One per card. |
| Headline | 28px | 400 | 1.2 | Panel and section titles |
| Title | 20px | 700 | 1.3 | Card titles, list headings, the red kicker above a headline |
| Body | 16px | 400 | 1.5 | Paragraphs, table cells, form text. Max 70 characters per line. |
| Label | 14px | 700 | 1.35 | Stat labels, pills, buttons, nav items, captions, axis ticks |

Calibri runs small for its size, so this scale sits one step larger than a typical sans.

**Type rules**

- Nothing below 12px, ever, including chart ticks, tooltips and footnotes. Readable text is 14px or more.
- Sentence case everywhere. No all-caps, no letter-spaced eyebrow kickers, no tiny subtitles with a dot.
- No Calibri Light and no weights below 400.
- The page title sits above a 64px × 2px SE Red rule, as on the SE Health placemat.
- A red kicker above a headline is allowed: Title size, SE Red Deep, sentence case.

## 5. Shape, space and depth

- **Everything is rounded.** Cards 24px. Inner tiles and chart wells 16px. Inputs and number tiles 12px. Buttons, pills, tags, tabs and icon chips are full pills.
- **Never mix** rounded and square controls.
- **Spacing** uses a 4px base: 4, 8, 12, 16, 24, 32. Cards pad 24px (16px on phones), cards sit 12–16px apart, sections 32px apart.
- **Flat.** No shadows, including on hover. Depth comes from tonal layering: Page → Card or tint → Plum and SE Red controls. Overlays sit on Page with a 1px Logo Grey border.
- **Hover changes colour, never elevation.**

## 6. Brand shapes, icons and imagery

**Five shapes:** heart, crescent, star, plus and blob (`assets/shapes/`). One per card, cropped off a corner, at 40–60% opacity, filled a little deeper than the card's tint. They mark the colour family, never data, and are always `aria-hidden`.

**Icons.** Lucide outline icons only, 1.8px stroke, 16–20px, inside a 32–40px tinted circle. The icon is Plum, or SE Red Deep in the people tone. Never mix outline and filled icons.

**Imagery.** No photography and no stock or AI-generated illustration. The only images are the five shapes and the SE Health logo. Every meaningful image has alt text; decorative ones are hidden from assistive tech.

## 7. Layout

- One shell for every employer screen: a Plum sidebar (224px, 24px radius, inset from the window edge) with the SE Health logo on a Page-coloured footer card.
- Content column, top to bottom: the synthetic-data banner, the presenter bar, a Display greeting, a row of tinted stat cards, then panels.
- Stat cards run 4 across at 1280px and wider, 2 at 768px, 1 below.
- Below 1024px the sidebar becomes a top bar with the logo and a "Menu" pill.
- The caregiver survey is phone-first: one column, max 36rem, one question per fieldset, answer targets at least 48px tall.
- No horizontal page scroll at 320px; wide tables scroll inside their own box.

## 8. Components

| Component | Spec |
| --- | --- |
| Hero button | SE Red pill, White Label text, 44px tall. One per view: the action the screen exists for. Hover: SE Red Deep. |
| Default button | Plum pill, White text. For every other filled button. |
| Secondary button | Page fill, 1px Plum outline, Plum text. |
| Icon button | 44px Plum circle, White outline icon, always an `aria-label`. |
| Disabled | Card fill, Text Grey, with the reason written nearby. |
| Card | 24px radius, one tone, no border or shadow, 24px padding, one idea. |
| Stat card | Icon chip + Label, then the Display number, then an optional Body hint. The number is the biggest thing on the card. |
| Number tile | 44px Teal tile, 12px radius, White Headline numeral. For ordered steps. |
| Data pill | Tinted fill, Plum Label text, optional 12px icon, always a word. |
| Section tag | Dashed Logo Grey pill, Plum Label text. Replaces eyebrow kickers. |
| Input | White, 1px Logo Grey border, 12px radius, 48px tall, visible label above. Error: SE Red Deep message with an icon and a plain-language fix; the value stays. |
| Slider | Plum thumb and fill on a Card track, value as Label beside it, the assumption's source as Body below. |
| Sidebar nav | 44px items, outline icon + Label, White. Active: Sidebar-active wash, a 3px White marker and `aria-current="page"`. |
| Tabs | Pill triggers; active is Plum with White text. |
| Privacy value | "<5" with a lock icon, on Teal tint, focusable, tooltip "Hidden to protect privacy: fewer than 5 people." |

## 9. Charts and data

- **Bars:** Plum, rounded tops, on a Card or tint well. The current week is SE Red; future weeks are dashed outlines.
- **Lines:** one Plum line per chart, no fill, a dot and dashed SE Red marker on the current point. Compare measures with small multiples, not several lines on one chart.
- **Series:** SE Red, Teal Deep, Plum and Text Grey for household, companionship, personal care and other.
- **Donuts:** thick rounded segments with a Display number in the center.
- **Progress:** tinted or Teal fill on a Card track, percentage large to the right.
- Every chart has a text alternative ("View as table") and axis ticks of 12px or more.
- Projections are labelled "Projection, not a prediction" and show an 80% band.

## 10. Voice and writing

Breather speaks in SE Health's brand voice.

| Voice | Sounds like |
| --- | --- |
| Fiercely Compassionate | Caring, empowering, relentless |
| Delivering Hope | Optimistic, confident, aspiring |
| Bold Visionaries | Progressive, innovative, courageous |
| Collaborative Allies | Invitational, catalytic, trustworthy |
| Confident Experts | Knowledgeable, insightful, reliable |

Employer screens lean on **Collaborative Ally** and **Confident Expert**. Caregiver screens lean on **Fiercely Compassionate** and **Delivering Hope**.

**Writing rules**

- Plain language. Short sentences. One idea per sentence.
- Honest about what the pilot is and isn't. Label every assumption and every estimate.
- Never make caregivers prove their burden. Many people don't call themselves caregivers; say "help someone with daily living".
- Every external figure keeps its source and year. National and Ontario figures are not interchangeable.
- AI wording: Jev (AI) recommends, the rules table checks it and takes over if it fails, and the screen always says which one answered.
- Never claim live integrations, real enrolment, sent email, ROI or causal results ("respite saves you $X").

| Write | Not |
| --- | --- |
| "Fewer than 5 people, so this is hidden." | "Insufficient data." |
| "Available at pilot end. You're at week 6 of 13." | "Locked." |
| "Breather recommends Scale. You decide." | "The AI has decided to scale." |
| "Do you help someone with daily living?" | "Are you a caregiver?" |

## 11. Privacy, made visible

- Data flows one way: caregivers → SE Health → the employer, as totals.
- Any value from fewer than 5 people shows as "<5" with a lock icon. If any part of a total is hidden, the total is hidden too.
- No department, team or location breakdowns anywhere.
- Every page shows a "Synthetic data" banner while the data is synthetic.

## 12. Accessibility and states

**WCAG 2.1 AA minimum** (2.2 AA where it costs little).

- Visible focus on every control: 2px Plum outline, 4px offset (White inside the Plum sidebar).
- Every interactive target is at least 44 × 44px.
- Every control has an accessible name; sliders forward their name to the thumb.
- Status is never shown by colour alone.
- Charts have a text alternative. Motion respects reduced-motion settings.

**Every screen ships five states**, in plain language with a next step:

| State | Pattern |
| --- | --- |
| Empty | A Card with a shape, a Title saying what will appear, a Body line saying when, one next step |
| Loading | Card-coloured skeletons in the final layout; no spinner for under 1 second |
| Locked | Lock icon chip, "Available at pilot end", the current week and a progress bar |
| Error | What happened, what to do, a retry or back action. Fallbacks are labelled ("Rules engine") |
| "<5" | The privacy value above |

Simulated actions get a review step, then a confirmation that says plainly what was and wasn't sent.

## 13. Employer co-brand

Each employer's homepage inside Breather is built from this package plus the employer's own theme file. SE Health stays the brand; the employer is a guest.

**An employer may bring:** its name, a text wordmark, a greeting, and one accent colour with a light tint.

**The accent may appear only** in the co-brand strip at the top of the employer's homepage and as the small mark beside the employer's name. It never colours buttons, data, charts or status.

**Guardrails (checked by `checkEmployerTheme`)**

- White text on the accent reaches 4.5:1.
- The accent itself reaches 4.5:1 on the page.
- Plum text on the accent tint reaches 4.5:1.
- The accent is not red, so SE Red stays the only hero.

**Demo employer: Northwind Logistics (fictional).** 100 staff, 12 places, 2-week enrolment window. Accent Northwind Navy #1D4E89 with White text (8.4:1); tint #E3EBF4; greeting "Good morning, Northwind". Northwind is invented for the demo; never present it as a real company.

## 14. Anti-pattern checklist

Check every screen before it ships. Each of these makes a product look carelessly AI-made.

- [ ] More than one hero colour, or two red things competing
- [ ] More than five type styles, or any size below 12px
- [ ] All-caps text or letter-spaced eyebrow kickers
- [ ] Tiny subtitles with a dot beside them
- [ ] Thin weights (below 400) or Calibri Light
- [ ] Light grey text on white, or grey text on a tint
- [ ] Rounded and square controls mixed
- [ ] Outline and filled icons mixed
- [ ] Shadows or gradients
- [ ] Photos, stock or AI illustrations
- [ ] Status shown by colour alone
- [ ] Missing focus states, alt text or accessible names
- [ ] A screen with no empty, loading, locked, error or "<5" state

## 15. Using the package

```bash
npm install ./breather-brand-1.0.0.tgz
```

**CSS only**

```css
@import "@breather/brand/css/tokens.css";
@import "@breather/brand/css/breather.css";
@import "@breather/brand/themes/northwind.css"; /* optional employer layer */
```

**Tailwind v4** (adds `bg-se-red`, `text-plum`, `bg-teal-tint`, `rounded-xl`, `font-sans` and removes shadows)

```css
@import "tailwindcss";
@import "@breather/brand/css/tailwind.css";
```

**An existing app.** `css/aliases.css` maps shadcn/ui variables and the team repo's `app/breather.css` variables onto the brand. Add `class="br-root"` (or `data-employer="northwind"`) to the part of the page you want rebranded.

**React**

```jsx
import "@breather/brand/css/tokens.css";
import "@breather/brand/css/breather.css";
import { EmployerFrame, PageTitle, StatCard, Button, PrivacyValue } from "@breather/brand/react";

<EmployerFrame employer="northwind">
  <PageTitle kicker="Week 6 of 13">Good morning, Northwind</PageTitle>
  <StatCard tone="people" label="Potential caregivers" value={32} />
  <StatCard tone="info" label="Waitlisted" value={3} groupSize={3} /> {/* shows <5 */}
  <Button variant="hero">Submit to SE Health</Button>
</EmployerFrame>
```

**JavaScript tokens** (for Recharts and inline styles)

```js
import { tokens, suppress, meetsAA, checkEmployerTheme } from "@breather/brand";
<Bar fill={tokens.chart.bar} />;
```

**Adding an employer.** Copy `themes/northwind.json`, change it, run `npm run build` and `npm test`. The test refuses a theme that breaks the guardrails.
