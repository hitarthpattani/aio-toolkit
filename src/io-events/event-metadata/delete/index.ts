/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import RestClient from '../../../integration/rest-client';
import { IOEventsApiError, IoEventsGlobals } from '../../types';

/**
 * Delete all event metadata for a provider in Adobe I/O Events
 *
 * This class handles the deletion of all event metadata associated with a specific provider.
 * The operation returns 204 No Content on successful deletion.
 */
class Delete {
  private readonly endpoint: string = IoEventsGlobals.BASE_URL;
  private readonly restClient: RestClient;

  /**
   * Constructor for Delete event metadata service
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
   * Execute the delete event metadata API call
   *
   * @param providerId - The ID of the provider to delete event metadata for
   * @param eventCode - Optional event code to delete specific event metadata. If not provided, deletes all event metadata for the provider
   * @returns Promise<void> - No content returned on successful deletion (204)
   * @throws IOEventsApiError - When API call fails with specific error details
   */
  async execute(providerId: string, eventCode?: string): Promise<void> {
    try {
      // Validate required parameters
      if (!providerId?.trim()) {
        throw new IOEventsApiError(
          'providerId is required and cannot be empty',
          400,
          'VALIDATION_ERROR'
        );
      }

      // Validate eventCode if provided
      if (eventCode !== undefined && !eventCode?.trim()) {
        throw new IOEventsApiError(
          'eventCode cannot be empty when provided',
          400,
          'VALIDATION_ERROR'
        );
      }

      // Build the API URL - append eventCode if provided for specific deletion
      let url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/providers/${providerId}/eventmetadata`;
      if (eventCode?.trim()) {
        url += `/${encodeURIComponent(eventCode.trim())}`;
      }

      // Prepare headers as required by the API
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        'x-api-key': this.clientId,
        Accept: 'application/hal+json',
      };

      // Make the DELETE request - RestClient should handle 204 No Content properly
      await this.restClient.delete(url, headers);

      // No return value for 204 No Content
    } catch (error: any) {
      // Handle different types of errors
      this.handleError(error);
    }
  }

  /**
   * Handles errors from the API request
   *
   * @param error - The error object from the API request
   * @throws IOEventsApiError - Always throws with appropriate error details
   * @private
   */
  private handleError(error: any): never {
    // If it's already an IOEventsApiError, re-throw it
    if (error instanceof IOEventsApiError) {
      throw error;
    }

    // Check if it's an HTTP error from RestClient (e.g., "HTTP error! status: 404")
    if (error instanceof Error && error.message.includes('HTTP error! status:')) {
      const statusCode = this.extractStatusCodeFromMessage(error.message);
      const errorMessage = this.getErrorMessageForStatus(statusCode);

      throw new IOEventsApiError(errorMessage, statusCode);
    }

    // Check if it's a structured API error response
    if (error.response) {
      const statusCode = this.extractStatusCode(error);
      const errorMessage =
        error.response.body?.message || this.getErrorMessageForStatus(statusCode);

      throw new IOEventsApiError(
        errorMessage,
        statusCode,
        error.response.body?.error_code,
        error.response.body?.details
      );
    }

    // Handle other types of errors (network, timeout, parsing, etc.)
    let errorMessage: string;
    let statusCode: number;

    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Request timeout while deleting event metadata';
        statusCode = IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT;
      } else if (
        error.message.includes('is required') ||
        error.message.includes('cannot be empty')
      ) {
        // Validation errors should be thrown as-is with 400 status
        throw new IOEventsApiError(
          error.message,
          IoEventsGlobals.STATUS_CODES.BAD_REQUEST,
          'VALIDATION_ERROR'
        );
      } else if (error.message.includes('JSON') || error.message.includes('parse')) {
        errorMessage = 'Invalid response format from Adobe I/O Events API';
        statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      } else {
        errorMessage = `Network error: ${error.message}`;
        statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      }
    } else {
      errorMessage = `API Error: HTTP ${IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR}`;
      statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
    }

    throw new IOEventsApiError(errorMessage, statusCode);
  }

  /**
   * Extracts the status code from the error response
   *
   * @param error - The error object
   * @returns The HTTP status code
   * @private
   */
  private extractStatusCode(error: any): number {
    return error.response?.status || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }

  /**
   * Extracts the status code from RestClient error message
   *
   * @param errorMessage - Error message like "HTTP error! status: 404"
   * @returns The HTTP status code
   * @private
   */
  private extractStatusCodeFromMessage(errorMessage: string): number {
    const match = errorMessage.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1]!, 10) : IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }

  /**
   * Gets a human-readable error message based on HTTP status code
   *
   * @param statusCode - HTTP status code
   * @returns string - User-friendly error message
   * @private
   */
  private getErrorMessageForStatus(statusCode: number): string {
    switch (statusCode) {
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return 'Authentication failed. Please check your access token';
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return 'Access forbidden. You do not have permission to delete event metadata';
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return 'Provider or event metadata not found. The specified provider ID or event code does not exist';
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return 'Internal server error occurred while deleting event metadata';
      default:
        return `Unexpected error occurred: HTTP ${statusCode}`;
    }
  }
}

export default Delete;
