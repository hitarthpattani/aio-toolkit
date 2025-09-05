/**
 * <license header>
 */

import RestClient from '../../../integration/rest-client';
import { IOEventsApiError, IoEventsGlobals } from '../../types';
import { Provider } from '../types';
import { GetProviderQueryParams } from './types';

/**
 * Get provider by ID for Adobe I/O Events
 *
 * This class handles the retrieval of a specific event provider by its ID.
 * It supports including event metadata in the response.
 */
class Get {
  private readonly endpoint: string = IoEventsGlobals.BASE_URL;
  private readonly restClient: RestClient;

  /**
   * Constructor for Get provider service
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
   * Execute the get provider by ID API call
   *
   * @param providerId - The ID of the provider to retrieve
   * @param queryParams - Optional query parameters
   * @param queryParams.eventmetadata - Boolean to fetch provider's event metadata (default: false)
   * @returns Promise<Provider> - The provider details
   * @throws IOEventsApiError - When API call fails with specific error details
   *
   * @example
   * ```typescript
   * // Get basic provider details
   * const provider = await getService.execute('provider-123');
   *
   * // Get provider details with event metadata
   * const providerWithMetadata = await getService.execute('provider-123', {
   *   eventmetadata: true
   * });
   * ```
   */
  async execute(providerId: string, queryParams: GetProviderQueryParams = {}): Promise<Provider> {
    try {
      // Validate provider ID
      if (!providerId?.trim()) {
        throw new Error('Provider ID is required and cannot be empty');
      }

      // Build the API URL
      const url = `${this.endpoint}/events/providers/${encodeURIComponent(providerId)}`;

      // Build query string if parameters are provided
      const queryString = this.buildQueryString(queryParams);
      const fullUrl = queryString ? `${url}?${queryString}` : url;

      // Prepare headers as required by the API
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        'x-api-key': this.clientId,
        Accept: 'application/hal+json',
      };

      // Make the GET request
      const response: Provider = await this.restClient.get(fullUrl, headers);

      // Validate response format
      if (response === null || response === undefined) {
        throw new Error('Invalid response format: Expected provider object');
      }
      if (typeof response !== 'object') {
        throw new Error('Invalid response format: Expected provider object');
      }

      return response;
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(queryParams: GetProviderQueryParams): string {
    const params = new URLSearchParams();

    // Handle eventmetadata parameter
    if (queryParams.eventmetadata !== undefined) {
      params.append('eventmetadata', String(queryParams.eventmetadata));
    }

    return params.toString();
  }

  /**
   * Handle and transform errors into IOEventsApiError
   */
  private handleError(error: any): never {
    // Check if it's an HTTP error from RestClient (e.g., "HTTP error! status: 404")
    if (error instanceof Error && error.message.includes('HTTP error! status:')) {
      const statusCode = this.extractStatusCodeFromMessage(error.message);
      const errorMessage = this.getErrorMessageForStatus(statusCode);

      throw new IOEventsApiError(errorMessage, statusCode);
    }

    // Handle HTTP errors from RestClient
    if (error.response) {
      const status = this.extractStatusCode(error);
      const errorMessage = this.getErrorMessageForStatus(status);
      throw new IOEventsApiError(errorMessage, status, 'API_ERROR');
    }

    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new IOEventsApiError(
        'Network error: Unable to connect to Adobe I/O Events API',
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        'NETWORK_ERROR'
      );
    }

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT') {
      throw new IOEventsApiError(
        'Request timeout: Adobe I/O Events API did not respond in time',
        IoEventsGlobals.STATUS_CODES.TIMEOUT,
        'TIMEOUT_ERROR'
      );
    }

    // Handle JSON parsing errors
    if (error.message?.includes('JSON')) {
      throw new IOEventsApiError(
        'Invalid response format from Adobe I/O Events API',
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        'PARSE_ERROR'
      );
    }

    // Handle validation errors (from provider ID or response validation)
    if (
      error.message?.includes('Provider ID is required') ||
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
      `Unexpected error: ${error.message || 'Unknown error occurred'}`,
      IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
      'UNKNOWN_ERROR'
    );
  }

  /**
   * Extract status code from error response
   */
  private extractStatusCode(error: any): number {
    return (
      error.response?.status || error.status || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR
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
   * Get specific error message based on HTTP status code
   */
  private getErrorMessageForStatus(status: number): string {
    switch (status) {
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return 'Unauthorized: Invalid or expired access token';
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return 'Forbidden: Insufficient permissions to access this provider';
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return 'Provider ID does not exist';
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return 'Internal server error occurred while fetching provider';
      default:
        return `HTTP ${status}: Provider request failed`;
    }
  }
}

export default Get;
