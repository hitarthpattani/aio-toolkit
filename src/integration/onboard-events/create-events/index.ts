/**
 * <license header>
 */

import type { Logger } from '@adobe/aio-sdk';
import { EventMetadataManager, type EventMetadata } from '../../../io-events';
import type { ParsedEvent, CreateEventResult, CreateProviderResult } from '../types';

/**
 * Utility class for creating event metadata in Adobe Commerce onboarding integrations
 *
 * @example
 * const logger = Core.Logger('my-create-events', { level: 'debug' });
 * const createEvents = new CreateEvents(
 *   'your-consumer-id',
 *   'your-project-id',
 *   'your-workspace-id',
 *   'your-client-id',
 *   'your-access-token',
 *   logger
 * );
 *
 * // Process events for creation
 * await createEvents.process(events, providerResults);
 */
class CreateEvents {
  private readonly logger: Logger;
  private eventMetadataManager: EventMetadataManager | null = null;

  /**
   * Creates a new CreateEvents instance
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

    // Use the provided logger
    this.logger = logger;

    this.logger.debug(`[INIT] CreateEvents initialized with valid configuration`);
  }

  /**
   * Gets the EventMetadataManager instance (lazy initialization)
   * @private
   * @returns EventMetadataManager instance
   */
  private getEventMetadataManager(): EventMetadataManager {
    if (!this.eventMetadataManager) {
      this.eventMetadataManager = new EventMetadataManager(
        this.clientId,
        this.consumerId,
        this.projectId,
        this.workspaceId,
        this.accessToken
      );
    }
    return this.eventMetadataManager;
  }

  /**
   * Creates event metadata for a specific provider
   * @private
   * @param providerId - Provider ID to create event for
   * @param event - Parsed event data
   * @param existingEvents - Array of existing event metadata
   * @returns Promise<CreateEventResult> - Event creation result
   */
  private async createEvent(
    providerId: string,
    event: ParsedEvent,
    existingEvents: EventMetadata[]
  ): Promise<CreateEventResult> {
    try {
      const eventCode = event.eventCode;
      this.logger.debug(`[INFO] Processing event: ${eventCode}`);

      // Check if event metadata already exists
      const existingEvent = existingEvents.find(metadata => metadata.event_code === eventCode);

      if (existingEvent) {
        this.logger.debug(
          `[INFO] Event code '${eventCode}' already exists for provider ${providerId}`
        );
        this.logger.debug(`[SKIP] Event metadata already exists for: ${eventCode} - skipping`);
        return {
          created: false,
          skipped: true,
          event: {
            id: existingEvent.id,
            eventCode: eventCode,
            ...(existingEvent.label && { label: existingEvent.label }),
            ...(existingEvent.description && { description: existingEvent.description }),
            ...(existingEvent.sample_event_template && {
              sampleEventTemplate: existingEvent.sample_event_template,
            }),
          },
          raw: existingEvent,
        };
      }

      this.logger.debug(`[CREATE] Creating event metadata: ${eventCode}`);

      // Build the payload for EventMetadataInputModel
      const metadataPayload = {
        event_code: eventCode,
        label: eventCode,
        description: eventCode,
        ...(event.sampleEventTemplate ? { sample_event_template: event.sampleEventTemplate } : {}),
      };

      const eventMetadata = this.getEventMetadataManager();
      const result = await eventMetadata.create(providerId, metadataPayload);

      if (result) {
        const eventId = result.id || result.event_code || eventCode;
        this.logger.debug(`[SUCCESS] Event metadata created successfully: ${eventCode}`);

        return {
          created: true,
          skipped: false,
          event: {
            id: eventId,
            eventCode: eventCode,
            label: metadataPayload.label,
            description: metadataPayload.description,
            ...(metadataPayload.sample_event_template && {
              sampleEventTemplate: metadataPayload.sample_event_template,
            }),
          },
          raw: result,
        };
      } else {
        throw new Error('Event metadata creation returned no result');
      }
    } catch (error) {
      const eventCode = event.eventCode;
      this.logger.error(
        `[ERROR] Error creating event metadata for ${eventCode}: ${(error as Error).message}`
      );
      return {
        created: false,
        skipped: false,
        event: {
          eventCode: eventCode,
        },
        error: (error as Error).message,
      };
    }
  }

  /**
   * Fetches existing event metadata for a provider to avoid duplicates
   * @private
   * @param providerId - Provider ID to fetch metadata for
   * @returns Promise<EventMetadata[]> - List of existing event metadata
   */
  private async fetchMetadata(providerId: string): Promise<EventMetadata[]> {
    try {
      this.logger.debug(`[INFO] Fetching existing event metadata for provider: ${providerId}`);

      const eventMetadata = this.getEventMetadataManager();
      const existingList = await eventMetadata.list(providerId);

      this.logger.debug(`[INFO] Found ${existingList.length} existing event metadata entries`);
      return existingList;
    } catch (error) {
      this.logger.error(
        `[ERROR] Error fetching existing metadata for provider ${providerId}: ${(error as Error).message}`
      );
      return [];
    }
  }

  /**
   * Processes events for creation based on parsed events and provider results
   *
   * @param events - Array of parsed events from InputParser
   * @param providerResults - Array of provider creation results
   * @param projectName - Name of the project for enhanced labeling
   * @returns Promise resolving to event creation results
   */
  async process(
    events: ParsedEvent[],
    providerResults: CreateProviderResult[],
    projectName: string = 'Unknown Project'
  ): Promise<CreateEventResult[]> {
    this.logger.debug(`[CREATE] Creating events for project: ${projectName}`);
    this.logger.debug(
      `[INFO] Processing ${events.length} event(s) across ${providerResults.length} provider(s)...`
    );

    if (!events || events.length === 0) {
      this.logger.debug('[INFO] No events to process.');
      return [];
    }

    if (!providerResults || providerResults.length === 0) {
      this.logger.debug('[INFO] No provider results to process.');
      return [];
    }

    try {
      const results: CreateEventResult[] = [];

      for (const providerResult of providerResults) {
        const providerId = providerResult.provider.id;
        if (!providerId) {
          this.logger.debug(
            `[WARN] Skipping provider without ID: ${providerResult.provider.originalLabel}`
          );
          continue;
        }

        this.logger.debug(
          `[INFO] Processing events for provider: ${providerResult.provider.originalLabel}`
        );

        // Fetch existing metadata for this provider
        const existingEvents = await this.fetchMetadata(providerId);

        // Find events that belong to this provider
        const providerEvents = events.filter(
          event => event.providerKey === providerResult.provider.key
        );

        if (providerEvents.length === 0) {
          this.logger.debug(
            `[INFO] No events found for provider: ${providerResult.provider.originalLabel}`
          );
          continue;
        }

        this.logger.debug(`[INFO] Found ${providerEvents.length} event(s) for this provider`);

        // Process each event for this provider
        for (const event of providerEvents) {
          const eventResult = await this.createEvent(providerId, event, existingEvents);
          eventResult.provider = providerResult.provider;
          results.push(eventResult);
        }
      }

      return results;
    } catch (error) {
      this.logger.error(`[ERROR] Event metadata creation failed: ${(error as Error).message}`);
      throw error;
    }
  }
}

export default CreateEvents;
