/**
 * <license header>
 */

/**
 * Input model for creating an event provider
 */
export interface ProviderInputModel {
  /**
   * The label of this event provider, as shown on the Adobe Developer Console (required)
   */
  label: string;

  /**
   * The description of this event provider, as shown on the Adobe Developer Console
   */
  description?: string;

  /**
   * The documentation URL of this event provider, as shown on the Adobe Developer Console
   */
  docs_url?: string;

  /**
   * The provider metadata ID; optional. If omitted, the default `3rd_party_custom_events` will be used.
   */
  provider_metadata?: string;

  /**
   * A technical instance ID; optional. If omitted and `provider_metadata` is `3rd_party_custom_events`,
   * a random UUID is generated; otherwise, you must specify a custom value, which must be unique
   * at the `provider_metadata` level.
   */
  instance_id?: string;

  /**
   * The data residency region; optional. If omitted, the default `va6` will be used.
   * Currently we only support two regions: US (va6) and Europe (irl1).
   * This defines where your events are stored and processed.
   */
  data_residency_region?: string;
}

/**
 * Parameters for creating a provider
 */
export interface CreateProviderParams {
  /**
   * Project ID from Adobe Developer Console
   */
  projectId: string;

  /**
   * Workspace ID from Adobe Developer Console
   */
  workspaceId: string;

  /**
   * Provider input data
   */
  providerData: ProviderInputModel;
}
