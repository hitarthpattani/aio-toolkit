/**
 * <license header>
 */

import RestClient from '../../../integration/rest-client';
import { IOEventsApiError, IOEventsError, IoEventsGlobals } from '../../types';
import { Provider } from '../types';
import { ListProvidersQueryParams, ProvidersListResponse } from './types';

/**
 * List providers for Adobe I/O Events
 *
 * This class handles the retrieval of event providers entitled to a specific organization ID.
 * It supports filtering by provider metadata ID, instance ID, and can optionally include
 * event metadata in the response.
 */
class List {
  private readonly endpoint: string = IoEventsGlobals.BASE_URL;
  private readonly restClient: RestClient;

  /**
   * Constructor for List providers service
   *
   * @param clientId - Client ID from Adobe Developer Console (x-api-key header)
   * @param consumerId - Project Organization ID from Adobe Developer Console
   * @param projectId - Project ID from Adobe Developer Console
   * @param workspaceId - Workspace ID from Adobe Developer Console
   * @param accessToken - IMS token for authentication (Bearer token)
   */
  constructor(
    private readonly clientId: string,
    private readonly consumerId: string,
    private readonly projectId: string,
    private readonly workspaceId: string,
    private readonly accessToken: string
  ) {
    if (!clientId?.trim()) {
      throw new Error('clientId is required and cannot be empty');
    }
    if (!consumerId?.trim()) {
      throw new Error('consumerId is required and cannot be empty');
    }
    if (!projectId?.trim()) {
      throw new Error('projectId is required and cannot be empty');
    }
    if (!workspaceId?.trim()) {
      throw new Error('workspaceId is required and cannot be empty');
    }
    if (!accessToken?.trim()) {
      throw new Error('accessToken is required and cannot be empty');
    }

    this.restClient = new RestClient();
  }

  /**
   * Execute the list providers API call with automatic pagination
   *
   * This method automatically handles pagination by following the `_links.next.href` from the HAL+JSON response.
   * It makes recursive API calls to fetch all pages and returns a complete array containing all providers
   * across all pages.
   *
   * @param queryParams - Optional query parameters for filtering providers
   * @param queryParams.providerMetadataId - Filter by provider metadata id
   * @param queryParams.instanceId - Filter by instance id
   * @param queryParams.providerMetadataIds - List of provider metadata ids to filter (mutually exclusive with providerMetadataId)
   * @param queryParams.eventmetadata - Boolean to fetch provider's event metadata (default: false)
   * @returns Promise<Provider[]> - Complete array of all providers across all pages
   * @throws IOEventsApiError - When API call fails with specific error details
   */
  async execute(queryParams: ListProvidersQueryParams = {}): Promise<Provider[]> {
    try {
      // Validate query parameters
      if (queryParams.providerMetadataId && queryParams.providerMetadataIds) {
        throw new Error('Cannot specify both providerMetadataId and providerMetadataIds');
      }

      // Build the API URL
      const url = `${this.endpoint}/events/${this.consumerId}/providers`;

      // Build query string if parameters are provided
      const queryString = this.buildQueryString(queryParams);
      const fullUrl = queryString ? `${url}?${queryString}` : url;

      // Prepare headers as required by the API
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        'x-api-key': this.clientId,
        Accept: 'application/hal+json',
      };

      return await this.fetchAllPages(fullUrl, headers);
    } catch (error: any) {
      // Handle different types of errors
      this.handleError(error);
    }
  }

  /**
   * Recursively fetches all pages of providers using pagination links
   *
   * @param url - The URL to fetch (either initial URL or next page URL)
   * @param headers - Headers for the API request
   * @param accumulatedResults - Array to accumulate results across pages
   * @returns Promise<Provider[]> - Complete array of all providers
   * @private
   */
  private async fetchAllPages(
    url: string,
    headers: Record<string, string>,
    accumulatedResults: Provider[] = []
  ): Promise<Provider[]> {
    // Make the GET request
    const response: ProvidersListResponse = await this.restClient.get(url, headers);

    // Validate response format
    if (response === null || response === undefined) {
      throw new Error('Invalid response format: Expected object');
    }

    if (typeof response !== 'object') {
      throw new Error('Invalid response format: Expected object');
    }

    // Extract providers array
    const providers = response._embedded?.providers;

    if (providers !== undefined && !Array.isArray(providers)) {
      throw new Error('Invalid response format: providers should be an array');
    }

    // Get current page results
    const currentPageResults = providers || [];

    // Accumulate results from current page
    const allResults = [...accumulatedResults, ...currentPageResults];

    // Check if there's a next page
    const nextPageUrl = response._links?.next?.href;

    if (nextPageUrl) {
      // Recursively fetch the next page
      return await this.fetchAllPages(nextPageUrl, headers, allResults);
    }

    // No more pages, return all accumulated results
    return allResults;
  }

  /**
   * Handle and transform errors from the API call
   * @private
   * @param error - The caught error
   * @throws IOEventsApiError - Transformed error with proper details
   */
  private handleError(error: any): never {
    // Check if it's an HTTP error from RestClient (e.g., "HTTP error! status: 404")
    if (error instanceof Error && error.message.includes('HTTP error! status:')) {
      const statusCode = this.extractStatusCodeFromMessage(error.message);
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }

    // Check if error has response body with error details
    if (error.response?.body) {
      const errorBody: IOEventsError = error.response.body;
      const statusCode =
        error.response.statusCode || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      const message =
        errorBody.message || errorBody.error || this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(message, statusCode, errorBody.error_code, errorBody.details);
    }

    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new IOEventsApiError(
        'Network error: Unable to connect to Adobe I/O Events API. Please check your internet connection.',
        0,
        'NETWORK_ERROR'
      );
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT') {
      throw new IOEventsApiError(
        'Request timeout: Adobe I/O Events API did not respond in time.',
        0,
        'TIMEOUT_ERROR'
      );
    }

    // Handle JSON parsing errors
    if (error.message?.includes('JSON') || error.name === 'SyntaxError') {
      throw new IOEventsApiError(
        'Invalid response format: Unable to parse API response.',
        0,
        'PARSE_ERROR'
      );
    }

    // Handle validation errors
    if (
      error.message?.includes('Cannot specify both') ||
      error.message?.includes('Invalid response format')
    ) {
      throw new IOEventsApiError(
        error.message,
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST,
        'VALIDATION_ERROR'
      );
    }

    // Generic error fallback
    throw new IOEventsApiError(
      `Failed to list providers: ${error.message || 'Unknown error occurred'}`,
      IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
      'UNKNOWN_ERROR'
    );
  }

  /**
   * Extracts the status code from RestClient error message
   *
   * @param errorMessage - Error message like "HTTP error! status: 404"
   * @returns The HTTP status code
   */
  private extractStatusCodeFromMessage(errorMessage: string): number {
    const match = errorMessage.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1]!, 10) : IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }

  /**
   * Get user-friendly error message based on HTTP status code
   * @private
   * @param statusCode - HTTP status code
   * @returns string - User-friendly error message
   */
  private getErrorMessageForStatus(statusCode: number): string {
    switch (statusCode) {
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return 'Unauthorized: Invalid or expired access token';
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return 'Forbidden: Insufficient permissions or invalid API key';
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return 'Not Found: Provider associated with the consumerOrgId, providerMetadataId or instanceID does not exist';
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error: Adobe I/O Events service is temporarily unavailable';
      default:
        return `API Error: HTTP ${statusCode}`;
    }
  }

  /**
   * Build query string from parameters
   * @private
   */
  private buildQueryString(params: ListProvidersQueryParams): string {
    const queryParts: string[] = [];

    // Add providerMetadataId if provided
    if (params.providerMetadataId) {
      queryParts.push(`providerMetadataId=${encodeURIComponent(params.providerMetadataId)}`);
    }

    // Add instanceId if provided
    if (params.instanceId) {
      queryParts.push(`instanceId=${encodeURIComponent(params.instanceId)}`);
    }

    // Add providerMetadataIds array if provided
    if (params.providerMetadataIds && Array.isArray(params.providerMetadataIds)) {
      params.providerMetadataIds.forEach((id: string) => {
        queryParts.push(`providerMetadataIds=${encodeURIComponent(id)}`);
      });
    }

    // Add eventmetadata boolean if provided
    if (typeof params.eventmetadata === 'boolean') {
      queryParts.push(`eventmetadata=${params.eventmetadata}`);
    }

    return queryParts.join('&');
  }
}

export default List;
