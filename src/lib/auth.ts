import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

const JWT_ALG = "HS256" as const;
const ACCESS_TTL = 60 * 60 * 24 * 7; // 7 days
const COOKIE_NAME = "moataz_token";

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name?: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret(), { algorithm: JWT_ALG, expiresIn: ACCESS_TTL });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, secret(), { algorithms: [JWT_ALG] }) as JwtPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: ACCESS_TTL,
    path: "/",
  });
}

export function clearAuthCookie() {
  cookies().set(COOKIE_NAME, "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function getCurrentUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  // The login endpoint validates the user against the database before issuing this signed token.
  // Reading the signed payload here avoids an extra Prisma query on every admin page render,
  // which is important on Vercel + Supabase pooler.
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    role: payload.role,
    bio: null,
    avatar: null,
  };
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "ADMIN" && user.role !== "EDITOR") return null;
  return user;
}

export const AUTH_COOKIE = COOKIE_NAME;
