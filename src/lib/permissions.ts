import { auth } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type Role = "OWNER" | "MANAGER" | "STAFF";

export const roleHierarchy: Record<Role, number> = {
  OWNER: 3,
  MANAGER: 2,
  STAFF: 1,
};

export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(minRole: Role) {
  const session = await requireAuth();
  const userRole = (session.user as any).role as Role;

  if (roleHierarchy[userRole] < roleHierarchy[minRole]) {
    redirect("/unauthorized");
  }
  return session;
}

export function hasPermission(userRole: Role, minRole: Role) {
  return roleHierarchy[userRole] >= roleHierarchy[minRole];
}
