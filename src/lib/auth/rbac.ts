// RBAC minim (task 1.1). Logică pură, testabilă, fără dependențe de request —
// consumată de guard-urile din session.ts. Roluri ierarhice: admin ⊃ user.

export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

const ROLE_RANK: Record<Role, number> = { user: 1, admin: 2 };

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** true dacă `userRole` satisface cel puțin nivelul `required`. */
export function hasRole(userRole: string, required: Role): boolean {
  const have = isRole(userRole) ? ROLE_RANK[userRole] : 0;
  return have >= ROLE_RANK[required];
}
