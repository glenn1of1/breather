// Mirrors db/migrations/0000_schemas_roles.sql. Row-level data: SE Health side only.
import { pgSchema, text, integer, jsonb, timestamp, boolean, numeric, bigint, primaryKey } from "drizzle-orm/pg-core";

export const intake = pgSchema("intake");

export const claims = intake.table("claims", {
  claimNo: text("claim_no").primaryKey(),
  employerId: text("employer_id").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  pilotWeek: integer("pilot_week").notNull(),
  answers: jsonb("answers").notNull(),
  eligible: boolean("eligible").notNull(),
  cameClose: boolean("came_close").notNull(),
  priority: integer("priority"),
  statusSnapshot: text("status_snapshot").notNull(),
  contact: text("contact"),
});

export const checkins = intake.table("checkins", {
  claimNo: text("claim_no").notNull(),
  pilotWeek: integer("pilot_week").notNull(),
  q6: integer("q6"),
  q9: text("q9"),
  q10: integer("q10"),
  q11: integer("q11"),
}, (t) => [primaryKey({ columns: [t.claimNo, t.pilotWeek] })]);

export const usageEvents = intake.table("usage_events", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  claimNo: text("claim_no").notNull(),
  pilotWeek: integer("pilot_week").notNull(),
  hours: numeric("hours", { precision: 5, scale: 2 }).notNull(),
  serviceType: text("service_type").notNull(),
});

export const dropOuts = intake.table("drop_outs", {
  claimNo: text("claim_no").primaryKey(),
  pilotWeek: integer("pilot_week").notNull(),
});

export const transcripts = intake.table("transcripts", {
  id: text("id").primaryKey(),
  session: text("session").notNull(),
  text: text("text").notNull(),
});
