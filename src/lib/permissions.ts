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

/**
 * Ensures the request is sandboxed to the correct store.
 * - STAFF/MANAGER: Always locked to their session.user.storeId.
 * - OWNER: Can optionally view other stores by providing a storeId query param.
 */
export async function getAuthorizedStoreId(req?: Request) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  
  const { role, storeId: userStoreId } = session.user as any;
  
  if (role === "OWNER" && req) {
    const url = new URL(req.url);
    const queryStoreId = url.searchParams.get("storeId");
    if (queryStoreId) return queryStoreId;
  }
  
  return userStoreId;
}
