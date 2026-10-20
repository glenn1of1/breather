// HR-5 + AI-2: code data/transcripts.json into data/themes.json (run once, offline; commit the output).
//   npm run themes            → live Jev if TYPESAFE_API_KEY is set, otherwise the keyword mock
//   npm run themes -- mock    → force the mock
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { choice, noul, TypeSafeClient } from "@typesafe-ai/sdk";
import { codeThemes, mockCoder, THEMES, type Excerpt, type ThemeCoder, type ThemeKey } from "../lib/themes/code";

const ROOT = join(__dirname, "..");
const BATCH = 8;
const TIMEOUT_MS = 15_000;

function jevCoder(): ThemeCoder {
  const client = new TypeSafeClient();
  const criteria = Object.fromEntries(Object.entries(THEMES).map(([k, label]) => [k, label])) as Record<ThemeKey, string>;
  return {
    name: "jev",
    async classify(texts) {
      const out: ThemeKey[] = [];
      for (let i = 0; i < texts.length; i += BATCH) {
        const batch = texts.slice(i, i + BATCH);
        const questions = Object.fromEntries(batch.map((_, j) => [`e${j}`, choice(`Which theme best fits excerpt e${j}?`, criteria)]));
        const { answers } = await client.systemOne(
          { state: { excerpts: Object.fromEntries(batch.map((t, j) => [`e${j}`, t])) }, questions },
          { signal: AbortSignal.timeout(TIMEOUT_MS), retry: { maxRetries: 1 } },
        );
        batch.forEach((_, j) => out.push((answers[`e${j}`] as { choice: ThemeKey }).choice));
      }
      return out;
    },
    async containsPII(texts) {
      if (!texts.length) return [];
      const questions = Object.fromEntries(
        texts.map((_, i) => [`q${i}`, noul(`Does quote q${i} contain a name, contact detail, job title, team, place or anything else that could identify a person?`)]),
      );
      const { answers } = await client.systemOne(
        { state: { quotes: Object.fromEntries(texts.map((t, i) => [`q${i}`, t])) }, questions },
        { signal: AbortSignal.timeout(TIMEOUT_MS), retry: { maxRetries: 1 } },
      );
      return texts.map((_, i) => (answers[`q${i}`] as { noul: number }).noul);
    },
  };
}

async function main() {
  const raw = JSON.parse(readFileSync(join(ROOT, "data", "transcripts.json"), "utf8")) as { sessions: { excerpts: Excerpt[] }[] };
  const excerpts = raw.sessions.flatMap((s) => s.excerpts.map(({ speaker, text }) => ({ speaker, text })));
  const coder = process.argv[2] !== "mock" && process.env.TYPESAFE_API_KEY ? jevCoder() : mockCoder;
  const themes = await codeThemes(excerpts, coder);
  writeFileSync(join(ROOT, "data", "themes.json"), JSON.stringify({ codedBy: coder.name, themes }, null, 2) + "\n");
  console.log(`coded ${excerpts.length} excerpts with ${coder.name}: ${themes.length} themes kept (>= 5 people)`);
  for (const t of themes) console.log(`  ${t.participantCount} people  ${t.theme}  (${t.quotes.length} quotes)`);
}
main().catch((e) => { console.error((e as Error).message); process.exitCode = 1; });
