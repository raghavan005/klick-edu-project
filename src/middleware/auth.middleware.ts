// ─── Auth Middleware ──────────────────────────────────────────────────────────
// Attaches the decoded JWT payload to req.user.
// requireAdmin: blocks STAFF from admin-only routes.
// requireOwn:   STAFF can only touch leads assigned to their employeeId.
// ──────────────────────────────────────────────────────────────────────────────

import type { Request, Response, NextFunction } from "express";
import { authService, type AuthPayload } from "../services/auth.service.js";

// Extend Express Request so req.user is typed everywhere
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/** Require a valid JWT. Attaches decoded payload to req.user. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required." });
  }
  try {
    req.user = authService.verifyToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

/** Only ADMIN may proceed. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Authentication required." });
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}

/** STAFF can only see/edit leads assigned to themselves.
 *  ADMIN always passes through. */
export function scopeToEmployee(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Authentication required." });
  if (req.user.role === "STAFF" && req.user.employeeId) {
    // Inject the employee filter so STAFF only see their own leads
    req.query.assignedEmployeeId = req.user.employeeId;
  }
  next();
}
