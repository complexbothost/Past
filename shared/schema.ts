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

// Audit Log Action Types
export const AuditLogAction = {
  USER_CREATED: "user_created",
  USER_DELETED: "user_deleted",
  USER_UPDATED: "user_updated",
  PASTE_CREATED: "paste_created",
  PASTE_DELETED: "paste_deleted",
  PASTE_UPDATED: "paste_updated",
  COMMENT_CREATED: "comment_created",
  COMMENT_DELETED: "comment_deleted",
  IP_RESTRICTED: "ip_restricted",
  IP_UNRESTRICTED: "ip_unrestricted",
  ROLE_UPDATED: "role_updated",
  SUGGESTION_CREATED: "suggestion_created",
  SUGGESTION_RESPONDED: "suggestion_responded",
} as const;

// Create a type from the object values
export type AuditLogAction = (typeof AuditLogAction)[keyof typeof AuditLogAction];

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
  isAdminPaste: boolean("is_admin_paste").default(false).notNull(),
  isPinned: boolean("is_pinned").default(false),
  pinnedUntil: timestamp("pinned_until"),
  extraDetails: text("extra_details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPasteSchema = createInsertSchema(pastes).pick({
  title: true,
  content: true,
  isPrivate: true,
}).extend({
  isAdminPaste: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  extraDetails: z.string().optional(),
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

// Suggestion schema
export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected, implemented
  adminResponse: text("admin_response"),
  adminId: integer("admin_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSuggestionSchema = createInsertSchema(suggestions).pick({
  title: true,
  content: true,
});

export const updateSuggestionResponseSchema = z.object({
  adminResponse: z.string().min(1, "Response cannot be empty"),
  status: z.enum(["pending", "approved", "rejected", "implemented"]),
});

// Audit Log schema
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  userId: integer("user_id").notNull(),
  targetId: integer("target_id"),  // ID of the affected entity (user, paste, etc.)
  targetType: text("target_type"),  // Type of the affected entity (user, paste, etc.)
  details: text("details"),        // JSON string with additional details
  ipAddress: text("ip_address"),    // IP address of the user who performed the action
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  action: true,
  userId: true,
  targetId: true,
  targetType: true,
  details: true,
  ipAddress: true,
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
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type UpdateSuggestionResponse = z.infer<typeof updateSuggestionResponseSchema>;
export type Suggestion = typeof suggestions.$inferSelect;