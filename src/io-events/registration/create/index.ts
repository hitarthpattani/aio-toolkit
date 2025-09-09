/**
 * <license header>
 */

import RestClient from '../../../integration/rest-client';
import { IOEventsApiError, IoEventsGlobals } from '../../types';
import type { Registration } from '../types';
import type { RegistrationCreateModel } from './types';

/**
 * Service for creating registrations
 */
export class Create {
  private restClient: RestClient;
  private endpoint: string;
  private clientId: string;
  private consumerId: string;
  private projectId: string;
  private workspaceId: string;
  private accessToken: string;

  /**
   * Initialize the Create service
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
    this.clientId = clientId;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
  }

  /**
   * Create a new registration
   *
   * @param registrationData - The registration data to create
   * @returns Promise<Registration> - The created registration
   * @throws IOEventsApiError - When the API call fails
   *
   * @example
   * ```typescript
   * const registration = await registrationManager.create({
   *   client_id: 'your-client-id',
   *   name: 'My Registration',
   *   description: 'Registration for user events',
   *   webhook_url: 'https://example.com/webhook',
   *   events_of_interest: [
   *     {
   *       provider_id: 'provider-123',
   *       event_code: 'com.example.user.created'
   *     }
   *   ],
   *   delivery_type: 'webhook',
   *   enabled: true
   * });
   * console.log(registration.registration_id);
   * ```
   */
  async execute(registrationData: RegistrationCreateModel): Promise<Registration> {
    try {
      this.validateRegistrationInput(registrationData);

      const url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/registrations`;

      const response = await this.restClient.post(
        url,
        {
          Authorization: `Bearer ${this.accessToken}`,
          'x-api-key': this.clientId,
          'Content-Type': 'application/json',
          Accept: 'application/hal+json',
        },
        registrationData
      );

      return response as Registration;
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Validates the registration input data
   */
  private validateRegistrationInput(registrationData: RegistrationCreateModel): void {
    if (!registrationData) {
      throw new IOEventsApiError('Registration data is required', 400);
    }

    if (!registrationData.client_id?.trim()) {
      throw new IOEventsApiError('Client ID is required', 400);
    }

    if (registrationData.client_id.length < 3 || registrationData.client_id.length > 255) {
      throw new IOEventsApiError('Client ID must be between 3 and 255 characters', 400);
    }

    if (!registrationData.name?.trim()) {
      throw new IOEventsApiError('Registration name is required', 400);
    }

    if (registrationData.name.length < 3 || registrationData.name.length > 255) {
      throw new IOEventsApiError('Registration name must be between 3 and 255 characters', 400);
    }

    if (registrationData.description && registrationData.description.length > 5000) {
      throw new IOEventsApiError('Description must not exceed 5000 characters', 400);
    }

    if (registrationData.webhook_url && registrationData.webhook_url.length > 4000) {
      throw new IOEventsApiError('Webhook URL must not exceed 4000 characters', 400);
    }

    if (
      !registrationData.events_of_interest ||
      !Array.isArray(registrationData.events_of_interest)
    ) {
      throw new IOEventsApiError('Events of interest is required and must be an array', 400);
    }

    if (registrationData.events_of_interest.length === 0) {
      throw new IOEventsApiError('At least one event of interest is required', 400);
    }

    // Validate each event of interest
    registrationData.events_of_interest.forEach((event, index) => {
      if (!event.provider_id?.trim()) {
        throw new IOEventsApiError(`Provider ID is required for event at index ${index}`, 400);
      }
      if (!event.event_code?.trim()) {
        throw new IOEventsApiError(`Event code is required for event at index ${index}`, 400);
      }
    });

    if (!registrationData.delivery_type?.trim()) {
      throw new IOEventsApiError('Delivery type is required', 400);
    }

    const validDeliveryTypes = ['webhook', 'webhook_batch', 'journal', 'aws_eventbridge'];
    if (!validDeliveryTypes.includes(registrationData.delivery_type)) {
      throw new IOEventsApiError(
        `Delivery type must be one of: ${validDeliveryTypes.join(', ')}`,
        400
      );
    }

    if (registrationData.runtime_action && registrationData.runtime_action.length > 255) {
      throw new IOEventsApiError('Runtime action must not exceed 255 characters', 400);
    }
  }

  /**
   * Handles errors from the API call
   */
  private handleError(error: any): never {
    // Re-throw validation errors as-is
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
        return 'Bad request: Invalid registration data provided';
      case 401:
        return 'Unauthorized: Invalid or missing authentication';
      case 403:
        return 'Forbidden: Insufficient permissions';
      case 409:
        return 'Conflict: Registration with this name already exists';
      case 422:
        return 'Unprocessable entity: Invalid registration data';
      case 500:
        return 'Internal server error';
      default:
        return `API error: HTTP ${statusCode}`;
    }
  }
}

export default Create;
