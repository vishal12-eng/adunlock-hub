import { db } from "./db.js";
import { contents, userSessions, siteSettings, adminUsers, userRoles, adAttempts, smartlinks } from "../shared/schema.js";
import type { Content, InsertContent, UserSession, InsertUserSession, SiteSetting, AdminUser, InsertAdminUser, UserRole, AdAttempt, Smartlink, InsertSmartlink } from "../shared/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IStorage {
  getActiveContents(): Promise<Content[]>;
  getAllContents(): Promise<Content[]>;
  getContentById(id: string): Promise<Content | undefined>;
  createContent(data: InsertContent): Promise<Content>;
  updateContent(id: string, data: Partial<InsertContent>): Promise<Content | undefined>;
  deleteContent(id: string): Promise<boolean>;
  incrementContentViews(id: string): Promise<void>;
  incrementContentUnlocks(id: string): Promise<void>;

  getSession(sessionId: string, contentId: string): Promise<UserSession | undefined>;
  createSession(data: InsertUserSession): Promise<UserSession>;
  updateSession(id: string, data: Partial<InsertUserSession>): Promise<UserSession | undefined>;

  getAllSettings(): Promise<SiteSetting[]>;
  getSetting(key: string): Promise<SiteSetting | undefined>;
  upsertSetting(key: string, value: string): Promise<SiteSetting>;

  getAdminByEmail(email: string): Promise<AdminUser | undefined>;
  createAdmin(data: InsertAdminUser): Promise<AdminUser>;
  getAdminRole(userId: string): Promise<UserRole | undefined>;
  seedDefaultAdmin(): Promise<void>;

  createAdAttempt(sessionId: string, contentId: string, userSessionId: string, smartlinkId?: string): Promise<AdAttempt>;
  getAdAttemptByToken(token: string): Promise<AdAttempt | undefined>;
  markAdAttemptUsed(token: string): Promise<AdAttempt | undefined>;
  getLastCompletedAdAttempt(sessionId: string, contentId: string): Promise<AdAttempt | undefined>;
  getRecentSmartlinkIds(sessionId: string, contentId: string, limit: number): Promise<string[]>;

  getAllSmartlinks(): Promise<Smartlink[]>;
  getActiveSmartlinks(): Promise<Smartlink[]>;
  getSmartlinkById(id: string): Promise<Smartlink | undefined>;
  createSmartlink(data: InsertSmartlink): Promise<Smartlink>;
  updateSmartlink(id: string, data: Partial<InsertSmartlink>): Promise<Smartlink | undefined>;
  deleteSmartlink(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getActiveContents(): Promise<Content[]> {
    return await db.select().from(contents).where(eq(contents.status, "active"));
  }

  async getAllContents(): Promise<Content[]> {
    return await db.select().from(contents);
  }

  async getContentById(id: string): Promise<Content | undefined> {
    const [content] = await db.select().from(contents).where(eq(contents.id, id));
    return content;
  }

  async createContent(data: InsertContent): Promise<Content> {
    const [content] = await db.insert(contents).values({
      title: data.title,
      description: data.description ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
      file_url: data.file_url ?? null,
      redirect_url: data.redirect_url ?? null,
      required_ads: data.required_ads ?? 3,
      status: data.status ?? "active",
    }).returning();
    return content;
  }

  async updateContent(id: string, data: Partial<InsertContent>): Promise<Content | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description ?? null;
    if (data.thumbnail_url !== undefined) updateData.thumbnail_url = data.thumbnail_url ?? null;
    if (data.file_url !== undefined) updateData.file_url = data.file_url ?? null;
    if (data.redirect_url !== undefined) updateData.redirect_url = data.redirect_url ?? null;
    if (data.required_ads !== undefined) updateData.required_ads = data.required_ads;
    if (data.status !== undefined) updateData.status = data.status;

    const [content] = await db
      .update(contents)
      .set(updateData)
      .where(eq(contents.id, id))
      .returning();
    return content;
  }

  async deleteContent(id: string): Promise<boolean> {
    const result = await db.delete(contents).where(eq(contents.id, id)).returning();
    return result.length > 0;
  }

  async incrementContentViews(id: string): Promise<void> {
    await db
      .update(contents)
      .set({ views: sql`${contents.views} + 1` })
      .where(eq(contents.id, id));
  }

  async incrementContentUnlocks(id: string): Promise<void> {
    await db
      .update(contents)
      .set({ unlocks: sql`${contents.unlocks} + 1` })
      .where(eq(contents.id, id));
  }

  async getSession(sessionId: string, contentId: string): Promise<UserSession | undefined> {
    const [session] = await db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.session_id, sessionId), eq(userSessions.content_id, contentId)));
    return session;
  }

  async createSession(data: InsertUserSession): Promise<UserSession> {
    const [session] = await db.insert(userSessions).values({
      session_id: data.session_id,
      content_id: data.content_id,
      ads_required: data.ads_required,
      ads_watched: data.ads_watched ?? 0,
      completed: data.completed ?? false,
    }).returning();
    return session;
  }

  async updateSession(id: string, data: Partial<InsertUserSession>): Promise<UserSession | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.ads_watched !== undefined) updateData.ads_watched = data.ads_watched;
    if (data.completed !== undefined) updateData.completed = data.completed;

    const [session] = await db
      .update(userSessions)
      .set(updateData)
      .where(eq(userSessions.id, id))
      .returning();
    return session;
  }

  async getAllSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings);
  }

  async getSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async upsertSetting(key: string, value: string): Promise<SiteSetting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [setting] = await db
        .update(siteSettings)
        .set({ value, updated_at: new Date() })
        .where(eq(siteSettings.key, key))
        .returning();
      return setting;
    } else {
      const [setting] = await db.insert(siteSettings).values({
        key: key,
        value: value,
      }).returning();
      return setting;
    }
  }

  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return admin;
  }

  async createAdmin(data: InsertAdminUser): Promise<AdminUser> {
    const [admin] = await db.insert(adminUsers).values({
      email: data.email,
      password_hash: data.password_hash,
    }).returning();
    return admin;
  }

  async getAdminRole(userId: string): Promise<UserRole | undefined> {
    const [role] = await db.select().from(userRoles).where(eq(userRoles.user_id, userId));
    return role;
  }

  async seedDefaultAdmin(): Promise<void> {
    const existingAdmin = await this.getAdminByEmail("adnexus64@gmail.com");
    if (!existingAdmin) {
      const password_hash = await bcrypt.hash("Adnexus@64", 10);
      const admin = await this.createAdmin({
        email: "adnexus64@gmail.com",
        password_hash,
      });
      await db.insert(userRoles).values({
        user_id: admin.id,
        role: "admin",
      });
      console.log("Default admin user seeded successfully");
    } else {
      const existingRole = await this.getAdminRole(existingAdmin.id);
      if (!existingRole) {
        await db.insert(userRoles).values({
          user_id: existingAdmin.id,
          role: "admin",
        });
        console.log("Admin role assigned to existing admin");
      }
    }
  }

  async createAdAttempt(sessionId: string, contentId: string, userSessionId: string, smartlinkId?: string): Promise<AdAttempt> {
    const token = `ad_${crypto.randomUUID()}`;
    const [attempt] = await db.insert(adAttempts).values({
      token,
      session_id: sessionId,
      content_id: contentId,
      user_session_id: userSessionId,
      smartlink_id: smartlinkId ?? null,
      started_at: new Date(),
      used: false,
    }).returning();
    return attempt;
  }

  async getAdAttemptByToken(token: string): Promise<AdAttempt | undefined> {
    const [attempt] = await db.select().from(adAttempts).where(eq(adAttempts.token, token));
    return attempt;
  }

  async markAdAttemptUsed(token: string): Promise<AdAttempt | undefined> {
    const [attempt] = await db
      .update(adAttempts)
      .set({ used: true, completed_at: new Date() })
      .where(eq(adAttempts.token, token))
      .returning();
    return attempt;
  }

  async getLastCompletedAdAttempt(sessionId: string, contentId: string): Promise<AdAttempt | undefined> {
    const [attempt] = await db
      .select()
      .from(adAttempts)
      .where(and(
        eq(adAttempts.session_id, sessionId),
        eq(adAttempts.content_id, contentId),
        eq(adAttempts.used, true)
      ))
      .orderBy(desc(adAttempts.completed_at))
      .limit(1);
    return attempt;
  }

  async getRecentSmartlinkIds(sessionId: string, contentId: string, limit: number): Promise<string[]> {
    const attempts = await db
      .select({ smartlink_id: adAttempts.smartlink_id })
      .from(adAttempts)
      .where(and(
        eq(adAttempts.session_id, sessionId),
        eq(adAttempts.content_id, contentId)
      ))
      .orderBy(desc(adAttempts.started_at))
      .limit(limit);
    return attempts.map(a => a.smartlink_id).filter((id): id is string => id !== null);
  }

  async getAllSmartlinks(): Promise<Smartlink[]> {
    return await db.select().from(smartlinks).orderBy(desc(smartlinks.created_at));
  }

  async getActiveSmartlinks(): Promise<Smartlink[]> {
    return await db.select().from(smartlinks).where(eq(smartlinks.is_active, true));
  }

  async getSmartlinkById(id: string): Promise<Smartlink | undefined> {
    const [link] = await db.select().from(smartlinks).where(eq(smartlinks.id, id));
    return link;
  }

  async createSmartlink(data: InsertSmartlink): Promise<Smartlink> {
    const [link] = await db.insert(smartlinks).values({
      url: data.url,
      name: data.name ?? null,
      weight: data.weight ?? 1,
      is_active: data.is_active ?? true,
    }).returning();
    return link;
  }

  async updateSmartlink(id: string, data: Partial<InsertSmartlink>): Promise<Smartlink | undefined> {
    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (data.url !== undefined) updateData.url = data.url;
    if (data.name !== undefined) updateData.name = data.name ?? null;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const [link] = await db
      .update(smartlinks)
      .set(updateData)
      .where(eq(smartlinks.id, id))
      .returning();
    return link;
  }

  async deleteSmartlink(id: string): Promise<boolean> {
    const result = await db.delete(smartlinks).where(eq(smartlinks.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
