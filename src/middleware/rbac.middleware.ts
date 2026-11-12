import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { sendResponse } from '../utils/response';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendResponse(res, 401, false, undefined, 'Unauthorized: Authentication required');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendResponse(
        res,
        403,
        false,
        undefined,
        `Forbidden: Role '${req.user.role}' lacks permission for this resource. Required roles: ${allowedRoles.join(', ')}`
      );
      return;
    }

    next();
  };
};
