// src/features/fan-management/api.ts
import { logger } from "../../shared/utils/logger";
import { fanManagement } from "./FanManagement";
import { NewFan } from "./db/schema";

export class FanApi {
  private jsonResponse(data: any, status: number = 200) {
    return Response.json(data, { status });
  }

  async getAllFans(req: Request): Promise<Response> {
    logger.info("Request received: GET /api/fans");
    const result = await fanManagement.getAllFans();
    return this.jsonResponse(
      { success: result.success, data: result.data, error: result.error },
      result.status || 200
    );
  }

  async getFanById(req: Request, id: string): Promise<Response> {
    logger.info(`Request received: GET /api/fans/${id}`);
    if (!id) {
      return this.jsonResponse(
        { success: false, error: "Invalid fan ID" },
        400
      );
    }

    const result = await fanManagement.getFanById(id);
    return this.jsonResponse(
      { success: result.success, data: result.data, error: result.error },
      result.status || 200
    );
  }

  async createFan(req: Request): Promise<Response> {
    try {
      const body = await req.json();

      if (!body.name) {
        return this.jsonResponse(
          { success: false, error: "Name is required" },
          400
        );
      }

      const newFan: NewFan = {
        name: body.name,
        location: body.location,
        isActive: body.isActive ?? false,
        speed: body.speed ?? 0,
        temperatureThreshold: body.temperatureThreshold ?? 25,
      };

      const result = await fanManagement.createFan(newFan);
      return this.jsonResponse(
        { success: result.success, data: result.data, error: result.error },
        result.status || 201
      );
    } catch (error) {
      return this.jsonResponse(
        { success: false, error: "Invalid request body" },
        400
      );
    }
  }

  async updateFan(req: Request, id: string): Promise<Response> {
    if (!id) {
      return this.jsonResponse(
        { success: false, error: "Invalid fan ID" },
        400
      );
    }

    try {
      const body = await req.json();
      const updateData: Partial<NewFan> = {};

      if (body.name !== undefined) updateData.name = body.name;
      if (body.location !== undefined) updateData.location = body.location;
      if (body.isActive !== undefined) updateData.isActive = body.isActive;
      if (body.speed !== undefined) updateData.speed = body.speed;
      if (body.temperatureThreshold !== undefined)
        updateData.temperatureThreshold = body.temperatureThreshold;

      const result = await fanManagement.updateFan(id, updateData);
      return this.jsonResponse(
        { success: result.success, data: result.data, error: result.error },
        result.status || 200
      );
    } catch (error) {
      return this.jsonResponse(
        { success: false, error: "Invalid request body" },
        400
      );
    }
  }

  async deleteFan(req: Request, id: string): Promise<Response> {
    logger.info(`Request received: DELETE /api/fans/${id}`);
    if (!id) {
      return this.jsonResponse(
        { success: false, error: "Invalid fan ID" },
        400
      );
    }

    const result = await fanManagement.deleteFan(id);
    return this.jsonResponse(
      { success: result.success, data: result.data, error: result.error },
      result.status || 200
    );
  }

  async toggleFanState(req: Request, id: string): Promise<Response> {
    if (!id) {
      return this.jsonResponse(
        { success: false, error: "Invalid fan ID" },
        400
      );
    }

    const result = await fanManagement.toggleFanState(id);
    return this.jsonResponse(
      { success: result.success, data: result.data, error: result.error },
      result.status || 200
    );
  }

  async setFanSpeed(req: Request, id: string): Promise<Response> {
    if (!id) {
      return this.jsonResponse(
        { success: false, error: "Invalid fan ID" },
        400
      );
    }

    try {
      const body = await req.json();
      const result = await fanManagement.setFanSpeed(id, body.speed);
      return this.jsonResponse(
        { success: result.success, data: result.data, error: result.error },
        result.status || 200
      );
    } catch (error) {
      return this.jsonResponse(
        { success: false, error: "Invalid request body" },
        400
      );
    }
  }
}

export const fanApi = new FanApi();
