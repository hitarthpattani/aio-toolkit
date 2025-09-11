/**
 * <license header>
 */

import { Core, Logger } from '@adobe/aio-sdk';
import type { OnboardEventsInput, OnboardEventsResponse } from './types';
import CreateProviders from './create-providers';
import CreateEvents from './create-events';
import CreateRegistrations from './create-registrations';
import InputParser from './input-parser';

/**
 * Utility class for handling onboarding events in Adobe Commerce integrations
 *
 * @example
 * const onboardEvents = new OnboardEvents(
 *   'My Adobe Commerce Project',
 *   'your-consumer-id',
 *   'your-project-id',
 *   'your-workspace-id',
 *   'your-api-key',
 *   'your-access-token'
 * );
 *
 * // Get the configured logger for consistent logging
 * const logger = onboardEvents.getLogger();
 * logger.info('Custom logging with the same configuration');
 *
 * // Process onboard events input
 * await onboardEvents.process({ providers });
 */
class OnboardEvents {
  private readonly logger: Logger;
  private readonly createProviders: CreateProviders;
  private readonly createEvents: CreateEvents;
  private readonly createRegistrations: CreateRegistrations;

  /**
   * Creates a new OnboardEvents instance
   *
   * @param projectName - Name of the Adobe Commerce project
   * @param consumerId - Adobe I/O consumer ID
   * @param projectId - Adobe I/O project ID
   * @param workspaceId - Adobe I/O workspace ID
   * @param apiKey - API key for authentication
   * @param accessToken - Access token for API calls
   */
  constructor(
    private readonly projectName: string,
    private readonly consumerId: string,
    private readonly projectId: string,
    private readonly workspaceId: string,
    private readonly apiKey: string,
    private readonly accessToken: string
  ) {
    if (!projectName) {
      throw new Error('Project name is required');
    }

    if (!consumerId) {
      throw new Error('Consumer ID is required');
    }

    if (!projectId) {
      throw new Error('Project ID is required');
    }

    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    if (!apiKey) {
      throw new Error('API key is required');
    }

    if (!accessToken) {
      throw new Error('Access token is required');
    }

    // create a Logger using project name
    const loggerName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9\s-_]/g, '') // Remove special characters except spaces, hyphens, underscores
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/-{2,}/g, '-') // Replace multiple hyphens with single
      .trim()
      .concat('-onboard-events'); // Add suffix to identify as onboard events logger
    this.logger = Core.Logger(loggerName, { level: 'debug' });

    // Initialize CreateProviders instance
    this.createProviders = new CreateProviders(
      consumerId,
      projectId,
      workspaceId,
      apiKey,
      accessToken,
      this.logger
    );

    // Initialize CreateEvents instance
    this.createEvents = new CreateEvents(
      consumerId,
      projectId,
      workspaceId,
      apiKey, // Using apiKey as clientId
      accessToken,
      this.logger
    );

    // Initialize CreateRegistrations instance
    this.createRegistrations = new CreateRegistrations(
      consumerId,
      projectId,
      workspaceId,
      apiKey, // Using apiKey as clientId
      accessToken,
      this.logger
    );
  }

  /**
   * Gets the configured logger instance for consistent logging
   *
   * @returns The configured logger instance
   */
  getLogger(): Logger {
    return this.logger;
  }

  /**
   * Processes the onboarding events
   *
   * @param input - Onboard events input configuration containing providers, registrations, and events
   * @returns Promise resolving to processing result with created providers
   */
  async process(input: OnboardEventsInput): Promise<OnboardEventsResponse> {
    this.logger.debug(
      `[START] Processing onboard events for project: ${this.projectName} (${this.projectId}) with ${input.providers.length} providers`
    );

    const inputParser = new InputParser(input);
    const entities = inputParser.getEntities();

    // Use CreateProviders to create the providers
    const providerResults = await this.createProviders.process(
      entities.providers,
      this.projectName
    );

    // Log summary of results
    const providersCreated = providerResults.filter(r => r.created).length;
    const providersSkipped = providerResults.filter(r => r.skipped).length;
    const providersFailed = providerResults.filter(r => !r.created && !r.skipped).length;

    this.logger.debug(
      `[SUMMARY] Provider creation summary: ${providersCreated} created, ${providersSkipped} skipped, ${providersFailed} failed`
    );

    // Use CreateEvents to create the events
    const eventResults = await this.createEvents.process(
      entities.events,
      providerResults,
      this.projectName
    );

    const eventsCreated = eventResults.filter(r => r.created).length;
    const eventsSkipped = eventResults.filter(r => r.skipped).length;
    const eventsFailed = eventResults.filter(r => !r.created && !r.skipped).length;

    this.logger.debug(
      `[SUMMARY] Event creation summary: ${eventsCreated} created, ${eventsSkipped} skipped, ${eventsFailed} failed`
    );

    // Use CreateRegistrations to create the registrations
    const registrationResults = await this.createRegistrations.process(
      entities.registrations,
      entities.events,
      providerResults,
      this.projectName
    );

    const registrationsCreated = registrationResults.filter(r => r.created).length;
    const registrationsSkipped = registrationResults.filter(r => r.skipped).length;
    const registrationsFailed = registrationResults.filter(r => !r.created && !r.skipped).length;

    this.logger.debug(
      `[SUMMARY] Registration creation summary: ${registrationsCreated} created, ${registrationsSkipped} skipped, ${registrationsFailed} failed`
    );

    return {
      createdProviders: providerResults,
      createdEvents: eventResults,
      createdRegistrations: registrationResults,
    };
  }
}

export default OnboardEvents;
