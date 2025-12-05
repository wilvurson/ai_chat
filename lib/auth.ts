import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface UserPayload {
  id: string;
  email: string;
}

export function generateToken(user: UserPayload): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export async function getUserFromRequest(
  request: NextRequest
): Promise<UserPayload | null> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(request: NextRequest): Promise<UserPayload> {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
