import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle known AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Handle validation errors
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error: ' + error.message;
  }
  // Handle JSON parsing errors
  else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Invalid JSON format';
  }
  // Handle multer errors (file upload)
  else if (error.message?.includes('File too large')) {
    statusCode = 413;
    message = 'File size too large';
  }
  else if (error.message?.includes('Unexpected field')) {
    statusCode = 400;
    message = 'Invalid file field name';
  }
  // Handle OpenAI API errors
  else if (error.message?.includes('OpenAI')) {
    statusCode = 503;
    message = 'AI service temporarily unavailable';
  }
  // Handle rate limiting
  else if (error.message?.includes('rate limit')) {
    statusCode = 429;
    message = 'Too many requests. Please try again later.';
  }
  // Handle timeout errors
  else if (error.message?.includes('timeout')) {
    statusCode = 408;
    message = 'Request timeout. Please try again.';
  }

  // Log error details for debugging
  console.error('Error Details:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    statusCode,
    message: error.message,
    stack: error.stack,
    body: req.body,
    headers: req.headers,
  });

  // Create error response
  const errorResponse: ApiError = {
    error: 'Request Failed',
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  // Add additional context for development
  if (process.env.NODE_ENV === 'development') {
    (errorResponse as any).stack = error.stack;
    (errorResponse as any).details = error.message;
  }

  res.status(statusCode).json(errorResponse);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Validation middleware
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      const validationError = new AppError(
        `Validation failed: ${error.errors?.map((e: any) => e.message).join(', ') || error.message}`,
        400
      );
      next(validationError);
    }
  };
};