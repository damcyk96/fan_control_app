import { describe, test, expect } from "bun:test";
import { createTestServer } from "../index";

describe("Server", () => {
  test("initializes with test config", async () => {
    const testEnv = {
      PORT: "4000",
      DATABASE_URL: "postgresql://test:test@localhost:5432/testdb",
    };

    const { config } = await createTestServer(testEnv);
    expect(config.PORT).toBe(4000);
  });
});
