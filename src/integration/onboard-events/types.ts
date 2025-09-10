/**
 * <license header>
 */

/**
 * Onboard provider configuration for onboarding events
 */
export interface OnboardProvider {
  /** Provider key identifier */
  key: string;
  /** Provider display label */
  label: string;
  /** Provider description */
  description: string;
  /** Documentation URL for the provider */
  docs_url: string | null;
}

/**
 * Array of onboard provider configurations
 */
export type OnboardProviders = OnboardProvider[];

/**
 * Response from onboard events processing
 */
export interface OnboardEventsResponse {
  /** Array of created provider results */
  createdProviders: Array<{
    created: boolean;
    skipped: boolean;
    provider: {
      id?: string;
      instanceId?: string;
      label: string;
      originalLabel: string;
      description?: string;
      docsUrl?: string | null;
    };
    error?: string;
    reason?: string;
  }>;
}
