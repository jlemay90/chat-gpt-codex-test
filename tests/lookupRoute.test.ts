import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../server/app";

describe("POST /api/lookup", () => {
  it("returns a lead intel result in mock mode", async () => {
    const app = createApp({ mockMode: true });
    const response = await request(app)
      .post("/api/lookup")
      .send({ address: "123 Main St, Nashville, TN 37211" });

    expect(response.status).toBe(200);
    expect(response.body.leadScore.score).toBeDefined();
    expect(response.body.sources.length).toBeGreaterThan(0);
  });
});
