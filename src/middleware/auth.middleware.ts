import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { sessions, users } from '../db/schema';
import { User, Session, UserRole } from '../types';
import { sendResponse } from '../utils/response';

export const sessionMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    let sessionId = req.cookies?.lectio_session_id;

    if (!sessionId && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        sessionId = authHeader.substring(7).trim();
      } else {
        sessionId = authHeader.trim();
      }
    }

    if (!sessionId) {
      return next();
    }

    const db = getDb();
    const [foundSession] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!foundSession) {
      return next();
    }

    const now = new Date();
    if (new Date(foundSession.expiresAt) <= now) {
      // Session expired -> purge from DB
      await db.delete(sessions).where(eq(sessions.id, sessionId));
      return next();
    }

    const [foundUser] = await db.select().from(users).where(eq(users.id, foundSession.userId)).limit(1);

    if (!foundUser || foundUser.status === 'deactivated' || foundUser.status === 'suspended') {
      return next();
    }

    const user: User = {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role as UserRole,
      title: foundUser.title,
      pseudonymousLabel: foundUser.pseudonymousLabel,
      avatarUrl: foundUser.avatarUrl,
      districtId: foundUser.districtId,
      schoolDistrict: foundUser.districtId || 'Springfield Public Schools',
      status: foundUser.status as any,
      failedLoginAttempts: foundUser.failedLoginAttempts,
      lockedUntil: foundUser.lockedUntil ? foundUser.lockedUntil.toISOString() : null,
      mustChangePassword: foundUser.mustChangePassword,
      lastLoginAt: foundUser.lastLoginAt ? foundUser.lastLoginAt.toISOString() : null,
      createdAt: foundUser.createdAt ? foundUser.createdAt.toISOString() : null,
      updatedAt: foundUser.updatedAt ? foundUser.updatedAt.toISOString() : null,
    };

    const session: Session = {
      id: foundSession.id,
      userId: foundSession.userId,
      role: foundSession.role as UserRole,
      ipAddress: foundSession.ipAddress,
      userAgent: foundSession.userAgent,
      expiresAt: foundSession.expiresAt.toISOString(),
      createdAt: foundSession.createdAt ? foundSession.createdAt.toISOString() : null,
    };

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    console.warn('Session middleware resolution error:', error);
    next();
  }
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    sendResponse(res, 401, false, undefined, 'Unauthorized: Active session required');
    return;
  }
  next();
};

export const requireRole = (...roles: (UserRole | string)[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendResponse(res, 401, false, undefined, 'Unauthorized: Active session required');
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendResponse(res, 403, false, undefined, `Forbidden: Requires role in [${roles.join(', ')}]`);
      return;
    }
    next();
  };
};
