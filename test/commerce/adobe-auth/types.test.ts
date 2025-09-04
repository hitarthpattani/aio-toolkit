/**
 * Adobe Commerce AdobeAuth types tests
 *
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { AdobeIMSConfig } from '../../../src/commerce/adobe-auth/types';

describe('AdobeAuth Types', () => {
  describe('AdobeIMSConfig interface', () => {
    it('should allow valid configuration object', () => {
      const config: AdobeIMSConfig = {
        client_id: 'test-client-id',
        client_secrets: ['secret1', 'secret2'],
        technical_account_id: 'tech-account-123',
        technical_account_email: 'tech@example.com',
        ims_org_id: 'ims-org-456',
        scopes: ['AdobeID', 'openid', 'read_organizations'],
      };

      expect(config.client_id).toBe('test-client-id');
      expect(config.client_secrets).toEqual(['secret1', 'secret2']);
      expect(config.technical_account_id).toBe('tech-account-123');
      expect(config.technical_account_email).toBe('tech@example.com');
      expect(config.ims_org_id).toBe('ims-org-456');
      expect(config.scopes).toEqual(['AdobeID', 'openid', 'read_organizations']);
    });

    it('should allow single client secret in array', () => {
      const config: AdobeIMSConfig = {
        client_id: 'single-secret-client',
        client_secrets: ['single-secret'],
        technical_account_id: 'tech-account',
        technical_account_email: 'single@example.com',
        ims_org_id: 'org-single',
        scopes: ['AdobeID'],
      };

      expect(config.client_secrets).toHaveLength(1);
      expect(config.client_secrets[0]).toBe('single-secret');
    });

    it('should allow multiple client secrets', () => {
      const config: AdobeIMSConfig = {
        client_id: 'multi-secret-client',
        client_secrets: ['secret1', 'secret2', 'secret3'],
        technical_account_id: 'tech-account',
        technical_account_email: 'multi@example.com',
        ims_org_id: 'org-multi',
        scopes: ['AdobeID', 'openid'],
      };

      expect(config.client_secrets).toHaveLength(3);
      expect(config.client_secrets).toEqual(['secret1', 'secret2', 'secret3']);
    });

    it('should allow empty client secrets array', () => {
      const config: AdobeIMSConfig = {
        client_id: 'empty-secrets-client',
        client_secrets: [],
        technical_account_id: 'tech-account',
        technical_account_email: 'empty@example.com',
        ims_org_id: 'org-empty',
        scopes: ['AdobeID'],
      };

      expect(config.client_secrets).toHaveLength(0);
    });

    it('should allow multiple scopes', () => {
      const config: AdobeIMSConfig = {
        client_id: 'multi-scope-client',
        client_secrets: ['secret'],
        technical_account_id: 'tech-account',
        technical_account_email: 'scopes@example.com',
        ims_org_id: 'org-scopes',
        scopes: [
          'AdobeID',
          'openid',
          'read_organizations',
          'additional_info.projectedProductContext',
          'additional_info.roles',
          'adobeio_api',
          'read_client_secret',
          'manage_client_secrets',
        ],
      };

      expect(config.scopes).toHaveLength(8);
      expect(config.scopes).toContain('AdobeID');
      expect(config.scopes).toContain('adobeio_api');
      expect(config.scopes).toContain('manage_client_secrets');
    });

    it('should allow empty scopes array', () => {
      const config: AdobeIMSConfig = {
        client_id: 'no-scopes-client',
        client_secrets: ['secret'],
        technical_account_id: 'tech-account',
        technical_account_email: 'noscopes@example.com',
        ims_org_id: 'org-noscopes',
        scopes: [],
      };

      expect(config.scopes).toHaveLength(0);
    });

    it('should handle special characters in string fields', () => {
      const config: AdobeIMSConfig = {
        client_id: 'client-id@#$%^&*()',
        client_secrets: ['secret!@#$%^&*()'],
        technical_account_id: 'tech-account_123!',
        technical_account_email: 'special+chars@test-domain.com',
        ims_org_id: 'org_id-with-special@chars',
        scopes: ['scope@with!special#chars'],
      };

      expect(config.client_id).toContain('@#$%');
      expect(config.technical_account_email).toContain('+');
      expect(config.ims_org_id).toContain('@');
      expect(config.scopes[0]).toContain('@with!special#');
    });

    it('should allow empty string values', () => {
      const config: AdobeIMSConfig = {
        client_id: '',
        client_secrets: [''],
        technical_account_id: '',
        technical_account_email: '',
        ims_org_id: '',
        scopes: [''],
      };

      expect(config.client_id).toBe('');
      expect(config.client_secrets[0]).toBe('');
      expect(config.technical_account_id).toBe('');
      expect(config.technical_account_email).toBe('');
      expect(config.ims_org_id).toBe('');
      expect(config.scopes[0]).toBe('');
    });

    it('should validate all required properties exist', () => {
      const config: AdobeIMSConfig = {
        client_id: 'required-test',
        client_secrets: ['required-secret'],
        technical_account_id: 'required-account',
        technical_account_email: 'required@example.com',
        ims_org_id: 'required-org',
        scopes: ['required-scope'],
      };

      expect(config).toHaveProperty('client_id');
      expect(config).toHaveProperty('client_secrets');
      expect(config).toHaveProperty('technical_account_id');
      expect(config).toHaveProperty('technical_account_email');
      expect(config).toHaveProperty('ims_org_id');
      expect(config).toHaveProperty('scopes');

      expect(Object.keys(config)).toHaveLength(6);
    });
  });
});
