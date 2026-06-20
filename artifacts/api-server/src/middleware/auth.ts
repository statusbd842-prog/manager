/**
 * Extracts the teacher/user ID from a Supabase JWT Bearer token.
 * Decodes the JWT payload (base64url) to read the `sub` claim.
 * Falls back to "default-teacher" when no valid token is present.
 */
export function extractTeacherId(authHeader?: string): string {
  if (!authHeader?.startsWith("Bearer ")) return "default-teacher";
  const token = authHeader.slice(7);
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return "default-teacher";
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    ) as Record<string, unknown>;
    const sub = payload["sub"];
    return typeof sub === "string" && sub.length > 0 ? sub : "default-teacher";
  } catch {
    return "default-teacher";
  }
}
