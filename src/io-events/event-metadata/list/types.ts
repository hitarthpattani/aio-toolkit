/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { EventMetadata } from '../types';

/**
 * Interface for event metadata list response from Adobe I/O Events API
 */
export interface EventMetadataListResponse {
  _embedded?: {
    eventmetadata: EventMetadata[];
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
