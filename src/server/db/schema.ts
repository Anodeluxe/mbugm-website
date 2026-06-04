import { pgTable, serial, text, integer } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  dayLabel: text("day_label").notNull(),
  sessionNo: integer("session_no").notNull(),
  quota: integer("quota").notNull(),
});