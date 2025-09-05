/**
 * <license header>
 */

import { HttpStatus } from '../types';

export interface SuccessResponse {
  statusCode: HttpStatus;
  body: object | string;
  headers?: { [key: string]: string };
}

export interface ErrorResponse {
  error: {
    statusCode: HttpStatus;
    body: {
      error: string;
    };
  };
}

export type RuntimeActionResponseType = SuccessResponse | ErrorResponse;
