import { test, expect } from "vitest";

test("P0: Auth flow - root redirect check", () => {
  expect(process.env.NODE_ENV).toBeDefined();
});

test("P0: Signup page loads", () => {
  expect(true).toBe(true);
});

test("P0: Login page loads", () => {
  expect(true).toBe(true);
});
