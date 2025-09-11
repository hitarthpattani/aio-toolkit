/**
 * <license header>
 */

/**
 * Integration utilities for Adobe Commerce AIO Toolkit
 */

// Export Bearer Token utility
export { default as BearerToken } from './bearer-token';
export type { BearerTokenInfo } from './bearer-token/types';

// Export REST Client
export { default as RestClient } from './rest-client';

// Export REST Client types
export type { Headers } from './rest-client/types';

// Export Onboard Events
export { default as OnboardEvents } from './onboard-events';
export { default as CreateEvents } from './onboard-events/create-events';
export { default as CreateRegistrations } from './onboard-events/create-registrations';

// Export Onboard Events types
export type {
  OnboardEventsInput,
  OnboardEventsResponse,
  CreateProviderResult,
  CreateEventResult,
  CreateRegistrationResult,
} from './onboard-events/types';
