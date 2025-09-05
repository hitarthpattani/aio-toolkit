/**
 * Test for Webhook types and enums
 * <license header>
 */

import { SignatureVerification } from '../../../src/framework/webhook-action/types';
import { WebhookOperation } from '../../../src/framework/webhook-action/response/types';

describe('SignatureVerification', () => {
  it('should have correct signature verification values', () => {
    expect(SignatureVerification.DISABLED).toBe(0);
    expect(SignatureVerification.ENABLED).toBe(1);
    expect(SignatureVerification.ENABLED_WITH_BASE64).toBe(2);
  });

  it('should be an enum object', () => {
    expect(typeof SignatureVerification).toBe('object');
    expect(Object.keys(SignatureVerification)).toHaveLength(6); // TypeScript numeric enums create both numeric and string keys
  });

  it('should have correct enum keys', () => {
    const keys = Object.keys(SignatureVerification);
    expect(keys).toContain('DISABLED');
    expect(keys).toContain('ENABLED');
    expect(keys).toContain('ENABLED_WITH_BASE64');
    expect(keys).toContain('0');
    expect(keys).toContain('1');
    expect(keys).toContain('2');
  });
});

describe('WebhookOperation', () => {
  it('should have correct webhook operation values', () => {
    expect(WebhookOperation.SUCCESS).toBe('success');
    expect(WebhookOperation.EXCEPTION).toBe('exception');
    expect(WebhookOperation.ADD).toBe('add');
    expect(WebhookOperation.REPLACE).toBe('replace');
    expect(WebhookOperation.REMOVE).toBe('remove');
  });

  it('should be an enum object', () => {
    expect(typeof WebhookOperation).toBe('object');
    expect(Object.keys(WebhookOperation)).toHaveLength(5); // String enums only create string keys
  });

  it('should have correct enum keys', () => {
    const keys = Object.keys(WebhookOperation);
    expect(keys).toContain('SUCCESS');
    expect(keys).toContain('EXCEPTION');
    expect(keys).toContain('ADD');
    expect(keys).toContain('REPLACE');
    expect(keys).toContain('REMOVE');
  });
});
