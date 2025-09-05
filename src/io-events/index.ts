/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

/**
 * Adobe I/O Events utilities for Adobe Commerce AIO Toolkit
 */

// Export Provider utilities
export { default as ProviderManager } from './provider';

// Export Event Metadata utilities
export { default as EventMetadataManager } from './event-metadata';

// Export Registration utilities
export { default as RegistrationManager } from './registration';

// Export types and error classes
export * from './types';

// Export provider-specific types
export type { Provider } from './provider/types';
export type { ProviderInputModel, CreateProviderParams } from './provider/create/types';
export type { GetProviderQueryParams } from './provider/get/types';
export type { ListProvidersQueryParams } from './provider/list/types';

// Export event metadata types
export type { EventMetadata } from './event-metadata/types';
export type { EventMetadataInputModel } from './event-metadata/create/types';
export type { EventMetadataListResponse } from './event-metadata/list/types';

// Export registration-specific types
export type { Registration } from './registration/types';
export type { RegistrationCreateModel } from './registration/create/types';
export type { GetRegistrationQueryParams } from './registration/get/types';
export type {
  ListRegistrationQueryParams,
  RegistrationListResponse,
} from './registration/list/types';
