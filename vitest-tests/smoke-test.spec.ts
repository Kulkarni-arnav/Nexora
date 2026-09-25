import { test, expect } from "vitest";

test("P0: Basic verification", () => {
  expect(true).toBe(true);
});

test("P0: Config verification", () => {
  expect(typeof window).toBe("object");
});

test("P2: Framework verification", () => {
  expect(process.env.NODE_ENV).toBeDefined();
});
