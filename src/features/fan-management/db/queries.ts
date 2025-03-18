// src/features/fan-management/db/queries.ts
import { eq } from "drizzle-orm";
import { Database } from "../../../shared/db/connection";
import { fans, fanHistory, type NewFan, type NewFanHistory } from "./schema";

export class FanQueries {
  constructor(private db: Database) {}

  async getAllFans() {
    return this.db.select().from(fans);
  }

  async getFanById(id: string) {
    return this.db.select().from(fans).where(eq(fans.id, id));
  }

  async createFan(fan: NewFan) {
    return this.db.insert(fans).values(fan).returning();
  }

  async updateFan(id: string, data: Partial<NewFan>) {
    return this.db.update(fans).set(data).where(eq(fans.id, id)).returning();
  }

  async deleteFan(id: string) {
    return this.db.delete(fans).where(eq(fans.id, id)).returning();
  }

  async logFanHistory(history: NewFanHistory) {
    return this.db.insert(fanHistory).values(history);
  }
}
