/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import List from './list';
import Get from './get';
import Create from './create';
import Delete from './delete';
import { IOEventsApiError } from '../types';
import { Provider } from './types';
import { GetProviderQueryParams } from './get/types';
import { ListProvidersQueryParams } from './list/types';
import { ProviderInputModel } from './create/types';

/**
 * Providers service for Adobe I/O Events
 *
 * This class provides methods to interact with event providers in Adobe I/O Events.
 * It handles authentication and provides a clean interface for provider operations.
 */
class ProviderManager {
  private readonly listService: List;
  private readonly getService: Get;
  private readonly createService: Create;
  private readonly deleteService: Delete;

  /**
   * Constructor for Providers service
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
    this.listService = new List(clientId, consumerId, projectId, workspaceId, accessToken);
    this.getService = new Get(clientId, consumerId, projectId, workspaceId, accessToken);
    this.createService = new Create(clientId, consumerId, projectId, workspaceId, accessToken);
    this.deleteService = new Delete(clientId, consumerId, projectId, workspaceId, accessToken);
  }

  /**
   * List all event providers entitled to the provided organization ID
   *
   * @param queryParams - Optional query parameters for filtering providers
   * @param queryParams.providerMetadataId - Filter by provider metadata id
   * @param queryParams.instanceId - Filter by instance id
   * @param queryParams.providerMetadataIds - List of provider metadata ids to filter (mutually exclusive with providerMetadataId)
   * @param queryParams.eventmetadata - Boolean to fetch provider's event metadata (default: false)
   * @returns Promise<Provider[]> - Array of providers
   * @throws IOEventsApiError - When API call fails with specific error details
   *
   * @example
   * ```typescript
   * // List all providers
   * const providers = await providersService.list();
   *
   * // Filter by provider metadata ID
   * const customProviders = await providersService.list({
   *   providerMetadataId: '3rd_party_custom_events'
   * });
   *
   * // Include event metadata in response
   * const providersWithMetadata = await providersService.list({
   *   eventmetadata: true
   * });
   * ```
   */
  async list(queryParams: ListProvidersQueryParams = {}): Promise<Provider[]> {
    try {
      return await this.listService.execute(queryParams);
    } catch (error) {
      // Re-throw IOEventsApiError as-is, or wrap other errors
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in providers list: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'UNEXPECTED_ERROR'
      );
    }
  }

  /**
   * Get a specific event provider by its ID
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
   * const provider = await providersService.get('provider-123');
   *
   * // Get provider details with event metadata
   * const providerWithMetadata = await providersService.get('provider-123', {
   *   eventmetadata: true
   * });
   * ```
   */
  async get(providerId: string, queryParams: GetProviderQueryParams = {}): Promise<Provider> {
    try {
      return await this.getService.execute(providerId, queryParams);
    } catch (error) {
      // Re-throw IOEventsApiError as-is, or wrap other errors
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in providers get: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'UNEXPECTED_ERROR'
      );
    }
  }

  /**
   * Create a new event provider
   *
   * @param providerData - Provider input data
   * @param providerData.label - The label of this event provider (required)
   * @param providerData.description - Optional description for the provider
   * @param providerData.docs_url - Optional documentation URL for the provider
   * @param providerData.provider_metadata - Optional provider metadata ID (defaults to '3rd_party_custom_events')
   * @param providerData.instance_id - Optional technical instance ID
   * @param providerData.data_residency_region - Optional data residency region (defaults to 'va6')
   * @returns Promise<Provider> - The created provider
   * @throws IOEventsApiError - When API call fails with specific error details
   *
   * @example
   * ```typescript
   * // Create a basic provider
   * const provider = await providersService.create({
   *   label: 'My Event Provider'
   * });
   *
   * // Create a provider with custom details
   * const customProvider = await providersService.create({
   *   label: 'My Custom Provider',
   *   description: 'Provider for custom business events',
   *   provider_metadata: '3rd_party_custom_events',
   *   instance_id: 'production-instance'
   * });
   * ```
   */
  async create(providerData: ProviderInputModel): Promise<Provider> {
    try {
      return await this.createService.execute(providerData);
    } catch (error) {
      // Re-throw IOEventsApiError as-is, or wrap other errors
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in providers create: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'UNEXPECTED_ERROR'
      );
    }
  }

  /**
   * Delete an event provider by ID
   *
   * @param providerId - The ID of the provider to delete
   * @returns Promise<void> - Resolves when provider is successfully deleted
   * @throws IOEventsApiError - When API call fails with specific error details
   *
   * @example
   * ```typescript
   * // Delete a provider by ID
   * await providersService.delete('provider-123');
   * console.log('Provider deleted successfully');
   * ```
   */
  async delete(providerId: string): Promise<void> {
    try {
      return await this.deleteService.execute(providerId);
    } catch (error) {
      // Re-throw IOEventsApiError as-is, or wrap other errors
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in providers delete: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500,
        'UNEXPECTED_ERROR'
      );
    }
  }
}

export default ProviderManager;
