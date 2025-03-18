// src/features/fan-management/__tests__/FanManagement.test.ts
import { expect, test, describe, beforeEach } from "bun:test";
import { FanManagement } from "../FanManagement";
import type { Fan } from "../db/schema";
import type { Database } from "../../../shared/db/connection";

// Mock data
const mockFan: Fan = {
  id: "1",
  name: "Test Fan",
  location: "Test Location",
  isActive: false,
  speed: 0,
  temperatureThreshold: 25,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockFans = [
  mockFan,
  {
    ...mockFan,
    id: "2",
    name: "Test Fan 2",
  },
];

// Mock FanQueries class
class MockFanQueries {
  async getAllFans() {
    return mockFans;
  }

  async getFanById(id: string) {
    return id === "1" ? [mockFan] : [];
  }

  async createFan(fan: any) {
    return [{ ...mockFan, ...fan }];
  }

  async updateFan(id: string, data: any) {
    return [{ ...mockFan, ...data }];
  }

  async deleteFan(id: string) {
    return id === "1" ? [mockFan] : [];
  }

  async logFanHistory() {
    return true;
  }
}

// Mock database
const mockDb = {} as Database;

describe("FanManagement", () => {
  let fanManagement: FanManagement;

  beforeEach(() => {
    // Create new instance before each test
    fanManagement = new FanManagement(mockDb);
    // Replace the queries instance with our mock
    (fanManagement as any).queries = new MockFanQueries();
  });

  describe("getAllFans", () => {
    test("should return all fans successfully", async () => {
      const result = await fanManagement.getAllFans();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockFans);
    });

    test("should handle errors", async () => {
      // Override the mock for this specific test
      (fanManagement as any).queries.getAllFans = async () => {
        throw new Error("Database error");
      };

      const result = await fanManagement.getAllFans();
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to get fans");
      expect(result.status).toBe(500);
    });
  });

  describe("getFanById", () => {
    test("should return fan by id successfully", async () => {
      const result = await fanManagement.getFanById("1");
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockFan);
    });

    test("should return error for non-existent fan", async () => {
      const result = await fanManagement.getFanById("999");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Fan not found");
      expect(result.status).toBe(404);
    });
  });

  describe("createFan", () => {
    test("should create fan successfully", async () => {
      const newFan = {
        name: "New Fan",
        location: "New Location",
        isActive: false,
        speed: 0,
        temperatureThreshold: 25,
      };

      const result = await fanManagement.createFan(newFan);
      expect(result.success).toBe(true);
      expect(result.status).toBe(201);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe("New Fan");
    });

    test("should validate required fields", async () => {
      const result = await fanManagement.createFan({} as any);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Name is required");
      expect(result.status).toBe(400);
    });
  });

  describe("updateFan", () => {
    test("should update fan successfully", async () => {
      const updateData = {
        name: "Updated Fan",
        speed: 2,
      };

      const result = await fanManagement.updateFan("1", updateData);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe("Updated Fan");
    });

    test("should handle non-existent fan", async () => {
      const result = await fanManagement.updateFan("999", { name: "Test" });
      expect(result.success).toBe(false);
      expect(result.error).toBe("Fan not found");
      expect(result.status).toBe(404);
    });
  });

  describe("deleteFan", () => {
    test("should delete fan successfully", async () => {
      const result = await fanManagement.deleteFan("1");
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test("should handle non-existent fan", async () => {
      const result = await fanManagement.deleteFan("999");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Fan not found");
      expect(result.status).toBe(404);
    });
  });

  describe("toggleFanState", () => {
    test("should toggle fan state successfully", async () => {
      const result = await fanManagement.toggleFanState("1");
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test("should handle non-existent fan", async () => {
      const result = await fanManagement.toggleFanState("999");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Fan not found");
      expect(result.status).toBe(404);
    });
  });

  describe("setFanSpeed", () => {
    test("should set fan speed successfully", async () => {
      const result = await fanManagement.setFanSpeed("1", 3);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test("should validate speed value", async () => {
      const result = await fanManagement.setFanSpeed("1", -1);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Valid speed is required");
      expect(result.status).toBe(400);
    });

    test("should handle non-existent fan", async () => {
      const result = await fanManagement.setFanSpeed("999", 2);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Fan not found");
      expect(result.status).toBe(404);
    });
  });
});
