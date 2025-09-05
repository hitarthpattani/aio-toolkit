/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

export interface EventsOfInterestInputModel {
  provider_id: string;
  event_code: string;
}

/**
 * Registration create input model
 */
export interface RegistrationCreateModel {
  client_id: string;
  name: string;
  description?: string;
  webhook_url?: string;
  events_of_interest: EventsOfInterestInputModel[];
  delivery_type: 'webhook' | 'webhook_batch' | 'journal' | 'aws_eventbridge';
  runtime_action?: string;
  enabled?: boolean;
}
