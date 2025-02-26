import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Role type
export const UserRole = {
  RICH: "rich",
  FRAUD: "fraud",
  GANG: "gang",
} as const;

// Create a type from the object values
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  ipAddress: text("ip_address"),
  bio: text("bio").default(""),
  avatarUrl: text("avatar_url"),
  role: text("role"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Update role schema
export const updateRoleSchema = z.object({
  role: z.enum([UserRole.RICH, UserRole.FRAUD, UserRole.GANG]).nullable(),
});

// Bio update schema
export const updateBioSchema = z.object({
  bio: z.string().max(500, "Bio must be 500 characters or less"),
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

// Comment schema
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  profileUserId: integer("profile_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  profileUserId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPaste = z.infer<typeof insertPasteSchema>;
export type Paste = typeof pastes.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type UpdateBio = z.infer<typeof updateBioSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;