/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import type {
  ProviderInputModel,
  CreateProviderParams,
} from '../../../../src/io-events/provider/create/types';

describe('Create Provider Types', () => {
  describe('ProviderInputModel', () => {
    it('should define a valid provider with required fields only', () => {
      const providerData: ProviderInputModel = {
        label: 'Test Provider',
      };

      expect(providerData.label).toBe('Test Provider');
      expect(providerData.description).toBeUndefined();
      expect(providerData.docs_url).toBeUndefined();
      expect(providerData.provider_metadata).toBeUndefined();
      expect(providerData.instance_id).toBeUndefined();
      expect(providerData.data_residency_region).toBeUndefined();
    });

    it('should define a valid provider with all optional fields', () => {
      const providerData: ProviderInputModel = {
        label: 'Complete Provider',
        description: 'A complete provider with all fields',
        docs_url: 'https://example.com/docs',
        provider_metadata: '3rd_party_custom_events',
        instance_id: 'production-instance',
        data_residency_region: 'va6',
      };

      expect(providerData.label).toBe('Complete Provider');
      expect(providerData.description).toBe('A complete provider with all fields');
      expect(providerData.docs_url).toBe('https://example.com/docs');
      expect(providerData.provider_metadata).toBe('3rd_party_custom_events');
      expect(providerData.instance_id).toBe('production-instance');
      expect(providerData.data_residency_region).toBe('va6');
    });

    it('should allow undefined optional fields', () => {
      const providerData: ProviderInputModel = {
        label: 'Test Provider',
        description: undefined,
        docs_url: undefined,
        provider_metadata: undefined,
        instance_id: undefined,
        data_residency_region: undefined,
      };

      expect(providerData.label).toBe('Test Provider');
      expect(providerData.description).toBeUndefined();
      expect(providerData.docs_url).toBeUndefined();
      expect(providerData.provider_metadata).toBeUndefined();
      expect(providerData.instance_id).toBeUndefined();
      expect(providerData.data_residency_region).toBeUndefined();
    });

    it('should allow empty strings for optional fields', () => {
      const providerData: ProviderInputModel = {
        label: 'Test Provider',
        description: '',
        docs_url: '',
        provider_metadata: '',
        instance_id: '',
        data_residency_region: '',
      };

      expect(providerData.description).toBe('');
      expect(providerData.docs_url).toBe('');
      expect(providerData.provider_metadata).toBe('');
      expect(providerData.instance_id).toBe('');
      expect(providerData.data_residency_region).toBe('');
    });

    it('should handle typical use cases', () => {
      // Default provider
      const defaultProvider: ProviderInputModel = {
        label: 'My Event Provider',
        description: 'Provider for my application events',
      };
      expect(defaultProvider.provider_metadata).toBeUndefined(); // Will use default '3rd_party_custom_events'
      expect(defaultProvider.data_residency_region).toBeUndefined(); // Will use default 'va6'

      // Custom provider with metadata
      const customProvider: ProviderInputModel = {
        label: 'Custom Provider',
        provider_metadata: 'commerce_events',
        instance_id: 'store-123',
      };
      expect(customProvider.provider_metadata).toBe('commerce_events');
      expect(customProvider.instance_id).toBe('store-123');

      // European data residency
      const europeanProvider: ProviderInputModel = {
        label: 'EU Provider',
        data_residency_region: 'irl1',
      };
      expect(europeanProvider.data_residency_region).toBe('irl1');

      // Production provider with documentation
      const prodProvider: ProviderInputModel = {
        label: 'Production Events Provider',
        description: 'Production provider for business-critical events',
        docs_url: 'https://company.com/events/docs',
        provider_metadata: 'business_events',
        instance_id: 'prod-v2',
        data_residency_region: 'va6',
      };
      expect(prodProvider.docs_url).toContain('https://');
      expect(prodProvider.instance_id).toContain('prod');
    });

    it('should work with different data residency regions', () => {
      const usProvider: ProviderInputModel = {
        label: 'US Provider',
        data_residency_region: 'va6',
      };
      expect(usProvider.data_residency_region).toBe('va6');

      const euProvider: ProviderInputModel = {
        label: 'EU Provider',
        data_residency_region: 'irl1',
      };
      expect(euProvider.data_residency_region).toBe('irl1');
    });

    it('should handle various provider metadata values', () => {
      const customEvents: ProviderInputModel = {
        label: 'Custom Events',
        provider_metadata: '3rd_party_custom_events',
      };
      expect(customEvents.provider_metadata).toBe('3rd_party_custom_events');

      const commerceEvents: ProviderInputModel = {
        label: 'Commerce Events',
        provider_metadata: 'commerce_events',
      };
      expect(commerceEvents.provider_metadata).toBe('commerce_events');
    });
  });

  describe('CreateProviderParams', () => {
    it('should define valid parameters for creating a provider', () => {
      const params: CreateProviderParams = {
        projectId: 'project-123',
        workspaceId: 'workspace-456',
        providerData: {
          label: 'Test Provider',
          description: 'A test provider',
        },
      };

      expect(params.projectId).toBe('project-123');
      expect(params.workspaceId).toBe('workspace-456');
      expect(params.providerData.label).toBe('Test Provider');
      expect(params.providerData.description).toBe('A test provider');
    });

    it('should work with minimal provider data', () => {
      const params: CreateProviderParams = {
        projectId: 'project-123',
        workspaceId: 'workspace-456',
        providerData: {
          label: 'Minimal Provider',
        },
      };

      expect(params.providerData.label).toBe('Minimal Provider');
      expect(params.providerData.description).toBeUndefined();
    });

    it('should work with complete provider data', () => {
      const params: CreateProviderParams = {
        projectId: 'project-123',
        workspaceId: 'workspace-456',
        providerData: {
          label: 'Complete Provider',
          description: 'Complete provider with all fields',
          docs_url: 'https://example.com/docs',
          provider_metadata: 'custom_events',
          instance_id: 'prod-instance',
          data_residency_region: 'irl1',
        },
      };

      expect(params.providerData.label).toBe('Complete Provider');
      expect(params.providerData.docs_url).toBe('https://example.com/docs');
      expect(params.providerData.provider_metadata).toBe('custom_events');
      expect(params.providerData.instance_id).toBe('prod-instance');
      expect(params.providerData.data_residency_region).toBe('irl1');
    });

    it('should handle realistic parameter combinations', () => {
      // Development environment
      const devParams: CreateProviderParams = {
        projectId: 'dev-project-123',
        workspaceId: 'dev-workspace-456',
        providerData: {
          label: 'Development Provider',
          description: 'Provider for development environment',
          instance_id: 'dev-v1',
        },
      };
      expect(devParams.projectId).toContain('dev');
      expect(devParams.workspaceId).toContain('dev');

      // Production environment with EU residency
      const prodParams: CreateProviderParams = {
        projectId: 'prod-project-789',
        workspaceId: 'prod-workspace-012',
        providerData: {
          label: 'Production EU Provider',
          description: 'Production provider for European customers',
          docs_url: 'https://company.eu/events-docs',
          provider_metadata: 'business_events',
          instance_id: 'prod-eu-v2',
          data_residency_region: 'irl1',
        },
      };
      expect(prodParams.providerData.data_residency_region).toBe('irl1');
      expect(prodParams.providerData.docs_url).toContain('.eu');
    });
  });
});
