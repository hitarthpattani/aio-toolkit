/**
 * <license header>
 */

import RestClient from '../../../integration/rest-client';
import { IOEventsApiError, IoEventsGlobals } from '../../types';
import type { Registration } from '../types';
import type { RegistrationListResponse, ListRegistrationQueryParams } from './types';

/**
 * Service for listing registrations with automatic pagination
 */
export class List {
  private restClient: RestClient;
  private endpoint: string;
  private clientId: string;
  private consumerId: string;
  private projectId: string;
  private workspaceId: string;
  private accessToken: string;

  /**
   * Initialize the List service
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
   * Execute registration list with automatic pagination
   */
  async execute(queryParams?: ListRegistrationQueryParams): Promise<Registration[]> {
    try {
      this.validateInputs();

      let url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/registrations`;

      // Add query parameters if provided
      if (queryParams && Object.keys(queryParams).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        if (searchParams.toString()) {
          url += `?${searchParams.toString()}`;
        }
      }

      return await this.fetchAllPages(url);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  /**
   * Fetch all pages recursively
   */
  private async fetchAllPages(
    url: string,
    accumulatedResults: Registration[] = []
  ): Promise<Registration[]> {
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'x-api-key': this.clientId,
      'Content-Type': 'application/json',
    };

    const data = (await this.restClient.get(url, headers)) as RegistrationListResponse;

    // Extract registrations from current page
    const currentPageRegistrations = data._embedded?.registrations || [];
    const allResults = [...accumulatedResults, ...currentPageRegistrations];

    // Check if there's a next page
    const nextPageUrl = data._links?.next?.href;
    if (nextPageUrl) {
      // Recursively fetch the next page
      return await this.fetchAllPages(nextPageUrl, allResults);
    }

    return allResults;
  }

  /**
   * Validate required inputs
   */
  private validateInputs(): void {
    if (!this.consumerId?.trim()) {
      throw new IOEventsApiError(
        'Consumer ID is required',
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST
      );
    }
    if (!this.projectId?.trim()) {
      throw new IOEventsApiError(
        'Project ID is required',
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST
      );
    }
    if (!this.workspaceId?.trim()) {
      throw new IOEventsApiError(
        'Workspace ID is required',
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST
      );
    }
    if (!this.accessToken?.trim()) {
      throw new IOEventsApiError(
        'Access token is required',
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST
      );
    }
  }

  /**
   * Handle and categorize errors
   */
  private handleError(error: any): never {
    // Handle RestClient HTTP errors (e.g., "HTTP error! status: 404")
    if (error instanceof Error && error.message.includes('HTTP error! status:')) {
      const statusCode = this.extractStatusCodeFromMessage(error.message);
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }

    // Handle structured API error responses
    if (error.response) {
      const statusCode =
        error.response.status || error.status || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }

    // Handle other errors
    if (error instanceof IOEventsApiError) {
      throw error;
    }

    // Default error handling
    throw new IOEventsApiError(
      error.message || 'An unexpected error occurred while listing registrations',
      IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }

  /**
   * Extract status code from error message
   */
  private extractStatusCodeFromMessage(errorMessage: string): number {
    const match = errorMessage.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1]!, 10) : IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }

  /**
   * Get appropriate error message for status code
   */
  private getErrorMessageForStatus(statusCode: number): string {
    switch (statusCode) {
      case IoEventsGlobals.STATUS_CODES.BAD_REQUEST:
        return 'Bad request. Please check your input parameters';
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return 'Unauthorized. Please check your access token';
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return 'Forbidden. You do not have permission to access registrations';
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return 'Registrations not found. The specified workspace may not exist or have no registrations';
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return 'Internal server error. Please try again later';
      default:
        return `API request failed with status ${statusCode}`;
    }
  }
}

export default List;
