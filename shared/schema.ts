import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  ipAddress: text("ip_address"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Paste schema
export const pastes = pgTable("pastes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  isClown: boolean("is_clown").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPasteSchema = createInsertSchema(pastes).pick({
  title: true,
  content: true,
  isPrivate: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPaste = z.infer<typeof insertPasteSchema>;
export type Paste = typeof pastes.$inferSelect;
