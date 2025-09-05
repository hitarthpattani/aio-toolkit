/**
 * <license header>
 */

import RestClient from '../../../integration/rest-client';
import { IOEventsApiError, IoEventsGlobals } from '../../types';

/**
 * Delete Provider Service
 *
 * Handles deletion of event providers in Adobe I/O Events.
 * Implements the DELETE /events/{consumerOrgId}/{projectId}/{workspaceId}/providers/{providerId} endpoint.
 */
export default class Delete {
  private readonly endpoint = IoEventsGlobals.BASE_URL;
  private readonly restClient: RestClient;

  /**
   * Creates an instance of Delete service
   *
   * @param clientId - Client ID from Adobe Developer Console
   * @param consumerId - Project Organization ID
   * @param projectId - Project ID from Adobe Developer Console
   * @param workspaceId - Workspace ID from Adobe Developer Console
   * @param accessToken - IMS token for authentication
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
   * Delete a provider by ID
   *
   * @param providerId - The ID of the provider to delete
   * @returns Promise<void> - Resolves when provider is successfully deleted
   * @throws IOEventsApiError - When the API request fails
   */
  async execute(providerId: string): Promise<void> {
    try {
      // Validate required parameters
      if (!providerId?.trim()) {
        throw new Error('providerId is required and cannot be empty');
      }

      // Build the API URL
      const url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/providers/${providerId}`;

      // Prepare headers
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        'x-api-key': this.clientId,
        Accept: 'application/hal+json',
        'Content-Type': 'application/json',
      };

      // Make the DELETE request
      await this.restClient.delete(url, headers);

      // DELETE requests with 204 response don't return content
      // Success is indicated by no exception being thrown
    } catch (error: any) {
      // Handle different types of errors
      this.handleError(error);
    }
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
    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
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

    // Handle validation errors (from provider ID validation)
    if (error.message?.includes('required') || error.message?.includes('empty')) {
      throw new IOEventsApiError(
        `Validation error: ${error.message}`,
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST,
        'VALIDATION_ERROR'
      );
    }

    // Handle generic errors
    if (error instanceof Error) {
      throw new IOEventsApiError(
        `Failed to delete provider: ${error.message}`,
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        'UNKNOWN_ERROR'
      );
    }

    // Handle unknown error types
    throw new IOEventsApiError(
      'Unexpected error: Unknown error occurred',
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
   * Get appropriate error message for HTTP status code
   */
  private getErrorMessageForStatus(status: number): string {
    switch (status) {
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return 'Unauthorized: Invalid or expired access token';
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return 'Forbidden: Insufficient permissions to delete provider';
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return 'Provider not found: The specified provider ID does not exist';
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return 'Internal server error occurred while deleting provider';
      default:
        return `HTTP ${status}: Provider deletion failed`;
    }
  }
}
