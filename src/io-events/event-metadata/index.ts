/**
 * <license header>
 */

import List from './list';
import Get from './get';
import Create from './create';
import Delete from './delete';
import { IOEventsApiError } from '../types';
import { EventMetadata } from './types';
import { EventMetadataInputModel } from './create/types';

/**
 * Main class for managing event metadata operations
 *
 * Provides methods to interact with Adobe I/O Events API for event metadata management.
 * Supports listing, getting, creating, and deleting event metadata for providers.
 */
class EventMetadataManager {
  private readonly listService: List;
  private readonly getService: Get;
  private readonly createService: Create;
  private readonly deleteService: Delete;

  /**
   * Creates an instance of EventMetadataManager
   *
   * @param clientId - Adobe I/O Client ID for API authentication
   * @param consumerId - Consumer organization ID
   * @param projectId - Project ID within the consumer organization
   * @param workspaceId - Workspace ID within the project
   * @param accessToken - Access token for API authentication
   */
  constructor(
    private readonly clientId: string,
    private readonly consumerId: string,
    private readonly projectId: string,
    private readonly workspaceId: string,
    private readonly accessToken: string
  ) {
    this.listService = new List(clientId, consumerId, projectId, workspaceId, accessToken);
    this.getService = new Get(clientId, consumerId, projectId, workspaceId, accessToken);
    this.createService = new Create(clientId, consumerId, projectId, workspaceId, accessToken);
    this.deleteService = new Delete(clientId, consumerId, projectId, workspaceId, accessToken);
  }

  /**
   * Lists all event metadata for a provider
   *
   * @param providerId - The ID of the provider to fetch event metadata for
   * @returns Promise<EventMetadata[]> - Array of event metadata
   * @throws IOEventsApiError - When the API request fails
   *
   * @example
   * // List all event metadata for a provider
   * const allMetadata = await eventMetadata.list('provider-123');
   */
  async list(providerId: string): Promise<EventMetadata[]> {
    try {
      return await this.listService.execute(providerId);
    } catch (error) {
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in event metadata list: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'UNEXPECTED_ERROR'
      );
    }
  }

  /**
   * Gets specific event metadata by provider ID and event code
   *
   * @param providerId - The ID of the provider
   * @param eventCode - The event code to get metadata for
   * @returns Promise<EventMetadata> - The event metadata
   * @throws IOEventsApiError - When the API request fails
   *
   * @example
   * // Get specific event metadata by event code
   * const specificMetadata = await eventMetadata.get('provider-123', 'user.created');
   */
  async get(providerId: string, eventCode: string): Promise<EventMetadata> {
    try {
      return await this.getService.execute(providerId, eventCode);
    } catch (error) {
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in event metadata get: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'UNEXPECTED_ERROR'
      );
    }
  }

  /**
   * Creates new event metadata for a provider
   *
   * @param providerId - The ID of the provider to create event metadata for
   * @param eventMetadataData - The event metadata input data
   * @returns Promise<EventMetadata> - The created event metadata
   * @throws IOEventsApiError - When the API request fails
   *
   * @example
   * // Create new event metadata
   * const newMetadata = await eventMetadata.create('provider-123', {
   *   event_code: 'com.example.user.created',
   *   label: 'User Created',
   *   description: 'Triggered when a new user is created',
   *   sample_event_template: { name: 'John Doe', email: 'john@example.com' } // JSON object
   * });
   */
  async create(
    providerId: string,
    eventMetadataData: EventMetadataInputModel
  ): Promise<EventMetadata> {
    try {
      return await this.createService.execute(providerId, eventMetadataData);
    } catch (error) {
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in event metadata create: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'UNEXPECTED_ERROR'
      );
    }
  }

  /**
   * Deletes event metadata for a provider
   *
   * @param providerId - The ID of the provider to delete event metadata for
   * @param eventCode - Optional event code to delete specific event metadata. If not provided, deletes all event metadata for the provider
   * @returns Promise<void> - No content returned on successful deletion
   * @throws IOEventsApiError - When the API request fails
   *
   * @example
   * // Delete all event metadata for a provider
   * await eventMetadata.delete('provider-123');
   *
   * @example
   * // Delete specific event metadata by event code
   * await eventMetadata.delete('provider-123', 'com.example.user.created');
   */
  async delete(providerId: string, eventCode?: string): Promise<void> {
    try {
      return await this.deleteService.execute(providerId, eventCode);
    } catch (error) {
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in event metadata delete: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'UNEXPECTED_ERROR'
      );
    }
  }
}

export default EventMetadataManager;
