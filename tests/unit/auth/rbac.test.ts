import { describe, expect, it } from "vitest";
import { hasRole, isRole } from "@/lib/auth/rbac";

describe("rbac", () => {
  it("admin satisface și user, și admin", () => {
    expect(hasRole("admin", "user")).toBe(true);
    expect(hasRole("admin", "admin")).toBe(true);
  });

  it("user satisface user, dar nu admin", () => {
    expect(hasRole("user", "user")).toBe(true);
    expect(hasRole("user", "admin")).toBe(false);
  });

  it("un rol necunoscut nu satisface nimic", () => {
    expect(hasRole("guest", "user")).toBe(false);
    expect(hasRole("", "user")).toBe(false);
  });

  it("isRole recunoaște doar rolurile definite", () => {
    expect(isRole("user")).toBe(true);
    expect(isRole("admin")).toBe(true);
    expect(isRole("root")).toBe(false);
  });
});
