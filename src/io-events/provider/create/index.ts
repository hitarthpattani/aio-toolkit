/**
 * <license header>
 */

import RestClient from '../../../integration/rest-client';
import { IOEventsApiError, IoEventsGlobals } from '../../types';
import { Provider } from '../types';
import { ProviderInputModel } from './types';

/**
 * Create provider for Adobe I/O Events
 *
 * This class handles the creation of new event providers for a specific organization,
 * project, and workspace. It supports both single-instance and multi-instance providers.
 */
class Create {
  private readonly endpoint: string = IoEventsGlobals.BASE_URL;
  private readonly restClient: RestClient;

  /**
   * Constructor for Create provider service
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
   * Execute the create provider API call
   *
   * @param providerData - Provider input data
   * @returns Promise<Provider> - The created provider
   * @throws IOEventsApiError - When API call fails with specific error details
   */
  async execute(providerData: ProviderInputModel): Promise<Provider> {
    try {
      // Validate required parameters
      if (!providerData) {
        throw new Error('providerData is required');
      }
      if (!providerData.label?.trim()) {
        throw new Error('label is required in providerData');
      }

      // Build the API URL
      const url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/providers`;

      // Prepare headers as required by the API
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        'x-api-key': this.clientId,
        Accept: 'application/hal+json',
        'Content-Type': 'application/json',
      };

      // Make the POST request
      const response: Provider = await this.restClient.post(url, headers, providerData);

      // Validate response format
      if (response === null || response === undefined) {
        throw new Error('Invalid response format: Expected provider object');
      }

      if (typeof response !== 'object') {
        throw new Error('Invalid response format: Expected provider object');
      }

      // Validate required provider fields
      if (!response.id) {
        throw new Error('Invalid response format: Missing provider id');
      }

      return response;
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

    // Check if error has response body with error details
    if (error.response?.body) {
      const errorBody = error.response.body;
      const statusCode =
        error.response.statusCode || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      const message =
        errorBody.message || errorBody.error || this.getErrorMessageForStatus(statusCode);

      // Handle conflict error with special header
      if (
        statusCode === IoEventsGlobals.STATUS_CODES.CONFLICT &&
        error.response.headers?.[IoEventsGlobals.HEADERS.CONFLICTING_ID]
      ) {
        const conflictingId = error.response.headers[IoEventsGlobals.HEADERS.CONFLICTING_ID];
        throw new IOEventsApiError(
          `Provider already exists with conflicting ID: ${conflictingId}`,
          statusCode,
          'CONFLICT_ERROR',
          `Conflicting provider ID: ${conflictingId}`
        );
      }

      throw new IOEventsApiError(message, statusCode, errorBody.error_code, errorBody.details);
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

    // Handle validation errors
    if (
      error.message?.includes('is required') ||
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
      `Failed to create provider: ${error.message || 'Unknown error occurred'}`,
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
   * Get specific error message based on HTTP status code
   */
  private getErrorMessageForStatus(status: number): string {
    switch (status) {
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return 'Unauthorized: Invalid or expired access token';
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return 'Forbidden: Insufficient permissions or invalid scopes, or attempt to create non multi-instance provider';
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return 'Provider metadata provided in the input model does not exist';
      case IoEventsGlobals.STATUS_CODES.CONFLICT:
        return 'The event provider already exists';
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return 'Internal server error occurred while creating provider';
      default:
        return `HTTP ${status}: Provider creation failed`;
    }
  }
}

export default Create;
