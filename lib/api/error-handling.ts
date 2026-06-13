/**
 * Standard error types and response helpers for FunnelSwift API routes.
 * Provides consistent error formatting across all endpoints.
 */

import { z } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(429, message, 'RATE_LIMITED');
    this.name = 'RateLimitError';
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export function successResponse<T>(data: T, status: number = 200): Response {
  return Response.json(
    { success: true, data },
    { status }
  );
}

export function errorResponse(error: AppError): Response {
  return Response.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    },
    { status: error.statusCode }
  );
}

export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return errorResponse(error);
  }

  if (error instanceof z.ZodError) {
    return errorResponse(
      new ValidationError('Validation error', { issues: error.errors })
    );
  }

  // Preserve HTTP status from auth-layer ApiError in lib/api/auth.ts
  if (error instanceof Error && typeof (error as { status?: unknown }).status === 'number') {
    const status = (error as unknown as { status: number }).status;
    return errorResponse(new AppError(status, error.message));
  }

  if (error instanceof Error) {
    console.error('Unhandled API error:', error.message, error.stack);
    return errorResponse(new AppError(500, 'Internal server error'));
  }

  console.error('Unknown API error:', error);
  return errorResponse(new AppError(500, 'Internal server error'));
}

export function parseBody<T>(body: unknown): T {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('Request body must be a valid JSON object');
  }
  return body as T;
}
