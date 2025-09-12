/**
 * <license header>
 */

/**
 * Sample event template structure (flexible object)
 */
export interface SampleEventTemplate {
  [key: string]: any;
}

/**
 * Event configuration for onboarding
 */
export interface OnboardEvent {
  /** Event code identifier */
  eventCode: string;
  /** Runtime action to handle the event */
  runtimeAction: string;
  /** Type of event delivery */
  deliveryType: string;
  /** Sample event template for testing */
  sampleEventTemplate: SampleEventTemplate;
}

/**
 * Registration configuration for onboarding events
 */
export interface OnboardRegistration {
  /** Registration key identifier */
  key: string;
  /** Registration display label */
  label: string;
  /** Registration description */
  description: string;
  /** Array of events for this registration */
  events: OnboardEvent[];
}

/**
 * Provider configuration for onboarding events
 */
export interface OnboardProvider {
  /** Provider key identifier */
  key: string;
  /** Provider display label */
  label: string;
  /** Provider description */
  description: string;
  /** Documentation URL for the provider */
  docsUrl: string | null;
  /** Array of registrations for this provider */
  registrations: OnboardRegistration[];
}

/**
 * Complete onboard events input structure
 */
export interface OnboardEventsInput {
  /** Array of provider configurations */
  providers: OnboardProvider[];
}

/**
 * Array of onboard provider configurations
 * @deprecated Use OnboardEventsInput instead
 */
export type OnboardProviders = OnboardProvider[];

/**
 * Parsed provider entity
 */
export interface ParsedProvider {
  key: string;
  label: string;
  description: string;
  docsUrl: string | null;
}

/**
 * Parsed registration entity
 */
export interface ParsedRegistration {
  key: string;
  label: string;
  description: string;
  providerKey: string;
}

/**
 * Parsed event entity
 */
export interface ParsedEvent {
  eventCode: string;
  runtimeAction: string;
  deliveryType: string;
  sampleEventTemplate: any;
  registrationKey: string;
  providerKey: string;
}

/**
 * Parsed entities structure extracted from OnboardEventsInput
 */
export interface ParsedEntities {
  providers: ParsedProvider[];
  registrations: ParsedRegistration[];
  events: ParsedEvent[];
}

/**
 * Provider creation result interface
 */
export interface CreateProviderResult {
  created: boolean;
  skipped: boolean;
  provider: {
    id?: string;
    instanceId?: string;
    key: string;
    label: string;
    originalLabel: string;
    description?: string;
    docsUrl?: string | null;
  };
  error?: string;
  reason?: string;
  raw?: any;
}

/**
 * Event metadata creation result interface
 */
export interface CreateEventResult {
  created: boolean;
  skipped: boolean;
  event: {
    id?: string;
    eventCode: string;
    label?: string;
    description?: string;
    sampleEventTemplate?: any;
  };
  provider?: CreateProviderResult['provider'];
  error?: string;
  reason?: string;
  raw?: any;
}

/**
 * Registration creation result interface
 */
export interface CreateRegistrationResult {
  created: boolean;
  skipped: boolean;
  registration: {
    id?: string;
    key: string;
    label: string;
    originalLabel: string;
    description?: string;
    clientId?: string;
    name?: string;
    webhookUrl?: string;
    deliveryType?: string;
    runtimeAction?: string;
  };
  provider?: CreateProviderResult['provider'];
  error?: string;
  reason?: string;
  raw?: any;
}

/**
 * Summary item for providers, events, or registrations
 */
export interface OnboardSummaryItem {
  id?: string | undefined;
  key?: string | undefined;
  label: string;
  eventCode?: string | undefined;
  status: 'created' | 'existing' | 'failed';
  provider?: string | undefined;
  error?: string | undefined;
}

/**
 * Summary counts for onboard results
 */
export interface OnboardSummaryCounts {
  created: number;
  existing: number;
  failed: number;
  total: number;
}

/**
 * Concise summary of onboard events processing
 */
export interface OnboardEventsSummary {
  /** Summary of providers */
  providers: {
    items: OnboardSummaryItem[];
    counts: OnboardSummaryCounts;
  };
  /** Summary of events */
  events: {
    items: OnboardSummaryItem[];
    counts: OnboardSummaryCounts;
  };
  /** Summary of registrations */
  registrations: {
    items: OnboardSummaryItem[];
    counts: OnboardSummaryCounts;
  };
  /** Overall summary */
  overall: {
    totalProcessed: number;
    totalCreated: number;
    totalExisting: number;
    totalFailed: number;
  };
}

/**
 * Response from onboard events processing
 */
export interface OnboardEventsResponse {
  /** Array of created provider results */
  createdProviders: CreateProviderResult[];
  /** Array of created event results */
  createdEvents: CreateEventResult[];
  /** Array of created registration results */
  createdRegistrations: CreateRegistrationResult[];
}
