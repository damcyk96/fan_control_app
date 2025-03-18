// src/features/fan-management/FanManagement.ts
import { FanQueries } from "./db/queries";
import type { Fan, NewFan } from "./db/schema";
import type { Database } from "../../shared/db/connection";
import { logger } from "../../shared/utils/logger";

export type Result<T> = {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
};

export class FanManagement {
  private queries: FanQueries;

  constructor(db: Database) {
    this.queries = new FanQueries(db);
  }

  async getAllFans(): Promise<Result<Fan[]>> {
    try {
      const result = await this.queries.getAllFans();
      return { success: true, data: result };
    } catch (error) {
      logger.error({ error }, "Error getting all fans");
      return { success: false, error: "Failed to get fans", status: 500 };
    }
  }

  async getFanById(id: string): Promise<Result<Fan>> {
    try {
      const result = await this.queries.getFanById(id);

      if (result.length === 0) {
        return { success: false, error: "Fan not found", status: 404 };
      }

      return { success: true, data: result[0] };
    } catch (error) {
      logger.error({ error, id }, "Error getting fan by ID");
      return { success: false, error: "Failed to get fan", status: 500 };
    }
  }

  async createFan(fanData: NewFan): Promise<Result<Fan>> {
    try {
      if (!fanData.name) {
        return { success: false, error: "Name is required", status: 400 };
      }

      const result = await this.queries.createFan(fanData);
      return { success: true, data: result[0], status: 201 };
    } catch (error) {
      logger.error({ error }, "Error creating fan");
      return { success: false, error: "Failed to create fan", status: 500 };
    }
  }

  async updateFan(
    id: string,
    updateData: Partial<NewFan>
  ): Promise<Result<Fan>> {
    try {
      const currentFan = await this.queries.getFanById(id);

      if (currentFan.length === 0) {
        return { success: false, error: "Fan not found", status: 404 };
      }

      updateData.updatedAt = new Date();

      const result = await this.queries.updateFan(id, updateData);

      // Log changes to history if necessary
      if (
        updateData.isActive !== undefined &&
        updateData.isActive !== currentFan[0].isActive
      ) {
        await this.queries.logFanHistory({
          fanId: id,
          action: updateData.isActive ? "turned_on" : "turned_off",
          oldValue: String(currentFan[0].isActive),
          newValue: String(updateData.isActive),
        });
      }

      if (
        updateData.speed !== undefined &&
        updateData.speed !== currentFan[0].speed
      ) {
        await this.queries.logFanHistory({
          fanId: id,
          action: "speed_changed",
          oldValue: String(currentFan[0].speed),
          newValue: String(updateData.speed),
        });
      }

      return { success: true, data: result[0] };
    } catch (error) {
      logger.error({ error, id }, "Error updating fan");
      return { success: false, error: "Failed to update fan", status: 500 };
    }
  }

  async deleteFan(id: string): Promise<Result<Fan>> {
    try {
      const result = await this.queries.deleteFan(id);

      if (result.length === 0) {
        return { success: false, error: "Fan not found", status: 404 };
      }

      return { success: true, data: result[0] };
    } catch (error) {
      logger.error({ error, id }, "Error deleting fan");
      return { success: false, error: "Failed to delete fan", status: 500 };
    }
  }

  async toggleFanState(id: string): Promise<Result<Fan>> {
    try {
      const currentFan = await this.queries.getFanById(id);

      if (currentFan.length === 0) {
        return { success: false, error: "Fan not found", status: 404 };
      }

      const newState = !currentFan[0].isActive;

      const result = await this.queries.updateFan(id, {
        isActive: newState,
        updatedAt: new Date(),
      });

      await this.queries.logFanHistory({
        fanId: id,
        action: newState ? "turned_on" : "turned_off",
        oldValue: String(currentFan[0].isActive),
        newValue: String(newState),
      });

      return { success: true, data: result[0] };
    } catch (error) {
      logger.error({ error, id }, "Error toggling fan state");
      return {
        success: false,
        error: "Failed to toggle fan state",
        status: 500,
      };
    }
  }

  async setFanSpeed(id: string, speed: number): Promise<Result<Fan>> {
    try {
      if (typeof speed !== "number" || speed < 0) {
        return {
          success: false,
          error: "Valid speed is required",
          status: 400,
        };
      }

      const currentFan = await this.queries.getFanById(id);

      if (currentFan.length === 0) {
        return { success: false, error: "Fan not found", status: 404 };
      }

      const result = await this.queries.updateFan(id, {
        speed,
        updatedAt: new Date(),
      });

      await this.queries.logFanHistory({
        fanId: id,
        action: "speed_changed",
        oldValue: String(currentFan[0].speed),
        newValue: String(speed),
      });

      return { success: true, data: result[0] };
    } catch (error) {
      logger.error({ error, id }, "Error setting fan speed");
      return { success: false, error: "Failed to set fan speed", status: 500 };
    }
  }
}

// Create singleton instance with database connection
let fanManagementInstance: FanManagement | null = null;

export async function getFanManagement(db: Database): Promise<FanManagement> {
  if (!fanManagementInstance) {
    fanManagementInstance = new FanManagement(db);
  }
  return fanManagementInstance;
}
