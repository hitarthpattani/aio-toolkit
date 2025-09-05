/**
 * <license header>
 */

/**
 * Interface for event metadata item
 */
export interface EventMetadata {
  event_code: string;
  label?: string;
  description?: string;
  sample_event_template?: string;
  [key: string]: any;
}
