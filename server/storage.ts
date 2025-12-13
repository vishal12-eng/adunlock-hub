import { db } from "./db";
import { contents, userSessions, siteSettings, adminUsers } from "@shared/schema";
import type { Content, InsertContent, UserSession, InsertUserSession, SiteSetting, InsertSiteSetting, AdminUser, InsertAdminUser } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

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
    const [content] = await db.insert(contents).values(data).returning();
    return content;
  }

  async updateContent(id: string, data: Partial<InsertContent>): Promise<Content | undefined> {
    const [content] = await db
      .update(contents)
      .set({ ...data, updated_at: new Date() })
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
    const [session] = await db.insert(userSessions).values(data).returning();
    return session;
  }

  async updateSession(id: string, data: Partial<InsertUserSession>): Promise<UserSession | undefined> {
    const [session] = await db
      .update(userSessions)
      .set({ ...data, updated_at: new Date() })
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
      const [setting] = await db.insert(siteSettings).values({ key, value }).returning();
      return setting;
    }
  }

  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return admin;
  }

  async createAdmin(data: InsertAdminUser): Promise<AdminUser> {
    const [admin] = await db.insert(adminUsers).values(data).returning();
    return admin;
  }
}

export const storage = new DatabaseStorage();
