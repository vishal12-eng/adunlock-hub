import { pgTable, text, integer, boolean, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("user_role", ["admin", "editor"]);

export const contents = pgTable("contents", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  thumbnail_url: text("thumbnail_url"),
  file_url: text("file_url"),
  redirect_url: text("redirect_url"),
  required_ads: integer("required_ads").notNull().default(3),
  status: text("status").notNull().default("active"),
  views: integer("views").notNull().default(0),
  unlocks: integer("unlocks").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  session_id: text("session_id").notNull(),
  content_id: uuid("content_id").references(() => contents.id, { onDelete: "cascade" }).notNull(),
  ads_required: integer("ads_required").notNull(),
  ads_watched: integer("ads_watched").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").unique().notNull(),
  value: text("value"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminUsers = pgTable("admins", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  password_hash: text("password_hash").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => adminUsers.id, { onDelete: "cascade" }).notNull(),
  role: roleEnum("role").notNull().default("editor"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContentSchema = createInsertSchema(contents).omit({
  id: true,
  views: true,
  unlocks: true,
  created_at: true,
  updated_at: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  created_at: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  created_at: true,
});

export type Content = typeof contents.$inferSelect;
export type InsertContent = typeof contents.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;
