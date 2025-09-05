/**
 * <license header>
 */

import type { Registration } from '../types';

/**
 * HAL+JSON response structure for registration list
 */
export interface RegistrationListResponse {
  _embedded?: {
    registrations?: Registration[];
  };
  _links?: {
    self?: {
      href: string;
    };
    next?: {
      href: string;
    };
  };
  [key: string]: any;
}

/**
 * Query parameters for registration list
 */
export interface ListRegistrationQueryParams {
  [key: string]: string | number | boolean | undefined;
}
