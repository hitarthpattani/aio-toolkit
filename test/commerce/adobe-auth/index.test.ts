/**
 * Adobe Commerce AdobeAuth tests
 *
 * Copyright © Adobe, Inc. All rights reserved.
 */

import AdobeAuth from '../../../src/commerce/adobe-auth';
import { AdobeIMSConfig } from '../../../src/commerce/adobe-auth/types';

// Mock @adobe/aio-lib-ims
jest.mock('@adobe/aio-lib-ims', () => ({
  context: {
    setCurrent: jest.fn(),
    set: jest.fn(),
  },
  getToken: jest.fn(),
}));

import { context, getToken } from '@adobe/aio-lib-ims';

describe('AdobeAuth', () => {
  const mockContext = context as jest.Mocked<typeof context>;
  const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default resolved states to prevent interference between tests
    mockContext.setCurrent.mockResolvedValue(undefined);
    mockContext.set.mockResolvedValue(undefined);
    mockGetToken.mockResolvedValue('default-test-token');
  });

  describe('getToken', () => {
    it('should retrieve authentication token with valid credentials', async () => {
      const mockToken = 'mock-access-token-12345';
      mockGetToken.mockResolvedValue(mockToken);

      const clientId = 'test-client-id';
      const clientSecret = 'test-client-secret';
      const technicalAccountId = 'test-technical-account-id';
      const technicalAccountEmail = 'test@example.com';
      const imsOrgId = 'test-ims-org-id';
      const scopes = [
        'AdobeID',
        'openid',
        'read_organizations',
        'additional_info.projectedProductContext',
        'additional_info.roles',
        'adobeio_api',
        'read_client_secret',
        'manage_client_secrets',
      ];

      const result = await AdobeAuth.getToken(
        clientId,
        clientSecret,
        technicalAccountId,
        technicalAccountEmail,
        imsOrgId,
        scopes
      );

      expect(result).toBe(mockToken);
      expect(mockContext.setCurrent).toHaveBeenCalledWith('onboarding-config');
      expect(mockContext.set).toHaveBeenCalledWith('onboarding-config', {
        client_id: clientId,
        client_secrets: [clientSecret],
        technical_account_id: technicalAccountId,
        technical_account_email: technicalAccountEmail,
        ims_org_id: imsOrgId,
        scopes: scopes,
      });
      expect(mockGetToken).toHaveBeenCalled();
    });

    it('should use custom context when provided', async () => {
      const mockToken = 'mock-custom-context-token';
      mockGetToken.mockResolvedValue(mockToken);

      const customContext = 'custom-context-name';
      const scopes = ['AdobeID', 'openid'];
      const result = await AdobeAuth.getToken(
        'client-id',
        'client-secret',
        'tech-account-id',
        'tech@example.com',
        'ims-org-id',
        scopes,
        customContext
      );

      expect(result).toBe(mockToken);
      expect(mockContext.setCurrent).toHaveBeenCalledWith(customContext);
      expect(mockContext.set).toHaveBeenCalledWith(customContext, expect.any(Object));
    });

    it('should handle authentication errors gracefully', async () => {
      const errorMessage = 'IMS authentication failed';
      mockGetToken.mockRejectedValue(new Error(errorMessage));

      const scopes = ['AdobeID', 'openid'];
      await expect(
        AdobeAuth.getToken(
          'invalid-client-id',
          'invalid-client-secret',
          'invalid-tech-account-id',
          'invalid@example.com',
          'invalid-ims-org-id',
          scopes
        )
      ).rejects.toThrow(errorMessage);
    });

    it('should handle context setting errors gracefully', async () => {
      const errorMessage = 'Context setting failed';
      mockContext.setCurrent.mockRejectedValue(new Error(errorMessage));

      const scopes = ['AdobeID', 'openid'];
      await expect(
        AdobeAuth.getToken(
          'client-id',
          'client-secret',
          'tech-account-id',
          'tech@example.com',
          'ims-org-id',
          scopes
        )
      ).rejects.toThrow(errorMessage);
    });

    it('should handle context configuration errors gracefully', async () => {
      const errorMessage = 'Context configuration failed';
      mockContext.set.mockRejectedValue(new Error(errorMessage));

      const scopes = ['AdobeID', 'openid'];
      await expect(
        AdobeAuth.getToken(
          'client-id',
          'client-secret',
          'tech-account-id',
          'tech@example.com',
          'ims-org-id',
          scopes
        )
      ).rejects.toThrow(errorMessage);
    });

    it('should set proper IMS configuration with all required scopes', async () => {
      const mockToken = 'test-token';
      mockGetToken.mockResolvedValue(mockToken);

      const scopes = [
        'AdobeID',
        'openid',
        'read_organizations',
        'additional_info.projectedProductContext',
        'additional_info.roles',
        'adobeio_api',
        'read_client_secret',
        'manage_client_secrets',
      ];

      await AdobeAuth.getToken(
        'client-id',
        'client-secret',
        'tech-account-id',
        'tech@example.com',
        'ims-org-id',
        scopes
      );

      const expectedConfig: AdobeIMSConfig = {
        client_id: 'client-id',
        client_secrets: ['client-secret'],
        technical_account_id: 'tech-account-id',
        technical_account_email: 'tech@example.com',
        ims_org_id: 'ims-org-id',
        scopes: scopes,
      };

      expect(mockContext.set).toHaveBeenCalledWith('onboarding-config', expectedConfig);
    });

    it('should work with empty strings for optional parameters', async () => {
      const mockToken = 'empty-params-token';
      mockGetToken.mockResolvedValue(mockToken);

      const scopes = ['AdobeID'];
      const result = await AdobeAuth.getToken('', '', '', '', '', scopes);

      expect(result).toBe(mockToken);
      expect(mockContext.setCurrent).toHaveBeenCalledWith('onboarding-config');
    });

    it('should work with special characters in parameters', async () => {
      const mockToken = 'special-chars-token';
      mockGetToken.mockResolvedValue(mockToken);

      const scopes = ['AdobeID', 'openid'];
      const result = await AdobeAuth.getToken(
        'client-id@#$%',
        'secret-with-symbols!@#$%^&*()',
        'tech-account-123!',
        'test+special@email.com',
        'org-id_with_underscores',
        scopes
      );

      expect(result).toBe(mockToken);
    });

    it('should be a static method', () => {
      expect(typeof AdobeAuth.getToken).toBe('function');
      expect(AdobeAuth.getToken).toBeInstanceOf(Function);
    });

    it('should return a Promise', () => {
      mockGetToken.mockResolvedValue('test-token');

      const scopes = ['AdobeID'];
      const result = AdobeAuth.getToken('id', 'secret', 'account', 'email', 'org', scopes);

      expect(result).toBeInstanceOf(Promise);
    });

    it('should handle multiple sequential calls', async () => {
      const mockToken1 = 'token-1';
      const mockToken2 = 'token-2';

      mockGetToken.mockResolvedValueOnce(mockToken1).mockResolvedValueOnce(mockToken2);

      const scopes1 = ['AdobeID', 'openid'];
      const scopes2 = ['AdobeID', 'adobeio_api'];

      const [result1, result2] = await Promise.all([
        AdobeAuth.getToken('id1', 'secret1', 'account1', 'email1', 'org1', scopes1),
        AdobeAuth.getToken('id2', 'secret2', 'account2', 'email2', 'org2', scopes2),
      ]);

      expect(result1).toBe(mockToken1);
      expect(result2).toBe(mockToken2);
      expect(mockContext.setCurrent).toHaveBeenCalledTimes(2);
      expect(mockContext.set).toHaveBeenCalledTimes(2);
      expect(mockGetToken).toHaveBeenCalledTimes(2);
    });
  });
});
