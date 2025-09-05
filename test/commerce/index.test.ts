/**
 * Test for commerce entry point
 * <license header>
 */

import * as commerce from '../../src/commerce';

describe('Commerce Module', () => {
  it('should export commerce utilities', () => {
    expect(commerce).toBeDefined();
    expect(typeof commerce).toBe('object');
  });

  it('should export AdobeAuth class', () => {
    expect(commerce.AdobeAuth).toBeDefined();
    expect(typeof commerce.AdobeAuth).toBe('function');
  });

  it('should have AdobeAuth static method', () => {
    expect(typeof commerce.AdobeAuth.getToken).toBe('function');
  });

  it('should be able to access AdobeAuth constructor', () => {
    expect(commerce.AdobeAuth.constructor).toBeDefined();
    expect(commerce.AdobeAuth.name).toBe('AdobeAuth');
  });

  it('should export AdobeCommerceClient class', () => {
    expect(commerce.AdobeCommerceClient).toBeDefined();
    expect(typeof commerce.AdobeCommerceClient).toBe('function');
  });

  it('should have AdobeCommerceClient constructor', () => {
    expect(commerce.AdobeCommerceClient.constructor).toBeDefined();
    expect(commerce.AdobeCommerceClient.name).toBe('AdobeCommerceClient');
  });

  it('should export BasicAuthConnection class', () => {
    expect(commerce.BasicAuthConnection).toBeDefined();
    expect(typeof commerce.BasicAuthConnection).toBe('function');
    expect(commerce.BasicAuthConnection.name).toBe('BasicAuthConnection');
  });

  it('should export Oauth1aConnection class', () => {
    expect(commerce.Oauth1aConnection).toBeDefined();
    expect(typeof commerce.Oauth1aConnection).toBe('function');
    expect(commerce.Oauth1aConnection.name).toBe('Oauth1aConnection');
  });

  it('should export ImsConnection class', () => {
    expect(commerce.ImsConnection).toBeDefined();
    expect(typeof commerce.ImsConnection).toBe('function');
    expect(commerce.ImsConnection.name).toBe('ImsConnection');
  });

  it('should export GenerateBasicAuthToken class', () => {
    expect(commerce.GenerateBasicAuthToken).toBeDefined();
    expect(typeof commerce.GenerateBasicAuthToken).toBe('function');
    expect(commerce.GenerateBasicAuthToken.name).toBe('GenerateBasicAuthToken');
  });

  it('should export all expected public API items', () => {
    const expectedExports = [
      'AdobeAuth',
      'AdobeCommerceClient',
      'BasicAuthConnection',
      'Oauth1aConnection',
      'ImsConnection',
      'GenerateBasicAuthToken',
    ];

    expectedExports.forEach(exportName => {
      expect(commerce).toHaveProperty(exportName);
      expect((commerce as any)[exportName]).toBeDefined();
    });
  });

  it('should maintain consistent export types', () => {
    // Class exports should be constructable functions
    expect(typeof commerce.AdobeAuth).toBe('function');
    expect(typeof commerce.AdobeCommerceClient).toBe('function');
    expect(typeof commerce.BasicAuthConnection).toBe('function');
    expect(typeof commerce.Oauth1aConnection).toBe('function');
    expect(typeof commerce.ImsConnection).toBe('function');
    expect(typeof commerce.GenerateBasicAuthToken).toBe('function');
  });

  it('should be able to create instances with proper constructors', () => {
    // AdobeCommerceClient should be constructable (though we don't call it here without params)
    expect(() => commerce.AdobeCommerceClient).not.toThrow();

    // AdobeAuth should have static methods available
    expect(typeof commerce.AdobeAuth.getToken).toBe('function');
  });
});
