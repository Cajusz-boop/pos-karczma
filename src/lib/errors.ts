/**
 * Standardized error codes for the application.
 * Use these codes in API responses for programmatic error handling.
 */

export const ErrorCodes = {
  // Authentication errors (1xxx)
  UNAUTHORIZED: "ERR_1001",
  SESSION_EXPIRED: "ERR_1002",
  INVALID_CREDENTIALS: "ERR_1003",
  INSUFFICIENT_PERMISSIONS: "ERR_1004",
  
  // Validation errors (2xxx)
  VALIDATION_ERROR: "ERR_2001",
  INVALID_INPUT: "ERR_2002",
  MISSING_REQUIRED_FIELD: "ERR_2003",
  INVALID_FORMAT: "ERR_2004",
  
  // Resource errors (3xxx)
  NOT_FOUND: "ERR_3001",
  ALREADY_EXISTS: "ERR_3002",
  RESOURCE_LOCKED: "ERR_3003",
  RESOURCE_DELETED: "ERR_3004",
  
  // Business logic errors (4xxx)
  ORDER_ALREADY_CLOSED: "ERR_4001",
  ORDER_ALREADY_SENT: "ERR_4002",
  INSUFFICIENT_STOCK: "ERR_4003",
  SHIFT_NOT_OPEN: "ERR_4004",
  TABLE_OCCUPIED: "ERR_4005",
  PAYMENT_FAILED: "ERR_4006",
  INVALID_OPERATION: "ERR_4007",
  
  // System errors (5xxx)
  INTERNAL_ERROR: "ERR_5001",
  DATABASE_ERROR: "ERR_5002",
  EXTERNAL_SERVICE_ERROR: "ERR_5003",
  RATE_LIMIT_EXCEEDED: "ERR_5004",
  SERVICE_UNAVAILABLE: "ERR_5005",
  
  // Network errors (6xxx)
  NETWORK_ERROR: "ERR_6001",
  TIMEOUT: "ERR_6002",
  CONNECTION_LOST: "ERR_6003",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Human-readable error messages in Polish.
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.UNAUTHORIZED]: "Brak autoryzacji",
  [ErrorCodes.SESSION_EXPIRED]: "Sesja wygasła — zaloguj się ponownie",
  [ErrorCodes.INVALID_CREDENTIALS]: "Nieprawidłowe dane logowania",
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: "Brak uprawnień do tej operacji",
  
  [ErrorCodes.VALIDATION_ERROR]: "Błąd walidacji danych",
  [ErrorCodes.INVALID_INPUT]: "Nieprawidłowe dane wejściowe",
  [ErrorCodes.MISSING_REQUIRED_FIELD]: "Brakuje wymaganego pola",
  [ErrorCodes.INVALID_FORMAT]: "Nieprawidłowy format danych",
  
  [ErrorCodes.NOT_FOUND]: "Nie znaleziono zasobu",
  [ErrorCodes.ALREADY_EXISTS]: "Zasób już istnieje",
  [ErrorCodes.RESOURCE_LOCKED]: "Zasób jest zablokowany",
  [ErrorCodes.RESOURCE_DELETED]: "Zasób został usunięty",
  
  [ErrorCodes.ORDER_ALREADY_CLOSED]: "Zamówienie jest już zamknięte",
  [ErrorCodes.ORDER_ALREADY_SENT]: "Zamówienie zostało już wysłane",
  [ErrorCodes.INSUFFICIENT_STOCK]: "Niewystarczający stan magazynowy",
  [ErrorCodes.SHIFT_NOT_OPEN]: "Zmiana nie jest otwarta",
  [ErrorCodes.TABLE_OCCUPIED]: "Stolik jest zajęty",
  [ErrorCodes.PAYMENT_FAILED]: "Płatność nie powiodła się",
  [ErrorCodes.INVALID_OPERATION]: "Niedozwolona operacja",
  
  [ErrorCodes.INTERNAL_ERROR]: "Wewnętrzny błąd serwera",
  [ErrorCodes.DATABASE_ERROR]: "Błąd bazy danych",
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: "Błąd zewnętrznej usługi",
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: "Zbyt wiele żądań — spróbuj ponownie za chwilę",
  [ErrorCodes.SERVICE_UNAVAILABLE]: "Usługa tymczasowo niedostępna",
  
  [ErrorCodes.NETWORK_ERROR]: "Błąd sieci",
  [ErrorCodes.TIMEOUT]: "Przekroczono limit czasu",
  [ErrorCodes.CONNECTION_LOST]: "Utracono połączenie",
};

/**
 * API error response structure.
 */
export interface ApiError {
  error: string;
  code: ErrorCode;
  details?: Record<string, unknown>;
}

/**
 * Create a standardized API error response.
 */
export function createApiError(
  code: ErrorCode,
  customMessage?: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    error: customMessage ?? ErrorMessages[code],
    code,
    ...(details && { details }),
  };
}

/**
 * Check if an error response is retryable.
 */
export function isRetryableError(code: ErrorCode): boolean {
  return [
    ErrorCodes.RATE_LIMIT_EXCEEDED,
    ErrorCodes.SERVICE_UNAVAILABLE,
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.TIMEOUT,
    ErrorCodes.CONNECTION_LOST,
    ErrorCodes.INTERNAL_ERROR,
    ErrorCodes.DATABASE_ERROR,
    ErrorCodes.EXTERNAL_SERVICE_ERROR,
  ].includes(code);
}

/**
 * Check if an error is a permanent failure (should not retry).
 */
export function isPermanentError(code: ErrorCode): boolean {
  return [
    ErrorCodes.UNAUTHORIZED,
    ErrorCodes.INVALID_CREDENTIALS,
    ErrorCodes.INSUFFICIENT_PERMISSIONS,
    ErrorCodes.VALIDATION_ERROR,
    ErrorCodes.INVALID_INPUT,
    ErrorCodes.NOT_FOUND,
    ErrorCodes.RESOURCE_DELETED,
    ErrorCodes.ORDER_ALREADY_CLOSED,
    ErrorCodes.INVALID_OPERATION,
  ].includes(code);
}

/**
 * Map HTTP status codes to error codes.
 */
export function httpStatusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCodes.INVALID_INPUT;
    case 401:
      return ErrorCodes.UNAUTHORIZED;
    case 403:
      return ErrorCodes.INSUFFICIENT_PERMISSIONS;
    case 404:
      return ErrorCodes.NOT_FOUND;
    case 409:
      return ErrorCodes.ALREADY_EXISTS;
    case 423:
      return ErrorCodes.RESOURCE_LOCKED;
    case 429:
      return ErrorCodes.RATE_LIMIT_EXCEEDED;
    case 500:
      return ErrorCodes.INTERNAL_ERROR;
    case 502:
    case 503:
    case 504:
      return ErrorCodes.SERVICE_UNAVAILABLE;
    default:
      return ErrorCodes.INTERNAL_ERROR;
  }
}
