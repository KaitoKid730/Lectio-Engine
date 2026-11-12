import { Response } from 'express';
import { ApiResponse } from '../types';

/**
 * Standard Response Envelope Helper (16-API-Gateway contract)
 */
export function sendResponse<T>(
  res: Response,
  statusCode: number,
  success: boolean,
  data?: T,
  error?: string,
  pagination?: ApiResponse<T>['pagination']
) {
  const payload: ApiResponse<T> = {
    success,
    data,
    error,
    pagination,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(payload);
}
