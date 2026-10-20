-- PRD CFO-7 (SPI/CPI earned value). Actual hourly rate paid for each usage row.
-- Additive and idempotent: existing rows take the $50/h budget rate.
alter table intake.usage_events
  add column if not exists rate numeric(6,2) not null default 50 check (rate > 0);
