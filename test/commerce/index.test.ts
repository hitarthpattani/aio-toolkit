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
});
