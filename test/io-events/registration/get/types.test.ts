/**
 * <license header>
 */

import type { GetRegistrationQueryParams } from '../../../../src/io-events/registration/get/types';

describe('Get Registration Types', () => {
  describe('GetRegistrationQueryParams', () => {
    it('should define valid query parameters', () => {
      const queryParams: GetRegistrationQueryParams = {
        consumerOrgId: 'test-consumer-org-123',
        projectId: 'test-project-456',
        workspaceId: 'test-workspace-789',
        registrationId: 'test-registration-abc',
      };

      expect(queryParams.consumerOrgId).toBe('test-consumer-org-123');
      expect(queryParams.projectId).toBe('test-project-456');
      expect(queryParams.workspaceId).toBe('test-workspace-789');
      expect(queryParams.registrationId).toBe('test-registration-abc');
    });

    it('should work with realistic Adobe I/O identifiers', () => {
      const queryParams: GetRegistrationQueryParams = {
        consumerOrgId: '1234567890ABCDEF@AdobeOrg',
        projectId: 'project-12345',
        workspaceId: 'workspace-production',
        registrationId: 'reg_a1b2c3d4e5f6',
      };

      expect(queryParams.consumerOrgId).toBe('1234567890ABCDEF@AdobeOrg');
      expect(queryParams.projectId).toBe('project-12345');
      expect(queryParams.workspaceId).toBe('workspace-production');
      expect(queryParams.registrationId).toBe('reg_a1b2c3d4e5f6');
    });

    it('should handle UUID-style identifiers', () => {
      const queryParams: GetRegistrationQueryParams = {
        consumerOrgId: '550e8400-e29b-41d4-a716-446655440000',
        projectId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        workspaceId: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        registrationId: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
      };

      expect(queryParams.consumerOrgId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(queryParams.projectId).toBe('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
      expect(queryParams.workspaceId).toBe('6ba7b811-9dad-11d1-80b4-00c04fd430c8');
      expect(queryParams.registrationId).toBe('6ba7b812-9dad-11d1-80b4-00c04fd430c8');
    });

    it('should handle short identifiers', () => {
      const queryParams: GetRegistrationQueryParams = {
        consumerOrgId: 'org1',
        projectId: 'proj1',
        workspaceId: 'ws1',
        registrationId: 'reg1',
      };

      expect(queryParams.consumerOrgId).toBe('org1');
      expect(queryParams.projectId).toBe('proj1');
      expect(queryParams.workspaceId).toBe('ws1');
      expect(queryParams.registrationId).toBe('reg1');
    });

    it('should work in typical query building scenarios', () => {
      const baseParams = {
        consumerOrgId: 'my-org',
        projectId: 'my-project',
        workspaceId: 'development',
      };

      const specificRegistration: GetRegistrationQueryParams = {
        ...baseParams,
        registrationId: 'specific-registration-id',
      };

      expect(specificRegistration.consumerOrgId).toBe('my-org');
      expect(specificRegistration.projectId).toBe('my-project');
      expect(specificRegistration.workspaceId).toBe('development');
      expect(specificRegistration.registrationId).toBe('specific-registration-id');
    });

    it('should maintain type safety', () => {
      const queryParams: GetRegistrationQueryParams = {
        consumerOrgId: 'test-consumer-org',
        projectId: 'test-project',
        workspaceId: 'test-workspace',
        registrationId: 'test-registration',
      };

      // These should all be string types
      const consumerOrgId: string = queryParams.consumerOrgId;
      const projectId: string = queryParams.projectId;
      const workspaceId: string = queryParams.workspaceId;
      const registrationId: string = queryParams.registrationId;

      expect(typeof consumerOrgId).toBe('string');
      expect(typeof projectId).toBe('string');
      expect(typeof workspaceId).toBe('string');
      expect(typeof registrationId).toBe('string');
    });

    it('should work in realistic API scenarios', () => {
      const queryParams: GetRegistrationQueryParams = {
        consumerOrgId: 'ABCDEF1234567890@AdobeOrg',
        projectId: 'adobe-commerce-integration',
        workspaceId: 'production-workspace',
        registrationId: 'commerce-customer-events-registration',
      };

      // Simulate URL building
      const urlPath = `/events/${queryParams.consumerOrgId}/${queryParams.projectId}/${queryParams.workspaceId}/registrations/${queryParams.registrationId}`;

      expect(urlPath).toBe(
        '/events/ABCDEF1234567890@AdobeOrg/adobe-commerce-integration/production-workspace/registrations/commerce-customer-events-registration'
      );
    });

    it('should handle alphanumeric and special characters', () => {
      const queryParams: GetRegistrationQueryParams = {
        consumerOrgId: 'org-123_ABC@domain.com',
        projectId: 'proj-456_DEF',
        workspaceId: 'ws-789_GHI',
        registrationId: 'reg-000_JKL',
      };

      expect(queryParams.consumerOrgId).toBe('org-123_ABC@domain.com');
      expect(queryParams.projectId).toBe('proj-456_DEF');
      expect(queryParams.workspaceId).toBe('ws-789_GHI');
      expect(queryParams.registrationId).toBe('reg-000_JKL');
    });
  });
});
