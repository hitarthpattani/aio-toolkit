/**
 * <license header>
 */

import type { Logger } from '@adobe/aio-sdk';
import type { OnboardProviders, OnboardProvider } from '../types';
import { ProviderManager } from '../../../io-events';
import { randomUUID } from 'crypto';
import type { CreateProviderResult } from './types';

/**
 * Utility class for creating providers in Adobe Commerce onboarding integrations
 *
 * @example
 * const logger = Core.Logger('my-create-providers', { level: 'debug' });
 * const createProviders = new CreateProviders(
 *   'your-consumer-id',
 *   'your-project-id',
 *   'your-workspace-id',
 *   'your-api-key',
 *   'your-access-token',
 *   logger
 * );
 *
 * // Process providers for creation
 * await createProviders.process(providers);
 */
class CreateProviders {
  private readonly logger: Logger;
  private providerManager: ProviderManager | null = null;

  /**
   * Creates a new CreateProviders instance
   *
   * @param consumerId - Adobe I/O consumer ID
   * @param projectId - Adobe I/O project ID
   * @param workspaceId - Adobe I/O workspace ID
   * @param apiKey - API key for authentication
   * @param accessToken - Access token for API calls
   * @param logger - Logger instance for consistent logging
   */
  constructor(
    private readonly consumerId: string,
    private readonly projectId: string,
    private readonly workspaceId: string,
    private readonly apiKey: string,
    private readonly accessToken: string,
    logger: Logger
  ) {
    // Validate configuration
    const config = {
      consumerId: this.consumerId,
      projectId: this.projectId,
      workspaceId: this.workspaceId,
      apiKey: this.apiKey,
      accessToken: this.accessToken,
    };
    const required = ['consumerId', 'projectId', 'workspaceId', 'apiKey', 'accessToken'];
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

    this.logger.debug(`[INIT] CreateProviders initialized with valid configuration`);
  }

  /**
   * Processes providers for creation in the Adobe Commerce integration
   *
   * @param providers - Array of onboard provider configurations to create
   * @param projectName - Name of the project for enhanced labeling
   * @returns Promise resolving to processing result
   */
  async process(
    providers: OnboardProviders,
    projectName: string = 'Unknown Project'
  ): Promise<CreateProviderResult[]> {
    this.logger.debug(`[CREATE] Creating providers for project: ${projectName}`);
    this.logger.debug(`[INFO] Processing ${providers.length} provider(s)...`);

    try {
      // Fetch existing providers first
      const existingProviders = await this.getProviders();

      const results: CreateProviderResult[] = [];

      for (const provider of providers) {
        const result = await this.createProvider(provider, projectName, existingProviders);
        results.push(result);
      }

      this.logger.debug('[DONE] Provider creation completed');

      // Show provider IDs in results
      results.forEach(result => {
        if (result.provider.id) {
          this.logger.debug(
            `[ID] Provider ID: ${result.provider.id} (${result.provider.originalLabel})`
          );
        }
      });

      return results;
    } catch (error: any) {
      this.logger.error(`[ERROR] Provider creation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets the Provider SDK instance from the framework
   * @private
   */
  private getProviderManager(): ProviderManager {
    if (!this.providerManager) {
      this.providerManager = new ProviderManager(
        this.apiKey,
        this.consumerId,
        this.projectId,
        this.workspaceId,
        this.accessToken
      );
    }

    return this.providerManager;
  }

  /**
   * Gets existing providers from Adobe I/O
   * @returns Promise<Map> Map of existing providers by label
   */
  private async getProviders(): Promise<Map<string, any>> {
    this.logger.debug('[FETCH] Fetching existing providers...');

    try {
      const providerManager = this.getProviderManager();
      const providerList = await providerManager.list();

      const existingProviders = new Map<string, any>();
      providerList.forEach((provider: any) => {
        existingProviders.set(provider.label, provider);
      });

      this.logger.debug(`[INFO] Found ${existingProviders.size} existing providers`);
      return existingProviders;
    } catch (error: any) {
      this.logger.error(`[ERROR] Failed to fetch existing providers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Creates a single provider
   * @param providerData - Provider configuration data
   * @param projectName - Project name for enhanced labeling
   * @param existingProviders - Map of existing providers by label
   * @private
   */
  private async createProvider(
    providerData: OnboardProvider,
    projectName: string,
    existingProviders: Map<string, any>
  ): Promise<CreateProviderResult> {
    const enhancedLabel = `${projectName} - ${providerData.label}`;
    this.logger.debug(
      `[PROCESS] Processing provider: ${providerData.label} with enhanced label: ${enhancedLabel}`
    );

    // Check if provider already exists
    const existingProvider = existingProviders.get(enhancedLabel);

    if (existingProvider) {
      this.logger.debug(`[SKIP] Provider already exists - skipping creation`);
      this.logger.debug(`[ID] Existing ID: ${existingProvider.id}`);

      return {
        created: false,
        skipped: true,
        provider: {
          id: existingProvider.id,
          ...(existingProvider.instance_id && { instanceId: existingProvider.instance_id }),
          label: enhancedLabel,
          originalLabel: providerData.label,
          description: providerData.description,
          docsUrl: providerData.docs_url,
        },
        reason: 'Already exists',
      };
    }

    try {
      const providerInput = this.preparePayload(providerData, enhancedLabel);

      this.logger.debug(
        `[NEW] Creating new provider with payload: ${JSON.stringify(providerInput)}`
      );

      const createdProvider = await this.getProviderManager().create(providerInput);

      this.logger.debug(
        `[INFO] Provider created successfully! ID: ${createdProvider.id}, Instance ID: ${createdProvider.instance_id}`
      );

      const result: CreateProviderResult = {
        created: true,
        skipped: false,
        provider: {
          id: createdProvider.id,
          ...(createdProvider.instance_id && { instanceId: createdProvider.instance_id }),
          label: createdProvider.label,
          originalLabel: providerData.label,
          description: providerData.description,
          docsUrl: providerData.docs_url,
        },
        raw: createdProvider,
      };

      return result;
    } catch (error: any) {
      this.logger.error(`[ERROR] Failed to create provider "${enhancedLabel}": ${error.message}`);

      return {
        created: false,
        skipped: false,
        error: error.message,
        provider: {
          label: enhancedLabel,
          originalLabel: providerData.label,
          description: providerData.description,
          docsUrl: providerData.docs_url,
        },
      };
    }
  }

  /**
   * Prepares payload object for Adobe I/O API
   * @param providerData - Provider configuration data
   * @param enhancedLabel - Enhanced provider label
   * @private
   */
  private preparePayload(providerData: OnboardProvider, enhancedLabel: string): any {
    const input: any = {
      label: enhancedLabel,
    };

    // Add description if provided
    if (providerData.description) {
      input.description = providerData.description;
    }

    // Add docs URL if provided
    if (providerData.docs_url) {
      input.docs_url = providerData.docs_url;
    }

    // Add special commerce provider metadata if needed
    if (this.isCommerceProvider(providerData)) {
      input.provider_metadata = 'dx_commerce_events';
      input.instance_id = randomUUID();
    }

    return input;
  }

  /**
   * Determines if provider is a commerce provider
   * @private
   */
  private isCommerceProvider(providerData: OnboardProvider): boolean {
    const commerceIndicators = ['commerce', 'magento', 'adobe commerce'];
    const label = providerData.label.toLowerCase();
    const description = (providerData.description || '').toLowerCase();

    return commerceIndicators.some(
      indicator => label.includes(indicator) || description.includes(indicator)
    );
  }
}

export default CreateProviders;
