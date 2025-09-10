/**
 * <license header>
 */

import { Core, Logger } from '@adobe/aio-sdk';
import type { OnboardProviders } from './types';

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
 * // Process providers
 * await onboardEvents.process(providers);
 */
class OnboardEvents {
  private readonly logger: Logger;

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
   * @param providers - Array of onboard provider configurations
   * @returns Promise resolving to processing result
   */
  async process(providers: OnboardProviders): Promise<void> {
    this.logger.debug(
      `🚀 Processing onboard events for project: ${this.projectName} (${this.projectId}) with ${providers.length} providers`
    );

    // Log each provider being processed
    providers.forEach(provider => {
      this.logger.debug(`Processing provider: ${provider.key} - ${provider.label}`);
    });

    // Implementation for processing
  }
}

export default OnboardEvents;
