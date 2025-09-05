/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

/**
 * Adobe I/O Events global constants
 */
export const IoEventsGlobals = {
  BASE_URL: 'https://api.adobe.io',
  STATUS_CODES: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    REQUEST_TIMEOUT: 408,
    TIMEOUT: 408,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },
  HEADERS: {
    CONFLICTING_ID: 'x-conflicting-id',
  },
} as const;

/**
 * HAL (Hypertext Application Language) link structure
 */
export interface HALLink {
  href: string;
  templated?: boolean;
  type?: string;
  title?: string;
}

/**
 * Error response from Adobe I/O Events API
 */
export interface IOEventsError {
  error?: string;
  message?: string;
  error_code?: string;
  details?: string;
}

/**
 * Custom error class for Adobe I/O Events API errors
 */
export class IOEventsApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string | undefined;
  public readonly details: string | undefined;

  constructor(message: string, statusCode: number, errorCode?: string, details?: string) {
    super(message);
    this.name = 'IOEventsApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}
