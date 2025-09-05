/**
 * <license header>
 */

import { HALLink } from '../types';

/**
 * Provider interface based on Adobe I/O Events API response
 */
export interface Provider {
  id: string;
  label: string;
  description: string;
  source: string;
  docs_url?: string;
  provider_metadata: string;
  instance_id?: string;
  event_delivery_format: string;
  publisher: string;
  _links?: {
    'rel:eventmetadata'?: HALLink;
    'rel:update'?: HALLink;
    self?: HALLink;
  };
}
