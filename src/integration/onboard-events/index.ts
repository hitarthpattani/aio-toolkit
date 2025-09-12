/**
 * <license header>
 */

import { Core, Logger } from '@adobe/aio-sdk';
import type { OnboardEventsInput, OnboardEventsResponse, OnboardEventsSummary } from './types';
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

    // Use CreateEvents to create the events
    const eventResults = await this.createEvents.process(
      entities.events,
      providerResults,
      this.projectName
    );

    // Use CreateRegistrations to create the registrations
    const registrationResults = await this.createRegistrations.process(
      entities.registrations,
      entities.events,
      providerResults,
      this.projectName
    );

    const response = {
      createdProviders: providerResults,
      createdEvents: eventResults,
      createdRegistrations: registrationResults,
    };

    // Generate and log comprehensive summary
    const summary = this.generateSummary(response);
    this.logSummary(summary);

    return response;
  }

  /**
   * Generates a concise summary of onboard events processing results
   * @private
   * @param response - The response from the onboard events processing
   * @returns A concise summary with IDs and status information
   */
  private generateSummary(response: OnboardEventsResponse): OnboardEventsSummary {
    // Process providers
    const providerItems = response.createdProviders.map(result => ({
      id: result.provider.id,
      key: result.provider.key,
      label: result.provider.label,
      status: result.created
        ? ('created' as const)
        : result.skipped
          ? ('existing' as const)
          : ('failed' as const),
      error: result.error,
    }));

    const providerCounts = {
      created: response.createdProviders.filter(r => r.created).length,
      existing: response.createdProviders.filter(r => r.skipped).length,
      failed: response.createdProviders.filter(r => !r.created && !r.skipped).length,
      total: response.createdProviders.length,
    };

    // Process events
    const eventItems = response.createdEvents.map(result => ({
      id: result.event.id,
      eventCode: result.event.eventCode,
      label: result.event.eventCode,
      status: result.created
        ? ('created' as const)
        : result.skipped
          ? ('existing' as const)
          : ('failed' as const),
      provider: result.provider?.key,
      error: result.error,
    }));

    const eventCounts = {
      created: response.createdEvents.filter(r => r.created).length,
      existing: response.createdEvents.filter(r => r.skipped).length,
      failed: response.createdEvents.filter(r => !r.created && !r.skipped).length,
      total: response.createdEvents.length,
    };

    // Process registrations
    const registrationItems = response.createdRegistrations.map(result => ({
      id: result.registration.id,
      key: result.registration.key,
      label: result.registration.label,
      status: result.created
        ? ('created' as const)
        : result.skipped
          ? ('existing' as const)
          : ('failed' as const),
      provider: result.provider?.key,
      error: result.error,
    }));

    const registrationCounts = {
      created: response.createdRegistrations.filter(r => r.created).length,
      existing: response.createdRegistrations.filter(r => r.skipped).length,
      failed: response.createdRegistrations.filter(r => !r.created && !r.skipped).length,
      total: response.createdRegistrations.length,
    };

    // Calculate overall totals
    const overall = {
      totalProcessed: providerCounts.total + eventCounts.total + registrationCounts.total,
      totalCreated: providerCounts.created + eventCounts.created + registrationCounts.created,
      totalExisting: providerCounts.existing + eventCounts.existing + registrationCounts.existing,
      totalFailed: providerCounts.failed + eventCounts.failed + registrationCounts.failed,
    };

    return {
      providers: {
        items: providerItems,
        counts: providerCounts,
      },
      events: {
        items: eventItems,
        counts: eventCounts,
      },
      registrations: {
        items: registrationItems,
        counts: registrationCounts,
      },
      overall,
    };
  }

  /**
   * Logs a formatted summary of onboard events processing results
   * @private
   * @param summary - The summary to log
   */
  private logSummary(summary: OnboardEventsSummary): void {
    this.logger.info('='.repeat(60));
    this.logger.info(`📊 ONBOARD EVENTS SUMMARY - ${this.projectName}`);
    this.logger.info('='.repeat(60));

    this.logger.info('');
    // Overall summary
    this.logger.info(
      `📈 OVERALL: ${summary.overall.totalProcessed} processed | ${summary.overall.totalCreated} created | ${summary.overall.totalExisting} existing | ${summary.overall.totalFailed} failed`
    );
    this.logger.info('');

    // Providers summary
    if (summary.providers.counts.total > 0) {
      this.logger.info(`🏭 PROVIDERS (${summary.providers.counts.total}):`);
      summary.providers.items.forEach(item => {
        const status = item.status === 'created' ? '✅' : item.status === 'existing' ? '⏭️' : '❌';
        const id = item.id ? ` [ID: ${item.id}]` : '';
        const error = item.error ? ` - Error: ${item.error}` : '';
        this.logger.info(`   ${status} ${item.key} - ${item.label}${id}${error}`);
      });
      this.logger.info('');
    }

    // Events summary
    if (summary.events.counts.total > 0) {
      this.logger.info(`📅 EVENTS (${summary.events.counts.total}):`);
      summary.events.items.forEach(item => {
        const status = item.status === 'created' ? '✅' : item.status === 'existing' ? '⏭️' : '❌';
        const id = item.id ? ` [ID: ${item.id}]` : '';
        const provider = item.provider ? ` (Provider: ${item.provider})` : '';
        const error = item.error ? ` - Error: ${item.error}` : '';
        this.logger.info(`   ${status} ${item.eventCode}${provider}${id}${error}`);
      });
      this.logger.info('');
    }

    // Registrations summary
    if (summary.registrations.counts.total > 0) {
      this.logger.info(`📋 REGISTRATIONS (${summary.registrations.counts.total}):`);
      summary.registrations.items.forEach(item => {
        const status = item.status === 'created' ? '✅' : item.status === 'existing' ? '⏭️' : '❌';
        const id = item.id ? ` [ID: ${item.id}]` : '';
        const provider = item.provider ? ` (Provider: ${item.provider})` : '';
        const error = item.error ? ` - Error: ${item.error}` : '';
        this.logger.info(`   ${status} ${item.key} - ${item.label}${provider}${id}${error}`);
      });
      this.logger.info('');
    }

    this.logger.info('='.repeat(60));
  }
}

export default OnboardEvents;
