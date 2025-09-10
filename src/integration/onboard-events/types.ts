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
