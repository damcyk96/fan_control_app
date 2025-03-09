import { Context } from "hono";
import { logger } from "../utils/logger";
import { db } from "../db";
import { fans, Fan, NewFan, fanHistory } from "../db/schema";
import { eq } from "drizzle-orm";

export const fanController = {
  // Get all fans
  async getAllFans(c: Context) {
    try {
      const result = await db.select().from(fans);
      return c.json({ success: true, data: result });
    } catch (error) {
      logger.error({ error }, "Error getting all fans");
      return c.json({ success: false, error: "Failed to get fans" }, 500);
    }
  },

  // Get fan by ID
  async getFanById(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ success: false, error: "Invalid fan ID" }, 400);
    }

    try {
      const result = await db.select().from(fans).where(eq(fans.id, id));

      if (result.length === 0) {
        return c.json({ success: false, error: "Fan not found" }, 404);
      }

      return c.json({ success: true, data: result[0] });
    } catch (error) {
      logger.error({ error, id }, "Error getting fan by ID");
      return c.json({ success: false, error: "Failed to get fan" }, 500);
    }
  },

  // Create a new fan
  async createFan(c: Context) {
    try {
      const body = await c.req.json();

      // Basic validation
      if (!body.name) {
        return c.json({ success: false, error: "Name is required" }, 400);
      }

      const newFan: NewFan = {
        name: body.name,
        location: body.location,
        isActive: body.isActive ?? false,
        speed: body.speed ?? 0,
        temperatureThreshold: body.temperatureThreshold ?? 25,
      };

      const result = await db.insert(fans).values(newFan).returning();

      return c.json({ success: true, data: result[0] }, 201);
    } catch (error) {
      logger.error({ error }, "Error creating fan");
      return c.json({ success: false, error: "Failed to create fan" }, 500);
    }
  },

  // Update a fan
  async updateFan(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ success: false, error: "Invalid fan ID" }, 400);
    }

    try {
      const body = await c.req.json();

      // Get current fan state before update
      const currentFan = await db.select().from(fans).where(eq(fans.id, id));

      if (currentFan.length === 0) {
        return c.json({ success: false, error: "Fan not found" }, 404);
      }

      // Prepare update data
      const updateData: Partial<NewFan> = {};

      if (body.name !== undefined) updateData.name = body.name;
      if (body.location !== undefined) updateData.location = body.location;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.speed !== undefined) updateData.speed = body.speed;
      if (body.temperatureThreshold !== undefined)
        updateData.temperatureThreshold = body.temperatureThreshold;

      // Update timestamp
      updateData.updatedAt = new Date();

      // Update fan
      const result = await db
        .update(fans)
        .set(updateData)
        .where(eq(fans.id, id))
        .returning();

      // Log changes to history if necessary
      if (
        body.isActive !== undefined &&
        body.isActive !== currentFan[0].isActive
      ) {
        await db.insert(fanHistory).values({
          fanId: id,
          action: body.isActive ? "turned_on" : "turned_off",
          oldValue: String(currentFan[0].isActive),
          newValue: String(body.isActive),
        });
      }

      if (body.speed !== undefined && body.speed !== currentFan[0].speed) {
        await db.insert(fanHistory).values({
          fanId: id,
          action: "speed_changed",
          oldValue: String(currentFan[0].speed),
          newValue: String(body.speed),
        });
      }

      return c.json({ success: true, data: result[0] });
    } catch (error) {
      logger.error({ error, id }, "Error updating fan");
      return c.json({ success: false, error: "Failed to update fan" }, 500);
    }
  },

  // Delete a fan
  async deleteFan(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ success: false, error: "Invalid fan ID" }, 400);
    }

    try {
      const result = await db.delete(fans).where(eq(fans.id, id)).returning();

      if (result.length === 0) {
        return c.json({ success: false, error: "Fan not found" }, 404);
      }

      return c.json({ success: true, data: result[0] });
    } catch (error) {
      logger.error({ error, id }, "Error deleting fan");
      return c.json({ success: false, error: "Failed to delete fan" }, 500);
    }
  },

  // Toggle fan state (on/off)
  async toggleFanState(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ success: false, error: "Invalid fan ID" }, 400);
    }

    try {
      // Get current fan state
      const currentFan = await db.select().from(fans).where(eq(fans.id, id));

      if (currentFan.length === 0) {
        return c.json({ success: false, error: "Fan not found" }, 404);
      }

      // Toggle the active state
      const newState = !currentFan[0].isActive;

      // Update fan
      const result = await db
        .update(fans)
        .set({
          isActive: newState,
          updatedAt: new Date(),
        })
        .where(eq(fans.id, id))
        .returning();

      // Log change to history
      await db.insert(fanHistory).values({
        fanId: id,
        action: newState ? "turned_on" : "turned_off",
        oldValue: String(currentFan[0].isActive),
        newValue: String(newState),
      });

      return c.json({ success: true, data: result[0] });
    } catch (error) {
      logger.error({ error, id }, "Error toggling fan state");
      return c.json(
        { success: false, error: "Failed to toggle fan state" },
        500
      );
    }
  },

  // Set fan speed
  async setFanSpeed(c: Context) {
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      return c.json({ success: false, error: "Invalid fan ID" }, 400);
    }

    try {
      const body = await c.req.json();

      if (
        body.speed === undefined ||
        typeof body.speed !== "number" ||
        body.speed < 0
      ) {
        return c.json(
          { success: false, error: "Valid speed is required" },
          400
        );
      }

      // Get current fan state
      const currentFan = await db.select().from(fans).where(eq(fans.id, id));

      if (currentFan.length === 0) {
        return c.json({ success: false, error: "Fan not found" }, 404);
      }

      // Update fan speed
      const result = await db
        .update(fans)
        .set({
          speed: body.speed,
          updatedAt: new Date(),
        })
        .where(eq(fans.id, id))
        .returning();

      // Log change to history
      await db.insert(fanHistory).values({
        fanId: id,
        action: "speed_changed",
        oldValue: String(currentFan[0].speed),
        newValue: String(body.speed),
      });

      return c.json({ success: true, data: result[0] });
    } catch (error) {
      logger.error({ error, id }, "Error setting fan speed");
      return c.json({ success: false, error: "Failed to set fan speed" }, 500);
    }
  },
};
