/**
 * <license header>
 */

import RestClient from '../../../integration/rest-client';
import { IOEventsApiError, IoEventsGlobals } from '../../types';
import { EventMetadata } from '../types';
import { EventMetadataInputModel } from './types';

/**
 * Create event metadata for Adobe I/O Events
 *
 * This class handles the creation of event metadata for a specific provider.
 * It validates the input data and makes the appropriate API call to create
 * the event metadata in Adobe I/O Events.
 */
class Create {
  private readonly endpoint: string = IoEventsGlobals.BASE_URL;
  private readonly restClient: RestClient;

  /**
   * Constructor for Create event metadata service
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
   * Execute the create event metadata API call
   *
   * @param providerId - The ID of the provider to create event metadata for
   * @param eventMetadataData - The event metadata input model
   * @returns Promise<EventMetadata> - The created event metadata
   * @throws IOEventsApiError - When API call fails with specific error details
   */
  async execute(
    providerId: string,
    eventMetadataData: EventMetadataInputModel
  ): Promise<EventMetadata> {
    try {
      // Validate required parameters
      if (!providerId?.trim()) {
        throw new IOEventsApiError(
          'providerId is required and cannot be empty',
          400,
          'VALIDATION_ERROR'
        );
      }

      if (!eventMetadataData) {
        throw new IOEventsApiError('eventMetadataData is required', 400, 'VALIDATION_ERROR');
      }

      // Validate required fields in eventMetadataData
      this.validateEventMetadataInput(eventMetadataData);

      // Convert the input data for API submission
      const apiPayload = this.convertToApiPayload(eventMetadataData);

      // Build the API URL
      const url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/providers/${providerId}/eventmetadata`;

      // Prepare headers as required by the API
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        'x-api-key': this.clientId,
        Accept: 'application/hal+json',
        'Content-Type': 'application/json',
      };

      // Make the POST request
      const response: EventMetadata = await this.restClient.post(url, headers, apiPayload);

      // Validate response format
      if (response === null || response === undefined) {
        throw new IOEventsApiError(
          'Invalid response format: Expected object',
          IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR
        );
      }

      if (typeof response !== 'object') {
        throw new IOEventsApiError(
          'Invalid response format: Expected object',
          IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR
        );
      }

      return response;
    } catch (error: any) {
      // Handle different types of errors
      this.handleError(error);
    }
  }

  /**
   * Validates the event metadata input data
   *
   * @param eventMetadataData - The event metadata input to validate
   * @throws Error - When validation fails
   * @private
   */
  private validateEventMetadataInput(eventMetadataData: EventMetadataInputModel): void {
    const { description, label, event_code, sample_event_template } = eventMetadataData;

    // Validate required fields
    if (!description?.trim()) {
      throw new IOEventsApiError(
        'description is required and cannot be empty',
        400,
        'VALIDATION_ERROR'
      );
    }

    if (!label?.trim()) {
      throw new IOEventsApiError('label is required and cannot be empty', 400, 'VALIDATION_ERROR');
    }

    if (!event_code?.trim()) {
      throw new IOEventsApiError(
        'event_code is required and cannot be empty',
        400,
        'VALIDATION_ERROR'
      );
    }

    // Validate field lengths
    if (description.length > 255) {
      throw new Error('description cannot exceed 255 characters');
    }

    if (label.length > 255) {
      throw new Error('label cannot exceed 255 characters');
    }

    if (event_code.length > 255) {
      throw new Error('event_code cannot exceed 255 characters');
    }

    // Validate patterns (basic validation - API will do full validation)
    const descriptionPattern = /^[\w\s\-_.(),:''`?#!]+$/;
    if (!descriptionPattern.test(description)) {
      throw new Error('description contains invalid characters');
    }

    const labelPattern = /^[\w\s\-_.(),:''`?#!]+$/;
    if (!labelPattern.test(label)) {
      throw new Error('label contains invalid characters');
    }

    const eventCodePattern = /^[\w\-_.]+$/;
    if (!eventCodePattern.test(event_code)) {
      throw new Error('event_code contains invalid characters');
    }

    // Validate sample_event_template if provided
    if (sample_event_template !== undefined) {
      if (typeof sample_event_template !== 'object' || sample_event_template === null) {
        throw new Error('sample_event_template must be a valid JSON object');
      }

      try {
        // Check if the JSON string representation would exceed the base64 limit
        // Base64 encoding increases size by ~33%, so we check the JSON string length
        const jsonString = JSON.stringify(sample_event_template);
        const base64Length = Buffer.from(jsonString).toString('base64').length;

        if (base64Length > 87382) {
          throw new Error('sample_event_template JSON object is too large when base64 encoded');
        }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('sample_event_template JSON object is too large')
        ) {
          throw error; // Re-throw our validation error
        }
        throw new Error('sample_event_template must be a valid JSON object');
      }
    }
  }

  /**
   * Converts the input data to the format expected by the API
   *
   * @param eventMetadataData - The event metadata input data
   * @returns The converted payload for the API
   * @private
   */
  private convertToApiPayload(eventMetadataData: EventMetadataInputModel): any {
    const { sample_event_template, ...rest } = eventMetadataData;

    const payload: any = { ...rest };

    // Convert sample_event_template from JSON object to base64 string if provided
    if (sample_event_template !== undefined) {
      payload.sample_event_template = Buffer.from(JSON.stringify(sample_event_template)).toString(
        'base64'
      );
    }

    return payload;
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
        errorMessage = 'Request timeout while creating event metadata';
        statusCode = IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT;
      } else if (
        error.message.includes('is required') ||
        error.message.includes('cannot be empty') ||
        error.message.includes('cannot exceed') ||
        error.message.includes('contains invalid characters') ||
        error.message.includes('must be a valid') ||
        error.message.includes('too large when base64 encoded')
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
      case IoEventsGlobals.STATUS_CODES.BAD_REQUEST:
        return 'Invalid request parameters for creating event metadata';
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return 'Authentication failed. Please check your access token';
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return 'Access forbidden. You do not have permission to create event metadata';
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return 'Provider not found. The specified provider ID does not exist';
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return 'Internal server error occurred while creating event metadata';
      default:
        return `Unexpected error occurred: HTTP ${statusCode}`;
    }
  }
}

export default Create;
