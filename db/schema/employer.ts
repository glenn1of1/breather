// Mirrors db/migrations/0000_schemas_roles.sql. The SQL file is the source of truth.
import { pgSchema, text, integer, jsonb, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";

export const employer = pgSchema("employer");

export const employers = employer.table("employers", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  surveyToken: text("survey_token").notNull().unique(),
  name: text("name").notNull(),
  headcount: integer("headcount").notNull(),
  config: jsonb("config").notNull(),
});

export const weeklySnapshot = employer.table("weekly_snapshot", {
  employerId: text("employer_id").notNull(),
  week: integer("week").notNull(),
  payload: jsonb("payload").notNull(),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.employerId, t.week] })]);

export const themes = employer.table("themes", {
  employerId: text("employer_id").notNull(),
  theme: text("theme").notNull(),
  participantCount: integer("participant_count").notNull(),
  quotes: jsonb("quotes").notNull(),
}, (t) => [primaryKey({ columns: [t.employerId, t.theme] })]);

export const piiCache = employer.table("pii_cache", {
  quoteHash: text("quote_hash").primaryKey(),
  containsPii: boolean("contains_pii").notNull(),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verdictCache = employer.table("verdict_cache", {
  employerId: text("employer_id").notNull(),
  scenario: text("scenario").notNull(),
  inputsHash: text("inputs_hash").notNull(),
  result: jsonb("result").notNull(),
}, (t) => [primaryKey({ columns: [t.employerId, t.scenario, t.inputsHash] })]);
