import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import type { Claims } from "../types/user";

export const JWT_SECRET = "secret";

export interface AuthRequest extends Request {
    userId?: number;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const header = req.headers["authorization"];
    const token = header?.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
        res.status(400).json({
            message: "Invalid or missing token"
        });
        return;
    }

    try {
        const claims = jwt.verify(token, JWT_SECRET) as unknown as Claims;
        req.userId = claims.sub;
        next();
    } catch {
        res.status(400).json({
            message: "Invalid or missing token"
        });
    }
}
