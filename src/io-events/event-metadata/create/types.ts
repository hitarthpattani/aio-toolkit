/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

/**
 * Input model for creating event metadata
 */
export interface EventMetadataInputModel {
  /**
   * The description of this Event Metadata, as shown on the Adobe Developer Console
   */
  description: string;

  /**
   * The label of this Event Metadata, as shown on the Adobe Developer Console
   */
  label: string;

  /**
   * The event_code of this Event Metadata. This event_code describes the type of event.
   * Ideally it should be prefixed with a reverse-DNS name (dictating the organization
   * which defines the semantics of this event type). It is equivalent to the CloudEvents' type.
   * See https://github.com/cloudevents/spec/blob/master/spec.md#type
   */
  event_code: string;

  /**
   * An optional sample event template as a JSON object.
   * This will be automatically converted to base64 encoded string for the API.
   */
  sample_event_template?: Record<string, any>;
}
