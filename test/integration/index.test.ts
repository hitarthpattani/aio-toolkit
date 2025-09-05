/**
 * Test for integration entry point
 * <license header>
 */

import * as integration from '../../src/integration';

describe('Integration Module', () => {
  it('should export integration utilities', () => {
    expect(integration).toBeDefined();
    expect(typeof integration).toBe('object');
  });

  it('should export BearerToken class', () => {
    expect(integration.BearerToken).toBeDefined();
    expect(typeof integration.BearerToken).toBe('function');
  });

  it('should have BearerToken static methods', () => {
    expect(typeof integration.BearerToken.extract).toBe('function');
  });

  it('should export RestClient class', () => {
    expect(integration.RestClient).toBeDefined();
    expect(typeof integration.RestClient).toBe('function');
  });

  it('should be able to instantiate RestClient', () => {
    const client = new integration.RestClient();
    expect(client).toBeDefined();
    expect(client.constructor.name).toBe('RestClient');
  });

  it('should have RestClient methods', () => {
    const client = new integration.RestClient();
    expect(typeof client.get).toBe('function');
    expect(typeof client.post).toBe('function');
    expect(typeof client.put).toBe('function');
    expect(typeof client.delete).toBe('function');
    expect(typeof client.apiCall).toBe('function');
  });
});
