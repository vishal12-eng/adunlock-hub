import { pgTable, text, integer, boolean, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
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

export const adAttempts = pgTable("ad_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").unique().notNull(),
  session_id: text("session_id").notNull(),
  content_id: uuid("content_id").references(() => contents.id, { onDelete: "cascade" }).notNull(),
  user_session_id: uuid("user_session_id").references(() => userSessions.id, { onDelete: "cascade" }).notNull(),
  smartlink_id: uuid("smartlink_id"),
  started_at: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  used: boolean("used").notNull().default(false),
  completed_at: timestamp("completed_at", { withTimezone: true }),
});

export const smartlinks = pgTable("smartlinks", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  name: text("name"),
  weight: integer("weight").notNull().default(1),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullish(),
  thumbnail_url: z.string().nullish(),
  file_url: z.string().nullish(),
  redirect_url: z.string().nullish(),
  required_ads: z.number().int().min(1).default(3),
  status: z.string().default("active"),
});

export const insertUserSessionSchema = z.object({
  session_id: z.string().min(1, "Session ID is required"),
  content_id: z.string().uuid("Content ID must be a valid UUID"),
  ads_required: z.number().int().min(0),
  ads_watched: z.number().int().min(0).default(0),
  completed: z.boolean().default(false),
});

export const insertSiteSettingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().nullish(),
});

export const insertAdminUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  password_hash: z.string().min(1, "Password hash is required"),
});

export const insertUserRoleSchema = z.object({
  user_id: z.string().uuid("User ID must be a valid UUID"),
  role: z.enum(["admin", "editor"]).default("editor"),
});

export const insertSmartlinkSchema = z.object({
  url: z.string().url("Valid URL is required"),
  name: z.string().nullish(),
  weight: z.number().int().min(1).default(1),
  is_active: z.boolean().default(true),
});

export type Content = typeof contents.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;

export type AdAttempt = typeof adAttempts.$inferSelect;

export type Smartlink = typeof smartlinks.$inferSelect;
export type InsertSmartlink = z.infer<typeof insertSmartlinkSchema>;
