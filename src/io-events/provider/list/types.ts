/**
 * <license header>
 */

/**
 * Query parameters for listing providers
 */
export interface ListProvidersQueryParams {
  /**
   * Filter by provider metadata id
   */
  providerMetadataId?: string;

  /**
   * Filter by instance id
   */
  instanceId?: string;

  /**
   * List of provider metadata ids to filter (mutually exclusive with providerMetadataId)
   */
  providerMetadataIds?: string[];

  /**
   * Boolean to fetch provider's event metadata (default: false)
   */
  eventmetadata?: boolean;
}

/**
 * Full API response structure for list providers (for internal use)
 */
export interface ProvidersListResponse {
  _links: {
    self: {
      href: string;
    };
    next?: {
      href: string;
    };
  };
  _embedded?: {
    providers: import('../types').Provider[];
  };
  [key: string]: any;
}
