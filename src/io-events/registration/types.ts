/**
 * <license header>
 */

/**
 * Registration object structure
 */
export interface Registration {
  registration_id: string;
  name: string;
  description?: string;
  webhook_url?: string;
  events_of_interest?: Array<{
    provider_id: string;
    event_code: string;
  }>;
  delivery_type: string;
  enabled: boolean;
  created_date: string;
  updated_date: string;
  runtime_action?: string;
  [key: string]: any;
}
