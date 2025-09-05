/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import RestClient from '../../../integration/rest-client';
import { IOEventsApiError, IoEventsGlobals } from '../../types';
import { EventMetadata } from '../types';
import { EventMetadataListResponse } from './types';

/**
 * Service class for listing all event metadata for a provider
 *
 * Handles: GET /events/providers/{providerId}/eventmetadata
 */
export default class List {
  private readonly restClient: RestClient;

  /**
   * Creates an instance of List service
   *
   * @param clientId - The Adobe I/O client ID (API key)
   * @param consumerId - The consumer organization ID
   * @param projectId - The project ID
   * @param workspaceId - The workspace ID
   * @param accessToken - The access token for authentication
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
   * Retrieves all event metadata for a provider with automatic pagination
   *
   * This method automatically follows pagination links to fetch all event metadata
   * across multiple pages, returning a complete array of all event metadata.
   *
   * @param providerId - The ID of the provider to fetch event metadata for
   * @returns Promise<EventMetadata[]> - Array of all event metadata across all pages
   * @throws IOEventsApiError - When the API request fails
   */
  async execute(providerId: string): Promise<EventMetadata[]> {
    if (!providerId?.trim()) {
      throw new IOEventsApiError(
        'providerId is required and cannot be empty',
        400,
        'VALIDATION_ERROR'
      );
    }

    try {
      const url = `${IoEventsGlobals.BASE_URL}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/providers/${providerId}/eventmetadata`;
      return await this.fetchAllPages(url);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Recursively fetches all pages of event metadata using pagination links
   *
   * @param url - The URL to fetch (either initial URL or next page URL)
   * @param accumulatedResults - Array to accumulate results across pages
   * @returns Promise<EventMetadata[]> - Complete array of all event metadata
   * @private
   */
  private async fetchAllPages(
    url: string,
    accumulatedResults: EventMetadata[] = []
  ): Promise<EventMetadata[]> {
    const response = await this.restClient.get(url, {
      Authorization: `Bearer ${this.accessToken}`,
      'x-api-key': this.clientId,
      Accept: 'application/hal+json',
    });

    // Validate response format
    if (response === null || response === undefined) {
      throw new IOEventsApiError(
        'Invalid response format: Expected object',
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        'PARSE_ERROR'
      );
    }

    if (typeof response !== 'object') {
      throw new IOEventsApiError(
        'Invalid response format: Expected object',
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        'PARSE_ERROR'
      );
    }

    const data = response as EventMetadataListResponse;

    // Validate _embedded structure
    if (!data._embedded || !Array.isArray(data._embedded.eventmetadata)) {
      throw new IOEventsApiError(
        'Invalid response format: Expected eventmetadata array',
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        'PARSE_ERROR'
      );
    }

    const currentPageResults = data._embedded.eventmetadata;

    // Accumulate results from current page
    const allResults = [...accumulatedResults, ...currentPageResults];

    // Check if there's a next page
    const nextPageUrl = data._links?.next?.href;

    if (nextPageUrl) {
      // Recursively fetch the next page
      return await this.fetchAllPages(nextPageUrl, allResults);
    }

    // No more pages, return all accumulated results
    return allResults;
  }

  /**
   * Handles errors from the API request
   *
   * @param error - The error object from the API request
   * @throws IOEventsApiError - Always throws with appropriate error details
   */
  private handleError(error: any): never {
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
        error.response.body,
        error.response.headers
      );
    }

    // Handle other types of errors (network, timeout, parsing, etc.)
    let errorMessage: string;
    let statusCode: number;

    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Request timeout while listing event metadata';
        statusCode = IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT;
      } else if (error.message.includes('JSON') || error.message.includes('parse')) {
        errorMessage = 'Invalid response format from Adobe I/O Events API';
        statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
        throw new IOEventsApiError(errorMessage, statusCode, 'PARSE_ERROR');
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
   */
  private extractStatusCode(error: any): number {
    return error.response?.status || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
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
   * Gets a human-readable error message for a given HTTP status code
   *
   * @param statusCode - The HTTP status code
   * @returns A descriptive error message
   */
  private getErrorMessageForStatus(statusCode: number): string {
    switch (statusCode) {
      case IoEventsGlobals.STATUS_CODES.BAD_REQUEST:
        return 'Invalid request parameters for listing event metadata';
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return 'Authentication failed. Please check your access token';
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return 'Access forbidden. You do not have permission to access event metadata';
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return 'Provider not found or no event metadata available';
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return 'Internal server error occurred while listing event metadata';
      default:
        return `Unexpected error occurred: HTTP ${statusCode}`;
    }
  }
}
