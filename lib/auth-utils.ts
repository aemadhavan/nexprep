import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Check if the current user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;

  // Check if user has admin role in Clerk metadata
  return user.publicMetadata?.role === "admin";
}

/**
 * Require admin role for a route (server-side)
 * Redirects to home if not admin
 */
export async function requireAdmin() {
  const admin = await isAdmin();

  if (!admin) {
    redirect("/");
  }
}

/**
 * Get current user's Clerk ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Get current user's full details
 */
export async function getCurrentUser() {
  return await currentUser();
}
