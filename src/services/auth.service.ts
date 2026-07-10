// ─── Auth Service ─────────────────────────────────────────────────────────────

import bcrypt      from "bcryptjs";
import jwt         from "jsonwebtoken";
import { prisma }  from "../lib/prisma.js";

const JWT_SECRET     = process.env.JWT_SECRET     ?? "dev_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";

export interface AuthPayload {
  userId:     string;
  email:      string;
  name:       string;
  role:       "ADMIN" | "STAFF";
  employeeId: string | null;
}

export const authService = {

  async login(email: string, password: string): Promise<{ token: string; user: AuthPayload }> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user || !user.isActive) {
      throw new Error("Invalid email or password.");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new Error("Invalid email or password.");
    }

    const payload: AuthPayload = {
      userId:     user.id,
      email:      user.email,
      name:       user.name,
      role:       user.role as "ADMIN" | "STAFF",
      employeeId: user.employeeId ?? null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    return { token, user: payload };
  },

  verifyToken(token: string): AuthPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
      throw new Error("Invalid or expired token.");
    }
  },

  async getProfile(userId: string): Promise<AuthPayload | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) return null;
    return {
      userId:     user.id,
      email:      user.email,
      name:       user.name,
      role:       user.role as "ADMIN" | "STAFF",
      employeeId: user.employeeId ?? null,
    };
  },
};
