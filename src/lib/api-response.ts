import { NextResponse } from "next/server";
import { type ApiError, createApiError, ErrorCodes, type ErrorCode } from "./errors";

/**
 * Standardized API response helpers.
 */

export function successResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function createdResponse<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 });
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(
  code: ErrorCode,
  customMessage?: string,
  details?: Record<string, unknown>,
  status?: number
): NextResponse<ApiError> {
  const httpStatus = status ?? getHttpStatusForCode(code);
  return NextResponse.json(createApiError(code, customMessage, details), { status: httpStatus });
}

export function badRequestResponse(
  message?: string,
  details?: Record<string, unknown>
): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.INVALID_INPUT, message, details, 400);
}

export function unauthorizedResponse(message?: string): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.UNAUTHORIZED, message, undefined, 401);
}

export function forbiddenResponse(message?: string): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.INSUFFICIENT_PERMISSIONS, message, undefined, 403);
}

export function notFoundResponse(message?: string): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.NOT_FOUND, message, undefined, 404);
}

export function conflictResponse(message?: string): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.ALREADY_EXISTS, message, undefined, 409);
}

export function lockedResponse(message?: string): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.RESOURCE_LOCKED, message, undefined, 423);
}

export function rateLimitResponse(retryAfter: number): NextResponse<ApiError> {
  const response = NextResponse.json(
    createApiError(ErrorCodes.RATE_LIMIT_EXCEEDED),
    { status: 429 }
  );
  response.headers.set("Retry-After", String(retryAfter));
  return response;
}

export function internalErrorResponse(message?: string): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.INTERNAL_ERROR, message, undefined, 500);
}

export function validationErrorResponse(
  message: string,
  fields?: Record<string, string>
): NextResponse<ApiError> {
  return errorResponse(ErrorCodes.VALIDATION_ERROR, message, fields ? { fields } : undefined, 400);
}

function getHttpStatusForCode(code: ErrorCode): number {
  const statusMap: Partial<Record<ErrorCode, number>> = {
    [ErrorCodes.UNAUTHORIZED]: 401,
    [ErrorCodes.SESSION_EXPIRED]: 401,
    [ErrorCodes.INVALID_CREDENTIALS]: 401,
    [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 403,
    [ErrorCodes.VALIDATION_ERROR]: 400,
    [ErrorCodes.INVALID_INPUT]: 400,
    [ErrorCodes.MISSING_REQUIRED_FIELD]: 400,
    [ErrorCodes.INVALID_FORMAT]: 400,
    [ErrorCodes.NOT_FOUND]: 404,
    [ErrorCodes.ALREADY_EXISTS]: 409,
    [ErrorCodes.RESOURCE_LOCKED]: 423,
    [ErrorCodes.RESOURCE_DELETED]: 410,
    [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,
    [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
  };
  
  return statusMap[code] ?? 500;
}

/**
 * Wrapper for API route handlers with automatic error handling.
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiError>> {
  return handler().catch((error) => {
    console.error("[API Error]", error);
    
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("nie znaleziono")) {
        return notFoundResponse(error.message);
      }
      if (error.message.includes("unauthorized") || error.message.includes("brak autoryzacji")) {
        return unauthorizedResponse(error.message);
      }
    }
    
    return internalErrorResponse();
  });
}
