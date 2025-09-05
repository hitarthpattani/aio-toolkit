/**
 * <license header>
 */

import Create from './create';
import Delete from './delete';
import Get from './get';
import List from './list';
import type { Registration } from './types';
import type { RegistrationCreateModel } from './create/types';
import type { ListRegistrationQueryParams } from './list/types';

/**
 * Manager class for registration operations
 */
export class RegistrationManager {
  private createService: Create;
  private deleteService: Delete;
  private getService: Get;
  private listService: List;

  /**
   * Initialize the RegistrationManager
   */
  constructor(
    clientId: string,
    consumerId: string,
    projectId: string,
    workspaceId: string,
    accessToken: string
  ) {
    this.createService = new Create(clientId, consumerId, projectId, workspaceId, accessToken);
    this.deleteService = new Delete(clientId, consumerId, projectId, workspaceId, accessToken);
    this.getService = new Get(clientId, consumerId, projectId, workspaceId, accessToken);
    this.listService = new List(clientId, consumerId, projectId, workspaceId, accessToken);
  }

  /**
   * Create a new registration
   *
   * @param registrationData - The registration data to create
   * @returns Promise<Registration> - The created registration
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
  async create(registrationData: RegistrationCreateModel): Promise<Registration> {
    return await this.createService.execute(registrationData);
  }

  /**
   * Delete a registration by ID
   *
   * @param registrationId - The registration ID to delete
   * @returns Promise<void> - Resolves when deletion is successful
   *
   * @example
   * ```typescript
   * await registrationManager.delete('your-registration-id');
   * console.log('Registration deleted successfully');
   * ```
   */
  async delete(registrationId: string): Promise<void> {
    return await this.deleteService.execute(registrationId);
  }

  /**
   * Get a registration by ID
   *
   * @param registrationId - The registration ID to retrieve
   * @returns Promise<Registration> - The registration data
   *
   * @example
   * ```typescript
   * const registration = await registrationManager.get('your-registration-id');
   * console.log(registration.name);
   * ```
   */
  async get(registrationId: string): Promise<Registration> {
    return await this.getService.execute(registrationId);
  }

  /**
   * List all registrations with automatic pagination
   *
   * @param queryParams - Optional query parameters for filtering
   * @returns Promise<Registration[]> - Array of all registrations across all pages
   *
   * @example
   * ```typescript
   * // List all registrations
   * const registrations = await registrationManager.list();
   *
   * // List with query parameters
   * const filteredRegistrations = await registrationManager.list({
   *   enabled: true
   * });
   * ```
   */
  async list(queryParams?: ListRegistrationQueryParams): Promise<Registration[]> {
    return await this.listService.execute(queryParams);
  }
}

export default RegistrationManager;
