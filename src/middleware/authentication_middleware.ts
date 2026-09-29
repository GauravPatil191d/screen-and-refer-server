import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { UserRole } from "../modules/users/model/user_model.js";

export interface AuthenticatedUser {
  user_generated_id: string;
  user_id: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: AuthenticatedUser;
    }
  }
}

export function authenticationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : undefined;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(token, secret);

    if (typeof decoded === "string") {
      throw new Error("Invalid token");
    }

    const payload = decoded as JwtPayload & Partial<AuthenticatedUser>;
    const validRole = Object.values(UserRole).includes(payload.role as UserRole);

    if (
      !payload.user_generated_id ||
      !payload.user_id ||
      !validRole
    ) {
      throw new Error("Invalid token");
    }

    req.authenticatedUser = {
      user_generated_id: payload.user_generated_id,
      user_id: payload.user_id,
      role: payload.role as UserRole,
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}