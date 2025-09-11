/**
 * <license header>
 */

import type { Logger } from '@adobe/aio-sdk';
import { RegistrationManager } from '../../../io-events/registration';
import type { Registration } from '../../../io-events/registration/types';
import type { RegistrationCreateModel } from '../../../io-events/registration/create/types';
import type {
  ParsedRegistration,
  ParsedEvent,
  CreateRegistrationResult,
  CreateProviderResult,
} from '../types';

/**
 * Utility class for creating registrations in Adobe Commerce onboarding integrations
 *
 * @example
 * const logger = Core.Logger('my-create-registrations', { level: 'debug' });
 * const createRegistrations = new CreateRegistrations(
 *   'your-consumer-id',
 *   'your-project-id',
 *   'your-workspace-id',
 *   'your-client-id',
 *   'your-access-token',
 *   logger
 * );
 *
 * // Process registrations for creation
 * await createRegistrations.process(registrations, providerResults);
 */
class CreateRegistrations {
  private readonly logger: Logger;
  private registrationManager?: RegistrationManager;

  /**
   * Creates a new CreateRegistrations instance
   *
   * @param consumerId - Adobe I/O consumer ID
   * @param projectId - Adobe I/O project ID
   * @param workspaceId - Adobe I/O workspace ID
   * @param clientId - Adobe I/O client ID
   * @param accessToken - Adobe I/O access token
   * @param logger - Logger instance for consistent logging
   */
  constructor(
    private readonly consumerId: string,
    private readonly projectId: string,
    private readonly workspaceId: string,
    private readonly clientId: string,
    private readonly accessToken: string,
    logger: Logger
  ) {
    // Validate configuration
    const config = {
      consumerId: this.consumerId,
      projectId: this.projectId,
      workspaceId: this.workspaceId,
      clientId: this.clientId,
      accessToken: this.accessToken,
    };

    const required = ['consumerId', 'projectId', 'workspaceId', 'clientId', 'accessToken'];
    const missing = required.filter(
      key => !config[key as keyof typeof config] || config[key as keyof typeof config].trim() === ''
    );

    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }

    if (!logger) {
      throw new Error('Logger is required');
    }

    this.logger = logger;
    this.logger.debug(`[INIT] CreateRegistrations initialized with valid configuration`);
  }

  /**
   * Process multiple registrations for creation
   *
   * @param registrations - Array of parsed registrations to process
   * @param events - Array of parsed events for registration creation
   * @param providerResults - Array of provider results to link registrations to
   * @param projectName - Optional project name for logging
   * @returns Promise resolving to array of registration creation results
   */
  async process(
    registrations: ParsedRegistration[],
    events: ParsedEvent[],
    providerResults: CreateProviderResult[],
    projectName: string = 'Unknown Project'
  ): Promise<CreateRegistrationResult[]> {
    this.logger.debug(`[INFO] Creating registrations for project: ${projectName}`);
    this.logger.debug(
      `[PROCESSING] Processing ${registrations.length} registration(s) with ${events.length} event(s) across ${providerResults.length} provider(s)...`
    );

    if (!registrations || registrations.length === 0) {
      this.logger.debug('[SKIP] No registrations to process.');
      return [];
    }

    if (!events || events.length === 0) {
      this.logger.debug('[SKIP] No events to process.');
      return [];
    }

    if (!providerResults || providerResults.length === 0) {
      this.logger.debug('[SKIP] No provider results to process.');
      return [];
    }

    try {
      // Fetch existing registrations first
      const existingRegistrations = await this.fetchRegistrations();

      const results: CreateRegistrationResult[] = [];

      for (const registration of registrations) {
        this.logger.debug(`[PROCESSING] Processing registration: ${registration.label}`);

        // Find events that belong to this registration
        const registrationEvents = events.filter(
          event => event.registrationKey === registration.key
        );

        if (registrationEvents.length === 0) {
          this.logger.debug(`[SKIP] No events found for registration: ${registration.label}`);
          continue;
        }

        this.logger.debug(
          `[INFO] Found ${registrationEvents.length} event(s) for this registration`
        );

        // Group events by provider to create separate registrations per provider
        const eventsByProvider = this.groupEventsByProvider(registrationEvents);

        for (const [providerLabel, providerEvents] of Object.entries(eventsByProvider)) {
          const provider = providerResults.find(p => p.provider.originalLabel === providerLabel);

          if (!provider || !provider.provider.id) {
            this.logger.debug(`[SKIP] Provider not found or missing ID for: ${providerLabel}`);
            continue;
          }

          const result = await this.createRegistration(
            registration,
            providerEvents,
            provider,
            existingRegistrations
          );
          results.push(result);
        }
      }

      return results;
    } catch (error) {
      this.logger.error(`[ERROR] Registration creation failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Lazy initialization of RegistrationManager
   * @private
   * @returns RegistrationManager instance
   */
  private getRegistrationManager(): RegistrationManager {
    if (!this.registrationManager) {
      this.registrationManager = new RegistrationManager(
        this.clientId,
        this.consumerId,
        this.projectId,
        this.workspaceId,
        this.accessToken
      );
    }
    return this.registrationManager;
  }

  /**
   * Fetches existing registrations to avoid duplicates
   * @returns {Promise<Map>} Map of existing registrations by name
   */
  async fetchRegistrations(): Promise<Map<string, Registration>> {
    this.logger.debug('[INFO] Fetching existing registrations...');

    try {
      const registrationSDK = this.getRegistrationManager();
      const registrationList = await registrationSDK.list();

      const existingRegistrations = new Map<string, Registration>();
      registrationList.forEach(registration => {
        existingRegistrations.set(registration.name, registration);
      });

      this.logger.debug(`[INFO] Found ${existingRegistrations.size} existing registrations`);
      return existingRegistrations;
    } catch (error) {
      this.logger.error(
        `[ERROR] Failed to fetch existing registrations: ${(error as Error).message}`
      );
      throw error;
    }
  }

  /**
   * Groups events by their provider key
   * @private
   * @param events - Events to group
   * @returns Events grouped by provider key
   */
  private groupEventsByProvider(events: ParsedEvent[]): Record<string, ParsedEvent[]> {
    const grouped: Record<string, ParsedEvent[]> = {};

    events.forEach(event => {
      if (!grouped[event.providerKey]) {
        grouped[event.providerKey] = [];
      }
      grouped[event.providerKey]!.push(event);
    });

    return grouped;
  }

  /**
   * Builds registration input object for Adobe I/O API
   * @private
   * @param registration - Registration entity
   * @param events - Events for this registration
   * @param provider - Provider result
   * @param registrationName - Enhanced registration name
   * @param firstEvent - First event for common properties
   * @returns Registration input for API
   */
  private preparePayload(
    registration: ParsedRegistration,
    events: ParsedEvent[],
    provider: CreateProviderResult,
    registrationName: string,
    firstEvent: ParsedEvent
  ): RegistrationCreateModel {
    // Build events of interest array
    const eventsOfInterest = events.map(event => ({
      provider_id: provider.provider.id || '',
      event_code: event.eventCode,
    }));

    const input: RegistrationCreateModel = {
      client_id: this.clientId,
      name: registrationName,
      description: registration.description || registrationName,
      delivery_type:
        (firstEvent.deliveryType as 'webhook' | 'webhook_batch' | 'journal' | 'aws_eventbridge') ||
        'webhook',
      events_of_interest: eventsOfInterest,
      ...(firstEvent.runtimeAction && { runtime_action: firstEvent.runtimeAction }),
    };

    return input;
  }

  /**
   * Creates a single registration for a provider and its events
   * @private
   * @param registrationData - Registration entity
   * @param events - Events for this registration
   * @param provider - Provider result
   * @param existingRegistrations - Map of existing registrations
   * @returns Registration creation result
   */
  private async createRegistration(
    registrationData: ParsedRegistration,
    events: ParsedEvent[],
    provider: CreateProviderResult,
    existingRegistrations: Map<string, Registration>
  ): Promise<CreateRegistrationResult> {
    // Use the first event to get common properties (runtimeAction, deliveryType)
    const firstEvent = events[0];
    if (!firstEvent) {
      throw new Error('No events provided for registration creation');
    }

    const registrationName = registrationData.label;

    this.logger.debug(
      `[PROCESSING] Processing registration: ${registrationData.label} for provider: ${provider.provider.originalLabel}`
    );
    this.logger.debug(`[INFO] Registration name: ${registrationName}`);

    // Check if registration already exists
    const existingRegistration = existingRegistrations.get(registrationName);

    if (existingRegistration) {
      this.logger.debug('[SKIP] Registration already exists - skipping creation');
      this.logger.debug(`[INFO] Existing ID: ${existingRegistration.id}`);

      return {
        created: false,
        skipped: true,
        registration: {
          id: existingRegistration.id,
          key: registrationData.key,
          label: registrationData.label,
          originalLabel: registrationData.label,
          name: registrationName,
          description: registrationData.description,
        },
        reason: 'Already exists',
        raw: existingRegistration,
      };
    }

    // Create new registration
    this.logger.debug('[CREATE] Creating new registration...');

    try {
      const registrationInput = this.preparePayload(
        registrationData,
        events,
        provider,
        registrationName,
        firstEvent
      );
      this.logger.debug(`[INFO] Registration input: ${JSON.stringify(registrationInput, null, 2)}`);

      const registrationSDK = this.getRegistrationManager();
      const createdRegistration = await registrationSDK.create(registrationInput);

      this.logger.debug('[SUCCESS] Registration created successfully!');
      this.logger.debug(`[INFO] New ID: ${createdRegistration.id}`);
      this.logger.debug(`[INFO] Registration ID: ${createdRegistration.registration_id}`);

      const result = {
        created: true,
        skipped: false,
        registration: {
          id: createdRegistration.id,
          key: registrationData.key,
          label: registrationData.label,
          originalLabel: registrationData.label,
          name: createdRegistration.name,
          description: registrationData.description,
        },
        provider: provider.provider,
        raw: createdRegistration,
      };

      return result;
    } catch (error) {
      this.logger.error(
        `[ERROR] Failed to create registration "${registrationName}": ${(error as Error).message}`
      );

      return {
        created: false,
        skipped: false,
        error: (error as Error).message,
        registration: {
          key: registrationData.key,
          label: registrationData.label,
          originalLabel: registrationData.label,
          name: registrationName,
          description: registrationData.description,
        },
        provider: provider.provider,
      };
    }
  }
}

export default CreateRegistrations;
