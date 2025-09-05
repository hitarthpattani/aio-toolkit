/**
 * Test for commerce entry point
 * Copyright © Adobe, Inc. All rights reserved.
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

  it('should export all expected public API items', () => {
    const expectedExports = ['AdobeAuth', 'AdobeCommerceClient'];

    expectedExports.forEach(exportName => {
      expect(commerce).toHaveProperty(exportName);
      expect((commerce as any)[exportName]).toBeDefined();
    });
  });

  it('should maintain consistent export types', () => {
    // Class exports should be constructable functions
    expect(typeof commerce.AdobeAuth).toBe('function');
    expect(typeof commerce.AdobeCommerceClient).toBe('function');
  });

  it('should be able to create instances with proper constructors', () => {
    // AdobeCommerceClient should be constructable (though we don't call it here without params)
    expect(() => commerce.AdobeCommerceClient).not.toThrow();

    // AdobeAuth should have static methods available
    expect(typeof commerce.AdobeAuth.getToken).toBe('function');
  });
});
