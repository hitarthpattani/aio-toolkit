/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import RestClient from '../../../integration/rest-client';
import { IOEventsApiError, IoEventsGlobals } from '../../types';

/**
 * Service for deleting registrations
 */
export class Delete {
  private restClient: RestClient;
  private endpoint: string;
  private consumerId: string;
  private projectId: string;
  private workspaceId: string;
  private accessToken: string;

  /**
   * Initialize the Delete service
   */
  constructor(
    clientId: string,
    consumerId: string,
    projectId: string,
    workspaceId: string,
    accessToken: string
  ) {
    if (!clientId?.trim()) {
      throw new IOEventsApiError('clientId is required and cannot be empty', 400);
    }
    if (!consumerId?.trim()) {
      throw new IOEventsApiError('consumerId is required and cannot be empty', 400);
    }
    if (!projectId?.trim()) {
      throw new IOEventsApiError('projectId is required and cannot be empty', 400);
    }
    if (!workspaceId?.trim()) {
      throw new IOEventsApiError('workspaceId is required and cannot be empty', 400);
    }
    if (!accessToken?.trim()) {
      throw new IOEventsApiError('accessToken is required and cannot be empty', 400);
    }

    this.restClient = new RestClient();
    this.endpoint = IoEventsGlobals.BASE_URL;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
  }

  /**
   * Delete a registration by ID
   *
   * @param registrationId - The registration ID to delete
   * @returns Promise<void> - Resolves when deletion is successful
   * @throws IOEventsApiError - When the API call fails
   *
   * @example
   * ```typescript
   * await registrationManager.delete('your-registration-id');
   * console.log('Registration deleted successfully');
   * ```
   */
  async execute(registrationId: string): Promise<void> {
    try {
      this.validateInputs(registrationId);

      const url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/registrations/${registrationId}`;

      await this.restClient.delete(url, {
        Authorization: `Bearer ${this.accessToken}`,
        'x-api-key': this.consumerId,
        Accept: 'text/plain',
      });

      // Delete operation returns 204 No Content on success
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Validates the input parameters
   */
  private validateInputs(registrationId: string): void {
    if (!registrationId?.trim()) {
      throw new IOEventsApiError('Registration ID is required', 400);
    }
  }

  /**
   * Handles errors from the API call
   */
  private handleError(error: any): never {
    if (error instanceof IOEventsApiError) {
      throw error;
    }

    if (error instanceof Error && error.message.includes('HTTP error! status:')) {
      const statusCode = this.extractStatusCodeFromMessage(error.message);
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }

    if (error.response?.status) {
      const statusCode = error.response.status;
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }

    if (error.status) {
      const statusCode = error.status;
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }

    throw new IOEventsApiError('Network error occurred', 500);
  }

  /**
   * Extracts status code from HTTP error message
   */
  private extractStatusCodeFromMessage(message: string): number {
    const match = message.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1]!, 10) : 500;
  }

  /**
   * Gets appropriate error message for HTTP status code
   */
  private getErrorMessageForStatus(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'Bad request: Invalid registration ID provided';
      case 401:
        return 'Unauthorized: Invalid or missing authentication';
      case 403:
        return 'Forbidden: Insufficient permissions';
      case 404:
        return 'Registration not found';
      case 500:
        return 'Internal server error';
      default:
        return `API error: HTTP ${statusCode}`;
    }
  }
}

export default Delete;
